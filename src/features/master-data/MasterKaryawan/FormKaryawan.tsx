import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/organisms/Modal';
import { Heading, Label } from '@/components/atoms/Typography';
import TextInput from '@/components/atoms/Input/TextInput';
import Select from '@/components/atoms/Select/Select';
import Button from '@/components/atoms/Button';
import { Karyawan } from '@/types';
import { TAHAP_ORDER, TAHAP_LABEL, TahapKey } from '@/lib/utils/production-helpers';
import { useMasterStore } from '@/stores/useMasterStore';

export interface FormKaryawanProps {
  open: boolean;
  onClose: () => void;
  initialValues?: Karyawan | null;
  onSubmit: (data: Partial<Karyawan>) => void;
}

export default function FormKaryawan({ open, onClose, initialValues, onSubmit }: FormKaryawanProps) {
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [aktif, setAktif] = useState(true);
  const [tahapList, setTahapList] = useState<string[]>([]);
  const [gajiPokok, setGajiPokok] = useState<number>(0);
  
  const { jabatan: globalJabatanOptions } = useMasterStore();

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setNama(initialValues.nama);
        setJabatan(initialValues.jabatan);
        setAktif(initialValues.aktif);
        setTahapList(initialValues.tahapList || []);
        setGajiPokok(initialValues.gajiPokok || 0);
      } else {
        setNama('');
        setJabatan('');
        setAktif(true);
        setTahapList([]);
        setGajiPokok(0);
      }
    }
  }, [open, initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ nama, jabatan, aktif, tahapList, gajiPokok });
    onClose();
  };

  const toggleTahap = (tahap: string) => {
    setTahapList(prev => 
      prev.includes(tahap) ? prev.filter(t => t !== tahap) : [...prev, tahap]
    );
  };

  const jabatanOptions = globalJabatanOptions.map(j => ({ value: j.id, label: j.nama }));
  if (jabatanOptions.length === 0 || !jabatanOptions.find(o => o.value === 'Lainnya')) {
    jabatanOptions.push({ value: 'Lainnya', label: 'Lainnya' });
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
          <Heading level={4}>{initialValues ? 'Edit Karyawan' : 'Tambah Karyawan'}</Heading>
        </div>
        
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label>Nama Karyawan <span style={{ color: 'var(--color-danger)' }}>*</span></Label>
            <TextInput value={nama} onChange={setNama} required />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label>Jabatan <span style={{ color: 'var(--color-danger)' }}>*</span></Label>
            <Select value={jabatan} onChange={setJabatan} options={jabatanOptions} placeholder="Pilih Jabatan..." />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label>Gaji Pokok / Tunjangan Tetap <span style={{ color: 'var(--color-text-sub)', fontSize: '11px' }}>(Opsional)</span></Label>
            <TextInput 
              type="number" 
              value={gajiPokok.toString()} 
              onChange={(v) => setGajiPokok(Number(v))} 
              placeholder="Contoh: 1000000"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <input 
              type="checkbox" 
              id="aktif-checkbox" 
              checked={aktif} 
              onChange={(e) => setAktif(e.target.checked)} 
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="aktif-checkbox" style={{ fontSize: '14px' }}>Status Aktif</label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <Label>Tahap Produksi <span style={{ color: 'var(--color-text-sub)', fontSize: '12px' }}>(Posisi Kerja)</span></Label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px', 
              padding: '12px', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '8px',
              border: '1px solid var(--color-border)'
            }}>
              {TAHAP_ORDER.map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id={`tahap-${t}`} 
                    checked={tahapList.includes(t)} 
                    onChange={() => toggleTahap(t)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor={`tahap-${t}`} style={{ fontSize: '13px', cursor: 'pointer' }}>
                    {TAHAP_LABEL[t]}
                  </label>
                </div>
              ))}
            </div>
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
