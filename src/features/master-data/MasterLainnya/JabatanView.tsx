import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import { useMasterStore } from '@/stores/useMasterStore';
import { Jabatan } from '@/types';
import MasterFormModal, { FormFieldConfig } from '../MasterDetail/MasterFormModal';
import styles from './JenisRejectView.module.css'; // Reusing CSS

export default function JabatanView() {
  const { jabatan, addJabatan, updateJabatan, removeJabatan } = useMasterStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Jabatan | null>(null);

  const handleSubmit = (data: Record<string, any>) => {
    if (editingItem) {
      updateJabatan(editingItem.id, data as Partial<Jabatan>);
    } else {
      addJabatan({
        id: `JAB-${Date.now()}`,
        nama: data.nama
      });
    }
    setModalOpen(false);
  };

  const columns: Column<Jabatan>[] = [
    { key: 'id', header: 'ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'nama', header: 'Nama Jabatan', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeJabatan(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Jabatan', type: 'text', required: true }
  ];

  return (
    <PageWrapper 
      title="Manajemen Jabatan" 
      subtitle="Kelola daftar jabatan/posisi karyawan"
      action={
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Jabatan
        </Button>
      }
    >
      <div className={styles.container}>
        <Panel title="Daftar Jabatan">
          <DataTable columns={columns} data={jabatan} keyField="id" />
        </Panel>
      </div>

      <MasterFormModal 
        title={editingItem ? 'Edit Jabatan' : 'Tambah Jabatan'}
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        fields={fields}
        initialValues={editingItem || {}} 
        onSubmit={handleSubmit} 
      />
    </PageWrapper>
  );
}
