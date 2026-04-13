import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { useMasterStore } from '@/stores/useMasterStore';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { HPPKomponen } from '@/types';
import MasterFormModal, { FormFieldConfig } from '../MasterDetail/MasterFormModal';
import styles from './MasterHPPKomponenView.module.css';

export default function MasterHPPKomponenView() {
  const { hppKomponen, addHPPKomponen, updateHPPKomponen, removeHPPKomponen } = useMasterStore();
  const [activeTab, setActiveTab] = useState<'semua' | 'bahan_baku' | 'biaya_produksi' | 'overhead'>('semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HPPKomponen | null>(null);

  const filteredData = hppKomponen.filter(item => {
    if (activeTab === 'semua') return true;
    return item.kategori === activeTab;
  });

  const columns: Column<HPPKomponen>[] = [
    { key: 'id', header: 'ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'nama', header: 'Nama Komponen', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'kategori', header: 'Kategori', render: (val) => {
      let variant: 'success' | 'info' | 'warning' | 'neutral' | 'danger' = 'neutral';
      let label = val;
      if (val === 'bahan_baku') { variant = 'success'; label = 'Bahan Baku'; }
      if (val === 'biaya_produksi') { variant = 'info'; label = 'Biaya Produksi'; }
      if (val === 'overhead') { variant = 'warning'; label = 'Overhead'; }
      return <Badge variant={variant}>{label}</Badge>;
    }},
    { key: 'satuan', header: 'Satuan', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'trackInventory', header: 'Track Stok', render: (val, row) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Badge variant={val ? 'success' : 'neutral'}>{val ? 'YA' : 'TIDAK'}</Badge>
        {val && row.inventoryItemId && (
          <span style={{ fontSize: '10px', color: 'var(--color-text-sub)' }}>
            ID: {row.inventoryItemId}
          </span>
        )}
      </div>
    )},
    { key: 'deskripsi', header: 'Deskripsi', render: (val) => <span style={{ color: 'var(--color-text-sub)', fontSize: '13px' }}>{val || '-'}</span> },
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeHPPKomponen(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Komponen', type: 'text', required: true },
    { key: 'kategori', label: 'Kategori', type: 'select', required: true, options: [
      { value: 'bahan_baku', label: 'Bahan Baku' },
      { value: 'biaya_produksi', label: 'Biaya Produksi' },
      { value: 'overhead', label: 'Overhead' }
    ]},
    { key: 'satuan', label: 'Satuan', type: 'text', required: true, placeholder: 'Contoh: meter, pcs, lusin' },
    { key: 'trackInventory', label: 'Track Inventory', type: 'select', options: [
      { value: 'false', label: 'TIDAK' },
      { value: 'true', label: 'YA' }
    ]},
    { 
      key: 'inventoryItemId', 
      label: 'Link ke Barang Gudang', 
      type: 'select', 
      showIf: (vals) => vals.trackInventory === 'true' || vals.trackInventory === true,
      options: useInventoryStore.getState().items.map(i => ({ value: i.id, label: `${i.id} — ${i.nama}` }))
    },
    { key: 'deskripsi', label: 'Deskripsi (Opsional)', type: 'text' }
  ];

  const handleSubmit = (values: Record<string, any>) => {
    // Convert string 'true'/'false' from select back to boolean
    const processedValues = {
      ...values,
      trackInventory: values.trackInventory === 'true' || values.trackInventory === true
    };

    if (editingItem) {
      updateHPPKomponen(editingItem.id, processedValues as Partial<HPPKomponen>);
    } else {
      addHPPKomponen({ id: `KOMP-${Date.now()}`, ...processedValues } as HPPKomponen);
    }
    setModalOpen(false);
  };

  return (
    <PageWrapper 
      title="Komponen HPP" 
      subtitle="Kelola daftar jenis biaya produksi"
      action={
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Komponen
        </Button>
      }
    >
      <Panel title="Data Komponen HPP">
        <div className={styles.container}>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === 'semua' ? styles.active : ''}`} onClick={() => setActiveTab('semua')}>Semua</button>
            <button className={`${styles.tab} ${activeTab === 'bahan_baku' ? styles.active : ''}`} onClick={() => setActiveTab('bahan_baku')}>Bahan Baku</button>
            <button className={`${styles.tab} ${activeTab === 'biaya_produksi' ? styles.active : ''}`} onClick={() => setActiveTab('biaya_produksi')}>Biaya Produksi</button>
            <button className={`${styles.tab} ${activeTab === 'overhead' ? styles.active : ''}`} onClick={() => setActiveTab('overhead')}>Overhead</button>
          </div>
          
          <DataTable 
            columns={columns} 
            data={filteredData} 
            keyField="id" 
          />
        </div>
      </Panel>

      <MasterFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Komponen' : 'Tambah Komponen Baru'}
        fields={fields}
        initialValues={editingItem || {}}
        onSubmit={handleSubmit}
      />
    </PageWrapper>
  );
}
