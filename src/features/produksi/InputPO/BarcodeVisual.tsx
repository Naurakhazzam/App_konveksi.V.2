import React from 'react';
import { Bundle } from '@/types';
import { useMasterStore } from '@/stores/useMasterStore';
import styles from './BarcodeVisual.module.css';

interface BarcodeVisualProps {
  bundle: Bundle;
}

export default function BarcodeVisual({ bundle }: BarcodeVisualProps) {
  const { model, warna, sizes } = useMasterStore();
  
  const modelName = model.find(m => m.id === bundle.model)?.nama || bundle.model;
  const warnaName = warna.find(w => w.id === bundle.warna)?.nama || bundle.warna;
  const sizeName = sizes.find((s: any) => s.id === bundle.size)?.nama || bundle.size;

  return (
    <div className={styles.ticket}>
      <div className={styles.header}>
        <span className={styles.po}>{bundle.po}</span>
        <span className={styles.qty}>Isi: {bundle.qtyBundle} pcs</span>
      </div>
      
      <div className={styles.details}>
        {modelName} | {warnaName} | {sizeName}
      </div>

      <div className={styles.barcodeBox}>
        {/* Simulating barcode visual via text */}
        <div className={styles.barcodeStripes}>
          || |||| | ||| || ||| | || |||| | ||
        </div>
        <div className={styles.barcodeText}>
          {bundle.barcode}
        </div>
      </div>
      
      {bundle.skuKlien && (
        <div className={styles.footer}>
          SKU: {bundle.skuKlien}
        </div>
      )}
    </div>
  );
}
