'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label, Heading } from '@/components/atoms/Typography';
import NumberInput from '@/components/atoms/Input/NumberInput';
import styles from './ModalPemakaianBahan.module.css';
import { useInventoryStore } from '@/stores/useInventoryStore';

interface InitialBahanData {
  meter: number;
  gram: number;
  inventoryItemId: string;
}

interface ModalPemakaianBahanProps {
  open: boolean;
  onClose: () => void;
  artikelNama: string;
  poNomor: string;
  onConfirm: (meter: number, gram: number, inventoryItemId: string) => void;
  /** Jika bahan sudah pernah diisi, kirim data lama — modal tampil dalam mode ringkas */
  initialData?: InitialBahanData | null;
}

export default function ModalPemakaianBahan({ 
  open, 
  onClose, 
  artikelNama, 
  poNomor, 
  onConfirm,
  initialData,
}: ModalPemakaianBahanProps) {
  const { items } = useInventoryStore();
  const [meter, setMeter] = useState<number | ''>(initialData?.meter || '');
  const [gram, setGram] = useState<number | ''>(initialData?.gram || '');
  const [selectedItem, setSelectedItem] = useState(initialData?.inventoryItemId || '');

  // Sync state ketika modal dibuka ulang
  useEffect(() => {
    if (open) {
      setMeter(initialData?.meter || '');
      setGram(initialData?.gram || '');
      setSelectedItem(initialData?.inventoryItemId || '');
    }
  }, [open, initialData]);

  const kainItems = items.filter(i => i.jenisBahan === 'kain');
  const isValid = ((meter !== '' && Number(meter) > 0) || (gram !== '' && Number(gram) > 0)) && !!selectedItem;

  const namaKain = kainItems.find(i => i.id === initialData?.inventoryItemId)?.nama;

  // ── Mode Ringkas: data sudah pernah diisi ────────────────────────────────
  if (initialData) {
    return (
      <Modal open={open} onClose={onClose} size="sm" closeOnBackdrop={true} closeOnEsc={true}>
        <ModalHeader title="🧵 Pemakaian Bahan" onClose={onClose} />
        <ModalBody>
          <div className={styles.container}>
            <div className={styles.header}>
              <Heading level={4}>{poNomor}</Heading>
              <p className={styles.artikel}>{artikelNama}</p>
            </div>

            <div className={styles.alreadyFilled}>
              <span className={styles.alreadyFilledIcon}>✅</span>
              <div>
                <strong>Pemakaian bahan sudah pernah diisi</strong>
                <ul className={styles.alreadyFilledList}>
                  {namaKain && <li>Bahan: <strong>{namaKain}</strong></li>}
                  {initialData.meter > 0 && <li>Kain: <strong>{initialData.meter} meter/pcs</strong></li>}
                  {initialData.gram > 0 && <li>Berat: <strong>{initialData.gram} gram/pcs</strong></li>}
                </ul>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={() => onConfirm(initialData.meter, initialData.gram, initialData.inventoryItemId)}
          >
            ✅ OK, Lanjutkan
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  // ── Mode Normal: belum ada data ───────────────────────────────────────────
  return (
    <Modal open={open} onClose={onClose} size="sm" closeOnBackdrop={true} closeOnEsc={true}>
      <ModalHeader title="🧵 Input Pemakaian Bahan" onClose={onClose} />
      <ModalBody>
        <div className={styles.container}>
          <div className={styles.header}>
            <Heading level={4}>{poNomor}</Heading>
            <p className={styles.artikel}>{artikelNama}</p>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <Label>Pilih Bahan Baku <span className={styles.req}>*</span></Label>
              <select 
                className={styles.select} 
                value={selectedItem} 
                onChange={(e) => setSelectedItem(e.target.value)}
              >
                <option value="">-- Pilih kain dari gudang --</option>
                {kainItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.nama} (Stok: {item.stokAktual} {item.satuanId})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <Label>Pemakaian Kain (Meter / pcs) <span className={styles.req}>*</span></Label>
              <NumberInput 
                value={meter} 
                onChange={(v) => setMeter(v as number)} 
                placeholder="Misal: 1.25"
              />
            </div>

            <div className={styles.field}>
              <Label>Berat Bahan (Gram / pcs) <span className={styles.req}>*</span></Label>
              <NumberInput 
                value={gram} 
                onChange={(v) => setGram(v as number)} 
                placeholder="Misal: 250"
              />
            </div>
          </div>

          <div className={styles.alert}>
            💡 Anda bisa mengisi salah satu atau keduanya (Meter / Gram). Data ini digunakan untuk perhitungan HPP.
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Batal Scan</Button>
        <Button variant="primary" onClick={() => onConfirm(Number(meter || 0), Number(gram || 0), selectedItem)} disabled={!isValid}>
          💾 Simpan Data Bahan
        </Button>
      </ModalFooter>
    </Modal>
  );
}
