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
import AuthGateModal from '@/components/organisms/AuthGateModal/AuthGateModal';
import { useKoreksiStore } from '@/stores/useKoreksiStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatRupiah, getPayrollCycleRange } from '@/lib/utils/formatters';
import styles from './RekapGajiView.module.css';
import { useToast } from '@/components/molecules/Toast';

export default function RekapGajiView() {
  const { karyawan } = useMasterStore();
  const { calculateUpah, ledger, kasbon } = usePayrollStore();
  const { entries } = useJurnalStore();
  const { addActionApproval } = useKoreksiStore();
  const { canEdit: checkEdit, currentUser } = useAuthStore();
  const { info } = useToast();
  const router = useRouter();

  const [dateRange, setDateRange] = useState(getPayrollCycleRange());
  const [selectedKaryawan, setSelectedKaryawan] = useState<any | null>(null);
  const [authGate, setAuthGate] = useState<{ isOpen: boolean; type: 'pay' | 'recap'; payload?: any }>({
    isOpen: false,
    type: 'pay'
  });

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
        gajiPokok: calc.gajiPokok || 0, // NEW field
        sisaKasbon: calc.kasbonSisa,
        entryIds: calc.entries.map(e => e.id),
        isLunas: calc.entries.length > 0 && calc.entries.every(e => e.status === 'lunas')
      };
    });
  }, [karyawan, calculateUpah, dateRange, ledger, kasbon]);

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
      <KpiCard label="Total Upah Periode" value={stats.totalUpah} accent="blue" format="rupiah" sequenceIndex={0} />
      <KpiCard label="Sudah Dibayar" value={stats.totalSudah} accent="green" format="rupiah" sequenceIndex={1} />
      <KpiCard label="Belum Dibayar" value={stats.totalBelum} accent="yellow" format="rupiah" sequenceIndex={2} />
      <KpiCard label="Outstanding Kasbon" value={stats.sisaKasbon} accent="red" format="rupiah" sequenceIndex={3} />
    </div>
  );

  const isAlreadyRekap = useMemo(() => {
    const periodStr = `${dateRange.start} - ${dateRange.end}`;
    return entries.some(e => e.jenis === 'direct_upah' && e.keterangan.includes(periodStr));
  }, [entries, dateRange]);

  const handleRekapJurnal = () => {
    setAuthGate({
      isOpen: true,
      type: 'recap',
      payload: {
        totalUpah: stats.totalUpah,
        dateRange
      }
    });
  };

  const onAuthSuccess = () => {
    setAuthGate(prev => ({ ...prev, isOpen: false }));

    if (authGate.type === 'recap') {
      addActionApproval({
        type: 'recap_journal',
        label: `Rekap Jurnal Gaji: ${authGate.payload.dateRange.start} s/d ${authGate.payload.dateRange.end}`,
        payload: authGate.payload,
        requestedBy: currentUser?.nama || 'Unknown'
      });
      info('Permintaan Dikirim', 'Rekapitulasi Jurnal Gaji telah diajukan untuk disetujui Owner.');
    } else if (authGate.type === 'pay') {
      const { r, id, entryIds, potong, hariKerja } = authGate.payload;
      addActionApproval({
        type: 'pay_salary',
        label: `Bayar Gaji: ${r.nama}`,
        payload: { karyawanId: id, entryIds, inputKasbon: potong, hariKerja },
        requestedBy: currentUser?.nama || 'Unknown'
      });
      info('Permintaan Dikirim', `Pembayaran gaji untuk ${r.nama} telah diajukan untuk disetujui Owner.`);
    }
  };

  const allowEdit = checkEdit('/dashboard/penggajian'); // Using current path context

  const handleResetToCycle = () => {
    setDateRange(getPayrollCycleRange());
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
            <Button variant="ghost" size="sm" onClick={handleResetToCycle} title="Reset ke siklus Sab-Jum pekan ini">
              🔄 Pekan Ini
            </Button>
          </div>

          <Button 
            variant="primary" 
            onClick={handleRekapJurnal}
            disabled={isAlreadyRekap || stats.totalUpah === 0 || !allowEdit}
          >
            {isAlreadyRekap ? '✓ Sudah Direkap ke Jurnal' : '📋 Rekap ke Jurnal Umum'}
          </Button>
        </div>

        <Panel title="Daftar Rekapitulasi Gaji" sequenceIndex={4}>
          <RekapGajiTable 
            data={rekapData} 
            onBayar={(r) => {
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
          onConfirm={(id, entryIds, potong, hariKerja) => {
            setAuthGate({
              isOpen: true,
              type: 'pay',
              payload: { r: selectedKaryawan, id, entryIds, potong, hariKerja }
            });
            setSelectedKaryawan(null);
          }}
        />
      )}

      <AuthGateModal
        isOpen={authGate.isOpen}
        onClose={() => setAuthGate(prev => ({ ...prev, isOpen: false }))}
        type="password"
        onSuccess={onAuthSuccess}
        title={authGate.type === 'pay' ? 'Otorisasi Pembayaran' : 'Otorisasi Rekap Jurnal'}
        message={`Masukkan password Anda untuk melanjutkan ${authGate.type === 'pay' ? 'pembayaran gaji' : 'rekapitulasi jurnal'}.`}
      />
    </PageWrapper>
  );
}
