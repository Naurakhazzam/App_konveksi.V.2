import React, { useState } from 'react';
import { Modal } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { useMasterStore } from '@/stores/useMasterStore';

export interface CopyHPPModalProps {
  open: boolean;
  onClose: () => void;
  targetProdukId: string;
}

export default function CopyHPPModal({ open, onClose, targetProdukId }: CopyHPPModalProps) {
  const { produk, copyHPP } = useMasterStore();
  const [sourceId, setSourceId] = useState('');

  // Tampilkan semua produk kecuali yang sedang aktif
  const availableProduk = produk.filter(p => p.id !== targetProdukId);

  const handleCopy = () => {
    if (sourceId) {
      if (confirm('HPP yang sudah ada di produk ini akan DITIMPA. Lanjutkan?')) {
        copyHPP(sourceId, targetProdukId);
        setSourceId('');
        onClose();
      }
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ padding: '20px', minWidth: '400px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Salin HPP dari Produk Lain</h3>
        
        <p style={{ color: 'var(--color-text-sub)', fontSize: '14px', marginBottom: '16px' }}>
          Semua komponen HPP dari produk sumber akan diduplikasi ke produk ini. Items yang sudah ada akan dihapus/ditimpa.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500 }}>Pilih Produk Sumber:</label>
          <select 
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', background: 'var(--color-bg-secondary)', color: 'var(--color-text)', border: '1px solid var(--color-border)', outline: 'none' }}
          >
            <option value="">-- Pilih Produk --</option>
            {availableProduk.map(p => (
              <option key={p.id} value={p.id}>{p.skuInternal} (Klien: {p.skuKlien})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={handleCopy} disabled={!sourceId}>
            Salin & Terapkan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
