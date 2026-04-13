'use client';

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import { useMasterStore } from '@/stores/useMasterStore';
import { InventoryItem } from '@/types';
import styles from './FormBahanBaku.module.css';

interface FormBahanBakuProps {
  onClose: () => void;
  onConfirm: (data: InventoryItem) => void;
  item?: InventoryItem;
}

export default function FormBahanBaku({ onClose, onConfirm, item }: FormBahanBakuProps) {
  const { satuan } = useMasterStore();
  
  const [formData, setFormData] = useState<InventoryItem>(item || {
    id: `INV-RAW-${Date.now()}`,
    nama: '',
    jenisBahan: 'kain',
    satuanId: '',
    stokAktual: 0,
    stokMinimum: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.satuanId) return;
    onConfirm(formData);
  };

  return (
    <Modal open={true} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader title={item ? "Edit Bahan Baku" : "Tambah Bahan Baku Baru"} onClose={onClose} />
        <ModalBody>
          <div className={styles.container}>
            <div className={styles.field}>
              <Label>Nama Bahan Baku</Label>
              <input 
                type="text" 
                className={styles.input} 
                value={formData.nama} 
                onChange={e => setFormData(p => ({ ...p, nama: e.target.value }))}
                placeholder="Misal: Kain Cotton Combed 30s"
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <Label>Jenis Bahan</Label>
                <select 
                  className={styles.select}
                  value={formData.jenisBahan}
                  onChange={e => setFormData(p => ({ ...p, jenisBahan: e.target.value as any }))}
                  required
                >
                  <option value="kain">Kain</option>
                  <option value="aksesori">Aksesori</option>
                  <option value="kemasan">Kemasan</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div className={styles.field}>
                <Label>Satuan (UOM)</Label>
                <select 
                  className={styles.select}
                  value={formData.satuanId}
                  onChange={e => setFormData(p => ({ ...p, satuanId: e.target.value }))}
                  required
                >
                  <option value="">-- Pilih Satuan --</option>
                  {satuan.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <Label>Stok Awal</Label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={formData.stokAktual} 
                  onChange={e => setFormData(p => ({ ...p, stokAktual: Number(e.target.value) }))}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className={styles.field}>
                <Label>Stok Minimum</Label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={formData.stokMinimum} 
                  onChange={e => setFormData(p => ({ ...p, stokMinimum: Number(e.target.value) }))}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">Batal</Button>
          <Button variant="primary" type="submit">Simpan Bahan Baku</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
