'use client';

import React, { useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import { usePayrollStore } from '@/stores/usePayrollStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { formatRupiah, formatDate } from '@/lib/utils/formatters';
import styles from './LaporanGajiView.module.css';

interface SalaryReportItem {
  id: string;
  karyawanId: string;
  nama: string;
  jabatan: string;
  tanggalBayar: string;
  upahKotor: number;
  potongan: number;
  totalBersih: number;
}

export default function LaporanGajiView() {
  const { ledger } = usePayrollStore();
  const { karyawan } = useMasterStore();

  const paidHistory = useMemo(() => {
    // Filter only paid entries
    const paidEntries = ledger.filter(l => l.status === 'lunas' && l.tanggalBayar);
    
    // Group by (karyawanId + tanggalBayar)
    const groups: Record<string, SalaryReportItem> = {};
    
    paidEntries.forEach(entry => {
      const key = `${entry.karyawanId}-${entry.tanggalBayar}`;
      const k = karyawan.find(emp => emp.id === entry.karyawanId);
      
      if (!groups[key]) {
        groups[key] = {
          id: key,
          karyawanId: entry.karyawanId,
          nama: k?.nama || 'Unknown',
          jabatan: k?.jabatan || 'Unknown',
          tanggalBayar: entry.tanggalBayar!,
          upahKotor: 0,
          potongan: 0,
          totalBersih: 0
        };
      }
      
      if (entry.tipe === 'selesai' || entry.tipe === 'rework') {
        groups[key].upahKotor += entry.total;
      } else if (entry.tipe === 'reject_potong') {
        groups[key].potongan += Math.abs(entry.total);
      }
    });

    return Object.values(groups).map(g => ({
      ...g,
      totalBersih: g.upahKotor - g.potongan
    })).sort((a,b) => new Date(b.tanggalBayar).getTime() - new Date(a.tanggalBayar).getTime());
  }, [ledger, karyawan]);

  const totalPaid = paidHistory.reduce((a, c) => a + c.totalBersih, 0);

  const columns: Column<SalaryReportItem>[] = [
    { key: 'tanggalBayar', header: 'Tgl Bayar', render: (v) => formatDate(v) },
    { 
      key: 'nama', 
      header: 'Karyawan', 
      render: (v, r) => (
        <div className={styles.empCol}>
          <strong>{v}</strong>
          <span>{r.jabatan}</span>
        </div>
      ) 
    },
    { key: 'upahKotor', header: 'Upah Kotor', render: (v) => formatRupiah(v) },
    { key: 'potongan', header: 'Potongan', render: (v) => <span className={styles.minus}>-{formatRupiah(v)}</span> },
    { 
      key: 'totalBersih', 
      header: 'Total Dibayar', 
      render: (v) => <strong className={styles.amount}>{formatRupiah(v)}</strong> 
    },
    { 
      key: 'karyawanId', 
      header: 'Status', 
      render: () => <Badge variant="success">LUNAS</Badge> 
    }
  ];

  return (
    <PageWrapper 
      title="Histori Pembayaran Gaji" 
      subtitle="Rekapitulasi pengeluaran upah yang telah dibayarkan"
    >
      <div className={styles.container}>
        <div className={styles.summaryCard}>
          <div className={styles.sumInfo}>
            <span>Total Akumulasi Gaji Terbayar</span>
            <strong>{formatRupiah(totalPaid)}</strong>
          </div>
          <div className={styles.sumBadge}>
            Verified by Finance
          </div>
        </div>

        <Panel title="Daftar Histori Penggajian">
          <DataTable columns={columns} data={paidHistory} keyField="id" />
        </Panel>
      </div>
    </PageWrapper>
  );
}
