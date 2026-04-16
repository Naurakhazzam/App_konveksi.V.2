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
import { formatRupiah, formatDate, getPayrollCycleRange } from '@/lib/utils/formatters';
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

  const [dateRange, setDateRange] = useState(getPayrollCycleRange());
  
  const [selectedKaryawanId, setSelectedKaryawanId] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <div className={`${styles.container} print-parent`}>
      <Panel title="Filter Periode Pembayaran" className="no-print">
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
          <Panel title="Daftar Pembayaran Selesai" className="no-print">
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
                <div className={styles.slipWatermark}>STITCHLYX</div>
                <div className={styles.slipHeader}>
                  <div className={styles.companyInfo}>
                    <div className={styles.brand}>STITCHLYX.SYNCORE</div>
                    <div className={styles.branch}>Pusat Produksi Garmen</div>
                  </div>
                  <div className={styles.docInfo}>
                    <div className={styles.docType}>SLIP GAJI KARYAWAN</div>
                    <div className={styles.docDate}>Periode: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}</div>
                  </div>
                </div>

                <div className={styles.employeeGrid}>
                  <div className={styles.infoGroup}>
                    <span className={styles.infoLabel}>NAMA KARYAWAN</span>
                    <span className={styles.infoValue}>{infoKaryawan.nama}</span>
                  </div>
                  <div className={styles.infoGroup}>
                    <span className={styles.infoLabel}>ID / JABATAN</span>
                    <span className={styles.infoValue}>{infoKaryawan.id} — {infoKaryawan.jabatan}</span>
                  </div>
                </div>

                <div className={styles.billingGrid}>
                  {/* Earnings */}
                  <div className={styles.billingCol}>
                    <div className={styles.colHeader}>RINCIAN PENGHASILAN (+)</div>
                    <div className={styles.billingList}>
                      {/* Borongan Lunas */}
                      {slipData.entries.filter(e => e.status === 'lunas' && e.tipe === 'selesai' && !e.id.startsWith('GP-')).length > 0 && (
                        <div className={styles.billItem}>
                          <span>Upah Produksi (Borongan)</span>
                          <span>{formatRupiah(slipData.entries.filter(e => e.status === 'lunas' && e.tipe === 'selesai' && !e.id.startsWith('GP-')).reduce((a, b) => a + b.total, 0))}</span>
                        </div>
                      )}
                      
                      {/* Gaji Pokok Lunas */}
                      {slipData.entries.filter(e => e.status === 'lunas' && e.id.startsWith('GP-')).map((e, idx) => (
                        <div key={idx} className={styles.billItem}>
                          <span>{e.keterangan}</span>
                          <span>{formatRupiah(e.total)}</span>
                        </div>
                      ))}

                      {/* Rework Lunas */}
                      {slipData.entries.filter(e => e.status === 'lunas' && e.tipe === 'rework').length > 0 && (
                        <div className={styles.billItem}>
                          <span>Bonus Rework</span>
                          <span>{formatRupiah(slipData.entries.filter(e => e.status === 'lunas' && e.tipe === 'rework').reduce((a, b) => a + b.total, 0))}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className={styles.billingCol}>
                    <div className={styles.colHeader}>RINCIAN POTONGAN (-)</div>
                    <div className={styles.billingList}>
                      {/* Reject Lunas */}
                      {slipData.entries.filter(e => e.status === 'lunas' && e.tipe === 'reject_potong').length > 0 ? (
                        <div className={styles.billItem}>
                          <span>Reject Tahap</span>
                          <span className={styles.red}>
                            ({formatRupiah(Math.abs(slipData.entries.filter(e => e.status === 'lunas' && e.tipe === 'reject_potong').reduce((a, b) => a + b.total, 0)))})
                          </span>
                        </div>
                      ) : (
                        <div className={styles.billItem}><span className={styles.muted}>Tidak ada potongan reject</span></div>
                      )}
                      
                      {/* Kasbon - This one is tricky as it's not in ledger but in kasbon store. 
                          But during payment, we usually know how much was deducted.
                          Actually, the Slip should show the deduction made in THIS payment.
                      */}
                    </div>
                  </div>
                </div>

                {/* L-03: Escrow Section (Hanya tampil jika ada data) */}
                {slipData.totalEscrow > 0 && (
                  <div className={styles.escrowSection}>
                    <div className={styles.escrowHeader}>
                      ⚠️ UPAH TERTUNDA (ESCROW) — {formatRupiah(slipData.totalEscrow)}
                    </div>
                    <div className={styles.escrowList}>
                      {slipData.escrowEntries.map((e, idx) => (
                        <div key={idx} className={styles.escrowItem}>
                          <div className={styles.escrowMain}>
                            <strong>PO: {e.sumberId}</strong> 
                            <p className={styles.escrowWarning}>
                              {e.keterangan || 'Pending perbaikan reject'}. Perbaiki dulu agar bisa cair.
                            </p>
                          </div>
                          <span className={styles.muted}>{formatRupiah(e.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.summaryBox}>
                  <div className={styles.summaryLabel}>TOTAL PENDAPATAN BERSIH (TAKE HOME PAY)</div>
                  <div className={styles.summaryValue}>{formatRupiah(slipData.upahLunas)}</div>
                  <div className={styles.terbilang}># {slipData.upahLunas.toLocaleString('id-ID')} Rupiah #</div>
                </div>

                <div className={styles.slipFooter}>
                   <div className={styles.signArea}>
                      <div className={styles.signBox}>
                        <p>Diterima Oleh,</p>
                        <div className={styles.signLine} />
                        <p>{infoKaryawan.nama}</p>
                      </div>
                      <div className={styles.signBox}>
                        <p>Kasir / Admin,</p>
                        <div className={styles.signLine} />
                        <p>BAG. KEUANGAN</p>
                      </div>
                   </div>
                   <div className={styles.printNote}>
                      Dicetak pada {isMounted ? new Date().toLocaleString('id-ID') : ''} • Dokumen sah tanpa tanda tangan jika diproses sistem.
                   </div>
                </div>
              </div>
              
              <div className={`${styles.actions} no-print`}>
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
