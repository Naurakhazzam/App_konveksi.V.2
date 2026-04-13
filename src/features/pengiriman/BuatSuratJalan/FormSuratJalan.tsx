import React from 'react';
import { Bundle } from '@/types';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import styles from './FormSuratJalan.module.css';

interface FormSuratJalanProps {
  items: Array<{
    bundle: Bundle;
    qtySJ: number;
    alasan?: string;
  }>;
  onRemove: (barcode: string) => void;
}

export default function FormSuratJalan({ items, onRemove }: FormSuratJalanProps) {
  const columns: Column<FormSuratJalanProps['items'][0]>[] = [
    { key: 'sku', header: 'SKU Klien', render: (row) => row.bundle.skuKlien },
    { key: 'po', header: 'No. PO', render: (row) => row.bundle.po },
    { key: 'model', header: 'Model', render: (row) => row.bundle.model },
    { key: 'warna', header: 'Warna', render: (row) => row.bundle.warna },
    { key: 'size', header: 'Size', render: (row) => row.bundle.size },
    { 
      key: 'packing', 
      header: 'Packing (pcs)', 
      render: (row) => <span style={{ opacity: 0.6 }}>{row.bundle.statusTahap.packing.qtySelesai}</span> 
    },
    { 
      key: 'qtySJ', 
      header: 'QTY SJ', 
      render: (val, row) => {
        const packing = row.bundle.statusTahap.packing.qtySelesai || 0;
        const color = val < packing ? 'var(--color-danger)' : val > packing ? 'var(--color-cyan-dim)' : 'inherit';
        return <strong style={{ color, fontSize: '1.1rem' }}>{val}</strong>;
      }
    },
    {
      key: 'alasan',
      header: 'Keterangan',
      render: (val, row) => {
        const packing = row.bundle.statusTahap.packing.qtySelesai || 0;
        if (row.qtySJ < packing) return <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: 600 }}>⚠️ QTY KURANG</span>;
        if (row.qtySJ > packing) return <span style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--color-text-sub)' }}>{val}</span>;
        return <span style={{ opacity: 0.3 }}>—</span>;
      }
    },
    {
      key: 'action',
      header: 'Aksi',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => onRemove(row.bundle.barcode)}>
          <span style={{ color: 'var(--color-danger)' }}>❌</span>
        </Button>
      )
    }
  ];

  const tableData = items.map(item => ({
    ...item,
    id: item.bundle.barcode // Flat ID for DataTable keyField
  }));

  const totalQty = items.reduce((sum, item) => sum + item.qtySJ, 0);

  return (
    <div className={styles.container}>
      <DataTable columns={columns} data={tableData} keyField="id" />
      
      <div className={styles.footer}>
        <div className={styles.stat}>
          <span>Total Bundel:</span>
          <strong>{items.length}</strong>
        </div>
        <div className={styles.stat}>
          <span>Total QTY:</span>
          <strong>{totalQty} pcs</strong>
        </div>
      </div>
    </div>
  );
}
