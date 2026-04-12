'use client';

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import { useMasterStore } from '@/stores/useMasterStore';
import styles from './ModalTambahItem.module.css';

interface ModalTambahItemProps {
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export default function ModalTambahItem({ onClose, onConfirm }: ModalTambahItemProps) {
  const { kategori, satuan } = useMasterStore();
  const [formData, setFormData] = useState({
    id: `INV-${Date.now()}`,
    nama: '',
    kategoriId: '',
    satuanId: '',
    stokAktual: 0,
    stokMinimum: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.kategoriId || !formData.satuanId) return;
    onConfirm(formData);
  };

  return (
    <Modal open={true} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader title="Tambah Item Inventory" onClose={onClose} />
        <ModalBody>
          <div className={styles.container}>
            <div className={styles.field}>
              <Label>Nama Barang</Label>
              <input 
                type="text" 
                className={styles.input} 
                value={formData.nama} 
                onChange={e => setFormData(p => ({ ...p, nama: e.target.value }))}
                placeholder="Misal: Kain Katun Airflow"
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <Label>Kategori</Label>
                <select 
                  className={styles.input}
                  value={formData.kategoriId}
                  onChange={e => setFormData(p => ({ ...p, kategoriId: e.target.value }))}
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <Label>Satuan (UOM)</Label>
                <select 
                  className={styles.input}
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
                  required
                />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit">Simpan Item</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
