'use client';

import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Pagination from '@/components/atoms/Pagination';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { InventoryItem } from '@/types';
import ModalTambahItem from './ModalTambahItem';
import styles from './OverviewStokView.module.css';

export default function OverviewStokView() {
  const { items, addItem } = useInventoryStore();
  const { kategori, satuan } = useMasterStore();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const stats = useMemo(() => {
    const total = items.length;
    const aman = items.filter(i => i.stokAktual > i.stokMinimum).length;
    const rendah = items.filter(i => i.stokAktual <= i.stokMinimum && i.stokAktual > 0).length;
    const habis = items.filter(i => i.stokAktual <= 0).length;
    return { total, aman, rendah, habis };
  }, [items]);

  const kpiRow = (
    <div className={styles.kpiRow}>
      <KpiCard label="Total Item" value={stats.total} accent="blue" />
      <KpiCard label="Stok Aman" value={stats.aman} accent="green" />
      <KpiCard label="Stok Rendah" value={stats.rendah} accent="yellow" />
      <KpiCard label="Stok Habis" value={stats.habis} accent="red" />
    </div>
  );

  const filteredItems = useMemo(() => {
    return items.filter(i => 
      i.nama.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const columns: Column<InventoryItem>[] = [
    { key: 'id', header: 'Kode', render: (v) => <code className={styles.code}>{v}</code> },
    { key: 'nama', header: 'Nama Barang', render: (v) => <strong>{v}</strong> },
    { 
      key: 'kategoriId', 
      header: 'Kategori', 
      render: (v) => kategori.find(k => k.id === v)?.nama || v 
    },
    { 
      key: 'satuanId', 
      header: 'Satuan', 
      render: (v) => satuan.find(s => s.id === v)?.nama || v 
    },
    { 
      key: 'stokAktual', 
      header: 'Stok AKTUAL', 
      render: (_, row) => (
        <span className={row.stokAktual <= 0 ? styles.habis : row.stokAktual <= row.stokMinimum ? styles.rendah : ''}>
          {row.stokAktual}
        </span>
      )
    },
    { key: 'stokMinimum', header: 'Stok MIN' },
    {
      key: 'stokStatus',
      header: 'Status',
      render: (_, row) => {
        if (row.stokAktual <= 0) return <Badge variant="danger">HABIS</Badge>;
        if (row.stokAktual <= row.stokMinimum) return <Badge variant="warning">RENDAH</Badge>;
        return <Badge variant="success">AMAN</Badge>;
      }
    }
  ];

  return (
    <PageWrapper 
      title="Inventory — Overview Stok" 
      subtitle="Monitoring ketersediaan bahan baku dan aksesori"
      kpiRow={kpiRow}
      action={
        <Button variant="primary" onClick={() => setShowModal(true)}>
          ➕ Tambah Item Baru
        </Button>
      }
    >
      <div className={styles.container}>
        <Panel title="Daftar Inventaris Barang">
          <div className={styles.toolbar}>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Cari kode atau nama barang..." 
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <DataTable columns={columns} data={paginatedItems} keyField="id" />
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className={styles.pagination}
          />
        </Panel>
      </div>

      {showModal && (
        <ModalTambahItem 
          onClose={() => setShowModal(false)}
          onConfirm={(data) => {
            addItem(data);
            setShowModal(false);
          }}
        />
      )}
    </PageWrapper>
  );
}
