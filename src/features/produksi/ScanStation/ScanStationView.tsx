import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import { Bundle } from '@/types';
import { TahapKey, SLUG_TO_KEY, TAHAP_LABEL } from '@/lib/utils/production-helpers';
import ScanInput from './ScanInput';
import ScanResult from './ScanResult';
import styles from './ScanStationView.module.css';

interface ScanStationViewProps {
  tahapSlug: string;
}

export default function ScanStationView({ tahapSlug }: ScanStationViewProps) {
  const tahap = SLUG_TO_KEY[tahapSlug];
  const [activeBundle, setActiveBundle] = useState<Bundle | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!tahap) {
    return (
      <PageWrapper title="Error" subtitle="Tahap tidak ditemukan">
        <Panel title="Error">URL tahap produksi tidak valid.</Panel>
      </PageWrapper>
    );
  }

  const handleFound = (bundle: Bundle) => {
    setActiveBundle(bundle);
    setErrorMsg(null);
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
    setActiveBundle(null);
  };

  // Dummy riwayat scan hari ini (bisa diganti dengan data dari store ScanRecord nanti)
  const historyColumns: Column<any>[] = [
    { key: 'waktu', header: 'Waktu', render: () => new Date().toLocaleTimeString() },
    { key: 'barcode', header: 'Barcode', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'aksi', header: 'Aksi', render: (val) => <Badge variant={val === 'Terima' ? 'info' : 'success'}>{val}</Badge> },
    { key: 'qty', header: 'QTY' },
  ];
  
  const dummyHistory = activeBundle ? [
    { id: '1', waktu: new Date().toISOString(), barcode: activeBundle.barcode, aksi: 'Pencarian', qty: activeBundle.qtyBundle }
  ] : [];

  return (
    <PageWrapper 
      title={`Scan — ${TAHAP_LABEL[tahap]}`} 
      subtitle={`Stasiun kerja produksi pemindaian barcode bundle`}
    >
      <div className={styles.container}>
        
        {/* Area Scan & Hasil */}
        <div className={styles.scanArea}>
          <Panel title="Scan Barcode">
            <ScanInput onFound={handleFound} onError={handleError} tahap={tahap} />
            {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}
          </Panel>

          {activeBundle && (
            <ScanResult 
              bundle={activeBundle} 
              tahap={tahap} 
              onComplete={() => setActiveBundle(null)}
            />
          )}
        </div>

        {/* Tabel Riwayat */}
        <Panel title={`Riwayat Scan Hari Ini (${TAHAP_LABEL[tahap]})`}>
          <DataTable columns={historyColumns} data={dummyHistory} keyField="id" />
        </Panel>

      </div>
    </PageWrapper>
  );
}
