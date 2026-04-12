import React from 'react';
import Button from '@/components/atoms/Button';
import { HPPKomponen, ProdukHPPItem } from '@/types';
import { formatRupiah } from '@/lib/utils/formatters';

interface HPPItemRowProps {
  item: ProdukHPPItem;
  komponen: HPPKomponen;
  onUpdate: (data: Partial<ProdukHPPItem>) => void;
  onRemove: () => void;
}

import styles from './HPPItemRow.module.css';

export default function HPPItemRow({ item, komponen, onUpdate, onRemove }: HPPItemRowProps) {
  const subtotal = item.qty * item.harga;

  return (
    <div className={styles.row}>
      <button 
        type="button"
        className={styles.deleteBtn}
        onClick={onRemove}
      >×</button>
      
      <div className={styles.info}>
        <div className={styles.name}>{komponen.nama}</div>
        <div className={styles.inputs}>
          <input 
            type="number"
            className={styles.inputQty}
            value={item.qty || ''}
            onChange={(e) => onUpdate({ qty: parseFloat(e.target.value) || 0 })}
          />
          <span>{komponen.satuan} &times; Rp</span>
          <input 
            type="number"
            className={styles.inputHarga}
            value={item.harga || ''}
            onChange={(e) => onUpdate({ harga: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      
      <div className={styles.subtotal}>
        {formatRupiah(subtotal)}
      </div>
    </div>
  );
}
