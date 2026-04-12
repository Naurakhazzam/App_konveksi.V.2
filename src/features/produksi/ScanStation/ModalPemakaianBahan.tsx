'use client';

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label, Heading } from '@/components/atoms/Typography';
import NumberInput from '@/components/atoms/Input/NumberInput';
import styles from './ModalPemakaianBahan.module.css';

interface ModalPemakaianBahanProps {
  open: boolean;
  onClose: () => void;
  artikelNama: string;
  poNomor: string;
  onConfirm: (meter: number, gram: number) => void;
}

export default function ModalPemakaianBahan({ 
  open, 
  onClose, 
  artikelNama, 
  poNomor, 
  onConfirm 
}: ModalPemakaianBahanProps) {
  const [meter, setMeter] = useState<number | ''>('');
  const [gram, setGram] = useState<number | ''>('');

  // At least one field must be filled
  const isValid = (meter !== '' && Number(meter) > 0) || (gram !== '' && Number(gram) > 0);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(Number(meter || 0), Number(gram || 0));
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" closeOnBackdrop={true} closeOnEsc={true}>
      <ModalHeader title="🧵 Input Pemakaian Bahan" onClose={handleCancel} />
      <ModalBody>
        <div className={styles.container}>
          <div className={styles.header}>
            <Heading level={4}>{poNomor}</Heading>
            <p className={styles.artikel}>{artikelNama}</p>
          </div>

          <div className={styles.form}>
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
        <Button variant="ghost" onClick={handleCancel}>Batal Scan</Button>
        <Button variant="primary" onClick={handleConfirm} disabled={!isValid}>
          💾 Simpan Data Bahan
        </Button>
      </ModalFooter>
    </Modal>
  );
}
