import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import { useMasterStore } from '@/stores/useMasterStore';
import { Satuan } from '@/types';
import MasterFormModal, { FormFieldConfig } from '../MasterDetail/MasterFormModal';
import styles from './JenisRejectView.module.css'; // Reusing CSS

export default function SatuanView() {
  const { satuan, addSatuan, updateSatuan, removeSatuan } = useMasterStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Satuan | null>(null);

  const handleSubmit = (data: Record<string, any>) => {
    if (editingItem) {
      updateSatuan(editingItem.id, data as Partial<Satuan>);
    } else {
      addSatuan({
        id: `UOM-${Date.now()}`,
        nama: data.nama
      });
    }
    setModalOpen(false);
  };

  const columns: Column<Satuan>[] = [
    { key: 'id', header: 'ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'nama', header: 'Nama Satuan', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeSatuan(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Satuan', type: 'text', required: true }
  ];

  return (
    <PageWrapper 
      title="Satuan (UOM)" 
      subtitle="Manajemen satuan unit"
      action={
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Satuan
        </Button>
      }
    >
      <div className={styles.container}>
        <Panel title="Daftar Satuan">
          <DataTable columns={columns} data={satuan} keyField="id" />
        </Panel>
      </div>

      <MasterFormModal 
        title={editingItem ? 'Edit Satuan' : 'Tambah Satuan'}
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        fields={fields}
        initialValues={editingItem || {}} 
        onSubmit={handleSubmit} 
      />
    </PageWrapper>
  );
}
