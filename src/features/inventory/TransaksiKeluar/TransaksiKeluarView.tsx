'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import Button from '@/components/atoms/Button';
import DataTable, { Column } from '@/components/organisms/DataTable';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { TransaksiKeluar } from '@/types';
import { formatDate } from '@/lib/utils/formatters';
import ModalTransaksiKeluar from './ModalTransaksiKeluar';
import styles from './TransaksiKeluarView.module.css';

export default function TransaksiKeluarView() {
  const { trxKeluar, items, addTrxKeluar } = useInventoryStore();
  const [showModal, setShowModal] = useState(false);

  const columns: Column<TransaksiKeluar>[] = [
    { key: 'tanggal', header: 'Tanggal', render: (v) => formatDate(v) },
    { 
      key: 'itemId', 
      header: 'Nama Barang', 
      render: (v) => items.find(i => i.id === v)?.nama || v 
    },
    { 
      key: 'qty', 
      header: 'QTY Keluar', 
      render: (v, row) => (
        <span className={styles.qty}>
          {v} {items.find(i => i.id === row.itemId)?.satuanId || ''}
        </span>
      )
    },
    { 
      key: 'referensiPO', 
      header: 'Referensi PO', 
      render: (v) => v ? <code className={styles.po}>{v}</code> : 'Umum' 
    },
    { key: 'keterangan', header: 'Keterangan' }
  ];

  return (
    <PageWrapper 
      title="Transaksi Keluar — Pemakaian Bahan" 
      subtitle="Riwayat pengeluaran stok untuk produksi"
      action={
        <Button variant="primary" onClick={() => setShowModal(true)}>
          ➕ Catat Pemakaian Baru
        </Button>
      }
    >
      <div className={styles.container}>
        <Panel title="Riwayat Transaksi Keluar">
          <DataTable columns={columns} data={[...trxKeluar].reverse()} keyField="id" />
        </Panel>
      </div>

      {showModal && (
        <ModalTransaksiKeluar 
          onClose={() => setShowModal(false)}
          onConfirm={(data) => {
            addTrxKeluar(data);
            setShowModal(false);
          }}
        />
      )}
    </PageWrapper>
  );
}
