import React, { useState } from 'react';
import { Modal } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { useMasterStore } from '@/stores/useMasterStore';

export interface AddKomponenModalProps {
  open: boolean;
  onClose: () => void;
  produkId: string;
}

export default function AddKomponenModal({ open, onClose, produkId }: AddKomponenModalProps) {
  const { hppKomponen, addProdukHPPItem, getHPPItemsByProduk } = useMasterStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Hanya tampilkan komponen yang belum ada di produk ini
  const existingItems = getHPPItemsByProduk(produkId);
  const existingKomponenIds = new Set(existingItems.map(i => i.komponenId));
  const availableKomponen = hppKomponen.filter(k => !existingKomponenIds.has(k.id));

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleAdd = () => {
    Array.from(selectedIds).forEach(kompId => {
      addProdukHPPItem({
        id: `PHI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        produkId,
        komponenId: kompId,
        harga: 0,
        qty: 1
      });
    });
    setSelectedIds(new Set());
    onClose();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ padding: '20px', minWidth: '400px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Tambah Komponen HPP</h3>
        
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
          {availableKomponen.length === 0 ? (
            <div style={{ color: 'var(--color-text-sub)', textAlign: 'center', padding: '20px 0' }}>
              Semua komponen sudah ditambahkan ke produk ini.
            </div>
          ) : (
            availableKomponen.map(k => (
              <div 
                key={k.id} 
                className="add-komponen-row"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                onClick={() => toggleSelect(k.id)}
              >
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(k.id)} 
                  onChange={() => toggleSelect(k.id)} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{k.nama}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-sub)' }}>{k.kategori} &bull; {k.satuan}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={handleAdd} disabled={selectedIds.size === 0}>
            Tambahkan ({selectedIds.size})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
