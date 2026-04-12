'use client';

import React, { useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import { useJurnalStore } from '@/stores/useJurnalStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { formatRupiah } from '@/lib/utils/formatters';
import ExpenseBarChart from './ExpenseBarChart';
import styles from './RingkasanView.module.css';

export default function RingkasanView() {
  const { entries, getTotalByTipe } = useJurnalStore();
  const { kategoriTrx } = useMasterStore();

  const financeStats = useMemo(() => {
    const pemasukan = getTotalByTipe('masuk');
    const pengeluaran = getTotalByTipe('keluar');
    const saldo = pemasukan - pengeluaran;
    
    // Breakdown pengeluaran for chart
    const bahan = entries.filter(e => e.jenis === 'direct_bahan').reduce((a, c) => a + c.nominal, 0);
    const upah = entries.filter(e => e.jenis === 'direct_upah').reduce((a, c) => a + c.nominal, 0);
    const overhead = entries.filter(e => e.jenis === 'overhead').reduce((a, c) => a + c.nominal, 0);

    // Breakdown per Category for table
    const categoryStats = kategoriTrx.map(cat => {
      const catEntries = entries.filter(e => e.kategoriTrxId === cat.id);
      const total = catEntries.reduce((a, c) => a + c.nominal, 0);
      return {
        id: cat.id,
        nama: cat.nama,
        jenis: cat.jenis,
        count: catEntries.length,
        total
      };
    }).filter(s => s.count > 0).sort((a,b) => b.total - a.total);

    return { pemasukan, pengeluaran, saldo, bahan, upah, overhead, categoryStats };
  }, [entries, getTotalByTipe, kategoriTrx]);

  const chartData = [
    { label: 'Bahan Baku', value: financeStats.bahan, color: 'var(--color-purple)' },
    { label: 'Upah Produksi', value: financeStats.upah, color: 'var(--color-blue)' },
    { label: 'Overhead / Ops', value: financeStats.overhead, color: 'var(--color-yellow)' },
  ];

  const kpiRow = (
    <div className={styles.kpiRow}>
      <KpiCard label="Saldo Kas" value={financeStats.saldo} accent="blue" format="rupiah" sequenceIndex={0} />
      <KpiCard label="Total Pemasukan" value={financeStats.pemasukan} accent="green" format="rupiah" sequenceIndex={1} />
      <KpiCard label="Total Pengeluaran" value={financeStats.pengeluaran} accent="red" format="rupiah" sequenceIndex={2} />
    </div>
  );

  return (
    <PageWrapper 
      title="Ringkasan Dashboard Keuangan" 
      subtitle="Analisis struktur biaya dan arus kas operasional"
      kpiRow={kpiRow}
    >
      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <Panel title="Struktur Biaya Pengeluaran (Actual)" sequenceIndex={0}>
            <div className={styles.chartWrapper}>
              <ExpenseBarChart data={chartData} />
            </div>
          </Panel>

          <Panel title="Breakdown Per Kategori" sequenceIndex={1}>
            <div className={styles.tableWrapper}>
              <table className={styles.catTable}>
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Jenis</th>
                    <th>Transaksi</th>
                    <th>Total Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {financeStats.categoryStats.map(cat => (
                    <tr key={cat.id}>
                      <td><strong>{cat.nama}</strong></td>
                      <td><span className={styles.badge}>{cat.jenis.replace('_', ' ')}</span></td>
                      <td>{cat.count} kali</td>
                      <td className={cat.jenis === 'masuk' ? styles.plus : styles.minus}>
                        {formatRupiah(cat.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className={styles.rightCol}>
          <Panel title="Arus Kas Terbaru" sequenceIndex={2}>
            <div className={styles.recentList}>
              {[...entries].reverse().slice(0, 10).map(e => (
                <div key={e.id} className={styles.recentItem}>
                  <div className={styles.recentInfo}>
                    <p>{e.keterangan}</p>
                    <span>{new Date(e.tanggal).toLocaleDateString()}</span>
                  </div>
                  <strong className={e.jenis === 'masuk' ? styles.plus : styles.minus}>
                    {e.jenis === 'masuk' ? '+' : '-'}{formatRupiah(e.nominal)}
                  </strong>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </PageWrapper>
  );
}
