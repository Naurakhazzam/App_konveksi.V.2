'use client';

import React, { useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable from '@/components/organisms/DataTable';
import { usePayrollStore } from '@/stores/usePayrollStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { formatRupiah, formatDate } from '@/lib/utils/formatters';
import styles from './LaporanRejectView.module.css';

export default function LaporanRejectView() {
  const { ledger } = usePayrollStore();
  const { karyawan } = useMasterStore();

  const rejectData = useMemo(() => {
    const entries = ledger.filter(l => l.tipe === 'reject_potong');
    const totalKerugian = entries.reduce((a, c) => a + Math.abs(c.total), 0);
    
    // Top Reasons Analysis
    const reasons: Record<string, number> = {};
    entries.forEach(e => {
      // Extract reason from keterangan, assuming format "Reject [Reason] (Qty)"
      const reasonMatch = e.keterangan.match(/Reject (.*?) \(/);
      const reason = reasonMatch ? reasonMatch[1] : e.keterangan;
      reasons[reason] = (reasons[reason] || 0) + Math.abs(e.total);
    });

    const topReasons = Object.entries(reasons)
      .map(([label, value]) => ({ label, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 3);

    return { entries, totalKerugian, topReasons };
  }, [ledger]);

  return (
    <PageWrapper 
      title="Analisa Reject & Kerugian Produksi" 
      subtitle="Monitoring kualitas hasil kerja dan dampak finansial akibat reject"
    >
      <div className={styles.container}>
        <div className={styles.topRow}>
          <div className={styles.summaryCard}>
            <span>Akumulasi Kerugian (Potongan Upah)</span>
            <strong>{formatRupiah(rejectData.totalKerugian)}</strong>
            <p>Berdasarkan denda yang dikenakan ke operator</p>
          </div>

          <Panel title="Top 3 Alasan Reject (by Value)">
            <div className={styles.chartContainer}>
              {rejectData.topReasons.length > 0 ? rejectData.topReasons.map((item, idx) => {
                const percentage = (item.value / (rejectData.totalKerugian || 1)) * 100;
                return (
                  <div key={idx} className={styles.chartRow}>
                    <div className={styles.chartLabel}>
                      <span>{item.label}</span>
                      <strong>{formatRupiah(item.value)}</strong>
                    </div>
                    <div className={styles.barWrapper}>
                      <div className={styles.bar} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              }) : <p className={styles.empty}>Belum ada data reject periode ini.</p>}
            </div>
          </Panel>
        </div>

        <Panel title="Rincian Detail Kejadian Reject">
          <DataTable 
            columns={[
              { key: 'tanggal', header: 'Tanggal', render: (v) => formatDate(v) },
              { 
                key: 'karyawanId', 
                header: 'Operator', 
                render: (v) => {
                  const k = karyawan.find(emp => emp.id === v);
                  return k ? `${k.nama} (${k.jabatan})` : v;
                }
              },
              { key: 'keterangan', header: 'Detail Kejadian' },
              { 
                key: 'total', 
                header: 'Denda (Potongan)', 
                render: (v) => <strong className={styles.red}>{formatRupiah(Math.abs(v))}</strong> 
              }
            ]} 
            data={[...rejectData.entries].reverse()} 
            keyField="id" 
          />
        </Panel>
      </div>
    </PageWrapper>
  );
}
