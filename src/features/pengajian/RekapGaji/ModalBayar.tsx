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
    gajiPokok: number; // NEW
    sisaKasbon: number;
    entryIds: string[];
  };
  onClose: () => void;
  onConfirm: (karyawanId: string, entryIds: string[], potongKasbon: number, hariKerja: number) => void;
}

export default function ModalBayar({ rekap, onClose, onConfirm }: ModalBayarProps) {
  const { error, success } = useToast();
  const [potongKasbon, setPotongKasbon] = useState(0);
  const [hariKerja, setHariKerja] = useState(6); // Default 6 days

  // Logic: 
  // upahBersih already includes FULL gajiPokok.
  // We need to subtract the difference if hariKerja < 6.
  const diffProrata = (hariKerja < 6) ? (rekap.gajiPokok / 6) * (6 - hariKerja) : 0;
  const upahSetelahProrata = rekap.upahBersih - diffProrata;
  const totalBayar = upahSetelahProrata - potongKasbon;

  const handleConfirm = () => {
    // Advanced Validation
    if (potongKasbon > rekap.sisaKasbon) {
      error('Input Invalid', 'Jumlah potong tidak boleh melebihi sisa kasbon.');
      return;
    }

    if (potongKasbon > upahSetelahProrata) {
      error('Input Invalid', 'Jumlah potong tidak boleh melebihi upah setelah pro-rata.');
      return;
    }

    if (potongKasbon < 0) {
      error('Input Invalid', 'Jumlah potong tidak boleh negatif.');
      return;
    }

    onConfirm(rekap.id, rekap.entryIds, potongKasbon, hariKerja);
    success('Pembayaran Berhasil', `Gaji untuk ${rekap.nama} telah diproses.`);
  };

  return (
    <Modal open={true} onClose={onClose} size="md">
      <ModalHeader title={`Bayar Gaji: ${rekap.nama}`} onClose={onClose} />
      <ModalBody>
        <div className={styles.container}>
          <div className={styles.summaryCard}>
            <div className={styles.row}>
              <span>Upah Bruto (Total)</span>
              <strong>{formatRupiah(rekap.upahBersih)}</strong>
            </div>
            {rekap.gajiPokok > 0 && (
              <div className={`${styles.row} ${styles.calculation}`}>
                <span>Prorata Gaji Pokok ({hariKerja}/6 hari)</span>
                <span className={diffProrata > 0 ? styles.red : ''}>
                  {diffProrata > 0 ? `- ${formatRupiah(diffProrata)}` : 'Full'}
                </span>
              </div>
            )}
            <div className={styles.row}>
              <span>Upah Akhir (Setelah Pro-rata)</span>
              <Heading level={4}>{formatRupiah(upahSetelahProrata)}</Heading>
            </div>
            <div className={styles.row}>
              <span>Sisa Kasbon Aktif</span>
              <strong className={styles.kasbon}>{formatRupiah(rekap.sisaKasbon)}</strong>
            </div>
          </div>

          <div className={styles.inputGrid}>
            <div className={styles.inputSection}>
              <Label>Hari Kerja (Standar 6 Hari)</Label>
              <input 
                type="number" 
                className={styles.input}
                value={hariKerja}
                onChange={(e) => setHariKerja(Math.min(6, Math.max(0, Number(e.target.value))))}
                max={6}
                min={0}
              />
              <p className={styles.hint}>Input 0-6 hari</p>
            </div>

            <div className={styles.inputSection}>
              <Label>Potong Kasbon (Rupiah)</Label>
              <input 
                type="number" 
                className={styles.input}
                value={potongKasbon}
                onChange={(e) => setPotongKasbon(Number(e.target.value))}
                max={Math.min(rekap.sisaKasbon, upahSetelahProrata)}
                min={0}
              />
              <p className={styles.hint}>
                Max potong: {formatRupiah(Math.min(rekap.sisaKasbon, upahSetelahProrata))}
              </p>
            </div>
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
