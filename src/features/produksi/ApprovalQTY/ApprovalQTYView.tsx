'use client';

import React, { useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { useKoreksiStore } from '@/stores/useKoreksiStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { KoreksiQTY } from '@/types';
import { TAHAP_LABEL, TahapKey } from '@/lib/utils/production-helpers';
import { useToast } from '@/components/molecules/Toast';
import KpiRow from '@/components/organisms/KpiRow';
import KpiCard from '@/components/molecules/KpiCard';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import styles from './ApprovalQTYView.module.css';

const ALASAN_LEBIH_LABEL: Record<string, string> = {
  lebih_cutting: 'Lebih Cutting',
  koreksi_tahap_sebelumnya: 'Koreksi Tahap Sebelumnya',
  lainnya: 'Lainnya',
};

export default function ApprovalQTYView() {
  const { koreksiList, approveKoreksiLebih, rejectKoreksiLebih } = useKoreksiStore();
  const { karyawan } = useMasterStore();
  const { bundles, updateStatusTahap } = useBundleStore();
  const { success, error: toastError } = useToast();

  const pending = useMemo(
    () =>
      koreksiList.filter(
        (k) => k.jenisKoreksi === 'lebih' && k.statusApproval === 'menunggu'
      ),
    [koreksiList]
  );

  const approved = useMemo(
    () => koreksiList.filter(k => k.jenisKoreksi === 'lebih' && k.statusApproval === 'approved'),
    [koreksiList]
  );

  const rejected = useMemo(
    () => koreksiList.filter(k => k.jenisKoreksi === 'lebih' && k.statusApproval === 'ditolak'),
    [koreksiList]
  );

  const getBundle = (barcode: string) => bundles.find((b) => b.barcode === barcode);
  const getKaryawan = (id: string) => karyawan.find((k) => k.id === id)?.nama || id || '—';

  const pendingColumns: Column<KoreksiQTY>[] = [
    {
      key: 'waktuLapor',
      header: 'Waktu',
      render: (val) => (
        <span style={{ fontSize: '12px', opacity: 0.7 }}>
          {new Date(val).toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      key: 'poId',
      header: 'No. PO',
      render: (val) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{val}</span>,
    },
    {
      key: 'barcode',
      header: 'Barcode / Artikel',
      render: (val) => {
        const b = getBundle(val);
        return (
          <div>
            <code style={{ fontSize: '11px', display: 'block' }}>{val}</code>
            {b && (
              <span style={{ fontSize: '12px', opacity: 0.7 }}>
                {b.model} / {b.warna} / {b.size}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'tahapDitemukan',
      header: 'Tahap',
      render: (val) => (
        <Badge variant="info">{TAHAP_LABEL[val as TahapKey] || val}</Badge>
      ),
    },
    {
      key: 'karyawanPelapor',
      header: 'Dilaporkan Oleh',
      render: (val) => <span>{getKaryawan(val)}</span>,
    },
    {
      key: 'alasanLebih',
      header: 'Alasan',
      render: (val, row) => (
        <div>
          <Badge variant="warning">{ALASAN_LEBIH_LABEL[val] || val}</Badge>
          {row.alasanLebihText && (
            <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
              {row.alasanLebihText}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'qtyKoreksi',
      header: 'QTY Lebih',
      render: (val) => (
        <strong style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
          +{val} pcs
        </strong>
      ),
    },
    {
      key: 'action',
      header: 'Aksi',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const bundle = getBundle(row.barcode);
              if (bundle) {
                const currentQty = bundle.statusTahap[row.tahapDitemukan as TahapKey].qtySelesai || 0;
                updateStatusTahap(bundle.barcode, row.tahapDitemukan, {
                  qtySelesai: currentQty + row.qtyKoreksi,
                  koreksiStatus: 'approved',
                });
              }
              approveKoreksiLebih(row.id, 'OWNER');
              success('Disetujui', `QTY Lebih untuk bundle ${row.barcode} telah disetujui.`);
            }}
          >
            ✅ Approve
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              updateStatusTahap(row.barcode, row.tahapDitemukan, {
                koreksiStatus: 'rejected',
              });
              rejectKoreksiLebih(row.id);
              toastError('Ditolak', `Permintaan QTY Lebih untuk bundle ${row.barcode} berhasil ditolak.`);
            }}
          >
            ❌ Tolak
          </Button>
        </div>
      ),
    },
  ];

  const history = useMemo(() => [...approved, ...rejected], [approved, rejected]);

  const historyColumns: Column<KoreksiQTY>[] = [
    {
      key: 'waktuLapor',
      header: 'Waktu',
      render: (val) => (
        <span style={{ fontSize: '12px', opacity: 0.7 }}>
          {new Date(val).toLocaleString('id-ID')}
        </span>
      ),
    },
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
      key: 'tahapDitemukan',
      header: 'Tahap',
      render: (val) => (
        <Badge variant="info">{TAHAP_LABEL[val as TahapKey] || val}</Badge>
      ),
    },
    {
      key: 'qtyKoreksi',
      header: 'QTY Lebih',
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>+{val} pcs</span>
      ),
    },
    {
      key: 'alasanLebih',
      header: 'Alasan',
      render: (val) => <Badge variant="warning">{ALASAN_LEBIH_LABEL[val] || val}</Badge>,
    },
    {
      key: 'statusApproval',
      header: 'Status',
      render: (val, row) => (
        <div>
          {val === 'approved' ? (
            <Badge variant="success">✅ Disetujui</Badge>
          ) : (
            <Badge variant="danger">❌ Ditolak</Badge>
          )}
          {row.approvedBy && (
            <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
              oleh {row.approvedBy}
              {row.approvedAt && ` · ${new Date(row.approvedAt).toLocaleDateString('id-ID')}`}
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Approval QTY Lebih"
      subtitle="Permintaan persetujuan penambahan QTY melebihi target PO"
    >
      <div className={styles.container}>
        <KpiRow columns={3}>
          <KpiCard
            label="Menunggu Approval"
            value={pending.length}
            accent="yellow"
            icon={<Clock size={20} />}
          />
          <KpiCard
            label="Total Disetujui"
            value={approved.length}
            accent="green"
            icon={<CheckCircle size={20} />}
          />
          <KpiCard
            label="Total Ditolak"
            value={rejected.length}
            accent="red"
            icon={<XCircle size={20} />}
          />
        </KpiRow>

        {pending.length > 0 && (
          <div className={styles.alertBanner}>
            🔔 Ada <strong>{pending.length}</strong> permintaan yang menunggu persetujuan Owner
          </div>
        )}

        <Panel title={`Menunggu Approval (${pending.length})`}>
          <DataTable
            columns={pendingColumns}
            data={pending}
            keyField="id"
            emptyMessage="Tidak ada permintaan QTY lebih yang menunggu approval."
          />
        </Panel>

        <Panel title="Riwayat Keputusan">
          <DataTable
            columns={historyColumns}
            data={history}
            keyField="id"
            emptyMessage="Belum ada riwayat keputusan."
            reverse={true}
          />
        </Panel>
      </div>
    </PageWrapper>
  );
}
