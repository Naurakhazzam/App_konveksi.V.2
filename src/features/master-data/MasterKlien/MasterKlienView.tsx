import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import TextInput from '@/components/atoms/Input/TextInput';
import { useMasterStore } from '@/stores/useMasterStore';
import { Klien } from '@/types';
import FormKlien from './FormKlien';
import styles from './MasterKlienView.module.css';

export default function MasterKlienView() {
  const { klien, addKlien, updateKlien, removeKlien } = useMasterStore();
  const [search, setSearch] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Klien | null>(null);

  const filteredData = klien.filter(item => {
    return item.nama.toLowerCase().includes(search.toLowerCase()) || 
           item.kontak.toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmit = (data: Partial<Klien>) => {
    if (editingItem) {
      updateKlien(editingItem.id, data);
    } else {
      addKlien({
        id: `KLN-${Date.now()}`,
        nama: data.nama!,
        kontak: data.kontak!,
        alamat: data.alamat!
      });
    }
    setModalOpen(false);
  };

  const columns: Column<Klien>[] = [
    { key: 'id', header: 'ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'nama', header: 'Nama Perusahaan', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'kontak', header: 'Kontak', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'alamat', header: 'Alamat', render: (val) => (
      <span style={{ 
        display: 'inline-block', maxWidth: '300px', whiteSpace: 'nowrap', 
        overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-sub)', fontSize: '13px'
      }}>
        {val || '-'}
      </span>
    )},
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(row); setModalOpen(true); }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeKlien(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  return (
    <PageWrapper 
      title="Klien" 
      subtitle="Manajemen Data Klien"
      action={
        <Button variant="primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          + Tambah Klien
        </Button>
      }
    >
      <div className={styles.container}>
        <Panel title="Daftar Klien">
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <TextInput value={search} onChange={setSearch} placeholder="Cari by nama atau kontak..." />
            </div>
          </div>

          <DataTable columns={columns} data={filteredData} keyField="id" />
        </Panel>
      </div>

      <FormKlien 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        initialValues={editingItem} 
        onSubmit={handleSubmit} 
      />
    </PageWrapper>
  );
}
