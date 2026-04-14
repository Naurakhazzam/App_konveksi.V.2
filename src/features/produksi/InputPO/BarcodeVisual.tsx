import React from 'react';
import Barcode from 'react-barcode';
import QRCode from 'react-qr-code';
import { Bundle } from '@/types';
import { useMasterStore } from '@/stores/useMasterStore';
import { usePOStore } from '@/stores/usePOStore';
import styles from './BarcodeVisual.module.css';

interface BarcodeVisualProps {
  bundle: Bundle;
}

export default function BarcodeVisual({ bundle }: BarcodeVisualProps) {
  const { model, warna, sizes } = useMasterStore();
  const { poList } = usePOStore();
  
  const poData = poList.find(po => po.id === bundle.po);
  const displayPO = poData?.nomorPO || bundle.po;
  
  const modelName = model.find(m => m.id === bundle.model)?.nama || bundle.model;
  const warnaName = warna.find(w => w.id === bundle.warna)?.nama || bundle.warna;
  const sizeName = (sizes as any[]).find((s: any) => s.id === bundle.size)?.nama || bundle.size;

  return (
    <div className={styles.ticket}>
      {/* Kolom Atas: Header & QTY */}
      <div className={styles.header}>
        <div className={styles.poCol}>
          <span className={styles.label}>PO NUMBER</span>
          <span className={styles.value}>{displayPO}</span>
        </div>
        <div className={styles.qtyCol}>
          <span className={styles.label}>QTY</span>
          <span className={styles.valueLarge}>{bundle.qtyBundle} <small>pcs</small></span>
        </div>
      </div>
      
      {/* Kolom Tengah: Info Produk (Besar) */}
      <div className={styles.productInfo}>
        <div className={styles.modelRow}>
          <span className={styles.brand}>STITCHLYX</span>
          <span className={styles.sku}>{bundle.skuKlien || bundle.skuInternal}</span>
        </div>
        <div className={styles.descRow}>
          <span className={styles.modelName}>{modelName}</span>
          <span className={styles.variant}>{warnaName}</span>
        </div>
      </div>

      <div className={styles.footerGrid}>
         <div className={styles.barcodeSection}>
            <Barcode 
              value={bundle.barcode} 
              width={1.2} 
              height={40} 
              fontSize={10} 
              background="transparent"
              margin={0}
            />
            <div className={styles.sizeBadge}>
              SIZE: {sizeName}
            </div>
         </div>
         <div className={styles.qrSection}>
            <div style={{ background: 'white', padding: '4px' }}>
              <QRCode 
                value={bundle.barcode} 
                size={50} 
                level="H"
              />
            </div>
         </div>
      </div>
    </div>
  );
}
