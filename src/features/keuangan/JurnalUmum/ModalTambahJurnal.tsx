'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import { useMasterStore } from '@/stores/useMasterStore';
import { usePOStore } from '@/stores/usePOStore';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { JenisTransaksi } from '@/types';
import { formatRupiah } from '@/lib/utils/formatters';
import AuthGateModal from '@/components/organisms/AuthGateModal/AuthGateModal';
import styles from './ModalTambahJurnal.module.css';

interface ModalTambahJurnalProps {
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export default function ModalTambahJurnal({ onClose, onConfirm }: ModalTambahJurnalProps) {
  const { kategoriTrx, satuan } = useMasterStore();
  const { poList } = usePOStore();
  const { items: inventoryItems, addBatch, generateInvoiceNo } = useInventoryStore();
  
  const [formData, setFormData] = useState({
    id: `JRN-${Date.now()}`,
    kategoriTrxId: '',
    jenis: 'overhead' as JenisTransaksi,
    nominal: 0,
    tanggal: new Date().toISOString().split('T')[0],
    noFaktur: '',
    tagPOs: [] as string[],
    poId: '',
    keterangan: '',
    inventoryItemId: '',
    inventoryQty: 0,
    pricePerUnit: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  const selectedKategori = kategoriTrx.find(k => k.id === formData.kategoriTrxId);
  const isBahanBaku = selectedKategori?.jenis === 'direct_bahan';
  const isUpah = selectedKategori?.jenis === 'direct_upah';
  
  const selectedItem = useMemo(() => 
    inventoryItems.find(i => i.id === formData.inventoryItemId),
  [formData.inventoryItemId, inventoryItems]);

  const itemSatuan = useMemo(() => 
    satuan.find(s => s.id === selectedItem?.satuanId)?.nama || '',
  [selectedItem, satuan]);

  // Auto-generate invoice number when isBahanBaku becomes true
  useEffect(() => {
    if (isBahanBaku && !formData.noFaktur) {
      // generateInvoiceNo sekarang async (RPC) — harus await sebelum set state
      (async () => {
        const invoiceNo = await generateInvoiceNo();
        setFormData(prev => ({ ...prev, noFaktur: invoiceNo }));
      })();
    }
  }, [isBahanBaku, generateInvoiceNo, formData.noFaktur]);

  // Auto-calculate nominal
  useEffect(() => {
    if (isBahanBaku) {
      setFormData(prev => ({ ...prev, nominal: prev.inventoryQty * prev.pricePerUnit }));
    }
  }, [isBahanBaku, formData.inventoryQty, formData.pricePerUnit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kategoriTrxId) return;

    // BUG #27: Nominal validasi
    if (!isUpah && (!formData.nominal || formData.nominal <= 0)) {
      alert('Nominal harus lebih dari 0.');
      return;
    }

    if (isBahanBaku && (!formData.inventoryItemId || formData.inventoryQty <= 0)) {
      alert('Untuk pembelian bahan, mohon pilih item inventory dan jumlahnya.');
      return;
    }

    // BUG #26: Double-submit prevention
    if (isSubmitting) return;

    // Prepare final data
    const jurnalId = formData.id;
    let finalKeterangan = formData.keterangan;
    if (isBahanBaku && selectedItem) {
      const detailStr = `${selectedItem.nama} — ${formData.inventoryQty} ${itemSatuan} @ ${formatRupiah(formData.pricePerUnit)}`;
      finalKeterangan = finalKeterangan ? `${detailStr} | ${finalKeterangan}` : detailStr;
    }

    const finalData = {
      ...formData,
      jenis: selectedKategori?.jenis || 'overhead',
      keterangan: finalKeterangan
    };

    // BUG #28: AuthGate sebelum eksekusi
    setPendingData(finalData);
    setAuthGateOpen(true);
  };

  const executeSubmit = async () => {
    if (!pendingData) return;
    setIsSubmitting(true);
    try {
      // CATATAN: Tidak memanggil addBatch() di sini.
      // RPC record_purchase_atomic (via onConfirm → useJurnalStore.addEntry)
      // sudah menangani INSERT inventory_batch + UPDATE stok secara atomik.
      // Memanggil addBatch() secara terpisah akan menyebabkan double-stok (BUG #29).
      await onConfirm(pendingData);
    } finally {
      setIsSubmitting(false);
      setPendingData(null);
    }
  };

  const handleTogglePO = (poId: string) => {
    setFormData(prev => ({
      ...prev,
      tagPOs: prev.tagPOs.includes(poId) 
        ? prev.tagPOs.filter(id => id !== poId)
        : [...prev.tagPOs, poId]
    }));
  };

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader title="Tambah Transaksi Keuangan" onClose={onClose} />
        <ModalBody>
          <div className={styles.container}>
            <div className={styles.field}>
              <Label>Kategori Transaksi</Label>
              <select 
                className={styles.input}
                value={formData.kategoriTrxId}
                onChange={e => setFormData(p => ({ ...p, kategoriTrxId: e.target.value }))}
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {kategoriTrx.map(k => (
                  <option key={k.id} value={k.id}>
                    [{k.jenis.toUpperCase()}] {k.nama}
                  </option>
                ))}
              </select>
              {isUpah && (
                <div className={styles.warningBox}>
                  ⚠️ <strong>Akses Ditolak:</strong> Upah karyawan hanya bisa diinput melalui proses <strong>REKAP</strong> di modul Penggajian untuk menjaga akurasi laporan.
                </div>
              )}
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <Label>Nominal (Rupiah)</Label>
                <input 
                  type="number" 
                  className={styles.input}
                  value={formData.nominal}
                  onChange={e => setFormData(p => ({ ...p, nominal: Number(e.target.value) }))}
                  readOnly={isBahanBaku}
                  required
                />
              </div>
              <div className={styles.field}>
                <Label>Tanggal</Label>
                <input 
                  type="date" 
                  className={styles.input}
                  value={formData.tanggal}
                  onChange={e => setFormData(p => ({ ...p, tanggal: e.target.value }))}
                  required
                />
              </div>
            </div>

            {isBahanBaku && (
              <div className={styles.bahanSection}>
                <div className={styles.sectionHeader}>📦 INTEGRASI INVENTORY</div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <Label>Pilih Item di Gudang</Label>
                    <select 
                      className={styles.input}
                      value={formData.inventoryItemId}
                      onChange={e => setFormData(p => ({ ...p, inventoryItemId: e.target.value }))}
                      required={isBahanBaku}
                    >
                      <option value="">-- Pilih Item --</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>{item.nama} (Stok: {item.stokAktual})</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <Label>Satuan</Label>
                    <input type="text" className={styles.input} value={itemSatuan || '—'} readOnly tabIndex={-1} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <Label>Jumlah yang Dibeli</Label>
                    <input 
                      type="number" 
                      className={styles.input}
                      value={formData.inventoryQty}
                      onChange={e => setFormData(p => ({ ...p, inventoryQty: Number(e.target.value) }))}
                      placeholder="Qty masuk"
                      required={isBahanBaku}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className={styles.field}>
                    <Label>Harga per Satuan</Label>
                    <input 
                      type="number" 
                      className={styles.input}
                      value={formData.pricePerUnit}
                      onChange={e => setFormData(p => ({ ...p, pricePerUnit: Number(e.target.value) }))}
                      placeholder="Harga beli"
                      required={isBahanBaku}
                      min="0"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <Label>No. Faktur / Nota (Otomatis)</Label>
                  <input 
                    type="text" 
                    className={styles.input}
                    value={formData.noFaktur}
                    readOnly
                    placeholder="Auto-generated"
                  />
                </div>
                
                <div className={styles.field}>
                  <Label>Tag ke PO (Biaya dibebankan ke:)</Label>
                  <div className={styles.poGrid}>
                    {poList.map((po: any) => (
                      <label key={po.id} className={styles.poChip}>
                        <input 
                          type="checkbox" 
                          checked={formData.tagPOs.includes(po.id)}
                          onChange={() => handleTogglePO(po.id)}
                        />
                        <span>{po.nomorPO}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isBahanBaku && !isUpah && (
              <div className={styles.field}>
                <Label>Link ke PO (Opsional)</Label>
                <select 
                  className={styles.input}
                  value={formData.poId}
                  onChange={e => setFormData(p => ({ ...p, poId: e.target.value }))}
                >
                  <option value="">-- Tidak ada --</option>
                  {poList.map((p: any) => <option key={p.id} value={p.id}>{p.nomorPO}</option>)}
                </select>
              </div>
            )}

            <div className={styles.field}>
              <Label>Keterangan</Label>
              <textarea 
                className={styles.textarea}
                value={formData.keterangan}
                onChange={e => setFormData(p => ({ ...p, keterangan: e.target.value }))}
                placeholder="Deskripsi transaksi..."
                required
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">Batal</Button>
          <Button variant="primary" type="submit" disabled={isUpah || isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Simpan Transaksi'}
          </Button>
        </ModalFooter>
      </form>

      <AuthGateModal
        isOpen={authGateOpen}
        onClose={() => {
          setAuthGateOpen(false);
          setPendingData(null);
        }}
        type="password"
        onSuccess={() => {
          setAuthGateOpen(false);
          executeSubmit();
        }}
        title="Otorisasi Pencatatan Jurnal"
        message="Masukkan password Anda untuk menyetujui transaksi keuangan ini."
      />
    </Modal>
  );
}
