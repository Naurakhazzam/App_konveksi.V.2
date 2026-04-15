import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import { useMasterStore } from '@/stores/useMasterStore';
import { usePOStore } from '@/stores/usePOStore';
import { useToast } from '@/components/molecules/Toast';
import { generatePOMassTemplate, processPOCSV, ProcessedPOData } from '@/lib/utils/po-import';
import Papa from 'papaparse';

interface ModalImportPOProps {
  onClose: () => void;
}

export default function ModalImportPO({ onClose }: ModalImportPOProps) {
  const masterData = useMasterStore();
  const { incrementGlobalSequence, poList, createPOWithBundles } = usePOStore();
  const { success, error, warning } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ProcessedPOData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSummary(null);
    }
  };

  const handleParse = () => {
    if (!file) return;
    setLoading(true);

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const existingNomorPOs = poList.map(p => p.nomorPO);
        const processed = processPOCSV(
          results,
          masterData,
          incrementGlobalSequence,
          existingNomorPOs
        );
        setSummary(processed);
        setLoading(false);
      },
      error: (err) => {
        error("Gagal Membaca File", err.message);
        setLoading(false);
      }
    });
  };

  const handleImport = async () => {
    if (!summary || summary.entries.length === 0) return;

    // Safety check: block if there are errors (Missing SKU/Client)
    if (summary.errors.length > 0) {
      error("Impor Terhambat", "Harap perbaiki data SKU atau Klien yang tidak ditemukan sebelum melanjutkan.");
      return;
    }

    setLoading(true);

    // Proses setiap PO secara atomik via createPOWithBundles (RPC create_po_atomic)
    // Jika satu PO gagal, PO lain tetap diproses
    let successCount = 0;
    let failCount = 0;
    let totalBundleCount = 0;

    for (const entry of summary.entries) {
      try {
        await createPOWithBundles(entry.po, entry.bundles);
        successCount++;
        totalBundleCount += entry.bundles.length;
      } catch (err) {
        console.error(`[ModalImportPO] Gagal import PO ${entry.po.nomorPO}:`, err);
        failCount++;
      }
    }

    setLoading(false);

    if (failCount === 0) {
      success("Impor Berhasil", `${successCount} PO berhasil diimpor dengan total ${totalBundleCount} bundle.`);
    } else if (successCount > 0) {
      warning("Impor Sebagian", `${successCount} PO berhasil, ${failCount} PO gagal. Periksa koneksi dan coba lagi.`);
    } else {
      error("Impor Gagal", `Semua ${failCount} PO gagal diimpor. Periksa koneksi database.`);
    }

    onClose();
  };

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <ModalHeader title="Import Massal Purchase Order (CSV)" onClose={onClose} />
      <ModalBody>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'var(--color-card2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <Label>Panduan Format Template</Label>
                <Button variant="ghost" size="sm" onClick={generatePOMassTemplate}>
                   📄 Download Template CSV
                </Button>
             </div>
             <ul style={{ paddingLeft: '20px', color: 'var(--color-text-sub)', fontSize: '13px', marginTop: '8px' }}>
                <li>Header kolom harus sesuai urutan: <strong>Nomor_PO, ID_Klien, SKU_Klien, Nama_produk, Total_QTY, QTY_Per_Bundle, Catatan</strong></li>
                <li><strong>SKU_Klien</strong> wajib terdaftar di Master Data Produk agar sistem dapat mengidentifikasi Model/Warna/Size.</li>
                <li><strong>ID_Klien</strong> bisa diisi dengan ID (C-xxx) atau Nama Klien yang ada di database.</li>
                <li>Gunakan format angka bulat untuk kolom QTY.</li>
             </ul>
          </div>

          <div>
             <Label>Pilih File CSV (.csv)</Label>
             <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                style={{ marginTop: '8px', display: 'block' }}
             />
          </div>

          {file && !summary && (
              <Button type="button" variant="ghost" onClick={handleParse} disabled={loading}>
                 {loading ? "Menganalisa Data..." : "Analisa Dokumen PO"}
              </Button>
          )}

          {summary && (
             <div style={{ 
               background: summary.errors.length > 0 ? '#3b1c1c' : '#1c3127', 
               padding: '16px', 
               borderRadius: '8px', 
               border: `1px solid ${summary.errors.length > 0 ? '#5c2020' : '#205c3d'}` 
             }}>
                <h4 style={{ color: summary.errors.length > 0 ? '#f87171' : '#4ade80', marginBottom: '12px' }}>
                  {summary.errors.length > 0 ? 'Ditemukan Masalah pada Data' : 'Ringkasan Analisa PO'}
                </h4>
                
                {summary.errors.length > 0 ? (
                  <div style={{ fontSize: '14px', color: '#fca5a5' }}>
                    <p>Sistem menemukan {summary.errors.length} masalah yang harus diperbaiki:</p>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      {summary.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                      {summary.errors.length > 5 && <li>...dan {summary.errors.length - 5} baris lainnya</li>}
                    </ul>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', color: 'white' }}>
                    <div>Total Baris Terbaca: <strong>{summary.entries.reduce((acc, e) => acc + e.po.items.length, 0)} baris</strong></div>
                    <div>Total PO Unik: <strong>{summary.entries.length} PO</strong></div>
                    <div>Total Bundel Tiket: <strong>{summary.totalBundles} bundle</strong></div>
                    <div>Status Validasi: <strong style={{ color: '#4ade80' }}>SIAP IMPOR</strong></div>
                  </div>
                )}
             </div>
          )}

        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button 
          variant="primary" 
          onClick={handleImport} 
          disabled={!summary || summary.errors.length > 0 || loading}
        >
          {loading ? 'Mengimpor...' : 'Konfirmasi & Tambahkan ke Antrian'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
