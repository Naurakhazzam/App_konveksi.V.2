'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { usePayrollStore } from '@/stores/usePayrollStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { formatRupiah, formatDate } from '@/lib/utils/formatters';
import { KasbonEntry } from '@/types';
import ModalTambahKasbon from './ModalTambahKasbon';
import styles from './KasbonView.module.css';

export default function KasbonView() {
  const { kasbon, addKasbon } = usePayrollStore();
  const { karyawan } = useMasterStore();
  const [showModal, setShowModal] = useState(false);

  const columns: Column<KasbonEntry>[] = [
    { key: 'tanggal', header: 'Tanggal', render: (v) => formatDate(v) },
    { 
      key: 'karyawanId', 
      header: 'Karyawan', 
      render: (v) => karyawan.find(k => k.id === v)?.nama || v 
    },
    { 
      key: 'jumlah', 
      header: 'Jumlah', 
      render: (v) => <span className={v > 0 ? styles.amount : styles.repayment}>{formatRupiah(v)}</span> 
    },
    { key: 'keterangan', header: 'Keterangan' },
    { 
      key: 'status', 
      header: 'Status', 
      render: (v) => (
        <Badge variant={v === 'lunas' ? 'success' : 'warning'}>
          {v === 'lunas' ? 'LUNAS' : 'AKTIF'}
        </Badge>
      ) 
    }
  ];

  const totalOutstanding = kasbon
    .filter(k => k.status === 'belum_lunas')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  return (
    <PageWrapper 
      title="Manajemen Kasbon" 
      subtitle="Pencatatan Pinjaman Karyawan"
      action={
        <Button variant="primary" onClick={() => setShowModal(true)}>
          ➕ Tambah Pinjaman Baru
        </Button>
      }
    >
      <div className={styles.container}>
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <span>Total Outstanding Kasbon</span>
            <strong>{formatRupiah(totalOutstanding)}</strong>
          </div>
        </div>

        <Panel title="Daftar Kasbon Aktif & Riwayat">
          <DataTable columns={columns} data={[...kasbon].reverse()} keyField="id" />
        </Panel>
      </div>

      {showModal && (
        <ModalTambahKasbon 
          onClose={() => setShowModal(false)}
          onConfirm={(data) => {
            addKasbon(data);
            setShowModal(false);
          }}
        />
      )}
    </PageWrapper>
  );
}
