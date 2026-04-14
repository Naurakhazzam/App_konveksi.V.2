'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { Label, Heading } from '@/components/atoms/Typography';
import { useReturnStore } from '@/stores/useReturnStore';
import { usePayrollStore } from '@/stores/usePayrollStore';
import { useMasterStore } from '@/stores/useMasterStore';
import styles from './Retur.module.css';

export default function PengirimanReturView() {
  const { karyawan } = useMasterStore();
  const { getReturnByBarcode, updateReturnStatus } = useReturnStore();
  const { activateEscrowByBarcode } = usePayrollStore();

  const [search, setSearch] = useState('');
  const [foundReturn, setFoundReturn] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const ret = getReturnByBarcode(search);
    if (ret && ret.status === 'siap_kirim') {
      setFoundReturn(ret);
    } else {
      alert('Barcode tidak ditemukan atau barang belum selesai diperbaiki.');
    }
  };

  const handleShip = () => {
    const now = new Date().toISOString();

    // 1. ACTIVATE payroll (release escrow)
    activateEscrowByBarcode(foundReturn.barcode);

    // 2. Mark Return as Completed
    updateReturnStatus(foundReturn.id, 'selesai', {
      waktuDikirim: now
    });

    alert('Barang retur dikirim! Hak upah/restitusi telah diaktifkan di saldo karyawan.');
    setFoundReturn(null);
    setSearch('');
  };

  return (
    <PageWrapper title="Pengiriman Retur (Klaim Upah)" subtitle="Titik akhir perbaikan. Scan di sini untuk mengaktifkan upah/restitusi karyawan.">
      <div className={styles.container}>
        <Panel title="Scan Barcode Siap Kirim">
          <form onSubmit={handleSearch} className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="Scan barcode perbaikan selesai..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <Button variant="primary" type="submit">Cari</Button>
          </form>
        </Panel>

        {foundReturn && (
          <div className={styles.resultGrid}>
            <Panel title="Konfirmasi Pengiriman">
              <div className={styles.infoList}>
                <div className={styles.infoRow}><Label>Barcode</Label><strong>{foundReturn.barcode}</strong></div>
                <div className={styles.infoRow}>
                  <Label>Hak Upah Milik</Label>
                  <Badge variant="success">
                    {karyawan.find(k => k.id === foundReturn.karyawanPerbaikan)?.nama || foundReturn.karyawanPerbaikan}
                  </Badge>
                </div>
                <div className={styles.infoRow}>
                  <Label>Tipe Klaim</Label>
                  <strong>{foundReturn.isSelfRepair ? 'Restitusi (Kembali Saldo)' : 'Upah Rework (Baru)'}</strong>
                </div>
              </div>

              <div className={styles.alertAction}>
                <p>Klik konfirmasi untuk mencairkan upah ke payroll dan menyelesaikan siklus retur.</p>
                <Button variant="primary" fullWidth onClick={handleShip}>
                  Konfirmasi Pengiriman & Cairkan Upah
                </Button>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
