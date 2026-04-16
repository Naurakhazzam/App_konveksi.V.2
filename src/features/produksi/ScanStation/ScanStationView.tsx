'use client';

import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import { Bundle } from '@/types';
import { TahapKey, SLUG_TO_KEY, TAHAP_LABEL } from '@/lib/utils/production-helpers';
import { useScanStore, ScanRecord } from '@/stores/useScanStore';
import ScanInput from './ScanInput';
import ScanResult from './ScanResult';
import ListAntrianTahap from './ListAntrianTahap';
import RejectListTahap from './RejectListTahap';
import styles from './ScanStationView.module.css';

interface ScanStationViewProps {
  tahapSlug: string;
}

export default function ScanStationView({ tahapSlug }: ScanStationViewProps) {
  const tahap = SLUG_TO_KEY[tahapSlug];
  const { history } = useScanStore();
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

  // Filter history for current stage only
  const stageHistory = useMemo(() => {
    return history.filter(h => h.tahap === tahap);
  }, [history, tahap]);

  const historyColumns: Column<ScanRecord>[] = [
    { 
      key: 'waktu', 
      header: 'Waktu', 
      render: (val) => new Date(val).toLocaleTimeString('id-ID', { hour12: false }) 
    },
    { 
      key: 'barcode', 
      header: 'KODE UNIK', 
      render: (val) => <code style={{ fontSize: '11px', fontWeight: 'bold' }}>{val}</code> 
    },
    { 
      key: 'aksi', 
      header: 'Aksi', 
      render: (val) => (
        <Badge variant={val === 'terima' ? 'info' : val === 'selesai' ? 'success' : 'danger'}>
          {val.toUpperCase()}
        </Badge>
      ) 
    },
    { key: 'qty', header: 'QTY', render: (val) => <strong>{val}</strong> },
  ];
  
  return (
    <PageWrapper 
      title={`Scan — ${TAHAP_LABEL[tahap]}`} 
      subtitle={`Stasiun kerja produksi pemindaian kode unik bundle`}
    >
      <div className={styles.container}>
        
        {/* Area Scan & Hasil */}
        <div className={styles.scanArea}>
          <Panel title="Scan KODE UNIK" overflowVisible={true}>
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

        <ListAntrianTahap tahap={tahap} />

        <RejectListTahap tahap={tahap} />

        {/* Tabel Riwayat */}
        <Panel title={`Riwayat Scan Hari Ini (${TAHAP_LABEL[tahap]})`}>
          <DataTable 
            columns={historyColumns} 
            data={stageHistory} 
            keyField="id" 
            emptyMessage="Belum ada aktivitas scan untuk tahap ini hari ini."
            reverse={true}
          />
        </Panel>

      </div>
    </PageWrapper>
  );
}
