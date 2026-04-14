'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';

export default function TestKoneksiPage() {
  const [status, setStatus] = useState<'testing' | 'online' | 'error'>('testing');
  const [latency, setLatency] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [schema, setSchema] = useState<{table: string, columns: string[]}[]>([]);

  const testConnection = async () => {
    setStatus('testing');
    setErrorMsg(null);
    setSchema([]);
    const start = Date.now();
    
    try {
      // 1. Basic Ping (Select minimal data)
      const { data: kData, error: kErr } = await supabase.from('karyawan').select('*').limit(1);
      const { data: uData, error: uErr } = await supabase.from('users').select('*').limit(1);

      const detectedSchema = [];
      if (kData) detectedSchema.push({ table: 'karyawan', columns: Object.keys(kData[0] || {}) });
      if (uData) detectedSchema.push({ table: 'users', columns: Object.keys(uData[0] || {}) });
      
      setSchema(detectedSchema);
      setLatency(Date.now() - start);
      setStatus('online');
    } catch (err: any) {
      console.error('Supabase Connection Error:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Gagal terhubung ke API Supabase. Cek file .env.local Anda.');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <PageWrapper 
      title="Diagnostik & Inspeksi Supabase" 
      subtitle="Memastikan aplikasi terhubung dan memverifikasi struktur tabel Cloud"
    >
      <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Panel title="Status Jaringan Real-time">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Status Koneksi:</span>
              <Badge variant={status === 'online' ? 'success' : status === 'testing' ? 'warning' : 'danger'}>
                {status === 'online' ? '🟢 ONLINE' : status === 'testing' ? '🟡 MENGHUBUNGKAN...' : '🔴 OFFLINE'}
              </Badge>
            </div>
            
            {status === 'online' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Latensi (Ping):</span>
                <span style={{ color: 'var(--color-cyan)', fontWeight: 'bold' }}>{latency} ms</span>
              </div>
            )}

            {status === 'error' && (
              <div style={{ padding: '12px', background: 'rgba(255,0,0,0.1)', border: '1px solid var(--color-danger)', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '13px' }}>
                <strong>Error:</strong> {errorMsg}
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={testConnection} 
              disabled={status === 'testing'}
            >
              🔄 Refresh Diagnostik
            </Button>
          </div>
        </Panel>

        {status === 'online' && schema.length > 0 && (
          <Panel title="Hasil Inspeksi Struktur Tabel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
              {schema.map(item => (
                <div key={item.table} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-cyan)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Tabel: {item.table}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {item.columns.length > 0 ? item.columns.map(col => (
                      <Badge key={col} variant="neutral">
                        {col}
                      </Badge>
                    )) : (
                      <span style={{ color: 'var(--color-text-sub)', fontSize: '13px' }}>Tabel ini terdeteksi namun belum ada isi datanya (tidak bisa deteksi kolom).</span>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: '12px', background: 'var(--color-bg-dark)', padding: '10px', borderRadius: '6px' }}>
                <strong>Catatan AI:</strong> Jika daftar kolom di atas tidak sesuai dengan `src/types`, maka fungsi Simpan/Edit akan gagal. Jalankan Migration SQL untuk memperbaiki.
              </div>
            </div>
          </Panel>
        )}

        <div style={{ fontSize: '12px', color: 'var(--color-text-sub)', lineHeight: '1.6' }}>
          <p><strong>Info:</strong> Diagnostik ini mengirimkan permintaan ringan ke endpoint API Supabase Anda. Latensi yang baik untuk region <em>ap-southeast-1 (Singapore)</em> biasanya berkisar antara 30ms - 150ms tergantung provider internet Anda.</p>
        </div>
      </div>
    </PageWrapper>
  );
}
