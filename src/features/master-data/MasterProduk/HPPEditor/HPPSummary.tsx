import React from 'react';
import { useMasterStore } from '@/stores/useMasterStore';
import { formatRupiah } from '@/lib/utils/formatters';

export interface HPPSummaryProps {
  produkId: string;
}

export default function HPPSummary({ produkId }: HPPSummaryProps) {
  const { getTotalHPPByKategori, getTotalHPP, getMargin, produk } = useMasterStore();
  const prod = produk.find(p => p.id === produkId);
  
  if (!prod) return null;

  const subBahanBaku = getTotalHPPByKategori(produkId, 'bahan_baku');
  const subBiayaProduksi = getTotalHPPByKategori(produkId, 'biaya_produksi');
  const subOverhead = getTotalHPPByKategori(produkId, 'overhead');
  const total = getTotalHPP(produkId);
  const margin = getMargin(produkId);

  return (
    <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--color-text-sub)', fontSize: '13px' }}>
        <span>Subtotal Bahan Baku:</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatRupiah(subBahanBaku)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--color-text-sub)', fontSize: '13px' }}>
        <span>Subtotal Biaya Produksi:</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatRupiah(subBiayaProduksi)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--color-text-sub)', fontSize: '13px' }}>
        <span>Subtotal Overhead:</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatRupiah(subOverhead)}</span>
      </div>

      <div style={{ borderTop: '2px dashed var(--color-border)', margin: '16px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600 }}>
        <span>TOTAL HPP:</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatRupiah(total)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 600 }}>
        <span>Harga Jual:</span>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)' }}>{formatRupiah(prod.hargaJual)}</span>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '12px', 
        backgroundColor: margin.nominal >= 0 ? 'var(--color-success)' : 'var(--color-danger)', 
        color: margin.nominal >= 0 ? '#000' : '#fff',
        borderRadius: '8px',
        fontWeight: 'bold'
      }}>
        <span>MARGIN:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{formatRupiah(margin.nominal)}</span>
          <span style={{ fontSize: '14px', opacity: 0.8 }}>({margin.persen.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
}
