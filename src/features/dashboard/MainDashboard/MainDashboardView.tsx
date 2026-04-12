'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import KpiCard from '@/components/molecules/KpiCard';
import Button from '@/components/atoms/Button';
import { usePOStore } from '@/stores/usePOStore';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useJurnalStore } from '@/stores/useJurnalStore';
import { useLogStore } from '@/stores/useLogStore';
import ProductionStatusCard from './components/ProductionStatusCard';
import { Landmark, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import styles from './MainDashboardView.module.css';

export default function MainDashboardView() {
  const { poList } = usePOStore();
  const { items: inventoryItems } = useInventoryStore();
  const { entries, getTotalByTipe } = useJurnalStore();
  const { logs } = useLogStore();
  const router = useRouter();

  const inventoryAlertsCount = inventoryItems.filter(i => i.stokAktual <= i.stokMinimum).length;
  
  // Financial metrics
  const balance = getTotalByTipe('masuk') - getTotalByTipe('keluar');
  
  const monthlyStats = useMemo(() => {
    const currentMonth = new Date().toISOString().split('-').slice(0, 2).join('-'); // e.g., "2026-04"
    const monthlyEntries = entries.filter(e => e.tanggal.startsWith(currentMonth));
    const income = monthlyEntries.filter(e => e.jenis === 'masuk').reduce((a, c) => a + c.nominal, 0);
    const expense = monthlyEntries.filter(e => e.jenis !== 'masuk').reduce((a, c) => a + c.nominal, 0);
    const profit = income - expense;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    
    return { profit, margin };
  }, [entries]);

  const kpiRow = (
    <div className={styles.kpiRow}>
      <KpiCard 
        label="Laba Berjalan (MTD)" 
        value={monthlyStats.profit} 
        accent="green" 
        format="rupiah" 
        trend={{ value: Math.round(monthlyStats.margin), isUp: monthlyStats.profit >= 0 }}
        icon={<TrendingUp size={20} />}
      />
      <KpiCard 
        label="Saldo Kas" 
        value={balance} 
        accent="blue" 
        format="rupiah"
        icon={<Landmark size={20} />}
      />
      <KpiCard 
        label="Stok Bermasalah" 
        value={inventoryAlertsCount} 
        accent={inventoryAlertsCount > 0 ? 'red' : 'green'} 
        icon={<AlertTriangle size={20} />}
      />
      <KpiCard 
        label="PO Aktif" 
        value={poList.filter(p => p.status === 'aktif').length} 
        accent="cyan" 
        icon={<FileText size={20} />}
      />
    </div>
  );

  return (
    <PageWrapper 
      title="Dashboard Utama" 
      subtitle="Ringkasan eksekutif operasional Stitchlyx"
      kpiRow={kpiRow}
    >
      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <Panel title="Progres Produksi Terbaru">
            <div className={styles.productionGrid}>
              {poList.slice(0, 2).map(po => (
                <ProductionStatusCard 
                  key={po.id}
                  poNumber={po.nomorPO}
                  piecesTotal={po.items.reduce((a, c) => a + c.qty, 0)}
                  piecesDone={Math.floor(po.items.reduce((a, c) => a + c.qty, 0) * 0.4)}
                  currentStation="Jahit (Assembly)"
                />
              ))}
            </div>
          </Panel>

          <div className={styles.shortcuts}>
            <Button variant="ghost" onClick={() => router.push('/produksi/input-po')}>➕ PO Baru</Button>
            <Button variant="ghost" onClick={() => router.push('/produksi/monitoring')}>🔍 Scan Station</Button>
            <Button variant="ghost" onClick={() => router.push('/inventory/alert-order')}>📦 Restock Barang</Button>
          </div>
        </div>

        <div className={styles.rightCol}>
          <Panel title="Log Aktivitas Terbaru">
            <div className={styles.logList}>
              {logs.slice(0, 8).map(log => {
                const isKeuangan = log.modul === 'keuangan';
                return (
                  <div key={log.id} className={styles.logItem}>
                    <div className={styles.logDot} style={{ background: `var(--color-${isKeuangan ? 'red' : log.modul === 'inventory' ? 'yellow' : 'cyan'})` }} />
                    <div className={styles.logContent}>
                      <p>
                        <strong>{log.user.nama}</strong> {log.aksi} - {log.target}
                        {log.metadata?.nominal && <span className={styles.nominal}> [{isKeuangan ? '-' : '+'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(log.metadata.nominal)}]</span>}
                      </p>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}
              <Button 
                variant="ghost" 
                size="sm" 
                fullWidth 
                onClick={() => window.location.href='/audit-log'}
                className={styles.viewMore}
              >
                Lihat Seluruh Log →
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </PageWrapper>
  );
}
