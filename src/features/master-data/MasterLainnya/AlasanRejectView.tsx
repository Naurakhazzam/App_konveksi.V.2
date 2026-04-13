'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { useMasterStore } from '@/stores/useMasterStore';
import { AlasanReject } from '@/types';
import MasterFormModal, { FormFieldConfig } from '../MasterDetail/MasterFormModal';
import { TAHAP_LABEL, TahapKey } from '@/lib/utils/production-helpers';
import styles from './JenisRejectView.module.css';

const TAHAP_OPTIONS = Object.entries(TAHAP_LABEL).map(([value, label]) => ({ value, label }));

export default function AlasanRejectView() {
  const { alasanReject, addAlasanReject, updateAlasanReject, removeAlasanReject } = useMasterStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AlasanReject | null>(null);

  const handleSubmit = (data: Record<string, any>) => {
    if (editingItem) {
      updateAlasanReject(editingItem.id, {
        nama: data.nama,
        tahapBertanggungJawab: data.tahapBertanggungJawab,
        bisaDiperbaiki: data.bisaDiperbaiki === 'true' || data.bisaDiperbaiki === true,
        dampakPotongan: data.dampakPotongan,
      });
    } else {
      addAlasanReject({
        id: `RJ-${Date.now()}`,
        nama: data.nama,
        tahapBertanggungJawab: data.tahapBertanggungJawab,
        bisaDiperbaiki: data.bisaDiperbaiki === 'true' || data.bisaDiperbaiki === true,
        dampakPotongan: data.dampakPotongan,
      });
    }
    setModalOpen(false);
    setEditingItem(null);
  };

  const columns: Column<AlasanReject>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (val) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{val}</span>,
    },
    {
      key: 'nama',
      header: 'Nama Alasan',
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    {
      key: 'tahapBertanggungJawab',
      header: 'Tahap Bertanggung Jawab',
      render: (val) => (
        <Badge variant="info">
          {TAHAP_LABEL[val as TahapKey] || val}
        </Badge>
      ),
    },
    {
      key: 'bisaDiperbaiki',
      header: 'Bisa Diperbaiki',
      render: (val) =>
        val ? (
          <Badge variant="success">Ya</Badge>
        ) : (
          <Badge variant="danger">Tidak</Badge>
        ),
    },
    {
      key: 'dampakPotongan',
      header: 'Dampak Potongan',
      render: (val) => (
        <Badge variant={val === 'hpp_po' ? 'danger' : 'warning'}>
          {val === 'hpp_po' ? 'HPP PO' : 'Upah Tahap'}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditingItem(row); setModalOpen(true); }}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => removeAlasanReject(row.id)}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Alasan', type: 'text', required: true, placeholder: 'Contoh: Rusak Jahitan' },
    {
      key: 'tahapBertanggungJawab',
      label: 'Tahap Bertanggung Jawab',
      type: 'select',
      required: true,
      options: TAHAP_OPTIONS,
    },
    {
      key: 'bisaDiperbaiki',
      label: 'Bisa Diperbaiki?',
      type: 'select',
      required: true,
      options: [
        { value: 'true', label: 'Ya — bisa di-scan ulang untuk perbaikan' },
        { value: 'false', label: 'Tidak — masuk kerugian permanen' },
      ],
    },
    {
      key: 'dampakPotongan',
      label: 'Dampak Potongan',
      type: 'select',
      required: true,
      options: [
        { value: 'upah_tahap', label: 'Upah Tahap — potong upah karyawan di tahap tsb' },
        { value: 'hpp_po', label: 'HPP PO — potong sesuai HPP bahan baku PO' },
      ],
    },
  ];

  return (
    <PageWrapper
      title="Alasan Reject"
      subtitle="Master data alasan reject produksi dan aturan potongan gaji"
      action={
        <Button
          variant="primary"
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
        >
          + Tambah Alasan
        </Button>
      }
    >
      <div className={styles.container}>
        <Panel title="Daftar Alasan Reject">
          <DataTable columns={columns} data={alasanReject} keyField="id" />
        </Panel>
      </div>

      <MasterFormModal
        title={editingItem ? 'Edit Alasan Reject' : 'Tambah Alasan Reject'}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        fields={fields}
        initialValues={
          editingItem
            ? { ...editingItem, bisaDiperbaiki: String(editingItem.bisaDiperbaiki) }
            : {}
        }
        onSubmit={handleSubmit}
      />
    </PageWrapper>
  );
}
