import React from 'react';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { KoreksiQTY } from '@/types';
import { TAHAP_LABEL, TahapKey } from '@/lib/utils/production-helpers';

interface KoreksiTableProps {
  items: KoreksiQTY[];
  onApprove: (item: KoreksiQTY) => void;
  onReject: (item: KoreksiQTY) => void;
}

const JENIS_LABEL: Record<string, string> = {
  reject: 'Reject',
  hilang: 'Hilang',
  salah_hitung: 'Salah Hitung',
  lebih: 'QTY Lebih',
};

export default function KoreksiTable({ items, onApprove, onReject }: KoreksiTableProps) {
  const columns: Column<KoreksiQTY>[] = [
    {
      key: 'barcode',
      header: 'Barcode',
      render: (v) => <code style={{ fontSize: '12px' }}>{v}</code>,
    },
    {
      key: 'tahapDitemukan',
      header: 'Tahap',
      render: (v) => TAHAP_LABEL[v as TahapKey] || v,
    },
    {
      key: 'qtyKoreksi',
      header: 'QTY Koreksi',
      render: (v, row) => (
        <span>
          <strong style={{ color: row.jenisKoreksi === 'lebih' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
            {row.jenisKoreksi === 'lebih' ? '+' : '-'}{v} pcs
          </strong>
        </span>
      ),
    },
    {
      key: 'jenisKoreksi',
      header: 'Jenis',
      render: (v) => (
        <Badge variant={v === 'lebih' ? 'warning' : 'danger'}>
          {JENIS_LABEL[v] || v}
        </Badge>
      ),
    },
    {
      key: 'statusApproval',
      header: 'Status Approval',
      render: (v, row) => {
        if (row.jenisKoreksi !== 'lebih') return <span style={{ opacity: 0.5 }}>—</span>;
        if (v === 'approved') return <Badge variant="success">Disetujui</Badge>;
        if (v === 'ditolak') return <Badge variant="danger">Ditolak</Badge>;
        return <Badge variant="warning">Menunggu</Badge>;
      },
    },
    {
      key: 'statusPotongan',
      header: 'Status Potongan',
      render: (v) => {
        if (v === 'cancelled') return <Badge variant="success">Dibatalkan</Badge>;
        if (v === 'applied') return <Badge variant="danger">Diterapkan</Badge>;
        return <Badge variant="warning">Pending</Badge>;
      },
    },
    {
      key: 'waktuLapor',
      header: 'Waktu',
      render: (v) => (
        <span style={{ fontSize: '12px', opacity: 0.7 }}>
          {new Date(v).toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Aksi',
      render: (_, row) => {
        if (row.jenisKoreksi !== 'lebih' || row.statusApproval !== 'menunggu') return null;
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="primary" onClick={() => onApprove(row)}>
              ✅ Approve
            </Button>
            <Button size="sm" variant="danger" onClick={() => onReject(row)}>
              ❌ Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={items} keyField="id" />;
}
