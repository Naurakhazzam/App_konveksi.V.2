import React from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { KoreksiItem } from '@/stores/useKoreksiStore';
import { TAHAP_LABEL } from '@/lib/utils/production-helpers';
import { formatRelativeTime } from '@/lib/utils/formatters';

interface KoreksiTableProps {
  items: KoreksiItem[];
  onApprove: (item: KoreksiItem) => void;
  onReject: (item: KoreksiItem) => void;
}

export default function KoreksiTable({ items, onApprove, onReject }: KoreksiTableProps) {
  const columns: Column<KoreksiItem>[] = [
    { key: 'barcode', header: 'Barcode', render: (v) => <code style={{ fontSize: '12px' }}>{v}</code> },
    { key: 'tahap', header: 'Tahap', render: (v) => TAHAP_LABEL[v as keyof typeof TAHAP_LABEL] },
    { 
      key: 'qtyTarget', 
      header: 'QTY (Target | Aktual)', 
      render: (_, row) => (
        <span>{row.qtyTarget} pcs | <strong>{row.qtyAktual} pcs</strong></span>
      )
    },
    { 
      key: 'qtyAktual', 
      header: 'Selisih', 
      render: (v, row) => {
        const diff = v - row.qtyTarget;
        const color = diff > 0 ? 'var(--color-danger)' : 'var(--color-success)';
        return <span style={{ color, fontWeight: 700 }}>{diff > 0 ? '+' : ''}{diff}</span>;
      }
    },
    { key: 'tipe', header: 'Tipe', render: (v) => <Badge variant={v === 'lebih' ? 'warning' : 'info'}>{v}</Badge> },
    { key: 'alasan', header: 'Alasan' },
    { 
      key: 'status', 
      header: 'Status', 
      render: (v) => (
        <Badge variant={v === 'pending' ? 'warning' : v === 'approved' ? 'success' : 'danger'}>
          {v.toUpperCase()}
        </Badge>
      ) 
    },
    { 
      key: 'waktuAjukan', 
      header: 'Diajukan', 
      render: (v, row) => (
        <div style={{ fontSize: '12px' }}>
          <div>{row.diajukanOleh}</div>
          <div style={{ color: 'var(--color-text-secondary)' }}>{formatRelativeTime(v)}</div>
        </div>
      ) 
    },
    {
      key: 'id',
      header: 'Aksi',
      render: (_, row) => {
        if (row.status !== 'pending') return null;
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="primary" onClick={() => onApprove(row)}>✅ Approve</Button>
            <Button size="sm" variant="danger" onClick={() => onReject(row)}>❌ Reject</Button>
          </div>
        );
      }
    }
  ];

  return <DataTable columns={columns} data={items} keyField="id" />;
}
