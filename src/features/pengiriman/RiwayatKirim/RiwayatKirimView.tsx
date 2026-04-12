import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { usePengirimanStore } from '@/stores/usePengirimanStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { SuratJalan } from '@/types';
import DetailSuratJalan from './DetailSuratJalan';
import styles from './RiwayatKirimView.module.css';

export default function RiwayatKirimView() {
  const { suratJalanList, updateStatusSJ } = usePengirimanStore();
  const { klien } = useMasterStore();
  
  const [selectedSJ, setSelectedSJ] = useState<SuratJalan | null>(null);
  const [filterStatus, setFilterStatus] = useState<SuratJalan['status'] | 'all'>('all');

  const filteredList = useMemo(() => {
    if (filterStatus === 'all') return suratJalanList;
    return suratJalanList.filter(sj => sj.status === filterStatus);
  }, [suratJalanList, filterStatus]);

  const kpis = {
    total: suratJalanList.length,
    dikirim: suratJalanList.filter(sj => sj.status === 'dikirim').length,
    diterima: suratJalanList.filter(sj => sj.status === 'diterima').length
  };

  const kpiRow = (
    <div className={styles.kpiRow}>
      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Total Pengiriman</span>
        <span className={styles.kpiValue}>{kpis.total}</span>
      </div>
      <div className={styles.kpiCard} data-accent="blue">
        <span className={styles.kpiLabel}>Dalam Perjalanan</span>
        <span className={styles.kpiValue}>{kpis.dikirim}</span>
      </div>
      <div className={styles.kpiCard} data-accent="green">
        <span className={styles.kpiLabel}>Telah Diterima</span>
        <span className={styles.kpiValue}>{kpis.diterima}</span>
      </div>
    </div>
  );

  const columns: Column<SuratJalan>[] = [
    { key: 'nomorSJ', header: 'No. Surat Jalan', render: (v) => <strong>{v}</strong> },
    { 
      key: 'klienId', 
      header: 'Klien', 
      render: (v) => klien.find(k => k.id === v)?.nama || v 
    },
    { 
      key: 'tanggal', 
      header: 'Tanggal', 
      render: (v) => new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) 
    },
    { key: 'totalBundle', header: 'Bundel' },
    { key: 'totalQty', header: 'Total QTY', render: (v) => `${v} pcs` },
    { key: 'pengirim', header: 'Pengirim' },
    { 
      key: 'status', 
      header: 'Status', 
      render: (v) => (
        <Badge variant={v === 'diterima' ? 'success' : v === 'dikirim' ? 'info' : 'warning'}>
          {v.toUpperCase()}
        </Badge>
      ) 
    },
    {
      key: 'id',
      header: 'Aksi',
      render: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedSJ(row)}>
          👁️ Detail
        </Button>
      )
    }
  ];

  return (
    <PageWrapper 
      title="Riwayat Pengiriman" 
      subtitle="Daftar surat jalan dan status pengiriman barang"
      kpiRow={kpiRow}
    >
      <div className={styles.container}>
        <div className={styles.filters}>
          <div className={styles.tabList}>
            <button className={filterStatus === 'all' ? styles.active : ''} onClick={() => setFilterStatus('all')}>Semua</button>
            <button className={filterStatus === 'dikirim' ? styles.active : ''} onClick={() => setFilterStatus('dikirim')}>Dikirim</button>
            <button className={filterStatus === 'diterima' ? styles.active : ''} onClick={() => setFilterStatus('diterima')}>Diterima</button>
          </div>
        </div>

        <Panel title="Surat Jalan Terdaftar">
          <DataTable columns={columns} data={filteredList} keyField="id" />
        </Panel>
      </div>

      {selectedSJ && (
        <DetailSuratJalan 
          sj={selectedSJ} 
          onClose={() => setSelectedSJ(null)} 
          onUpdateStatus={(status: SuratJalan['status']) => updateStatusSJ(selectedSJ.id, status)}
        />
      )}
    </PageWrapper>
  );
}
