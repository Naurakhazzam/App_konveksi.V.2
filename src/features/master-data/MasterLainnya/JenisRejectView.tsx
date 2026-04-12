import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import { useMasterStore } from '@/stores/useMasterStore';
import { JenisReject } from '@/types';
import MasterFormModal, { FormFieldConfig } from '../MasterDetail/MasterFormModal';
import { formatRupiah } from '@/lib/utils/formatters';
import styles from './JenisRejectView.module.css';

export default function JenisRejectView() {
  const { jenisReject, addJenisReject, updateJenisReject, removeJenisReject } = useMasterStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JenisReject | null>(null);

  const handleSubmit = (data: Record<string, any>) => {
    if (editingItem) {
      updateJenisReject(editingItem.id, data as Partial<JenisReject>);
    } else {
      addJenisReject({
        id: `REJ-${Date.now()}`,
        nama: data.nama,
        potongan: data.potongan
      });
    }
    setModalOpen(false);
  };

  const columns: Column<JenisReject>[] = [
    { key: 'id', header: 'ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'nama', header: 'Nama Reject', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'potongan', header: 'Potongan per pcs', render: (val) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-danger)' }}>{formatRupiah(val)}</span> },
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeJenisReject(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Reject', type: 'text', required: true },
    { key: 'potongan', label: 'Potongan (Rp)', type: 'number', required: true }
  ];

  return (
    <PageWrapper 
      title="Jenis Reject" 
      subtitle="Manajemen kategori cacat produk dan potongannya"
      action={
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Reject
        </Button>
      }
    >
      <div className={styles.container}>
        <Panel title="Daftar Reject">
          <DataTable columns={columns} data={jenisReject} keyField="id" />
        </Panel>
      </div>

      <MasterFormModal 
        title={editingItem ? 'Edit Jenis Reject' : 'Tambah Jenis Reject'}
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        fields={fields}
        initialValues={editingItem || {}} 
        onSubmit={handleSubmit} 
      />
    </PageWrapper>
  );
}
