'use client';

import React, { useMemo } from 'react';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import { useKoreksiStore } from '@/stores/useKoreksiStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { KoreksiQTY } from '@/types';
import { TahapKey, TAHAP_LABEL } from '@/lib/utils/production-helpers';

interface RejectListTahapProps {
  tahap: TahapKey;
}

export default function RejectListTahap({ tahap }: RejectListTahapProps) {
  const { koreksiList } = useKoreksiStore();
  const { alasanReject, karyawan } = useMasterStore();
  const { bundles } = useBundleStore();

  // Hanya tampilkan reject yang tahapBertanggungJawab = tahap ini
  const rejectList = useMemo(() => {
    return koreksiList.filter(
      (k) =>
        k.tahapBertanggungJawab === tahap &&
        k.jenisKoreksi !== 'lebih'
    );
  }, [koreksiList, tahap]);

  const columns: Column<KoreksiQTY>[] = [
    {
      key: 'poId',
      header: 'No. PO',
      render: (val) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{val}</span>,
    },
    {
      key: 'barcode',
      header: 'Barcode',
      render: (val) => <code style={{ fontSize: '11px' }}>{val}</code>,
    },
    {
      key: 'artikel',
      header: 'Artikel',
      render: (_, row) => {
        const val = row.barcode;
        const bundle = bundles.find(b => b.barcode === val);
        if (!bundle) return <span style={{ opacity: 0.5 }}>—</span>;
        return <span style={{ fontSize: '13px' }}>{bundle.po} / {bundle.model}</span>;
      },
    },
    {
      key: 'qtyKoreksi',
      header: 'QTY Reject',
      render: (val) => (
        <strong style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
          {val} pcs
        </strong>
      ),
    },
    {
      key: 'alasanRejectId',
      header: 'Alasan',
      render: (val, row) => {
        if (row.jenisKoreksi === 'reject' && val) {
          const alasan = alasanReject.find(a => a.id === val);
          return <Badge variant="warning">{alasan?.nama || val}</Badge>;
        }
        if (row.jenisKoreksi === 'hilang') return <Badge variant="danger">Hilang</Badge>;
        if (row.jenisKoreksi === 'salah_hitung') return <Badge variant="info">Salah Hitung</Badge>;
        return <span>—</span>;
      },
    },
    {
      key: 'tahapDitemukan',
      header: 'Ditemukan di',
      render: (val) => (
        <Badge variant="info">
          {TAHAP_LABEL[val as TahapKey] || val}
        </Badge>
      ),
    },
    {
      key: 'karyawanBertanggungJawab',
      header: 'Karyawan',
      render: (val) => {
        const k = karyawan.find(k => k.id === val);
        return <span style={{ fontSize: '13px' }}>{k?.nama || val || '—'}</span>;
      },
    },
    {
      key: 'statusPotongan',
      header: 'Status',
      render: (val) => {
        if (val === 'cancelled') {
          return <Badge variant="success">✅ Sudah Diperbaiki</Badge>;
        }
        if (val === 'applied') {
          return <Badge variant="danger">Potongan Diterapkan</Badge>;
        }
        return <Badge variant="warning">⏳ Belum Diperbaiki</Badge>;
      },
    },
    {
      key: 'waktuLapor',
      header: 'Waktu',
      render: (val) =>
        val ? (
          <span style={{ fontSize: '12px', opacity: 0.7 }}>
            {new Date(val).toLocaleDateString('id-ID')}
          </span>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <Panel
      title={`Daftar Reject — Tanggung Jawab ${TAHAP_LABEL[tahap]}`}
    >
      <DataTable
        columns={columns}
        data={rejectList}
        keyField="id"
        emptyMessage={`Tidak ada reject yang menjadi tanggung jawab tahap ${TAHAP_LABEL[tahap]}.`}
      />
    </Panel>
  );
}
