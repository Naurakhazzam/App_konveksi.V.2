import React, { useState } from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import MasterFormModal, { FormFieldConfig } from './MasterFormModal';
import { useMasterStore } from '@/stores/useMasterStore';
import { Model } from '@/types';

export default function ModelSection() {
  const { model, kategori, addModel, updateModel, removeModel } = useMasterStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Model | null>(null);

  const columns: Column<Model>[] = [
    { key: 'id', header: 'ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'nama', header: 'Nama Model', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'kategoriId', header: 'Kategori', render: (val) => kategori.find(k => k.id === val)?.nama || val },
    { key: 'targetPoin', header: 'Target Poin', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeModel(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Model', type: 'text', required: true },
    { key: 'kategoriId', label: 'Kategori', type: 'select', required: true, options: kategori.map(k => ({ value: k.id, label: k.nama })) },
    { key: 'targetPoin', label: 'Target Poin (1-20)', type: 'number', required: true }
  ];

  const handleSubmit = (values: Record<string, any>) => {
    if (editingItem) {
      updateModel(editingItem.id, values as Partial<Model>);
    } else {
      addModel({ id: `MDL-${Date.now()}`, ...values } as Model);
    }
    setModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '18px' }}>Daftar Model</h3>
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Model
        </Button>
      </div>
      
      <DataTable columns={columns} data={model} keyField="id" sequenceIndex={1} />

      <MasterFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Model' : 'Tambah Model'}
        fields={fields}
        initialValues={editingItem || {}}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
