import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import { usePOStore } from '@/stores/usePOStore';
import { useBundleStore } from '@/stores/useBundleStore';
import { getWarnings } from '@/lib/utils/production-helpers';
import MonitoringStatusPO from './MonitoringStatusPO';
import MonitoringPerArtikel from './MonitoringPerArtikel';
import WarningProses from './WarningProses';
import styles from './MonitoringView.module.css';

type Tab = 'status' | 'artikel' | 'warning';

export default function MonitoringView() {
  const { poList, stuckThresholdHours, setStuckThreshold } = usePOStore();
  const { bundles } = useBundleStore();
  const [activeTab, setActiveTab] = useState<Tab>('status');

  const warnings = getWarnings(bundles, stuckThresholdHours);
  const activePOs = poList.filter((p: any) => p.status === 'aktif');
  const totalBundles = bundles.length;
  const completedBundles = bundles.filter(b => b.statusTahap.packing.status === 'selesai').length;

  const kpiRow = (
    <div className={styles.kpiGrid}>
      <KpiCard label="PO Aktif" value={activePOs.length} accent="blue" />
      <KpiCard label="Total Bundel" value={totalBundles} accent="cyan" />
      <KpiCard label="Bundel Selesai" value={completedBundles} accent="green" />
      <KpiCard 
        label="Bermasalah" 
        value={warnings.length} 
        accent={warnings.length > 0 ? 'red' : 'green'} 
      />
    </div>
  );

  return (
    <PageWrapper 
      title="Monitoring Produksi" 
      subtitle="Pantau progress real-time semua Purchase Order"
      kpiRow={kpiRow}
      action={
        <div className={styles.settings}>
          <label>Ambang Mandek (Jam):</label>
          <input 
            type="number" 
            value={stuckThresholdHours} 
            onChange={(e) => setStuckThreshold(Number(e.target.value))} 
            className={styles.thresholdInput}
          />
        </div>
      }
    >
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'status' ? styles.active : ''}`}
          onClick={() => setActiveTab('status')}
        >
          Status Produksi
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'artikel' ? styles.active : ''}`}
          onClick={() => setActiveTab('artikel')}
        >
          Monitor Per Artikel
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'warning' ? styles.active : ''}`}
          onClick={() => setActiveTab('warning')}
        >
          Warning Proses {warnings.length > 0 && <span className={styles.badge}>{warnings.length}</span>}
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'status' && (
          <Panel title="Manajemen Status PO">
            <MonitoringStatusPO poList={activePOs} bundles={bundles} />
          </Panel>
        )}
        {activeTab === 'artikel' && (
          <Panel title="Detail Progress Per Artikel">
            <MonitoringPerArtikel poList={activePOs} bundles={bundles} />
          </Panel>
        )}
        {activeTab === 'warning' && (
          <Panel title="Pusat Peringatan Produksi">
            <WarningProses bundles={bundles} />
          </Panel>
        )}
      </div>
    </PageWrapper>
  );
}
