import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { usePOStore } from '@/stores/usePOStore';
import { PurchaseOrder } from '@/types';
import FormInputPO from './FormInputPO';
import DetailPO from './DetailPO';
import ModalImportPO from './ModalImportPO';
import { generatePOMassTemplate } from '@/lib/utils/po-import';
import { useAuthStore } from '@/stores/useAuthStore';
import styles from './InputPOView.module.css';

type Mode = 'list' | 'form' | 'detail';

export default function InputPOView() {
  const { poList } = usePOStore();
  const { canEdit: checkEdit } = useAuthStore();
  const [mode, setMode] = useState<Mode>('list');
  const [activePOId, setActivePOId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleCreate = () => setMode('form');
  
  const handleView = (id: string) => {
    setActivePOId(id);
    setMode('detail');
  };

  const handleBackToList = () => {
    setMode('list');
    setActivePOId(null);
  };

  const handleSaveSuccess = (id: string) => {
    setActivePOId(id);
    setMode('detail');
  };

  const allowEdit = checkEdit('/produksi');

  const mainAction = (
    <div style={{ display: 'flex', gap: '8px' }}>
      {allowEdit && (
        <>
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
            📤 Upload PO (CSV)
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            + Buat PO Baru
          </Button>
        </>
      )}
    </div>
  );

  const columns: Column<PurchaseOrder>[] = [
    { key: 'nomorPO', header: 'No. PO', render: (val, row) => {
      const isLong = val.length > 15 && val.startsWith('PO-IMP');
      let display = val;
      if (isLong) {
        const sorted = [...poList].sort((a, b) => new Date(a.tanggalInput).getTime() - new Date(b.tanggalInput).getTime());
        const idx = sorted.findIndex(p => p.id === row.id);
        display = `PO-${String(idx + 1).padStart(3, '0')}`;
      }
      return (
        <span 
          title={val}
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }} 
          onClick={() => handleView(row.id)}
        >
          {display}
        </span>
      );
    }},
    { key: 'klienId', header: 'Klien' }, // normally map to client name
    { key: 'tanggalInput', header: 'Tanggal Input', render: (val) => val ? new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-' },
    { key: 'itemsCount', header: 'Jumlah Artikel', render: (_, row: any) => row.items?.length || 0 },
    { key: 'itemsQty', header: 'Total QTY', render: (_, row: any) => row.items?.reduce((acc: number, curr: any) => acc + curr.qty, 0) || 0 },
    { key: 'status', header: 'Status', render: (val) => {
      if (val === 'draft') return <Badge variant="neutral">Draft</Badge>;
      if (val === 'aktif') return <Badge variant="success">Aktif</Badge>;
      if (val === 'selesai') return <Badge variant="info">Selesai</Badge>;
      return <Badge variant="neutral">{val}</Badge>;
    }},
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <Button variant="ghost" size="sm" onClick={() => handleView(row.id)}>Detail</Button>
    )}
  ];

  if (mode === 'form') {
    return (
      <PageWrapper title="Input PO Baru" subtitle="Buat PO baru dan generate tiket bundle" action={<Button variant="ghost" onClick={handleBackToList}>Kembali</Button>}>
        <FormInputPO onCancel={handleBackToList} onSuccess={handleSaveSuccess} />
      </PageWrapper>
    );
  }

  if (mode === 'detail' && activePOId) {
    return (
      <PageWrapper title="Detail PO" subtitle={activePOId} action={<Button variant="ghost" onClick={handleBackToList}>Kembali</Button>}>
        <DetailPO poId={activePOId} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper 
      title="Daftar Purchase Order" 
      subtitle="Manajemen dan monitor entri PO"
      action={mainAction}
    >
      <div className={styles.container}>
        <Panel title="Semua PO" sequenceIndex={0}>
          <DataTable columns={columns} data={poList} keyField="id" sequenceIndex={1} reverse={true} />
        </Panel>
      </div>

      {isImportModalOpen && (
        <ModalImportPO onClose={() => setIsImportModalOpen(false)} />
      )}
    </PageWrapper>
  );
}
