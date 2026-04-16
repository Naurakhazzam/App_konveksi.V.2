import React, { useState } from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import MasterFormModal, { FormFieldConfig } from './MasterFormModal';
import { useMasterStore } from '@/stores/useMasterStore';
import { Warna } from '@/types';

import { getWrnAlias } from '@/lib/utils/master-helpers';

export default function WarnaSection() {
  const { warna, addWarna, updateWarna, removeWarna } = useMasterStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Warna | null>(null);

  const columns: Column<Warna>[] = [
    { 
      key: 'id', 
      header: 'ID', 
      render: (val) => (
        <span title={val} style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', fontWeight: 'bold' }}>
          {getWrnAlias(val, warna)}
        </span>
      ) 
    },
    { key: 'nama', header: 'Nama Warna', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'kodeHex', header: 'Kode Warna', render: (val) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: val, border: '1px solid var(--color-border)' }} />
        <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span>
      </div>
    )},
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeWarna(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Warna', type: 'text', required: true },
    { key: 'kodeHex', label: 'Kode Warna Hex', type: 'color', required: true }
  ];

  const handleSubmit = (values: Record<string, any>) => {
    if (editingItem) {
      updateWarna(editingItem.id, values as Partial<Warna>);
    } else {
      addWarna({ id: `WRN-${Date.now()}`, nama: values.nama, kodeHex: values.kodeHex || '#000000' } as Warna);
    }
    setModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '18px' }}>Daftar Warna</h3>
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Warna
        </Button>
      </div>
      
      <DataTable columns={columns} data={warna} keyField="id" sequenceIndex={1} />

      <MasterFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Warna' : 'Tambah Warna'}
        fields={fields}
        initialValues={editingItem || {}}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
