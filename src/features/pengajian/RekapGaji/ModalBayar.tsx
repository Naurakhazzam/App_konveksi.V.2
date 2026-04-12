import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label, Heading } from '@/components/atoms/Typography';
import { formatRupiah } from '@/lib/utils/formatters';
import styles from './ModalBayar.module.css';

import { useToast } from '@/components/molecules/Toast';

interface ModalBayarProps {
  rekap: {
    id: string;
    nama: string;
    upahBersih: number;
    sisaKasbon: number;
    entryIds: string[];
  };
  onClose: () => void;
  onConfirm: (karyawanId: string, entryIds: string[], potongKasbon: number) => void;
}

export default function ModalBayar({ rekap, onClose, onConfirm }: ModalBayarProps) {
  const { error, success } = useToast();
  const [potongKasbon, setPotongKasbon] = useState(Math.min(rekap.upahBersih, rekap.sisaKasbon));

  const totalBayar = rekap.upahBersih - potongKasbon;

  const handleConfirm = () => {
    // Advanced Validation
    if (potongKasbon > rekap.sisaKasbon) {
      error('Input Invalid', 'Jumlah potong tidak boleh melebihi sisa kasbon.');
      return;
    }

    if (potongKasbon > rekap.upahBersih) {
      error('Input Invalid', 'Jumlah potong tidak boleh melebihi total upah bersih.');
      return;
    }

    if (potongKasbon < 0) {
      error('Input Invalid', 'Jumlah potong tidak boleh negatif.');
      return;
    }

    onConfirm(rekap.id, rekap.entryIds, potongKasbon);
    success('Pembayaran Berhasil', `Gaji untuk ${rekap.nama} telah diproses.`);
  };

  return (
    <Modal open={true} onClose={onClose} size="md">
      <ModalHeader title={`Bayar Gaji: ${rekap.nama}`} onClose={onClose} />
      <ModalBody>
        <div className={styles.container}>
          <div className={styles.summaryCard}>
            <div className={styles.row}>
              <span>Upah Bersih (Periode)</span>
              <strong>{formatRupiah(rekap.upahBersih)}</strong>
            </div>
            <div className={styles.row}>
              <span>Sisa Kasbon Aktif</span>
              <strong className={styles.kasbon}>{formatRupiah(rekap.sisaKasbon)}</strong>
            </div>
          </div>

          <div className={styles.inputSection}>
            <Label>Potong Kasbon (Rupiah)</Label>
            <input 
              type="number" 
              className={styles.input}
              value={potongKasbon}
              onChange={(e) => setPotongKasbon(Number(e.target.value))}
              max={Math.min(rekap.sisaKasbon, rekap.upahBersih)}
              min={0}
            />
            <p className={styles.hint}>
              Max potong: {formatRupiah(Math.min(rekap.sisaKasbon, rekap.upahBersih))}
            </p>
          </div>

          <div className={styles.resultCard}>
            <Label>Total yang Dibayarkan (Netto)</Label>
            <Heading level={2} className={styles.finalAmount}>
              {formatRupiah(totalBayar)}
            </Heading>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" onClick={handleConfirm}>
          💳 Konfirmasi Pembayaran
        </Button>
      </ModalFooter>
    </Modal>
  );
}
