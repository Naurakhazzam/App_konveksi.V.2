import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import { useMasterStore } from '@/stores/useMasterStore';
import styles from './ModalTambahKasbon.module.css';

interface ModalTambahKasbonProps {
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export default function ModalTambahKasbon({ onClose, onConfirm }: ModalTambahKasbonProps) {
  const { karyawan } = useMasterStore();
  const [formData, setFormData] = useState({
    karyawanId: '',
    jumlah: 0,
    keterangan: '',
    tanggal: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.karyawanId || formData.jumlah <= 0) return;

    onConfirm({
      id: `KSB-${Date.now()}`,
      ...formData,
      status: 'belum_lunas'
    });
  };

  return (
    <Modal open={true} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader title="Tambah Pinjaman (Kasbon)" onClose={onClose} />
        <ModalBody>
          <div className={styles.container}>
            <div className={styles.field}>
              <Label>Nama Karyawan</Label>
              <select 
                className={styles.input}
                value={formData.karyawanId}
                onChange={e => setFormData(prev => ({ ...prev, karyawanId: e.target.value }))}
                required
              >
                <option value="">-- Pilih Karyawan --</option>
                {karyawan.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <Label>Jumlah Pinjaman (Rupiah)</Label>
              <input 
                type="number" 
                className={styles.input}
                value={formData.jumlah}
                onChange={e => setFormData(prev => ({ ...prev, jumlah: Number(e.target.value) }))}
                required
                min={1000}
              />
            </div>

            <div className={styles.field}>
              <Label>Keterangan</Label>
              <textarea 
                className={styles.textarea}
                value={formData.keterangan}
                onChange={e => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Alasan peminjaman..."
              />
            </div>

            <div className={styles.field}>
              <Label>Tanggal</Label>
              <input 
                type="date" 
                className={styles.input}
                value={formData.tanggal}
                onChange={e => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                required
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit">Simpan Pinjaman</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
