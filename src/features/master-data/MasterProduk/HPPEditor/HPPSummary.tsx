import React from 'react';
import { useMasterStore } from '@/stores/useMasterStore';
import { formatRupiah } from '@/lib/utils/formatters';
import styles from './HPPSummary.module.css';

export interface HPPSummaryProps {
  produkId: string;
}

export default function HPPSummary({ produkId }: HPPSummaryProps) {
  const { getTotalHPPByKategori, getTotalHPP, getMargin, produk } = useMasterStore();
  const prod = produk.find(p => p.id === produkId);
  
  if (!prod) return null;

  const subBahanBaku = getTotalHPPByKategori(produkId, 'bahan_baku');
  const subBiayaProduksi = getTotalHPPByKategori(produkId, 'biaya_produksi');
  const subOverhead = getTotalHPPByKategori(produkId, 'overhead');
  const total = getTotalHPP(produkId);
  const margin = getMargin(produkId);

  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <span>Subtotal Bahan Baku:</span>
        <span className={styles.itemValue}>{formatRupiah(subBahanBaku)}</span>
      </div>
      <div className={styles.item}>
        <span>Subtotal Biaya Produksi:</span>
        <span className={styles.itemValue}>{formatRupiah(subBiayaProduksi)}</span>
      </div>
      <div className={styles.item}>
        <span>Subtotal Overhead:</span>
        <span className={styles.itemValue}>{formatRupiah(subOverhead)}</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.totalRow}>
        <span>TOTAL HPP:</span>
        <span className={styles.totalValue}>{formatRupiah(total)}</span>
      </div>
      <div className={styles.totalRow}>
        <span>Harga Jual:</span>
        <span className={`${styles.totalValue} ${styles.hargaJual}`}>{formatRupiah(prod.hargaJual)}</span>
      </div>

      <div className={`${styles.marginBox} ${margin.nominal >= 0 ? styles.positive : styles.negative}`}>
        <span>MARGIN:</span>
        <div className={styles.marginValues}>
          <span className={styles.totalValue}>{formatRupiah(margin.nominal)}</span>
          <span className={styles.marginPercent}>({margin.persen.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
}
