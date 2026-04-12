import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import { useKoreksiStore, KoreksiItem } from '@/stores/useKoreksiStore';
import { useBundleStore } from '@/stores/useBundleStore';
import KoreksiTable from './KoreksiTable';
import ModalApproveReject from './ModalApproveReject';
import styles from './KoreksiView.module.css';

export default function KoreksiView() {
  const { queue, approve, reject } = useKoreksiStore();
  const { updateStatusTahap } = useBundleStore();
  
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedItem, setSelectedItem] = useState<KoreksiItem | null>(null);
  const [modalMode, setModalMode] = useState<'approve' | 'reject' | null>(null);

  // Filtering
  const filteredData = useMemo(() => {
    if (filterStatus === 'all') return queue;
    return queue.filter((q: KoreksiItem) => q.status === filterStatus);
  }, [queue, filterStatus]);

  // KPI Calculations
  const kpis = {
    pending: queue.filter((q: KoreksiItem) => q.status === 'pending').length,
    approved: queue.filter((q: KoreksiItem) => q.status === 'approved').length,
    rejected: queue.filter((q: KoreksiItem) => q.status === 'rejected').length,
    total: queue.length
  };

  const kpiRow = (
    <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
      <KpiCard label="Tunggu Review" value={kpis.pending} accent="yellow" icon="Clock" />
      <KpiCard label="Disetujui" value={kpis.approved} accent="green" icon="CheckCircle" />
      <KpiCard label="Ditolak" value={kpis.rejected} accent="red" icon="XCircle" />
      <KpiCard label="Total Ajuan" value={kpis.total} accent="blue" icon="ShieldCheck" />
    </div>
  );

  const handleAction = (item: KoreksiItem, mode: 'approve' | 'reject') => {
    setSelectedItem(item);
    setModalMode(mode);
  };

  const handleConfirm = (id: string, mode: 'approve' | 'reject') => {
    const item = queue.find((q: KoreksiItem) => q.id === id);
    if (!item) return;

    if (mode === 'approve') {
      approve(id, 'OWNER');
      updateStatusTahap(item.barcode, item.tahap, { koreksiStatus: 'approved' });
    } else {
      reject(id, 'OWNER');
      // On reject, revert qtySelesai to target
      updateStatusTahap(item.barcode, item.tahap, { 
        koreksiStatus: 'rejected',
        qtySelesai: item.qtyTarget 
      });
    }
    setSelectedItem(null);
    setModalMode(null);
  };

  return (
    <PageWrapper 
      title="Koreksi Data Produksi" 
      subtitle="Otorisasi Owner untuk perselisihan QTY produksi"
      kpiRow={kpiRow}
    >
      <div className={styles.container}>
        <div className={styles.filters}>
          <div className={styles.tabList}>
            <button className={filterStatus === 'pending' ? styles.active : ''} onClick={() => setFilterStatus('pending')}>Pending</button>
            <button className={filterStatus === 'approved' ? styles.active : ''} onClick={() => setFilterStatus('approved')}>Approved</button>
            <button className={filterStatus === 'rejected' ? styles.active : ''} onClick={() => setFilterStatus('rejected')}>Rejected</button>
            <button className={filterStatus === 'all' ? styles.active : ''} onClick={() => setFilterStatus('all')}>Semua</button>
          </div>
        </div>

        <Panel title="Daftar Pengajuan Koreksi">
          <KoreksiTable 
            items={filteredData} 
            onApprove={(item) => handleAction(item, 'approve')}
            onReject={(item) => handleAction(item, 'reject')}
          />
        </Panel>
      </div>

      <ModalApproveReject 
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        mode={modalMode}
        onConfirm={handleConfirm}
      />
    </PageWrapper>
  );
}
