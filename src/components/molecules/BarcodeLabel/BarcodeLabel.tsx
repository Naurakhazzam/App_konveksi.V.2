import React from 'react';
import { MonoText, Label } from '../../atoms/Typography';
import styles from './BarcodeLabel.module.css';

export interface BarcodeLabelProps {
  barcode: string;
  po: string;
  model: string;
  warna: string;
  size: string;
  qtyBundle: number;
  className?: string;
}

export default function BarcodeLabel({ barcode, po, model, warna, size, qtyBundle, className }: BarcodeLabelProps) {
  return (
    <div className={`${styles.labelContainer} ${className || ''}`}>
      <div className={styles.barcodePreview}>
        <MonoText size="lg" className={styles.barcodeText}>{barcode}</MonoText>
      </div>
      
      <div className={styles.infoGrid}>
        <div className={styles.infoCol}>
          <Label size="xs" color="sub">PO</Label>
          <MonoText size="sm">{po}</MonoText>
        </div>
        <div className={styles.infoCol}>
          <Label size="xs" color="sub">Model</Label>
          <Label size="sm" uppercase>{model}</Label>
        </div>
        <div className={styles.infoCol}>
          <Label size="xs" color="sub">Warna</Label>
          <Label size="sm" uppercase>{warna}</Label>
        </div>
        <div className={styles.infoCol}>
          <Label size="xs" color="sub">Size</Label>
          <Label size="sm" uppercase>{size}</Label>
        </div>
        <div className={styles.infoCol}>
          <Label size="xs" color="sub">QTY</Label>
          <MonoText size="sm">{qtyBundle}</MonoText>
        </div>
      </div>
    </div>
  );
}
