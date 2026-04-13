'use client';

import React from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Pagination from '@/components/atoms/Pagination';
import Badge from '@/components/atoms/Badge';
import EmptyState from '@/components/molecules/EmptyState';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { InventoryItem } from '@/types';
import styles from './AlertOrderView.module.css';

export default function AlertOrderView() {
  const { items } = useInventoryStore();
  const { satuan } = useMasterStore();
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const alertItems = React.useMemo(() => {
    return items.filter((i: InventoryItem) => i.stokAktual <= i.stokMinimum);
  }, [items]);

  const totalPages = Math.ceil(alertItems.length / itemsPerPage);
  const paginatedAlerts = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return alertItems.slice(start, start + itemsPerPage);
  }, [alertItems, currentPage]);

  const columns: Column<InventoryItem>[] = [
    { key: 'id', header: 'Kode', render: (v) => <code className={styles.code}>{v}</code> },
    { key: 'nama', header: 'Nama Bahan Baku', render: (v) => <strong>{v}</strong> },
    { 
      key: 'satuanId', 
      header: 'Satuan', 
      render: (v) => satuan.find(s => s.id === v)?.nama || v
    },
    { 
      key: 'stokAktual', 
      header: 'Stok AKTUAL', 
      render: (v, row) => <span className={v <= 0 ? styles.habis : styles.rendah}>{v}</span>
    },
    { key: 'stokMinimum', header: 'Stok MIN' },
    {
      key: 'stokStatus',
      header: 'Status',
      render: (_, row) => (
        <Badge variant={row.stokAktual <= 0 ? 'danger' : 'warning'}>
          {row.stokAktual <= 0 ? 'HABIS' : 'RENDAH'}
        </Badge>
      )
    }
  ];

  return (
    <PageWrapper 
      title="Alert Order — Stok Di Bawah Minimum" 
      subtitle="Daftar bahan baku yang perlu dipesan ulang (Restock)"
    >
      <div className={styles.container}>
        {alertItems.length > 0 ? (
          <Panel title={`Ditemukan ${alertItems.length} Item Bermasalah`}>
            <DataTable columns={columns} data={paginatedAlerts} keyField="id" />
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className={styles.pagination}
            />
          </Panel>
        ) : (
          <EmptyState 
            title="Semua Stok Aman" 
            message="Tidak ada bahan baku yang berada di bawah batas minimum stok."
          />
        )}
      </div>
    </PageWrapper>
  );
}
