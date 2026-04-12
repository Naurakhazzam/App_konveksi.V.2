'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { Label } from '@/components/atoms/Typography';
import DataTable, { Column } from '@/components/organisms/DataTable';
import { useMasterStore } from '@/stores/useMasterStore';
import { usePayrollStore } from '@/stores/usePayrollStore';
import { formatRupiah, formatDate } from '@/lib/utils/formatters';
import styles from './SlipGajiView.module.css';

interface PaidEmployeeRekap {
  id: string;
  nama: string;
  upahBersih: number;
  isPrinted: boolean;
  entryIds: string[];
}

function SlipGajiContent() {
  const { karyawan } = useMasterStore();
  const { calculateUpah, ledger, setSlipPrinted } = usePayrollStore();
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id');

  const [dateRange, setDateRange] = useState({ 
    start: '2026-04-01', 
    end: '2026-04-07' 
  });
  
  const [selectedKaryawanId, setSelectedKaryawanId] = useState('');

  // 1. Dapatkan daftar karyawan yang SUDAH DIBAYAR (Lunas) di periode ini
  const paidEmployees = useMemo(() => {
    return karyawan.map(k => {
      const calc = calculateUpah(k.id, dateRange.start, dateRange.end);
      // Filter hanya yang punya entri lunas di periode ini
      const lunasEntries = calc.entries.filter(e => e.status === 'lunas');
      
      if (lunasEntries.length === 0) return null;

      return {
        id: k.id,
        nama: k.nama,
        upahBersih: lunasEntries.reduce((acc, curr) => {
          if (curr.tipe === 'selesai') return acc + curr.total;
          if (curr.tipe === 'reject_potong') return acc - Math.abs(curr.total);
          if (curr.tipe === 'rework') return acc + curr.total;
          return acc;
        }, 0),
        isPrinted: lunasEntries.every(e => e.isPrinted),
        entryIds: lunasEntries.map(e => e.id)
      };
    }).filter(Boolean) as PaidEmployeeRekap[];
  }, [karyawan, calculateUpah, dateRange, ledger]);

  useEffect(() => {
    if (idFromUrl) {
      setSelectedKaryawanId(idFromUrl);
    }
  }, [idFromUrl]);

  const slipData = useMemo(() => {
    if (!selectedKaryawanId) return null;
    return calculateUpah(selectedKaryawanId, dateRange.start, dateRange.end);
  }, [selectedKaryawanId, dateRange, calculateUpah]);

  const infoKaryawan = karyawan.find(k => k.id === selectedKaryawanId);

  const handlePrint = () => {
    if (!slipData) return;
    
    // Mark as printed in store
    const lunasEntryIds = slipData.entries.filter(e => e.status === 'lunas').map(e => e.id);
    setSlipPrinted(lunasEntryIds);
    
    // Trigger browser print
    window.print();
  };

  const columns: Column<PaidEmployeeRekap>[] = [
    { key: 'nama', header: 'Nama Karyawan', render: (v) => <strong>{v}</strong> },
    { 
      key: 'upahBersih', 
      header: 'Total Diterima', 
      render: (v) => <span className={styles.money}>{formatRupiah(v)}</span> 
    },
    { 
      key: 'isPrinted', 
      header: 'Status Slip', 
      render: (v) => (
        <Badge variant={v ? 'success' : 'warning'}>
          {v ? '✓ Sudah Cetak' : '⚠ Belum Cetak'}
        </Badge>
      ) 
    },
    {
      key: 'id',
      header: 'Aksi',
      render: (v) => (
        <Button 
          variant={selectedKaryawanId === v ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setSelectedKaryawanId(v)}
        >
          📄 {selectedKaryawanId === v ? 'Sedang Dilihat' : 'Lihat Slip'}
        </Button>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <Panel title="Filter Periode Pembayaran">
        <div className={styles.selector}>
          <div className={styles.field}>
            <Label>Mulai</Label>
            <input type="date" className={styles.input} value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
          </div>
          <div className={styles.field}>
            <Label>Sampai</Label>
            <input type="date" className={styles.input} value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
          </div>
        </div>
      </Panel>

      <div className={styles.mainGrid}>
        <div className={styles.listSection}>
          <Panel title="Daftar Pembayaran Selesai">
            <DataTable 
              columns={columns} 
              data={paidEmployees} 
              keyField="id" 
              emptyMessage="Tidak ada data pembayaran sesuai periode ini."
            />
          </Panel>
        </div>

        <div className={styles.previewSection}>
          {slipData && infoKaryawan ? (
            <div className={styles.slipWrapper}>
              <div className={styles.slipCard} id="print-area">
                <div className={styles.slipHeader}>
                  <div className={styles.companyInfo}>
                    <h3>STITCHLYX.SYNCORE</h3>
                    <p>Garment Manufacturing Precision</p>
                  </div>
                  <div className={styles.slipTitle}>
                    <h2>SLIP GAJI</h2>
                    <p>Periode: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}</p>
                  </div>
                </div>

                <div className={styles.employeeInfo}>
                  <div className={styles.infoCol}>
                    <span>ID Karyawan:</span> <strong>{infoKaryawan.id}</strong>
                  </div>
                  <div className={styles.infoCol}>
                    <span>Nama:</span> <strong>{infoKaryawan.nama}</strong>
                  </div>
                  <div className={styles.infoCol}>
                    <span>Bagian/Role:</span> <strong>{infoKaryawan.jabatan}</strong>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.details}>
                  <h4>Rincian Penghasilan</h4>
                  <div className={styles.itemRow}>
                    <span>Upah Produksi (Kotor)</span>
                    <span>{formatRupiah(slipData.upah)}</span>
                  </div>
                  {slipData.rework > 0 && (
                    <div className={styles.itemRow}>
                      <span>Bonus Rework</span>
                      <span>{formatRupiah(slipData.rework)}</span>
                    </div>
                  )}
                  
                  <h4 className={styles.mt20}>Rincian Potongan</h4>
                  {slipData.potongan !== 0 && (
                    <div className={styles.itemRow}>
                      <span>Potongan Reject</span>
                      <span className={styles.red}>-{formatRupiah(Math.abs(slipData.potongan))}</span>
                    </div>
                  )}
                  {slipData.kasbonSisa > 0 && (
                    <div className={styles.itemRow}>
                      <span>Sisa Kasbon (Aktif)</span>
                      <span className={styles.orange}>{formatRupiah(slipData.kasbonSisa)}</span>
                    </div>
                  )}
                </div>

                <div className={styles.totalSection}>
                  <div className={styles.totalRow}>
                    <strong>TAKE HOME PAY</strong>
                    <strong className={styles.grandTotal}>{formatRupiah(slipData.upahBersih)}</strong>
                  </div>
                </div>

                <div className={styles.slipFooter}>
                  <div className={styles.sign}>
                    <p>Penerima,</p>
                    <div className={styles.signSpace} />
                    <p>( {infoKaryawan.nama} )</p>
                  </div>
                  <div className={styles.sign}>
                    <p>Hormat Kami,</p>
                    <div className={styles.signSpace} />
                    <p>( Bagian Keuangan )</p>
                  </div>
                </div>
              </div>
              
              <div className={styles.actions}>
                <Button variant="primary" onClick={handlePrint}>
                  🖨️ Cetak Slip Gaji
                </Button>
              </div>
            </div>
          ) : (
            <div className={styles.empty}>
              Silakan pilih karyawan dari daftar di samping untuk melihat pratinjau slip gaji.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SlipGajiView() {
  return (
    <PageWrapper 
      title="Slip Gaji" 
      subtitle="Cetak Ringkasan Penghasilan Karyawan"
    >
      <Suspense fallback={<div>Loading Search Params...</div>}>
        <SlipGajiContent />
      </Suspense>
    </PageWrapper>
  );
}
