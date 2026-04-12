"use client";

import React from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import KpiRow from '@/components/organisms/KpiRow';
import KpiCard from '@/components/molecules/KpiCard';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { Label, MonoText } from '@/components/atoms/Typography';

export default function Home() {
  const kpiItems = (
    <KpiRow columns={5}>
      <KpiCard label="Active PO" value="10" format="number" accent="cyan" />
      <KpiCard label="Total Order" value="978" format="number" accent="blue" />
      <KpiCard label="Terkirim" value="66" format="number" accent="purple" />
      <KpiCard label="Margin Est." value={12400000} format="rupiah" accent="green" />
      <KpiCard label="Alert Cutting" value="2" format="number" accent="red" />
    </KpiRow>
  );

  const poColumns: Column<any>[] = [
    { key: 'po', header: 'KODE PO', render: (val) => <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>{val}</span> },
    { key: 'model', header: 'MODEL', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'klien', header: 'KLIEN', render: (val) => <span style={{ color: 'var(--color-text-sub)' }}>{val}</span> },
    { key: 'order', header: 'ORDER' },
    { key: 'kirim', header: 'KIRIM', render: (val, row) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ color: val > 0 ? 'var(--color-green)' : 'var(--color-text-sub)' }}>{val}</span>
        <div style={{ width: '100%', height: '2px', background: 'var(--color-border)' }}>
          <div style={{ width: `${(val / row.order) * 100}%`, height: '100%', background: 'var(--color-green)' }} />
        </div>
      </div>
    )},
    { key: 'status', header: 'STATUS', render: (val) => {
      let color = 'neutral';
      if (val === 'Parsial') color = 'warning';
      if (val === 'Belum Kirim') color = 'purple';
      return <Badge variant={color as any} dot>{val}</Badge>;
    }},
    { key: 'action', header: '', align: 'right', render: () => (
      <Button variant="ghost" size="sm">Buka &rarr;</Button>
    )}
  ];

  const poData = [
    { po: 'PO-0001', model: 'Airflow', klien: 'Elyon Store', order: 168, kirim: 14, status: 'Parsial' },
    { po: 'PO-0002', model: 'Neck', klien: 'Elyon Store', order: 162, kirim: 16, status: 'Parsial' },
    { po: 'PO-0003', model: 'Storma', klien: 'Gudang Apparel', order: 144, kirim: 0, status: 'Belum Kirim' },
    { po: 'PO-0004', model: 'Druvo', klien: 'Gudang Apparel', order: 144, kirim: 0, status: 'Belum Kirim' },
    { po: 'PO-0005', model: 'Zumo Panjang', klien: 'Mizan Coll.', order: 56, kirim: 0, status: 'Belum Kirim' },
    { po: 'PO-0007', model: 'Jimo Panjang', klien: 'Mizan Coll.', order: 52, kirim: 0, status: 'Belum Kirim' },
  ];

  const headerAction = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Badge variant="info" dot>SYSTEM LIVE</Badge>
      <div style={{ 
        border: '1px solid var(--color-border)', 
        padding: '6px 12px', 
        borderRadius: '20px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--color-text-sub)'
      }}>
        12 APR 2026
      </div>
    </div>
  );

  return (
    <PageWrapper
        title="Produksi"
        subtitle="DASHBOARD / PRODUKSI"
        action={headerAction}
        kpiRow={kpiItems}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'flex-start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Panel title="PURCHASE ORDER — STATUS PRODUKSI" action="Lihat Semua">
              <DataTable 
                columns={poColumns} 
                data={poData} 
                keyField="po" 
                compact 
                striped={false}
              />
            </Panel>

            <Panel title="URGENT — DEADLINE ARTIKEL" accent="orange">
               <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-sub)' }}>
                 Tidak ada artikel mendesak saat ini.
               </div>
            </Panel>
          </div>

          <div>
            <Panel title="SYSTEM // ACTIVE LOG" accent="yellow">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '8px' }}>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <MonoText size="xs" color="sub" className="mt-1">14:02</MonoText>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Label color="text">PO-0001 Airflow Navy XL</Label>
                      <Badge variant="warning" size="sm">ANTRI</Badge>
                    </div>
                    <Label size="xs" color="sub">antri cutting 15 pcs</Label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <MonoText size="xs" color="sub" className="mt-1">14:04</MonoText>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Label color="text">EPUL — Jahit</Label>
                      <Badge variant="success" size="sm">SELESAI</Badge>
                    </div>
                    <Label size="xs" color="sub">selesai 5 pcs Airflow</Label>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <MonoText size="xs" color="sub" className="mt-1">14:08</MonoText>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Label color="red">PO-0004 Druvo Black M</Label>
                      <Badge variant="danger" size="sm">ALERT</Badge>
                    </div>
                    <Label size="xs" color="sub">cutting selisih -4 pcs</Label>
                  </div>
                </div>

              </div>
            </Panel>
          </div>

        </div>
      </PageWrapper>
  );
}
