'use client';

import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import DataTable, { Column } from '@/components/organisms/DataTable';
import { useJurnalStore } from '@/stores/useJurnalStore';
import { useMasterStore } from '@/stores/useMasterStore';
import { usePOStore } from '@/stores/usePOStore';
import { JurnalEntry } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils/formatters';
import ModalTambahJurnal from './ModalTambahJurnal';
import styles from './JurnalUmumView.module.css';

export default function JurnalUmumView() {
  const { entries, addEntry } = useJurnalStore();
  const { kategoriTrx } = useMasterStore();
  const { poList } = usePOStore();
  
  const [showModal, setShowModal] = useState(false);
  
  // Filters State
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [filterJenis, setFilterJenis] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Derived & Filtered Data
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchJenis = filterJenis === 'all' || e.jenis === filterJenis;
      const matchDateStart = !dateStart || new Date(e.tanggal) >= new Date(dateStart);
      const matchDateEnd = !dateEnd || new Date(e.tanggal) <= new Date(dateEnd);
      const matchSearch = !searchQuery || e.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) || e.noFaktur?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchJenis && matchDateStart && matchDateEnd && matchSearch;
    });
  }, [entries, filterJenis, dateStart, dateEnd, searchQuery]);

  // Totals for filtered data
  const stats = useMemo(() => {
    const masuk = filteredEntries.filter(e => e.jenis === 'masuk').reduce((a, c) => a + c.nominal, 0);
    const keluar = filteredEntries.filter(e => e.jenis !== 'masuk').reduce((a, c) => a + c.nominal, 0);
    return { masuk, keluar, saldo: masuk - keluar };
  }, [filteredEntries]);

  const handleReset = () => {
    setDateStart('');
    setDateEnd('');
    setFilterJenis('all');
    setSearchQuery('');
  };

  const kpiRow = (
    <div className={styles.kpiRow}>
      <KpiCard label="Saldo Periode" value={stats.saldo} accent={stats.saldo >= 0 ? 'blue' : 'red'} format="rupiah" />
      <KpiCard label="Total Masuk" value={stats.masuk} accent="green" format="rupiah" />
      <KpiCard label="Total Keluar" value={stats.keluar} accent="red" format="rupiah" />
    </div>
  );

  const columns: Column<JurnalEntry>[] = [
    { key: 'tanggal', header: 'Tanggal', render: (v) => formatDate(v) },
    { key: 'noFaktur', header: 'No. Faktur', render: (v) => v || <span className={styles.muted}>—</span> },
    { 
      key: 'kategoriTrxId', 
      header: 'Kategori', 
      render: (v) => kategoriTrx.find(k => k.id === v)?.nama || v
    },
    { 
      key: 'jenis', 
      header: 'Jenis', 
      render: (v) => {
        const variants: Record<string, any> = {
          direct_bahan: 'purple',
          direct_upah: 'info',
          overhead: 'warning',
          masuk: 'success'
        };
        return <Badge variant={variants[v] || 'neutral'}>{v.toUpperCase().replace('_', ' ')}</Badge>;
      }
    },
    { key: 'keterangan', header: 'Keterangan' },
    { 
      key: 'poId', 
      header: 'Tag PO', 
      render: (_, row) => {
        if (row.tagPOs?.length) return (
          <div className={styles.tagWrapper}>
            {row.tagPOs.map(id => (
              <Badge key={id} variant="neutral" size="sm">
                {poList.find(p => p.id === id)?.nomorPO || id}
              </Badge>
            ))}
          </div>
        );
        if (row.poId) return <Badge variant="neutral">{poList.find(p => p.id === row.poId)?.nomorPO || row.poId}</Badge>;
        return <span className={styles.muted}>Umum</span>;
      }
    },
    { 
      key: 'nominal', 
      header: 'Nominal', 
      render: (v, row) => (
        <span className={row.jenis === 'masuk' ? styles.plus : styles.minus}>
          {row.jenis === 'masuk' ? '+' : '-'}{formatRupiah(v)}
        </span>
      )
    }
  ];

  return (
    <PageWrapper 
      title="Jurnal Umum" 
      subtitle="Pencatatan keuangan detail & integrasi sistem"
      kpiRow={kpiRow}
      action={
        <Button variant="primary" onClick={() => setShowModal(true)}>
          ➕ Tambah Transaksi
        </Button>
      }
    >
      <div className={styles.mainContainer}>
        <Panel title="Filter & Pencarian">
          <div className={styles.filterGrid}>
            <div className={styles.filterField}>
              <label>Mulai Tanggal</label>
              <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            </div>
            <div className={styles.filterField}>
              <label>Sampai Tanggal</label>
              <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
            </div>
            <div className={styles.filterField}>
              <label>Jenis Transaksi</label>
              <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}>
                <option value="all">Semua Jenis</option>
                <option value="direct_bahan">Bahan Baku</option>
                <option value="direct_upah">Upah</option>
                <option value="overhead">Overhead</option>
                <option value="masuk">Pemasukan</option>
              </select>
            </div>
            <div className={styles.filterField}>
              <label>Cari Keterangan/Faktur</label>
              <input 
                type="text" 
                placeholder="Kata kunci..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterActions}>
              <Button variant="ghost" size="sm" onClick={handleReset}>Reset</Button>
            </div>
          </div>
        </Panel>

        <Panel title="Daftar Transaksi">
          <DataTable columns={columns} data={[...filteredEntries].reverse()} keyField="id" />
          
          <div className={styles.footerSummary}>
            <div className={styles.sumRow}>
              <span>Total Pemasukan:</span>
              <strong className={styles.plus}>{formatRupiah(stats.masuk)}</strong>
            </div>
            <div className={styles.sumRow}>
              <span>Total Pengeluaran:</span>
              <strong className={styles.minus}>{formatRupiah(stats.keluar)}</strong>
            </div>
            <div className={`${styles.sumRow} ${styles.total}`}>
              <span>Saldo Periode Ini:</span>
              <strong className={stats.saldo >= 0 ? styles.plus : styles.minus}>
                {formatRupiah(stats.saldo)}
              </strong>
            </div>
          </div>
        </Panel>
      </div>

      {showModal && (
        <ModalTambahJurnal 
          onClose={() => setShowModal(false)}
          onConfirm={(data) => {
            addEntry(data);
            setShowModal(false);
          }}
        />
      )}
    </PageWrapper>
  );
}
