import React from 'react';
import { Bundle } from '@/types';
import Button from '@/components/atoms/Button';
import BarcodeVisual from './BarcodeVisual';
import styles from './TiketBarcode.module.css';

interface TiketBarcodeProps {
  bundles: Bundle[];
  onBack: () => void;
}

export default function TiketBarcode({ bundles, onBack }: TiketBarcodeProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.noPrint}>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onBack}>← Kembali</Button>
          <Button variant="primary" onClick={handlePrint}>🖨️ Cetak Sekarang</Button>
        </div>
        <p className={styles.help}>Gunakan ukuran kertas A4. Pastikan margins diset ke "Minimum" atau "None" di pengaturan print browser.</p>
      </div>

      <div className={styles.printArea}>
        <div className={styles.grid}>
          {bundles.map((bundle, idx) => (
            <BarcodeVisual key={idx} bundle={bundle} />
          ))}
        </div>
      </div>
    </div>
  );
}
