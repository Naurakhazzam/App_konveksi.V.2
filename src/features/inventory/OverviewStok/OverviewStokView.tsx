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
import { formatRupiah } from '@/lib/utils/formatters';
import FormBahanBaku from './FormBahanBaku';
import styles from './OverviewStokView.module.css';

export default function OverviewStokView() {
  const { items, addItem } = useInventoryStore();
  const { satuan } = useMasterStore();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const stats = useMemo(() => {
    const totalJenis = items.length;
    const totalNilaiStok = items.reduce((acc, curr) => acc + (curr.stokAktual * (curr.hargaSatuan || 0)), 0);
    const rendah = items.filter(i => i.stokAktual <= i.stokMinimum).length;
    
    return { totalJenis, totalNilaiStok, rendah };
  }, [items]);

  const kpiRow = (
    <div className={styles.kpiRow}>
      <KpiCard label="Total Jenis Bahan" value={stats.totalJenis} accent="blue" />
      <KpiCard label="Total Nilai Stok (HPP)" value={formatRupiah(stats.totalNilaiStok)} accent="cyan" />
      <KpiCard label="Bahan Hampir Habis" value={stats.rendah} accent="yellow" />
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
    { 
      key: 'nama', 
      header: 'Nama Bahan Baku', 
      render: (v, row) => (
        <div className={styles.itemNameWrapper}>
          <span className={styles.itemName}>{v}</span>
          {row.jenisBahan && <Badge variant="neutral" className={styles.jenisBadge}>{row.jenisBahan}</Badge>}
        </div>
      )
    },
    { 
      key: 'satuanId', 
      header: 'Satuan', 
      render: (v) => satuan.find(s => s.id === v)?.nama || v 
    },
    { 
      key: 'hargaSatuan', 
      header: 'Harga (HPP)', 
      render: (v) => formatRupiah(v || 0)
    },
    { 
      key: 'stokAktual', 
      header: 'Stok AKTUAL', 
      render: (v, row) => (
        <span className={v <= row.stokMinimum ? styles.rendah : ''}>
          {v}
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
      subtitle="Manajemen ketersediaan bahan baku, aksesori, dan kemasan"
      kpiRow={kpiRow}
      action={
        <Button variant="primary" onClick={() => setShowModal(true)}>
          ➕ Tambah Bahan Baku
        </Button>
      }
    >
      <div className={styles.container}>
        <Panel title="Daftar Inventaris Bahan Baku">
          <div className={styles.toolbar}>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Cari kode atau nama bahan..." 
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
        <FormBahanBaku 
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
