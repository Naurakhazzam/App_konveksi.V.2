import React from 'react';
import Button from '@/components/atoms/Button';
import { HPPKomponen, ProdukHPPItem } from '@/types';
import { formatRupiah } from '@/lib/utils/formatters';

interface HPPItemRowProps {
  item: ProdukHPPItem;
  komponen: HPPKomponen;
  onUpdate: (data: Partial<ProdukHPPItem>) => void;
  onRemove: () => void;
}

export default function HPPItemRow({ item, komponen, onUpdate, onRemove }: HPPItemRowProps) {
  const subtotal = item.qty * item.harga;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 12px',
      backgroundColor: 'var(--color-bg-tertiary)',
      borderRadius: '8px',
      marginBottom: '8px'
    }}>
      <button 
        type="button"
        onClick={onRemove}
        style={{ 
          background: 'none', border: 'none', color: 'var(--color-danger)', 
          cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' 
        }}
      >×</button>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{komponen.nama}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <input 
            type="number"
            value={item.qty || ''}
            onChange={(e) => onUpdate({ qty: parseFloat(e.target.value) || 0 })}
            style={{ width: '60px', padding: '4px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '4px' }}
          />
          <span style={{ color: 'var(--color-text-sub)' }}>{komponen.satuan} &times; Rp</span>
          <input 
            type="number"
            value={item.harga || ''}
            onChange={(e) => onUpdate({ harga: parseFloat(e.target.value) || 0 })}
            style={{ width: '100px', padding: '4px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '4px' }}
          />
        </div>
      </div>
      
      <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
        {formatRupiah(subtotal)}
      </div>
    </div>
  );
}
