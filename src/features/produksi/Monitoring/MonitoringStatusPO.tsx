import React, { useState } from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import ProgressBar from '@/components/atoms/ProgressBar';
import { PurchaseOrder, Bundle } from '@/types';
import { useMasterStore } from '@/stores/useMasterStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { TAHAP_ORDER, getProgressByPO, TAHAP_LABEL, TahapKey } from '@/lib/utils/production-helpers';
import ProductionFlowBoard from './ProductionFlowBoard';
import styles from './MonitoringStatusPO.module.css';

interface MonitoringStatusPOProps {
  poList: PurchaseOrder[];
  bundles: Bundle[];
  sequenceIndex?: number;
}

type FilterStatus = 'belum' | 'proses' | 'selesai_unpaid';

export default function MonitoringStatusPO({ poList, bundles, sequenceIndex }: MonitoringStatusPOProps) {
  const { klien, karyawan } = useMasterStore();
  const { markUpahPaid } = useBundleStore();
  const [activeSubTab, setActiveSubTab] = useState<FilterStatus>('belum');

  // Next index for inner table
  const innerIndex = sequenceIndex !== undefined ? sequenceIndex + 1 : undefined;

  // Logic to categorize POs
  const groupedPOs = poList.reduce((acc, po) => {
    const poBundles = bundles.filter(b => b.po === po.id);
    const totalBundles = poBundles.length;
    
    // Count stages completed
    const stagesDone = TAHAP_ORDER.filter(t => {
      const stats = getProgressByPO(bundles, po.id, t);
      return stats.pct >= 100;
    }).length;

    const isPackingDone = getProgressByPO(bundles, po.id, 'packing').pct >= 100;
    
    // Check if upah is paid for all finished bundles
    const isPaid = poBundles.every(b => {
      return TAHAP_ORDER.every(t => {
        const st = b.statusTahap[t];
        if (st.status === 'selesai' && !st.upahDibayar) return false;
        return true;
      });
    });

    const anyStarted = poBundles.some(b => TAHAP_ORDER.some(t => b.statusTahap[t].status !== null));

    if (!anyStarted) {
      acc.belum.push(po);
    } else if (isPackingDone && !isPaid) {
      acc.selesai_unpaid.push(po);
    } else if (!isPackingDone) {
      acc.proses.push(po);
    }

    return acc;
  }, { belum: [] as PurchaseOrder[], proses: [] as PurchaseOrder[], selesai_unpaid: [] as PurchaseOrder[] });

  const getKlienName = (id: string) => klien.find(k => k.id === id)?.nama || id;

  const getSelesaiDetail = (poId: string) => {
    const poBundles = bundles.filter(b => b.po === poId);
    // Find who did cutting/jahit for these bundles
    const workers = new Set<string>();
    poBundles.forEach(b => {
      if (b.statusTahap.cutting.karyawan) workers.add(karyawan.find(k => k.id === b.statusTahap.cutting.karyawan)?.nama || '');
      if (b.statusTahap.jahit.karyawan) workers.add(karyawan.find(k => k.id === b.statusTahap.jahit.karyawan)?.nama || '');
    });
    return Array.from(workers).filter(Boolean).join(', ');
  };

  const columnsBelum: Column<PurchaseOrder>[] = [
    { key: 'nomorPO', header: 'Nomor PO', render: (v) => <strong>{v}</strong> },
    { key: 'klienId', header: 'Klien', render: (v) => getKlienName(v) },
    { key: 'tanggalInput', header: 'Tgl Input', render: (val) => val ? new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-' },
    { key: 'items', header: 'Total QTY', render: (v: any[]) => v.reduce((sum, i) => sum + i.qty, 0) + ' pcs' },
    { key: 'id', header: 'Action', render: (v) => <Badge variant="neutral">Antri</Badge> }
  ];

  const columnsProses: Column<PurchaseOrder>[] = [
    { key: 'nomorPO', header: 'Nomor PO', render: (v) => <strong>{v}</strong> },
    { key: 'klienId', header: 'Klien', render: (v) => getKlienName(v) },
    ...TAHAP_ORDER.map((t): Column<PurchaseOrder> => ({
      key: t,
      header: TAHAP_LABEL[t],
      render: (_, row) => {
        const stats = getProgressByPO(bundles, row.id, t);
        return <ProgressBar value={stats.pct} height={4} color={stats.pct === 100 ? 'green' : 'cyan'} />;
      }
    }))
  ];

  const columnsSelesai: Column<PurchaseOrder>[] = [
    { key: 'nomorPO', header: 'Nomor PO', render: (v) => <strong>{v}</strong> },
    { key: 'detail', header: 'Artikel & Size', render: (_, row) => {
       const itemSummary = row.items.map(i => `${i.qty}pcs`).join(', ');
       return <span className={styles.muted}>{itemSummary}</span>;
    }},
    { key: 'karyawan', header: 'Pengerja', render: (_, row) => getSelesaiDetail(row.id) },
    { key: 'status', header: 'Payroll', render: () => <Badge variant="warning">Tagihan Upah</Badge> },
    { key: 'id', header: 'Aksi', render: (id) => (
      <Button variant="ghost" size="sm" onClick={() => markUpahPaid(id)}>💰 Bayar Upah</Button>
    )}
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.subTabs}>
        <button className={activeSubTab === 'belum' ? styles.active : ''} onClick={() => setActiveSubTab('belum')}>
          {activeSubTab === 'belum' && <div className={styles.activeDot} />}
          Belum Mulai ({groupedPOs.belum.length})
        </button>
        <button className={activeSubTab === 'proses' ? styles.active : ''} onClick={() => setActiveSubTab('proses')}>
          {activeSubTab === 'proses' && <div className={styles.activeDot} />}
          Sedang Dikerjakan ({groupedPOs.proses.length})
        </button>
        <button className={activeSubTab === 'selesai_unpaid' ? styles.active : ''} onClick={() => setActiveSubTab('selesai_unpaid')}>
          {activeSubTab === 'selesai_unpaid' && <div className={styles.activeDot} />}
          Selesai & Belum Dibayar ({groupedPOs.selesai_unpaid.length})
        </button>
      </div>

      <div className={styles.tableCard}>
        {activeSubTab === 'belum' && <DataTable columns={columnsBelum} data={groupedPOs.belum} keyField="id" reverse={true} />}
        {activeSubTab === 'proses' && <ProductionFlowBoard bundles={bundles} />}
        {activeSubTab === 'selesai_unpaid' && <DataTable columns={columnsSelesai} data={groupedPOs.selesai_unpaid} keyField="id" reverse={true} />}
      </div>
    </div>
  );
}
