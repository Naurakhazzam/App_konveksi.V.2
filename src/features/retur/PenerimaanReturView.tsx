'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { Label, Heading } from '@/components/atoms/Typography';
import { useMasterStore } from '@/stores/useMasterStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { useReturnStore } from '@/stores/useReturnStore';
import { usePayrollStore } from '@/stores/usePayrollStore';
import { usePOStore } from '@/stores/usePOStore';
import { formatRupiah } from '@/lib/utils/formatters';
import { TAHAP_LABEL, TahapKey } from '@/lib/utils/production-helpers';
import styles from './Retur.module.css';

export default function PenerimaanReturView() {
  const { karyawan, alasanReject, model, warna, sizes, hppKomponen, produkHPPItems } = useMasterStore();
  const { bundles, updateStatusTahap } = useBundleStore();
  const { addReturn } = useReturnStore();
  const { addLedgerEntry } = usePayrollStore();

  const [search, setSearch] = useState('');
  const [foundBundle, setFoundBundle] = useState<any>(null);
  const [selectedAlasan, setSelectedAlasan] = useState('');
  const [isDownsize, setIsDownsize] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [qtyRetur, setQtyRetur] = useState(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const b = bundles.find(x => x.barcode === search);
    if (b) {
      setFoundBundle(b);
      // Determine original worker (usually from Jahit)
      setSelectedAlasan('');
    } else {
      alert('Barcode tidak ditemukan atau tidak valid.');
    }
  };

  const getOriginalWorker = () => {
    if (!foundBundle) return null;
    // We prioritize Jahit stage for the "original worker" who typically takes the hit
    const st = foundBundle.statusTahap.jahit;
    return st.karyawan ? karyawan.find(k => k.id === st.karyawan) : null;
  };

  const calcPenalty = () => {
    if (!foundBundle) return 0;
    
    // 1. Dapatkan Produk ID dari bundle ini
    // Untuk dummy, kita cari produk yang cocok dengan model + warna + size
    const prd = (useMasterStore.getState() as any).produk.find((p: any) => 
      p.modelId === foundBundle.model && 
      p.warnaId === foundBundle.warna && 
      p.sizeId === foundBundle.size
    );

    if (!prd) return 7500 * qtyRetur; // Fallback jika tidak ditemukan

    // 2. Cari komponen 'Upah Jahit' (KOMP-010) untuk produk ini
    const hppItem = produkHPPItems.find(h => h.produkId === prd.id && h.komponenId === 'KOMP-010');
    
    if (!hppItem) return 7500 * qtyRetur; // Fallback

    return hppItem.harga * qtyRetur;
  };

  const handleConfirm = () => {
    if (!selectedAlasan) return alert('Pilih alasan retur');
    
    // ANTI-LEAK: Cek jika sudah pernah diretur dan belum selesai
    const { isBarcodeInReturn } = useReturnStore.getState();
    if (isBarcodeInReturn(foundBundle.barcode)) {
      return alert('Gagal: Barcode ini sudah memiliki data retur aktif yang belum diselesaikan. Cek menu Monitoring.');
    }

    const worker = getOriginalWorker();
    if (!worker) return alert('Karyawan asal tidak ditemukan di riwayat bundle ini.');

    const penalty = calcPenalty();
    const now = new Date().toISOString();
    const returnId = `RET-${Date.now()}`;

    // 1. Apply Penalty to Payroll
    addLedgerEntry({
      id: `PNL-${Date.now()}`,
      karyawanId: worker.id,
      tanggal: now,
      keterangan: `POTONGAN RETUR KONSUMEN (${foundBundle.barcode}) - ${alasanReject.find(a => a.id === selectedAlasan)?.nama}`,
      sumberId: foundBundle.barcode,
      total: -penalty,
      tipe: 'reject_potong',
      status: 'belum_lunas'
    });

    // 2. Add to Return Store
    addReturn({
      id: returnId,
      barcode: foundBundle.barcode,
      poId: foundBundle.po,
      klienId: 'EXTERNAL-CONS', // Placeholder for consumer
      artikelNama: `${model.find(m => m.id === foundBundle.model)?.nama || ''} ${warna.find(w => w.id === foundBundle.warna)?.nama || ''}`,
      originalSize: foundBundle.size,
      currentSize: isDownsize ? newSize : foundBundle.size,
      karyawanOriginal: worker.id,
      karyawanPerbaikan: null,
      alasanRejectId: selectedAlasan,
      jenisReject: 'bisa_diperbaiki', // In this view we focus on repairable
      status: 'diterima',
      nominalPotongan: penalty,
      qtyBundle: qtyRetur, // QTY DIKUNCI DI SINI
      waktuDiterima: now,
      isSelfRepair: false
    });

    // 3. Reset Bundle Status for Repair
    // When returned, it goes back to "Ready for Repair" (starting from Jahit)
    const resetStages = ['jahit', 'lkancing', 'bbenang', 'qc', 'steam', 'packing'];
    resetStages.forEach(s => {
      updateStatusTahap(foundBundle.barcode, s, {
        status: null,
        qtyTerima: null,
        qtySelesai: null,
        karyawan: null
      });
    });

    alert('Retur berhasil diterima. Gaji penjahit asal telah dipotong.');
    setFoundBundle(null);
    setSearch('');
  };

  return (
    <PageWrapper title="Penerimaan Retur Konsumen" subtitle="Input barang kembali dari konsumen & aplikasi potongan upah.">
      <div className={styles.container}>
        <Panel title="Scan Barcode Produk">
          <form onSubmit={handleSearch} className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="Scan barcode di sini..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <Button variant="primary" type="submit">Cari</Button>
          </form>
        </Panel>

        {foundBundle && (
          <div className={styles.resultGrid}>
            <Panel title="Detail Produk">
              <div className={styles.infoList}>
                <div className={styles.infoRow}><Label>Barcode</Label><strong>{foundBundle.barcode}</strong></div>
                <div className={styles.infoRow}><Label>Status Scan</Label><Badge variant="success">READY FOR RETURN</Badge></div>
                <div className={styles.infoRow}><Label>Original Worker (Jahit)</Label><Badge variant="info">{getOriginalWorker()?.nama || 'Unknown'}</Badge></div>
              </div>
            </Panel>

            <Panel title="Konfigurasi Retur" accent="yellow">
              <div className={styles.form}>
                <div className={styles.field}>
                  <Label>QTY Produk yang Retur (Hanya Bisa Diinput Sekali) <span className={styles.req}>*</span></Label>
                  <input 
                    type="number" 
                    value={qtyRetur} 
                    onChange={e => setQtyRetur(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '10px', borderRadius: '8px', color: 'var(--color-text)' }}
                  />
                </div>

                <div className={styles.field}>
                  <Label>Alasan Retur <span className={styles.req}>*</span></Label>
                  <select value={selectedAlasan} onChange={e => setSelectedAlasan(e.target.value)}>
                    <option value="">-- Pilih Alasan --</option>
                    {alasanReject.map(a => (
                      <option key={a.id} value={a.id}>{a.nama}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <div className={styles.checkboxRow}>
                    <input 
                      type="checkbox" 
                      id="downsize" 
                      checked={isDownsize} 
                      onChange={e => setIsDownsize(e.target.checked)} 
                    />
                    <label htmlFor="downsize">Downsize (Kecilkan Ukuran)?</label>
                  </div>
                </div>

                {isDownsize && (
                  <div className={styles.field}>
                    <Label>Pilih Size Baru</Label>
                    <select value={newSize} onChange={e => setNewSize(e.target.value)}>
                      <option value="">-- Pilih --</option>
                      {sizes.map(s => (
                        <option key={s.id} value={s.id}>{s.nama}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.divider} />
                <div className={styles.penaltyInfo}>
                  <Label>Estimasi Potongan Upah:</Label>
                  <Heading level={3} color="red">-{formatRupiah(calcPenalty())}</Heading>
                </div>

                <Button variant="primary" fullWidth onClick={handleConfirm} disabled={!selectedAlasan}>
                  Konfirmasi & Potong Gaji
                </Button>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
