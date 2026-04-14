'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestDBPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Mengecek koneksi ke Supabase...');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    async function testConnection() {
      try {
        // Test koneksi dengan query sederhana
        const { error } = await supabase.from('_test_ping').select('*').limit(1);

        // Jika error bukan "table not found", berarti ada masalah koneksi
        if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
          throw error;
        }

        // Koneksi berhasil (table belum ada tidak apa-apa)
        setStatus('success');
        setMessage('✅ Koneksi ke Supabase BERHASIL!');
        setDetail(`Project URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      } catch (err: unknown) {
        setStatus('error');
        setMessage('❌ Koneksi GAGAL');
        setDetail(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    testConnection();
  }, []);

  const bgColor =
    status === 'loading' ? '#1a1d1f' : status === 'success' ? '#0d2b1a' : '#2b0d0d';

  const textColor =
    status === 'loading' ? '#9aa0a6' : status === 'success' ? '#4ade80' : '#f87171';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#111315',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          background: bgColor,
          border: `1px solid ${textColor}`,
          borderRadius: '12px',
          padding: '40px 48px',
          textAlign: 'center',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        {/* Dots */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {['#ff5f57', '#ffbd2e', '#28ca41'].map((c) => (
            <div
              key={c}
              style={{ width: 12, height: 12, borderRadius: '50%', background: c }}
            />
          ))}
        </div>

        <h2 style={{ color: '#e8eaed', fontSize: '18px', marginBottom: '16px' }}>
          Supabase Connection Test
        </h2>

        <p style={{ color: textColor, fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
          {message}
        </p>

        {detail && (
          <p style={{ color: '#9aa0a6', fontSize: '13px', wordBreak: 'break-all' }}>
            {detail}
          </p>
        )}

        {status === 'success' && (
          <p style={{ color: '#9aa0a6', fontSize: '12px', marginTop: '16px' }}>
            Database masih kosong — siap untuk migration schema.
          </p>
        )}
      </div>
    </div>
  );
}
