import React from 'react';
import { Bundle } from '@/types';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import styles from './FormSuratJalan.module.css';

interface FormSuratJalanProps {
  items: Bundle[];
  onRemove: (barcode: string) => void;
}

export default function FormSuratJalan({ items, onRemove }: FormSuratJalanProps) {
  const columns: Column<Bundle>[] = [
    { key: 'skuKlien', header: 'SKU Klien' },
    { key: 'po', header: 'No. PO' },
    { key: 'model', header: 'Model' },
    { key: 'warna', header: 'Warna' },
    { key: 'size', header: 'Size' },
    { key: 'qtyBundle', header: 'QTY (pcs)', render: (v) => <strong>{v}</strong> },
    {
      key: 'barcode',
      header: 'Aksi',
      render: (v) => (
        <Button variant="ghost" size="sm" onClick={() => onRemove(v)}>
          <span style={{ color: 'var(--color-danger)' }}>❌ Hapus</span>
        </Button>
      )
    }
  ];

  const totalQty = items.reduce((sum, item) => sum + item.qtyBundle, 0);

  return (
    <div className={styles.container}>
      <DataTable columns={columns} data={items} keyField="barcode" />
      
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
