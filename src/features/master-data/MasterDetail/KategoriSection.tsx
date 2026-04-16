import React, { useState } from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import MasterFormModal, { FormFieldConfig } from './MasterFormModal';
import { useMasterStore } from '@/stores/useMasterStore';
import { Kategori } from '@/types';

import { getKatAlias } from '@/lib/utils/master-helpers';

export default function KategoriSection() {
  const { kategori, addKategori, updateKategori, removeKategori } = useMasterStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Kategori | null>(null);

  const columns: Column<Kategori>[] = [
    { 
      key: 'id', 
      header: 'ID', 
      render: (val) => (
        <span title={val} style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', fontWeight: 'bold' }}>
          {getKatAlias(val, kategori)}
        </span>
      ) 
    },
    { key: 'nama', header: 'Nama Kategori', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeKategori(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Kategori', type: 'text', required: true }
  ];

  const handleSubmit = (values: Record<string, any>) => {
    if (editingItem) {
      updateKategori(editingItem.id, values as Partial<Kategori>);
    } else {
      addKategori({ id: `KAT-${Date.now()}`, nama: values.nama } as Kategori);
    }
    setModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '18px' }}>Daftar Kategori</h3>
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Kategori
        </Button>
      </div>
      
      <DataTable columns={columns} data={kategori} keyField="id" sequenceIndex={1} />

      <MasterFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Kategori' : 'Tambah Kategori'}
        fields={fields}
        initialValues={editingItem || {}}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
