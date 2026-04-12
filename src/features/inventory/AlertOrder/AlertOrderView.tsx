'use client';

import React from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import EmptyState from '@/components/molecules/EmptyState';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { InventoryItem } from '@/types';
import styles from './AlertOrderView.module.css';

export default function AlertOrderView() {
  const { items } = useInventoryStore();
  const { kategori } = useMasterStore();

  const alertItems = items.filter((i: InventoryItem) => i.stokAktual <= i.stokMinimum);

  const columns: Column<InventoryItem>[] = [
    { 
      key: 'satuanId', 
      header: 'Satuan', 
      render: (v) => useMasterStore.getState().satuan.find(s => s.id === v)?.nama || v
    },
    { key: 'nama', header: 'Nama Barang', render: (v) => <strong>{v}</strong> },
    { 
      key: 'kategoriId', 
      header: 'Kategori', 
      render: (v) => kategori.find(k => k.id === v)?.nama || v 
    },
    { 
      key: 'stokAktual', 
      header: 'Stok AKTUAL', 
      render: (v) => <span className={v <= 0 ? styles.habis : styles.rendah}>{v}</span>
    },
    { key: 'stokMinimum', header: 'Stok MIN' },
    {
      key: 'stokStatus',
      header: 'Status',
      render: (v) => (
        <Badge variant={v <= 0 ? 'danger' : 'warning'}>
          {v <= 0 ? 'HABIS' : 'RENDAH'}
        </Badge>
      )
    }
  ];

  return (
    <PageWrapper 
      title="Alert Order — Stok Di Bawah Minimum" 
      subtitle="Daftar barang yang perlu dipesan ulang (Restock)"
    >
      <div className={styles.container}>
        {alertItems.length > 0 ? (
          <Panel title={`Ditemukan ${alertItems.length} Item Bermasalah`}>
            <DataTable columns={columns} data={alertItems} keyField="id" />
          </Panel>
        ) : (
          <EmptyState 
            title="Semua Stok Aman" 
            message="Tidak ada barang yang berada di bawah batas minimum stok."
          />
        )}
      </div>
    </PageWrapper>
  );
}
