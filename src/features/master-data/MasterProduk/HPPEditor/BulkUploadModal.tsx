import React from 'react';
import { Modal } from '@/components/organisms/Modal';

export interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BulkUploadModal({ open, onClose }: BulkUploadModalProps) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ padding: '24px', minWidth: '400px', textAlign: 'center' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Upload Massal HPP</h3>
        
        <div style={{ backgroundColor: 'var(--color-bg-tertiary)', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-cyan)' }}>Segera Hadir</h4>
          <p style={{ color: 'var(--color-text-sub)', fontSize: '14px', margin: 0 }}>
            Fitur import Excel (.xlsx) untuk update HPP massal sedang dalam tahap pengembangan.
          </p>
        </div>

        <div style={{ textAlign: 'left', fontSize: '13px', color: 'var(--color-text-sub)', marginBottom: '24px' }}>
          <strong>Format yang akan didukung:</strong>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Kolom: SKU, Nama Komponen, Qty, Harga</li>
            <li>Otomatis membaca baris per Produk/Size</li>
          </ul>
        </div>

        <button 
          onClick={onClose}
          style={{ width: '100%', padding: '10px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          Tutup
        </button>
      </div>
    </Modal>
  );
}
