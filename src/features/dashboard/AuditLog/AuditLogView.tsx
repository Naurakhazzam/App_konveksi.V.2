'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import { useLogStore } from '@/stores/useLogStore';
import { AuditEntry } from '@/types/audit.types';
import { Landmark, Box, Activity, User, Coins } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/formatters';
import styles from './AuditLogView.module.css';

export default function AuditLogView() {
  const { logs } = useLogStore();
  const [filterModul, setFilterModul] = useState<string>('all');

  const filteredLogs = logs.filter(l => filterModul === 'all' || l.modul === filterModul);

  const columns: Column<AuditEntry>[] = [
    { 
      key: 'timestamp', 
      header: 'Waktu', 
      render: (v) => <span className={styles.time}>{new Date(v).toLocaleString('id-ID')}</span> 
    },
    { 
      key: 'modul', 
      header: 'Modul', 
      render: (v) => {
        const icons: Record<string, any> = {
          keuangan: <Landmark size={14} />,
          inventory: <Box size={14} />,
          produksi: <Activity size={14} />,
          penggajian: <Coins size={14} />,
          auth: <User size={14} />
        };
        const variants: Record<string, any> = {
          keuangan: 'danger',
          inventory: 'warning',
          produksi: 'info',
          penggajian: 'purple',
          auth: 'neutral'
        };
        return (
          <div className={styles.modulCell}>
            <Badge variant={variants[v] || 'neutral'} className={styles.modulBadge}>
              {icons[v]} {v.toUpperCase()}
            </Badge>
          </div>
        );
      }
    },
    { 
      key: 'user', 
      header: 'User', 
      render: (v) => (
        <div className={styles.userInfo}>
          <strong>{v.nama}</strong>
          <span>{v.role}</span>
        </div>
      ) 
    },
    { 
      key: 'aksi', 
      header: 'Aksi & Target', 
      render: (v, r) => (
        <div className={styles.actionCol}>
          <span className={styles.actionText}>{v} ⮕ <code className={styles.target}>{r.target}</code></span>
          {r.metadata?.nominal && (
            <span className={styles.metaNominal}>
              Nominal: <strong>{formatRupiah(r.metadata.nominal)}</strong>
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <PageWrapper 
      title="Audit Log" 
      subtitle="Riwayat lengkap aktivitas sistem dan audit jejak digital"
    >
      <div className={styles.container}>
        <div className={styles.filters}>
          <label>Filter berdasarkan Modul:</label>
          <div className={styles.filterChips}>
            {['all', 'produksi', 'inventory', 'keuangan', 'penggajian'].map(m => (
              <button 
                key={m}
                className={`${styles.chip} ${filterModul === m ? styles.active : ''}`}
                onClick={() => setFilterModul(m)}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <Panel title="Riwayat Aktivitas Sistem">
          <DataTable columns={columns} data={[...filteredLogs].reverse()} keyField="id" />
        </Panel>
      </div>
    </PageWrapper>
  );
}
