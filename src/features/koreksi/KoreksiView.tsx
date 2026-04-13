import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import { useKoreksiStore } from '@/stores/useKoreksiStore';
import { KoreksiQTY } from '@/types';
import KoreksiTable from './KoreksiTable';
import ModalApproveReject from './ModalApproveReject';
import styles from './KoreksiView.module.css';

export default function KoreksiView() {
  const { koreksiList, approveKoreksiLebih, rejectKoreksiLebih } = useKoreksiStore();

  const [filterType, setFilterType] = useState<'semua' | 'lebih' | 'kurang'>('semua');
  const [selectedItem, setSelectedItem] = useState<KoreksiQTY | null>(null);
  const [modalMode, setModalMode] = useState<'approve' | 'reject' | null>(null);

  const filteredData = useMemo(() => {
    if (filterType === 'lebih') return koreksiList.filter((k) => k.jenisKoreksi === 'lebih');
    if (filterType === 'kurang') return koreksiList.filter((k) => k.jenisKoreksi !== 'lebih');
    return koreksiList;
  }, [koreksiList, filterType]);

  const kpis = {
    menunggu: koreksiList.filter((k) => k.jenisKoreksi === 'lebih' && k.statusApproval === 'menunggu').length,
    approved: koreksiList.filter((k) => k.statusApproval === 'approved').length,
    pending: koreksiList.filter((k) => k.statusPotongan === 'pending' && k.jenisKoreksi !== 'lebih').length,
    total: koreksiList.length,
  };

  const kpiRow = (
    <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
      <KpiCard label="Tunggu Approval" value={kpis.menunggu} accent="yellow" icon="Clock" />
      <KpiCard label="Disetujui" value={kpis.approved} accent="green" icon="CheckCircle" />
      <KpiCard label="Potongan Pending" value={kpis.pending} accent="red" icon="XCircle" />
      <KpiCard label="Total Koreksi" value={kpis.total} accent="blue" icon="ShieldCheck" />
    </div>
  );

  const handleAction = (item: KoreksiQTY, mode: 'approve' | 'reject') => {
    setSelectedItem(item);
    setModalMode(mode);
  };

  const handleConfirm = (id: string, mode: 'approve' | 'reject') => {
    if (mode === 'approve') {
      approveKoreksiLebih(id, 'OWNER');
    } else {
      rejectKoreksiLebih(id);
    }
    setSelectedItem(null);
    setModalMode(null);
  };

  return (
    <PageWrapper
      title="Koreksi Data Produksi"
      subtitle="Ringkasan semua koreksi QTY dan otorisasi approval"
      kpiRow={kpiRow}
    >
      <div className={styles.container}>
        <div className={styles.filters}>
          <div className={styles.tabList}>
            <button className={filterType === 'semua' ? styles.active : ''} onClick={() => setFilterType('semua')}>
              Semua
            </button>
            <button className={filterType === 'lebih' ? styles.active : ''} onClick={() => setFilterType('lebih')}>
              QTY Lebih
            </button>
            <button className={filterType === 'kurang' ? styles.active : ''} onClick={() => setFilterType('kurang')}>
              QTY Kurang / Reject
            </button>
          </div>
        </div>

        <Panel title="Daftar Koreksi QTY">
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
