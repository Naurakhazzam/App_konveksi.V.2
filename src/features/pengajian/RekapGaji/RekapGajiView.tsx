'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import Button from '@/components/atoms/Button';
import { useMasterStore } from '@/stores/useMasterStore';
import { usePayrollStore } from '@/stores/usePayrollStore';
import { useJurnalStore } from '@/stores/useJurnalStore';
import RekapGajiTable from './RekapGajiTable';
import ModalBayar from './ModalBayar';
import styles from './RekapGajiView.module.css';

export default function RekapGajiView() {
  const { karyawan } = useMasterStore();
  const { calculateUpah, prosesBayar } = usePayrollStore();
  const { addEntry, entries } = useJurnalStore();
  const router = useRouter();

  const [dateRange, setDateRange] = useState({ 
    start: '2026-04-01', 
    end: '2026-04-07' 
  });
  
  const [selectedKaryawan, setSelectedKaryawan] = useState<any | null>(null);

  const rekapData = useMemo(() => {
    return karyawan.map(k => {
      const calc = calculateUpah(k.id, dateRange.start, dateRange.end);
      return {
        id: k.id,
        nama: k.nama,
        upahKotor: calc.upah,
        potongan: calc.potongan,
        rework: calc.rework,
        upahBersih: calc.upahBersih,
        sisaKasbon: calc.kasbonSisa,
        entryIds: calc.entries.map(e => e.id),
        isLunas: calc.entries.length > 0 && calc.entries.every(e => e.status === 'lunas')
      };
    });
  }, [karyawan, calculateUpah, dateRange]);

  const stats = useMemo(() => {
    let totalUpah = 0;
    let sisaKasbon = 0;
    let totalSudah = 0;
    let totalBelum = 0;

    rekapData.forEach(r => {
      totalUpah += r.upahBersih;
      sisaKasbon += r.sisaKasbon;
      if (r.isLunas) totalSudah += r.upahBersih;
      else totalBelum += r.upahBersih;
    });

    return { totalUpah, sisaKasbon, totalSudah, totalBelum };
  }, [rekapData]);

  const kpiRow = (
    <div className={styles.kpiRow}>
      <KpiCard label="Total Upah Periode" value={stats.totalUpah} accent="blue" format="rupiah" />
      <KpiCard label="Sudah Dibayar" value={stats.totalSudah} accent="green" format="rupiah" />
      <KpiCard label="Belum Dibayar" value={stats.totalBelum} accent="yellow" format="rupiah" />
      <KpiCard label="Outstanding Kasbon" value={stats.sisaKasbon} accent="red" format="rupiah" />
    </div>
  );

  const isAlreadyRekap = useMemo(() => {
    const periodStr = `${dateRange.start} - ${dateRange.end}`;
    return entries.some(e => e.jenis === 'direct_upah' && e.keterangan.includes(periodStr));
  }, [entries, dateRange]);

    if (stats.totalBelum > 0) {
      if (!confirm(`Terdapat ${formatRupiah(stats.totalBelum)} gaji belum dibayar. Tetap rekap total biaya (${formatRupiah(stats.totalUpah)}) ke Jurnal Umum?`)) return;
    } else {
      if (!confirm('Rekap seluruh upah periode ini ke Jurnal Umum?')) return;
    }

    addEntry({
      id: `JRN-UPAH-${Date.now()}`,
      kategoriTrxId: 'KTR-002',
      jenis: 'direct_upah',
      nominal: stats.totalUpah,
      keterangan: `Upah periode ${dateRange.start} - ${dateRange.end}`,
      tanggal: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <PageWrapper 
      title="Rekap Gaji" 
      subtitle="Perhitungan dan Pembayaran Gaji Karyawan"
      kpiRow={kpiRow}
    >
      <div className={styles.container}>
        <div className={styles.controls}>
          <div className={styles.dateFilter}>
            <label>Periode:</label>
            <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
            <span>sd</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
          </div>

          <Button 
            variant="primary" 
            onClick={handleRekapJurnal}
            disabled={isAlreadyRekap || stats.totalUpah === 0}
          >
            {isAlreadyRekap ? '✓ Sudah Direkap ke Jurnal' : '📋 Rekap ke Jurnal Umum'}
          </Button>
        </div>

        <Panel title="Daftar Rekapitulasi Gaji">
          <RekapGajiTable 
            data={rekapData} 
            onBayar={(r) => {
              console.log('Bayar clicked for:', r.nama);
              setSelectedKaryawan(r);
            }}
            onViewSlip={(id) => {
              router.push(`/penggajian/slip-gaji?id=${id}`);
            }}
          />
        </Panel>
      </div>

      {selectedKaryawan && (
        <ModalBayar 
          rekap={selectedKaryawan}
          onClose={() => setSelectedKaryawan(null)}
          onConfirm={(id, entryIds, potong) => {
            prosesBayar(id, entryIds, potong);
            setSelectedKaryawan(null);
          }}
        />
      )}
    </PageWrapper>
  );
}
