'use client';

import React from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import { useReturnStore } from '@/stores/useReturnStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { formatDate } from '@/lib/utils/formatters';
import { ReturnItem } from '@/types/production.types';

export default function MonitoringReturView() {
  const { returns } = useReturnStore();
  const { karyawan } = useMasterStore();

  const getKaryawanNama = (id: string | null) => {
    if (!id) return <span style={{ opacity: 0.5 }}>—</span>;
    return karyawan.find(k => k.id === id)?.nama || id;
  };

  const columns: Column<ReturnItem>[] = [
    { 
      key: 'waktuDiterima', 
      header: 'Tgl Retur',
      render: (v) => formatDate(v)
    },
    { 
      key: 'barcode', 
      header: 'Barcode',
      render: (v) => <code style={{ fontSize: '12px' }}>{v}</code>
    },
    { key: 'artikelNama', header: 'Produk' },
    { 
      key: 'alasanRejectId', 
      header: 'Alasan',
      render: (v) => <Badge variant="danger">{v}</Badge>
    },
    { 
      key: 'karyawanOriginal', 
      header: 'Penjahit Asal',
      render: (v) => getKaryawanNama(v)
    },
    { 
      key: 'karyawanPerbaikan', 
      header: 'Penjahit Perbaikan',
      render: (v) => getKaryawanNama(v)
    },
    { 
      key: 'status', 
      header: 'Status Pipeline',
      render: (v) => {
        const variants: Record<string, any> = {
          diterima: 'danger',
          proses_perbaikan: 'warning',
          siap_kirim: 'info',
          selesai: 'success'
        };
        return <Badge variant={variants[v]}>{v.replace('_', ' ').toUpperCase()}</Badge>;
      }
    }
  ];

  return (
    <PageWrapper title="Monitoring Pipeline Perbaikan" subtitle="Pantau status barang retur dan tanggung jawab pengerjaan ulang.">
      <Panel title="Daftar Antrian Perbaikan & Retur">
        <DataTable columns={columns} data={[...returns].reverse()} keyField="id" />
      </Panel>
    </PageWrapper>
  );
}
