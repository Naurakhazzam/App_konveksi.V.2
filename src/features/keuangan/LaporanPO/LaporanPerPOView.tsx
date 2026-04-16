'use client';

import React, { useMemo, useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { usePOStore } from '@/stores/usePOStore';
import { useJurnalStore } from '@/stores/useJurnalStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { getPOFinancialSummary, POFinancialSummary } from '@/lib/utils/finance-calculations';
import { formatRupiah } from '@/lib/utils/formatters';
import ArticleDetailPanel from './components/ArticleDetailPanel';
import styles from './LaporanPerPOView.module.css';

export default function LaporanPerPOView() {
  const { poList } = usePOStore();
  const { entries } = useJurnalStore();
  const { produkHPPItems, hppKomponen, klien } = useMasterStore();
  
  const [expandedPO, setExpandedPO] = useState<string | null>(null);

  const reportData = useMemo(() => {
    // Mocking delivery data for overhead allocation
    // In real app, this would come from usePengirimanStore
    const totalDeliveredMonth = 1000; 
    
    return poList.map(po => {
      const client = klien.find(k => k.id === po.klienId);
      const poDelivered = po.nomorPO === 'PO-001' ? 200 : 0; // PO-001 has some shipped
      
      return getPOFinancialSummary(
        po, 
        entries, 
        produkHPPItems, 
        client?.nama || 'Unknown',
        totalDeliveredMonth,
        poDelivered
      );
    });
  }, [poList, entries, produkHPPItems, klien]);

  const stats = useMemo(() => {
    const totalRealisasi = reportData.reduce((a, c) => a + c.totalRealisasi, 0);
    const totalProfit = reportData.reduce((a, c) => a + c.profit, 0);
    const boncosCount = reportData.filter(d => d.status === 'boncos').length;
    return { totalRealisasi, totalProfit, boncosCount };
  }, [reportData]);

  const kpiRow = (
    <div className={styles.kpiRow}>
      <KpiCard label="Total Realisasi Biaya" value={stats.totalRealisasi} accent="blue" format="rupiah" />
      <KpiCard label="Estimasi Profit" value={stats.totalProfit} accent="green" format="rupiah" />
      <KpiCard label="PO Boncos" value={stats.boncosCount} accent="red" />
    </div>
  );

  const columns: Column<POFinancialSummary>[] = [
    { 
      key: 'noPO', 
      header: 'PO & Klien', 
      render: (v, r) => (
        <div className={styles.poCol}>
          <strong>{v}</strong>
          <span>{r.klienNama}</span>
        </div>
      )
    },
    { 
      key: 'hppEstimasi', 
      header: 'HPP Estimasi', 
      render: (v) => <span className={styles.muted}>{formatRupiah(v)}</span> 
    },
    { 
      key: 'biayaBahanReal', 
      header: 'Bahan (Real)', 
      render: (v) => <span className={styles.expense}>{formatRupiah(v)}</span> 
    },
    { 
      key: 'biayaUpahReal', 
      header: 'Upah (Real)', 
      render: (v) => <span className={styles.expense}>{formatRupiah(v)}</span> 
    },
    { 
      key: 'biayaOverheadReal', 
      header: 'Overhead', 
      render: (v) => <span className={styles.expense}>{formatRupiah(v)}</span> 
    },
    { 
      key: 'totalRealisasi', 
      header: 'Total Realisasi', 
      render: (v) => <strong className={styles.total}>{formatRupiah(v)}</strong> 
    },
    { 
      key: 'gap', 
      header: 'Gap (B/H)', 
      render: (v) => (
        <span className={v > 0 ? styles.boncos : styles.hemat}>
          {v > 0 ? '+' : ''}{formatRupiah(v)}
        </span>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (v) => (
        <Badge variant={v === 'hemat' ? 'success' : v === 'boncos' ? 'danger' : 'neutral'}>
          {v.toUpperCase().replace('_', ' ')}
        </Badge>
      ) 
    }
  ];

  const handleRowClick = (row: POFinancialSummary) => {
    setExpandedPO(expandedPO === row.poId ? null : row.poId);
  };

  return (
    <PageWrapper 
      title="Laporan HPP Aktual per PO" 
      subtitle="Analisa perbandingan anggaran vs pengeluaran riil"
      kpiRow={kpiRow}
      action={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" onClick={() => {
            import('@/lib/utils/export-utils').then(({ downloadCSV }) => {
              const exportData = reportData.map(r => ({
                'No PO': r.poId,
                'Klien': r.klienNama,
                'Status': r.status,
                'HPP Estimasi': r.hppEstimasi,
                'Biaya Bahan Real': r.biayaBahanReal,
                'Biaya Upah Real': r.biayaUpahReal,
                'Biaya Overhead Real': r.biayaOverheadReal,
                'Total Realisasi': r.totalRealisasi,
                'Profit': r.profit,
                'Gap': r.gap
              }));
              downloadCSV(exportData, 'Laporan_HPP_Actual_Per_PO');
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
        <Panel title="Daftar Analisa PO Active">
          <DataTable 
            columns={columns} 
            data={reportData} 
            keyField="poId"
            onRowClick={handleRowClick}
          />
          {expandedPO && (
            <div className={`${styles.expandArea} no-print`}>
              <ArticleDetailPanel 
                items={poList.find(p => p.id === expandedPO)?.items || []} 
                allHppItems={produkHPPItems}
                allKomponen={hppKomponen}
              />
            </div>
          )}
        </Panel>
      </div>
    </PageWrapper>
  );
}
