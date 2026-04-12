import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { useMasterStore } from '@/stores/useMasterStore';
import { KategoriTrx } from '@/types';
import MasterFormModal, { FormFieldConfig } from '../MasterDetail/MasterFormModal';
import styles from './JenisRejectView.module.css'; // Reusing CSS

export default function KategoriTrxView() {
  const { kategoriTrx, addKategoriTrx, updateKategoriTrx, removeKategoriTrx } = useMasterStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KategoriTrx | null>(null);

  const handleSubmit = (data: Record<string, any>) => {
    if (editingItem) {
      updateKategoriTrx(editingItem.id, data as Partial<KategoriTrx>);
    } else {
      addKategoriTrx({
        id: `KTRX-${Date.now()}`,
        nama: data.nama,
        jenis: data.jenis
      });
    }
    setModalOpen(false);
  };

  const columns: Column<KategoriTrx>[] = [
    { key: 'id', header: 'ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'nama', header: 'Nama Kategori', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'jenis', header: 'Jenis', render: (val) => {
      if (val === 'direct_bahan') return <Badge variant="success">Bahan Langsung</Badge>;
      if (val === 'direct_upah') return <Badge variant="info">Upah Langsung</Badge>;
      if (val === 'overhead') return <Badge variant="warning">Overhead</Badge>;
      if (val === 'masuk') return <span style={{ backgroundColor: 'var(--color-cyan)', color: '#000', borderRadius: '12px', display: 'inline-flex' }}><Badge variant="neutral">Pemasukan</Badge></span>;
      return <Badge variant="neutral">{val}</Badge>;
    }},
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeKategoriTrx(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Kategori', type: 'text', required: true },
    { key: 'jenis', label: 'Jenis', type: 'select', required: true, options: [
      { value: 'direct_bahan', label: 'Bahan Langsung' },
      { value: 'direct_upah', label: 'Upah Langsung' },
      { value: 'overhead', label: 'Overhead' },
      { value: 'masuk', label: 'Pemasukan' }
    ]}
  ];

  return (
    <PageWrapper 
      title="Kategori Transaksi" 
      subtitle="Manajemen kategori jurnal transaksi keuangan"
      action={
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Kategori
        </Button>
      }
    >
      <div className={styles.container}>
        <Panel title="Daftar Kategori Transaksi">
          <DataTable columns={columns} data={kategoriTrx} keyField="id" />
        </Panel>
      </div>

      <MasterFormModal 
        title={editingItem ? 'Edit Kategori Trx' : 'Tambah Kategori Trx'}
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        fields={fields}
        initialValues={editingItem || {}} 
        onSubmit={handleSubmit} 
      />
    </PageWrapper>
  );
}
