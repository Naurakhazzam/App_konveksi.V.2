import React, { useState, useRef } from 'react';
import { Modal, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { useMasterStore } from '@/stores/useMasterStore';
import { supabase } from '@/lib/supabase';

export interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
}

// Kolom tetap di CSV (index 0-6 + terakhir = Harga Jual)
const FIXED_COLS = 7;       // index 0-6 adalah info produk
const SKU_COL   = 1;        // kolom SKU klien
const HARGA_JUAL_HEADER = 'harga jual';

interface ImportSummary {
  totalRows: number;
  matched: number;
  skippedSKU: string[];
  unmatchedKomponen: string[];
  hppCount: number;
}

function parseNumber(val: string): number {
  if (!val || val.trim() === '') return 0;
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
}

export default function BulkUploadModal({ open, onClose }: BulkUploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [csvData, setCsvData] = useState<{ headers: string[], rows: string[][] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  const { produk, hppKomponen } = useMasterStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSummary(null); setIsDone(false); setResultMsg('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      const sep = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, '')));

      // Identifikasi kolom komponen (antara kolom info produk dan Harga Jual)
      const hargaJualIdx = headers.findIndex(h => h.toLowerCase().includes(HARGA_JUAL_HEADER));
      const komponenHeaders = headers.slice(FIXED_COLS, hargaJualIdx >= 0 ? hargaJualIdx : headers.length);

      // Cek mana komponen yang tidak ada di master
      const unmatchedKomponen = komponenHeaders.filter(h =>
        h && !hppKomponen.find(k => k.nama.toLowerCase().trim() === h.toLowerCase().trim())
      );

      // Analisa SKU yang tidak match
      const skippedSKU: string[] = [];
      let matched = 0;
      let hppCount = 0;

      rows.forEach(row => {
        const sku = row[SKU_COL]?.trim();
        if (!sku) return;
        const p = produk.find(pr => pr.skuKlien?.toLowerCase() === sku.toLowerCase());
        if (!p) { skippedSKU.push(sku); return; }
        matched++;

        komponenHeaders.forEach((h, i) => {
          const val = parseNumber(row[FIXED_COLS + i]);
          if (val > 0 && hppKomponen.find(k => k.nama.toLowerCase().trim() === h.toLowerCase().trim())) {
            hppCount++;
          }
        });
      });

      setCsvData({ headers, rows });
      setSummary({ totalRows: rows.length, matched, skippedSKU: [...new Set(skippedSKU)], unmatchedKomponen, hppCount });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (!csvData || !summary) return;
    setIsLoading(true);

    try {
      const { headers, rows } = csvData;
      const hargaJualIdx = headers.findIndex(h => h.toLowerCase().includes(HARGA_JUAL_HEADER));
      const komponenHeaders = headers.slice(FIXED_COLS, hargaJualIdx >= 0 ? hargaJualIdx : headers.length);

      // Kumpulkan semua produk yang akan diupdate
      const matchedProdukIds: string[] = [];
      const hppInsertData: object[] = [];
      const hargaJualUpdates: { id: string; harga: number }[] = [];

      rows.forEach(row => {
        const sku = row[SKU_COL]?.trim();
        if (!sku) return;
        const p = produk.find(pr => pr.skuKlien?.toLowerCase() === sku.toLowerCase());
        if (!p) return;

        matchedProdukIds.push(p.id);

        // Update harga jual
        if (hargaJualIdx >= 0) {
          const hj = parseNumber(row[hargaJualIdx]);
          if (hj > 0) hargaJualUpdates.push({ id: p.id, harga: hj });
        }

        // Kumpulkan HPP items
        komponenHeaders.forEach((h, i) => {
          const val = parseNumber(row[FIXED_COLS + i]);
          if (val <= 0) return; // skip yang kosong/0, user isi manual
          const komp = hppKomponen.find(k => k.nama.toLowerCase().trim() === h.toLowerCase().trim());
          if (!komp) return; // skip yang tidak ada di master

          hppInsertData.push({
            id: `HPP-${p.id}-${komp.id}-${Math.random().toString(36).slice(2, 8)}`,
            produk_id: p.id,
            komponen_id: komp.id,
            qty: 1,
            harga: val,
            nilai: val,
          });
        });
      });

      // Step 1: Hapus HPP items lama untuk produk yang di-import
      const uniqueProdukIds = [...new Set(matchedProdukIds)];
      if (uniqueProdukIds.length > 0) {
        const { error: delErr } = await supabase
          .from('produk_hpp_item')
          .delete()
          .in('produk_id', uniqueProdukIds);
        if (delErr) throw delErr;
      }

      // Step 2: Insert HPP items baru (batch per 500)
      for (let i = 0; i < hppInsertData.length; i += 500) {
        const batch = hppInsertData.slice(i, i + 500);
        const { error: insErr } = await supabase.from('produk_hpp_item').insert(batch);
        if (insErr) throw insErr;
      }

      // Step 3: Update harga jual per produk
      for (const upd of hargaJualUpdates) {
        await supabase.from('produk').update({ harga_jual: upd.harga }).eq('id', upd.id);
      }

      // Step 4: Refresh store
      await useMasterStore.getState().initializeMasterData();

      setResultMsg(
        `✅ Selesai! ${hppInsertData.length} komponen HPP berhasil diimport untuk ${uniqueProdukIds.length} produk. ` +
        `${hargaJualUpdates.length} harga jual diperbarui.`
      );
      setIsDone(true);

    } catch (err: any) {
      setResultMsg(`❌ Gagal import: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSummary(null); setCsvData(null);
    setIsDone(false); setResultMsg('');
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose} title="Upload Massal HPP dari CSV">
      <div style={{ padding: '8px 0', minWidth: '580px', maxWidth: '720px' }}>

        {/* Format Info */}
        <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px' }}>
          <strong>Format CSV yang didukung:</strong>
          <div style={{ marginTop: '6px', color: 'var(--color-text-sub)', lineHeight: 1.6 }}>
            Kolom tetap di awal: <code>Client, SKU, Nama Produk, MODEL, WARNA, SIZE, Kategori</code>
            <br />
            Lalu kolom-kolom komponen HPP (nama kolom = nama komponen di Master HPP).
            <br />
            Kolom terakhir: <code>Harga Jual</code>
            <br />
            <span style={{ color: '#facc15' }}>⚠ Nilai 0 atau kosong = dilewati (isi manual nanti).</span>
          </div>
        </div>

        {/* File Input */}
        <div style={{ marginBottom: '16px' }}>
          <input ref={fileRef} type="file" accept=".csv,.txt"
            onChange={handleFileChange}
            style={{ width: '100%', padding: '8px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', cursor: 'pointer' }}
          />
        </div>

        {/* Summary */}
        {summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { label: 'Total Baris CSV', val: summary.totalRows, color: 'var(--color-text)' },
                { label: 'Produk Cocok', val: summary.matched, color: '#4ade80' },
                { label: 'HPP Items Siap', val: summary.hppCount, color: '#60a5fa' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--color-bg-tertiary)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Unmatched Komponen */}
            {summary.unmatchedKomponen.length > 0 && (
              <div style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '8px', padding: '10px 14px' }}>
                <strong style={{ fontSize: '12px', color: '#facc15' }}>⚠ Komponen tidak ditemukan di Master HPP — akan dilewati:</strong>
                <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {summary.unmatchedKomponen.map(k => (
                    <span key={k} style={{ background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}>{k}</span>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', marginTop: '6px' }}>
                  Tambahkan komponen ini di halaman <strong>Master HPP Komponen</strong> terlebih dahulu jika ingin diimport.
                </div>
              </div>
            )}

            {/* Skipped SKU */}
            {summary.skippedSKU.length > 0 && (
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '10px 14px' }}>
                <strong style={{ fontSize: '12px', color: '#f87171' }}>❌ {summary.skippedSKU.length} SKU tidak ditemukan di database produk:</strong>
                <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-text-sub)', maxHeight: '80px', overflowY: 'auto' }}>
                  {summary.skippedSKU.slice(0, 20).join(', ')}{summary.skippedSKU.length > 20 ? ` ...+${summary.skippedSKU.length - 20} lainnya` : ''}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result Message */}
        {resultMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '8px',
            background: isDone ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${isDone ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
            fontSize: '13px' }}>
            {resultMsg}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>{isDone ? 'Tutup' : 'Batal'}</Button>
        {!isDone && summary && summary.hppCount > 0 && (
          <Button variant="primary" onClick={handleImport} disabled={isLoading}>
            {isLoading ? 'Mengimport...' : `Import ${summary.hppCount} Komponen HPP (${summary.matched} Produk)`}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
