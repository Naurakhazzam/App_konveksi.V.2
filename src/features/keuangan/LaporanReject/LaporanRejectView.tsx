'use client';

import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import { useKoreksiStore } from '@/stores/useKoreksiStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { TAHAP_ORDER, TAHAP_LABEL, TahapKey } from '@/lib/utils/production-helpers';
import { formatRupiah, formatDate } from '@/lib/utils/formatters';
import Badge from '@/components/atoms/Badge';
import { Heading, Label } from '@/components/atoms/Typography';
import Button from '@/components/atoms/Button';
import styles from './LaporanRejectView.module.css';

export default function LaporanRejectView() {
  const { koreksiList } = useKoreksiStore();
  const { karyawan, alasanReject } = useMasterStore();

  const [filterTahap, setFilterTahap] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 1. Filtering Logic
  const filteredData = useMemo(() => {
    return koreksiList.filter(k => {
      const matchTahap = filterTahap === 'all' || k.tahapBertanggungJawab === filterTahap;
      
      let matchDate = true;
      if (dateFrom || dateTo) {
        const d = new Date(k.waktuLapor).getTime();
        if (dateFrom && d < new Date(dateFrom).getTime()) matchDate = false;
        if (dateTo && d > new Date(dateTo).getTime() + 86400000) matchDate = false;
      }

      return matchTahap && matchDate;
    });
  }, [koreksiList, filterTahap, dateFrom, dateTo]);

  // 2. KPI Calculations
  const stats = useMemo(() => {
    const reject = filteredData.filter(k => k.jenisKoreksi === 'reject');
    const hilang = filteredData.filter(k => k.jenisKoreksi === 'hilang' || k.jenisKoreksi === 'salah_hitung');
    const lebih = filteredData.filter(k => k.jenisKoreksi === 'lebih' && k.statusApproval === 'approved');

    const totalPotongan = filteredData.reduce((sum, k) => 
      k.jenisKoreksi !== 'lebih' && k.statusPotongan !== 'cancelled' ? sum + k.nominalPotongan : sum, 0
    );

    const totalTambahan = lebih.reduce((sum, k) => sum + (k.nominalPotongan || 0), 0);
    
    return {
      total: filteredData.length,
      rejectCount: reject.length,
      rejectRepaired: reject.filter(k => k.statusPotongan === 'cancelled').length,
      hilangCount: hilang.length,
      lebihCount: lebih.length,
      totalPotongan,
      totalTambahan,
      nettLoss: totalPotongan - totalTambahan
    };
  }, [filteredData]);

  const columns: Column<typeof filteredData[0]>[] = [
    { key: 'waktuLapor', header: 'Tanggal', render: (v) => <span className={styles.dateCell}>{formatDate(v)}</span> },
    { key: 'poId', header: 'No. PO', render: (v) => <strong>{v}</strong> },
    { key: 'barcode', header: 'Barcode', render: (v) => <code className={styles.barcode}>{v.split('-').pop()}</code> },
    { 
      key: 'jenisKoreksi', 
      header: 'Jenis', 
      render: (v) => {
        if (v === 'reject') return <Badge variant="danger">REJECT</Badge>;
        if (v === 'lebih') return <Badge variant="success">LEBIH</Badge>;
        return <Badge variant="warning">{v.toUpperCase().replace('_', ' ')}</Badge>;
      } 
    },
    { 
      key: 'alasanRejectId', 
      header: 'Alasan', 
      render: (v, row) => {
        if (row.jenisKoreksi === 'lebih') return row.alasanLebihText || row.alasanLebih || '—';
        if (row.jenisKoreksi === 'reject') {
          const reason = alasanReject.find(a => a.id === v);
          return reason?.nama || '—';
        }
        return '—';
      }
    },
    { key: 'qtyKoreksi', header: 'QTY', render: (v) => <strong>{v} pcs</strong> },
    { 
      key: 'karyawanBertanggungJawab', 
      header: 'Penanggung Jawab', 
      render: (v) => {
        const k = karyawan.find(emp => emp.id === v);
        return k ? k.nama : <span style={{ opacity: 0.5 }}>—</span>;
      }
    },
    { 
      key: 'nominalPotongan', 
      header: 'Potongan', 
      render: (v, row) => {
        if (row.statusPotongan === 'cancelled') return <span className={styles.cancelledText} title="Dibatalkan (Sudah diperbaiki)">{formatRupiah(v)}</span>;
        if (row.jenisKoreksi === 'lebih') return <span className={styles.greenText}>+{formatRupiah(v)}</span>;
        return <span className={styles.redText}>-{formatRupiah(v)}</span>;
      }
    },
    { 
      key: 'statusPotongan', 
      header: 'Status', 
      render: (v, row) => {
        if (v === 'cancelled') return <Badge variant="success">REPAIRED</Badge>;
        if (row.jenisKoreksi === 'lebih') {
          return row.statusApproval === 'approved' ? <Badge variant="success">APPROVED</Badge> : <Badge variant="warning">PENDING</Badge>;
        }
        return <Badge variant="warning">PENDING</Badge>;
      }
    }
  ];

  return (
    <PageWrapper 
      title="Laporan Koreksi QTY & Kerugian" 
      subtitle="Rekapitulasi reject, kehilangan, dan surplus produksi per tahap"
    >
      <div className={styles.container}>
        {/* Filter Toolbar */}
        <div className={`${styles.toolbar} ${styles.noPrint}`}>
          <div className={styles.filterGroup}>
            <div className={styles.field}>
              <Label>Tahap Bertanggung Jawab</Label>
              <select className={styles.select} value={filterTahap} onChange={e => setFilterTahap(e.target.value)}>
                <option value="all">Semua Tahap</option>
                {TAHAP_ORDER.map(t => <option key={t} value={t}>{TAHAP_LABEL[t]}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <Label>Mulai Tanggal</Label>
              <input type="date" className={styles.input} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className={styles.field}>
              <Label>Sampai Tanggal</Label>
              <input type="date" className={styles.input} value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <Button variant="ghost" onClick={() => window.print()}>🖨️ Print Laporan</Button>
        </div>

        {/* Dashboard Cards */}
        <div className={styles.dashboard}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard} data-type="total">
              <span className={styles.statLabel}>Total Kejadian</span>
              <strong className={styles.statValue}>{stats.total}</strong>
              <div className={styles.statSub}>Kejadian koreksi QTY</div>
            </div>
            <div className={styles.statCard} data-type="reject">
              <span className={styles.statLabel}>Reject Produksi</span>
              <strong className={styles.statValue}>{stats.rejectCount}</strong>
              <div className={styles.statSub}>{stats.rejectRepaired} pcs diperbaiki (OK)</div>
            </div>
            <div className={styles.statCard} data-type="loss">
              <span className={styles.statLabel}>Hilang / Selisih</span>
              <strong className={styles.statValue}>{stats.hilangCount}</strong>
              <div className={styles.statSub}>Tidak dapat diperbaiki</div>
            </div>
            <div className={styles.statCard} data-type="surplus">
              <span className={styles.statLabel}>Total Surplus</span>
              <strong className={styles.statValue}>{stats.lebihCount}</strong>
              <div className={styles.statSub}>QTY Lebih (Approved)</div>
            </div>
          </div>

          <div className={styles.financialSummary}>
            <div className={styles.finCol}>
              <Label color="sub">Total Potongan Gaji</Label>
              <strong className={styles.redValue}>{formatRupiah(stats.totalPotongan)}</strong>
            </div>
            <div className={styles.finDivider} />
            <div className={styles.finCol}>
              <Label color="sub">Total Tambahan Bayar</Label>
              <strong className={styles.greenValue}>{formatRupiah(stats.totalTambahan)}</strong>
            </div>
            <div className={styles.finDivider} />
            <div className={styles.finCol} data-highlight="true">
              <Label color="sub">Nett Kerugian Produksi</Label>
              <strong className={styles.nettValue}>{formatRupiah(stats.nettLoss)}</strong>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <Panel title={`Detail Transaksi Koreksi (${filterTahap === 'all' ? 'Semua Tahap' : TAHAP_LABEL[filterTahap as TahapKey]})`}>
          <div className={styles.tableWrapper}>
            <DataTable 
              columns={columns} 
              data={[...filteredData].reverse()} 
              keyField="id" 
            />
          </div>
        </Panel>

        {/* Print Footer */}
        <div className={styles.printOnly}>
          <div className={styles.printFooter}>
            <div className={styles.printSig}>
              <span>Dibuat Oleh,</span>
              <div className={styles.sigLine} />
              <span>Admin Produksi</span>
            </div>
            <div className={styles.printSig}>
              <span>Diketahui Oleh,</span>
              <div className={styles.sigLine} />
              <span>Owner / Manager</span>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
