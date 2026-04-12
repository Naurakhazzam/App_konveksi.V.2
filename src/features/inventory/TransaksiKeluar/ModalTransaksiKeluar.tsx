'use client';

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { usePOStore } from '@/stores/usePOStore';
import styles from './ModalTransaksiKeluar.module.css';

interface ModalTransaksiKeluarProps {
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export default function ModalTransaksiKeluar({ onClose, onConfirm }: ModalTransaksiKeluarProps) {
  const { items } = useInventoryStore();
  const { poList } = usePOStore();
  
  const [formData, setFormData] = useState({
    id: `TK-${Date.now()}`,
    itemId: '',
    qty: 0,
    referensiPO: '',
    keterangan: '',
    tanggal: new Date().toISOString()
  });

  const selectedItem = items.find(i => i.id === formData.itemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId || formData.qty <= 0) return;
    
    if (selectedItem && formData.qty > selectedItem.stokAktual) {
      alert(`Stok tidak mencukupi! Maksimal: ${selectedItem.stokAktual}`);
      return;
    }

    onConfirm(formData);
  };

  return (
    <Modal open={true} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader title="Catat Pemakaian (Out)" onClose={onClose} />
        <ModalBody>
          <div className={styles.container}>
            <div className={styles.field}>
              <Label>Pilih Barang</Label>
              <select 
                className={styles.input}
                value={formData.itemId}
                onChange={e => setFormData(p => ({ ...p, itemId: e.target.value }))}
                required
              >
                <option value="">-- Pilih Barang --</option>
                {items.filter(i => i.stokAktual > 0).map(i => (
                  <option key={i.id} value={i.id}>{i.nama} (Stok: {i.stokAktual})</option>
                ))}
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <Label>Jumlah Pemakaian</Label>
                <input 
                  type="number" 
                  className={styles.input}
                  value={formData.qty}
                  onChange={e => setFormData(p => ({ ...p, qty: Number(e.target.value) }))}
                  max={selectedItem?.stokAktual}
                  required
                />
              </div>
              <div className={styles.field}>
                <Label>Untuk PO (Opsional)</Label>
                <select 
                  className={styles.input}
                  value={formData.referensiPO}
                  onChange={e => setFormData(p => ({ ...p, referensiPO: e.target.value }))}
                >
                  <option value="">-- Umum --</option>
                  {poList.map((p: any) => <option key={p.id} value={p.noPO}>{p.noPO}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <Label>Keterangan</Label>
              <textarea 
                className={styles.textarea}
                value={formData.keterangan}
                onChange={e => setFormData(p => ({ ...p, keterangan: e.target.value }))}
                placeholder="Misal: Untuk sample PO 001"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit">Catat Transaksi</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
