import React, { useState } from 'react';
import { Modal } from '@/components/organisms/Modal';
import { Heading } from '@/components/atoms/Typography';
import TextInput from '@/components/atoms/Input/TextInput';
import Select from '@/components/atoms/Select/Select';
import Button from '@/components/atoms/Button';
import { useMasterStore } from '@/stores/useMasterStore';
import { Produk } from '@/types';

export interface FormProdukProps {
  open: boolean;
  onClose: () => void;
}

export default function FormProduk({ open, onClose }: FormProdukProps) {
  const { model, sizes, warna, addProduk } = useMasterStore();
  const [modelId, setModelId] = useState('');
  const [sizeId, setSizeId] = useState('');
  const [warnaId, setWarnaId] = useState('');
  const [skuKlien, setSkuKlien] = useState('');
  const [hargaJual, setHargaJual] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId || !sizeId || !warnaId) return;

    // Generate skuInternal (simplified logic)
    const m = model.find(i => i.id === modelId);
    const w = warna.find(i => i.id === warnaId);
    const s = sizes.find(i => i.id === sizeId);
    
    let skuInternal = `LYX-${Date.now().toString().slice(-4)}`;
    if (m && w && s) {
      skuInternal = `LYX-${m.nama.substring(0, 3).toUpperCase()}-${w.nama.substring(0, 3).toUpperCase()}-${s.nama}`;
    }

    const newProduk: Produk = {
      id: `PRD-${Date.now()}`,
      modelId,
      sizeId,
      warnaId,
      skuInternal,
      skuKlien: skuKlien || '-',
      aktif: true,
      hargaJual
    };

    addProduk(newProduk);
    
    // reset form
    setModelId('');
    setSizeId('');
    setWarnaId('');
    setSkuKlien('');
    setHargaJual(0);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
          <Heading level={4}>Tambah Produk Baru</Heading>
        </div>
        
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>Model <span style={{color: 'var(--color-danger)'}}>*</span></label>
            <Select 
              value={modelId} 
              onChange={setModelId} 
              options={model.map(m => ({ value: m.id, label: m.nama }))}
              placeholder="Pilih Model"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>Size <span style={{color: 'var(--color-danger)'}}>*</span></label>
            <Select 
              value={sizeId} 
              onChange={setSizeId} 
              options={sizes.map(s => ({ value: s.id, label: s.nama }))}
              placeholder="Pilih Size"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>Warna <span style={{color: 'var(--color-danger)'}}>*</span></label>
            <Select 
              value={warnaId} 
              onChange={setWarnaId} 
              options={warna.map(w => ({ value: w.id, label: w.nama }))}
              placeholder="Pilih Warna"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>SKU Klien (Opsional)</label>
            <TextInput 
              value={skuKlien} 
              onChange={setSkuKlien} 
              placeholder="Contoh: AIR-BLK-S"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>Harga Jual (estimasi per pcs) <span style={{color: 'var(--color-danger)'}}>*</span></label>
            <input 
              type="number" 
              value={hargaJual || ''} 
              onChange={(e) => setHargaJual(parseFloat(e.target.value) || 0)}
              required
              style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', padding: '10px 14px', borderRadius: '8px', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--color-bg-secondary)', borderRadius: '0 0 12px 12px' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}
