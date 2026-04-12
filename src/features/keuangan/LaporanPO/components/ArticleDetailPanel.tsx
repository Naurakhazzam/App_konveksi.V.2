'use client';

import React from 'react';
import { PurchaseOrder, ProdukHPPItem, HPPKomponen } from '@/types';
import { formatRupiah } from '@/lib/utils/formatters';
import styles from './ArticleDetailPanel.module.css';

interface ArticleDetailPanelProps {
  items: PurchaseOrder['items'];
  allHppItems: ProdukHPPItem[];
  allKomponen: HPPKomponen[];
}

export default function ArticleDetailPanel({ items, allHppItems, allKomponen }: ArticleDetailPanelProps) {
  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Rincian Estimasi per Artikel</h4>
      <div className={styles.articleGrid}>
        {items.map((item) => {
          const hppItems = allHppItems.filter(h => h.produkId === item.id || h.produkId === item.skuInternal);
          const totalHppPerPCS = hppItems.reduce((a, c) => a + (c.harga * c.qty), 0);
          
          return (
            <div key={item.id} className={styles.articleCard}>
              <div className={styles.articleHeader}>
                <strong>{item.skuKlien}</strong>
                <span>{item.qty} PCS</span>
              </div>
              
              <div className={styles.komponenList}>
                {hppItems.map(h => {
                  const kom = allKomponen.find(k => k.id === h.komponenId);
                  return (
                    <div key={h.id} className={styles.komponenItem}>
                      <span>{kom?.nama || 'Unknown'}</span>
                      <strong>{formatRupiah(h.harga * h.qty)}</strong>
                    </div>
                  );
                })}
              </div>
              
              <div className={styles.articleFooter}>
                <span>Total Estimasi / PCS:</span>
                <strong>{formatRupiah(totalHppPerPCS)}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
