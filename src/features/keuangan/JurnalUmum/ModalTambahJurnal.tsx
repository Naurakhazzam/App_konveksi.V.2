'use client';

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import { useMasterStore } from '@/stores/useMasterStore';
import { usePOStore } from '@/stores/usePOStore';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { JenisTransaksi } from '@/types';
import styles from './ModalTambahJurnal.module.css';

interface ModalTambahJurnalProps {
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export default function ModalTambahJurnal({ onClose, onConfirm }: ModalTambahJurnalProps) {
  const { kategoriTrx } = useMasterStore();
  const { poList } = usePOStore();
  const { items: inventoryItems, addTrxMasuk } = useInventoryStore();
  
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
    inventoryQty: 0
  });

  const selectedKategori = kategoriTrx.find(k => k.id === formData.kategoriTrxId);
  const isBahanBaku = selectedKategori?.jenis === 'direct_bahan';
  const isUpah = selectedKategori?.jenis === 'direct_upah';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kategoriTrxId || formData.nominal <= 0) return;
    if (isBahanBaku && (!formData.inventoryItemId || formData.inventoryQty <= 0)) {
      alert('Untuk pembelian bahan, mohon pilih item inventory dan jumlahnya.');
      return;
    }

    const jurnalId = formData.id;
    const finalData = {
      ...formData,
      jenis: selectedKategori?.jenis || 'overhead'
    };

    // Integrasi Inventory
    if (isBahanBaku && formData.inventoryItemId) {
      addTrxMasuk({
        id: `TRXM-${Date.now()}`,
        itemId: formData.inventoryItemId,
        qty: formData.inventoryQty,
        tanggal: formData.tanggal,
        jurnalId: jurnalId,
        keterangan: `Masuk dari Jurnal: ${formData.keterangan}`
      });
    }

    onConfirm(finalData);
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
                    <Label>Jumlah yang Dibeli</Label>
                    <input 
                      type="number" 
                      className={styles.input}
                      value={formData.inventoryQty}
                      onChange={e => setFormData(p => ({ ...p, inventoryQty: Number(e.target.value) }))}
                      placeholder="Qty masuk"
                      required={isBahanBaku}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <Label>No. Faktur / Nota</Label>
                  <input 
                    type="text" 
                    className={styles.input}
                    value={formData.noFaktur}
                    onChange={e => setFormData(p => ({ ...p, noFaktur: e.target.value }))}
                    placeholder="Misal: INV/2026/001"
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
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" disabled={isUpah}>
            Simpan Transaksi
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
