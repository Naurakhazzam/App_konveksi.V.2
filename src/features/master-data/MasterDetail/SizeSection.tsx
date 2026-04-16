import React, { useState } from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import MasterFormModal, { FormFieldConfig } from './MasterFormModal';
import { useMasterStore } from '@/stores/useMasterStore';
import { Size } from '@/types';

import { getSzAlias } from '@/lib/utils/master-helpers';

export default function SizeSection() {
  const { sizes, addSize, updateSize, removeSize } = useMasterStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Size | null>(null);

  const columns: Column<Size>[] = [
    { 
      key: 'id', 
      header: 'ID', 
      render: (val) => (
        <span title={val} style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', fontWeight: 'bold' }}>
          {getSzAlias(val, sizes)}
        </span>
      ) 
    },
    { key: 'nama', header: 'Nama Size', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeSize(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Size', type: 'text', required: true }
  ];

  const handleSubmit = (values: Record<string, any>) => {
    if (editingItem) {
      updateSize(editingItem.id, values as Partial<Size>);
    } else {
      addSize({ id: `SZ-${Date.now()}`, nama: values.nama } as Size);
    }
    setModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '18px' }}>Daftar Size</h3>
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Size
        </Button>
      </div>
      
      <DataTable columns={columns} data={sizes} keyField="id" sequenceIndex={1} />

      <MasterFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Size' : 'Tambah Size'}
        fields={fields}
        initialValues={editingItem || {}}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
