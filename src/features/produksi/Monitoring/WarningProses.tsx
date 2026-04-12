import React from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import { Bundle } from '@/types';
import { getWarnings, WarningData, TAHAP_LABEL, TahapKey } from '@/lib/utils/production-helpers';
import styles from './WarningProses.module.css';

interface WarningProsesProps {
  bundles: Bundle[];
}

export default function WarningProses({ bundles }: WarningProsesProps) {
  const warnings = getWarnings(bundles);

  const columns: Column<WarningData>[] = [
    { 
      key: 'barcode', 
      header: 'Barcode', 
      render: (val) => <code className={styles.barcode}>{val}</code> 
    },
    { key: 'po', header: 'PO' },
    { 
      key: 'tahap', 
      header: 'Tahap', 
      render: (val) => TAHAP_LABEL[val as TahapKey] 
    },
    { 
      key: 'jenis', 
      header: 'Jenis Warning',
      render: (val) => {
        let variant: 'danger' | 'warning' | 'info' = 'info';
        let label = '';
        
        switch (val) {
          case 'koreksi': 
            variant = 'warning'; 
            label = 'Koreksi Pending'; 
            break;
          case 'mandek': 
            variant = 'danger'; 
            label = 'Bundle Mandek'; 
            break;
          case 'kurang': 
            variant = 'info'; 
            label = 'QTY Kurang'; 
            break;
        }
        
        return <Badge variant={variant as any}>{label}</Badge>;
      }
    },
    { key: 'detail', header: 'Detail Alert', render: (val) => <span className={styles.detail}>{val}</span> },
    { 
      key: 'waktu', 
      header: 'Waktu Terakhir',
      render: (val) => new Date(val).toLocaleString()
    }
  ];

  return (
    <div className={styles.container}>
      {warnings.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>✅</span>
          <p>Semua proses produksi berjalan lancar. Tidak ada peringatan saat ini.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={warnings} keyField="id" />
      )}
    </div>
  );
}
