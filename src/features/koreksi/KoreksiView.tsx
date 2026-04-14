import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import { useKoreksiStore, ActionApproval } from '@/stores/useKoreksiStore';
import { KoreksiQTY } from '@/types';
import KoreksiTable from './KoreksiTable';
import ModalApproveReject from './ModalApproveReject';
import DataTable from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import styles from './KoreksiView.module.css';

export default function KoreksiView() {
  const { 
    koreksiList, 
    approveKoreksiLebih, 
    rejectKoreksiLebih,
    pendingActions,
    resolveActionApproval
  } = useKoreksiStore();

  const [filterType, setFilterType] = useState<'semua' | 'lebih' | 'kurang' | 'aksi'>('semua');
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
    pendingAksi: pendingActions.filter((a) => a.status === 'pending').length,
    total: koreksiList.length + pendingActions.length,
  };

  const kpiRow = (
    <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
      <KpiCard label="Tunggu Approval QTY" value={kpis.menunggu} accent="yellow" icon="Clock" />
      <KpiCard label="Tunggu Approval Aksi" value={kpis.pendingAksi} accent="purple" icon="Shield" />
      <KpiCard label="Disetujui" value={kpis.approved} accent="green" icon="CheckCircle" />
      <KpiCard label="Total Histori" value={kpis.total} accent="blue" icon="ShieldCheck" />
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
            <button className={filterType === 'aksi' ? styles.active : ''} onClick={() => setFilterType('aksi')}>
              Persetujuan Tindakan
            </button>
          </div>
        </div>

        {filterType === 'aksi' ? (
          <Panel title="Antrean Persetujuan Tindakan">
            <DataTable
              keyField="id"
              data={pendingActions}
              columns={[
                { key: 'requestedAt', header: 'Waktu Aktvitas', render: (v: string) => new Date(v).toLocaleString('id-ID') },
                { key: 'label', header: 'Aksi yang Diajukan', render: (v: string) => <strong>{v}</strong> },
                { key: 'requestedBy', header: 'Oleh' },
                { key: 'status', header: 'Status', render: (v: string) => (
                  <span style={{ color: v === 'pending' ? 'var(--color-yellow)' : v === 'approved' ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {v.toUpperCase()}
                  </span>
                )},
                { key: 'action', header: '', align: 'right', render: (_: any, row: ActionApproval) => (
                  row.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="danger" size="sm" onClick={() => resolveActionApproval(row.id, 'rejected', 'FAUZAN')}>Reject</Button>
                      <Button variant="primary" size="sm" onClick={() => resolveActionApproval(row.id, 'approved', 'FAUZAN')}>Setujui</Button>
                    </div>
                  )
                )}
              ]}
            />
          </Panel>
        ) : (
          <Panel title="Daftar Koreksi QTY">
            <KoreksiTable
              items={filteredData}
              onApprove={(item) => handleAction(item, 'approve')}
              onReject={(item) => handleAction(item, 'reject')}
            />
          </Panel>
        )}
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
