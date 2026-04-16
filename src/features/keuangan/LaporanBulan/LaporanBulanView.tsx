'use client';

import React, { useMemo, useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { useJurnalStore } from '@/stores/useJurnalStore';
import { formatRupiah } from '@/lib/utils/formatters';
import styles from './LaporanBulanView.module.css';

export default function LaporanBulanView() {
  const { entries } = useJurnalStore();
  const [selectedMonth, setSelectedMonth] = useState('2026-04');

  const pAndL = useMemo(() => {
    const monthly = entries.filter(e => e.tanggal.startsWith(selectedMonth));
    
    const pendapatan = monthly.filter(e => e.jenis === 'masuk').reduce((a, c) => a + c.nominal, 0);
    const hppBahan = monthly.filter(e => e.jenis === 'direct_bahan').reduce((a, c) => a + c.nominal, 0);
    const hppUpah = monthly.filter(e => e.jenis === 'direct_upah').reduce((a, c) => a + c.nominal, 0);
    const hppTotal = hppBahan + hppUpah;
    
    const labaKotor = pendapatan - hppTotal;
    const overhead = monthly.filter(e => e.jenis === 'overhead').reduce((a, c) => a + c.nominal, 0);
    const labaBersih = labaKotor - overhead;
    
    const netMargin = pendapatan > 0 ? (labaBersih / pendapatan) * 100 : 0;

    return { pendapatan, hppBahan, hppUpah, hppTotal, labaKotor, overhead, labaBersih, netMargin };
  }, [entries, selectedMonth]);

  const kpiRow = (
    <div className={styles.kpiRow}>
      <KpiCard label="Pendapatan (Revenue)" value={pAndL.pendapatan} accent="green" format="rupiah" />
      <KpiCard label="Laba Bersih (Net Income)" value={pAndL.labaBersih} accent="blue" format="rupiah" />
      <KpiCard label="Net Profit Margin" value={`${pAndL.netMargin.toFixed(1)}%`} accent={pAndL.netMargin >= 15 ? 'green' : 'yellow'} />
    </div>
  );

  return (
    <PageWrapper 
      title="Laporan Laba Rugi Eksekutif" 
      subtitle="Analisa performa finansial berdasarkan standar akuntansi konveksi"
      kpiRow={kpiRow}
      action={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" onClick={() => {
            import('@/lib/utils/export-utils').then(({ downloadCSV }) => {
              const exportData = [{
                'Periode': selectedMonth,
                'Pendapatan': pAndL.pendapatan,
                'HPP Bahan': pAndL.hppBahan,
                'HPP Upah': pAndL.hppUpah,
                'Total HPP': pAndL.hppTotal,
                'Laba Kotor': pAndL.labaKotor,
                'Overhead': pAndL.overhead,
                'Laba Bersih': pAndL.labaBersih,
                'Net Profit Margin (%)': pAndL.netMargin.toFixed(2)
              }];
              downloadCSV(exportData, `Laporan_Bulanan_${selectedMonth}`);
            });
          }}>
            Download CSV
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            🖨️ Cetak Laporan
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <div className={`${styles.filterBar} no-print`}>
          <label>Pilih Periode:</label>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)} 
          />
        </div>

        <div className={styles.reportGrid}>
          <Panel title="Income Statement (P&L)">
            <div className={styles.plWrapper}>
              {/* SECTION: PENDAPATAN */}
              <div className={styles.plSection}>
                <div className={styles.plHeader}>PENDAPATAN</div>
                <div className={styles.plRow}>
                  <span>Total Penjualan / Penerimaan PO</span>
                  <strong>{formatRupiah(pAndL.pendapatan)}</strong>
                </div>
                <div className={`${styles.plRow} ${styles.total}`}>
                  <span>TOTAL PENDAPATAN</span>
                  <strong>{formatRupiah(pAndL.pendapatan)}</strong>
                </div>
              </div>

              {/* SECTION: HPP */}
              <div className={styles.plSection}>
                <div className={styles.plHeader}>BEBAN POKOK PRODUKSI (HPP)</div>
                <div className={styles.plRow}>
                  <span>Biaya Bahan Baku & Aksesori</span>
                  <span className={styles.minus}>({formatRupiah(pAndL.hppBahan)})</span>
                </div>
                <div className={styles.plRow}>
                  <span>Biaya Upah Tenaga Kerja Langsung</span>
                  <span className={styles.minus}>({formatRupiah(pAndL.hppUpah)})</span>
                </div>
                <div className={`${styles.plRow} ${styles.totalSub}`}>
                  <span>TOTAL BEBAN POKOK</span>
                  <strong>{formatRupiah(pAndL.hppTotal)}</strong>
                </div>
              </div>

              {/* GROSS PROFIT */}
              <div className={styles.plHighlight}>
                <span>LABA KOTOR (GROSS PROFIT)</span>
                <strong>{formatRupiah(pAndL.labaKotor)}</strong>
              </div>

              {/* SECTION: OVERHEAD */}
              <div className={styles.plSection}>
                <div className={styles.plHeader}>BEBAN OPERASIONAL (OVERHEAD)</div>
                <div className={styles.plRow}>
                  <span>Listrik, Sewa, & Pemeliharaan</span>
                  <span className={styles.minus}>({formatRupiah(pAndL.overhead)})</span>
                </div>
                <div className={`${styles.plRow} ${styles.totalSub}`}>
                  <span>TOTAL BEBAN OPERASIONAL</span>
                  <strong>{formatRupiah(pAndL.overhead)}</strong>
                </div>
              </div>

              {/* NET PROFIT */}
              <div className={`${styles.plHighlight} ${styles.final}`}>
                <span>LABA BERSIH (NET INCOME)</span>
                <strong className={pAndL.labaBersih >= 0 ? styles.plus : styles.minus}>
                  {formatRupiah(pAndL.labaBersih)}
                </strong>
              </div>
            </div>
          </Panel>

          <div className={styles.sideInfo}>
            <Panel title="Analisa Margin">
              <div className={styles.marginCard}>
                <div className={styles.marginItem}>
                  <span>Gross Margin</span>
                  <Badge variant="purple" size="md">
                    {pAndL.pendapatan > 0 ? ((pAndL.labaKotor / pAndL.pendapatan) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
                <p className={styles.marginHint}>
                  Efisiensi produksi Anda berada pada level yang {pAndL.labaKotor / pAndL.pendapatan > 0.3 ? 'Sangat Baik' : 'Wajar'}.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
