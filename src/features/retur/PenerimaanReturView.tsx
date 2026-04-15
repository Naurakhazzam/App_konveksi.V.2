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
import { usePengirimanStore } from '@/stores/usePengirimanStore';
import { formatRupiah } from '@/lib/utils/formatters';
import styles from './Retur.module.css';

export default function PenerimaanReturView() {
  const { karyawan, alasanReject, model, warna, sizes, hppKomponen, produkHPPItems } = useMasterStore();
  const { bundles } = useBundleStore();
  const { processReturnAtomic, isBarcodeInReturn } = useReturnStore();

  const [search, setSearch] = useState('');
  const [foundBundle, setFoundBundle] = useState<any>(null);
  // BUG #17/#21: Simpan SJ yang ditemukan untuk validasi dan klienId
  const [foundSJ, setFoundSJ] = useState<any>(null);
  // BUG #19: Simpan max qty retur dari SJ item
  const [maxQtyRetur, setMaxQtyRetur] = useState<number>(9999);
  const [selectedAlasan, setSelectedAlasan] = useState('');
  const [isDownsize, setIsDownsize] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [qtyRetur, setQtyRetur] = useState(1);
  // BUG #20: Double-submit protection
  const [isSubmitting, setIsSubmitting] = useState(false);

  // BUG #17: Validasi SJ sebelum menerima retur
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const b = bundles.find(x => x.barcode === search);
    if (!b) {
      alert('Barcode tidak ditemukan atau tidak valid.');
      return;
    }

    // Guard 1: Bundle harus sudah dikirim via SJ
    if (!b.suratJalanId) {
      alert('Bundle ini belum pernah dikirim via Surat Jalan.');
      return;
    }

    // Guard 2: SJ harus sudah berstatus 'diterima'
    const sj = usePengirimanStore.getState().suratJalanList.find(
      s => s.id === b.suratJalanId
    );
    if (!sj || sj.status !== 'diterima') {
      alert("Bundle hanya bisa diretur setelah Surat Jalan berstatus 'diterima' oleh klien.");
      return;
    }

    // Simpan SJ untuk dipakai di handleConfirm (klienId)
    setFoundSJ(sj);

    // BUG #19: Cari qty SJ item untuk set batas atas
    const sjItem = sj.items?.find((item: any) => item.bundleBarcode === b.barcode);
    const maxQty = sjItem?.qty ?? b.qtyBundle ?? 9999;
    setMaxQtyRetur(maxQty);
    setQtyRetur(1);

    setFoundBundle(b);
    setSelectedAlasan('');
  };

  const getOriginalWorker = () => {
    if (!foundBundle) return null;
    const st = foundBundle.statusTahap.jahit;
    return st.karyawan ? karyawan.find(k => k.id === st.karyawan) : null;
  };

  const calcPenalty = (): number | null => {
    if (!foundBundle) return 0;
    const prd = (useMasterStore.getState() as any).produk.find((p: any) =>
      p.modelId === foundBundle.model &&
      p.warnaId === foundBundle.warna &&
      p.sizeId === foundBundle.size
    );
    if (!prd) return null;
    const komponenJahit = hppKomponen.find(k => k.nama === 'Upah Jahit');
    if (!komponenJahit) return null;
    const hppItem = produkHPPItems.find(h =>
      h.produkId === prd.id && h.komponenId === komponenJahit.id
    );
    if (!hppItem) return null;
    return hppItem.harga * qtyRetur;
  };

  // BUG #20: Bungkus dengan isSubmitting + BUG #18: Panggil processReturnAtomic
  const handleConfirm = async () => {
    if (!selectedAlasan) return alert('Pilih alasan retur');

    // BUG #19: Validasi qty tidak melebihi SJ
    if (qtyRetur > maxQtyRetur) {
      return alert(`QTY retur tidak boleh melebihi qty yang dikirim di Surat Jalan (maks: ${maxQtyRetur} pcs).`);
    }

    if (isBarcodeInReturn(foundBundle.barcode)) {
      return alert('Gagal: Barcode ini sudah memiliki data retur aktif yang belum diselesaikan. Cek menu Monitoring.');
    }

    const worker = getOriginalWorker();
    if (!worker) return alert('Karyawan asal tidak ditemukan di riwayat bundle ini.');

    const penalty = calcPenalty();
    if (penalty === null) {
      return alert('Gagal: Data HPP "Upah Jahit" untuk produk ini tidak ditemukan di master data. Pastikan produk dan komponen HPP sudah diisi dengan benar.');
    }

    // BUG #20: Double-submit guard
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const returnId = `RET-${Date.now()}`;

      // BUG #22: Simpan snapshot nama alasan, bukan hanya ID
      const alasanNama = alasanReject.find(a => a.id === selectedAlasan)?.nama ?? selectedAlasan;

      const ledgerEntry = {
        id: `PNL-${Date.now()}`,
        karyawan_id: worker.id,
        tanggal: now,
        keterangan: `POTONGAN RETUR KONSUMEN (${foundBundle.barcode}) - ${alasanNama}`,
        sumber_id: foundBundle.barcode,
        total: -penalty,
        tipe: 'reject_potong',
        status: 'belum_lunas',
      };

      // BUG #21: Gunakan klienId dari SJ aktual bukan placeholder
      const returnItem = {
        id: returnId,
        barcode: foundBundle.barcode,
        poId: foundBundle.po,
        klienId: foundSJ?.klienId ?? 'UNKNOWN',
        artikelNama: `${model.find(m => m.id === foundBundle.model)?.nama || ''} ${warna.find(w => w.id === foundBundle.warna)?.nama || ''}`,
        originalSize: foundBundle.size,
        currentSize: isDownsize ? newSize : foundBundle.size,
        karyawanOriginal: worker.id,
        karyawanPerbaikan: null,
        alasanRejectId: selectedAlasan,
        alasanRejectNama: alasanNama,
        jenisReject: 'bisa_diperbaiki' as const,
        status: 'diterima' as const,
        nominalPotongan: penalty,
        qtyBundle: qtyRetur,
        waktuDiterima: now,
        isSelfRepair: false,
      };

      // BUG #18: Satu panggilan atomik — jika gagal, semua rollback
      await processReturnAtomic(returnItem as any, ledgerEntry, foundBundle.barcode);

      alert('Retur berhasil diterima. Gaji penjahit asal telah dipotong.');
      setFoundBundle(null);
      setFoundSJ(null);
      setSearch('');
    } catch (err) {
      alert('Gagal memproses retur. Periksa koneksi dan coba lagi.');
      console.error('[PenerimaanReturView] handleConfirm error:', err);
    } finally {
      setIsSubmitting(false);
    }
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
                {foundSJ && (
                  <div className={styles.infoRow}><Label>Surat Jalan</Label><Badge variant="neutral">{foundSJ.nomorSJ}</Badge></div>
                )}
              </div>
            </Panel>

            <Panel title="Konfigurasi Retur" accent="yellow">
              <div className={styles.form}>
                <div className={styles.field}>
                  {/* BUG #19: max dibatasi oleh qty dari SJ item */}
                  <Label>QTY Produk yang Retur (Maks: {maxQtyRetur} pcs) <span className={styles.req}>*</span></Label>
                  <input 
                    type="number" 
                    value={qtyRetur} 
                    min={1}
                    max={maxQtyRetur}
                    onChange={e => setQtyRetur(Math.min(maxQtyRetur, Math.max(1, parseInt(e.target.value) || 1)))}
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
                  {calcPenalty() === null
                    ? <span style={{ color: 'var(--color-status-danger)', fontSize: '13px' }}>⚠️ Data HPP Upah Jahit tidak ditemukan di master</span>
                    : <Heading level={3} color="red">-{formatRupiah(calcPenalty() as number)}</Heading>
                  }
                </div>

                {/* BUG #20: disabled saat isSubmitting */}
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleConfirm}
                  disabled={!selectedAlasan || isSubmitting}
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi & Potong Gaji'}
                </Button>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
