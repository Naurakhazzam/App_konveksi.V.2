import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/organisms/Modal';
import { Heading, Label } from '@/components/atoms/Typography';
import TextInput from '@/components/atoms/Input/TextInput';
import Select from '@/components/atoms/Select/Select';
import Button from '@/components/atoms/Button';
import { Karyawan } from '@/types';

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

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setNama(initialValues.nama);
        setJabatan(initialValues.jabatan);
        setAktif(initialValues.aktif);
      } else {
        setNama('');
        setJabatan('');
        setAktif(true);
      }
    }
  }, [open, initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ nama, jabatan, aktif });
    onClose();
  };

  const jabatanOptions = [
    { value: 'Operator Cutting', label: 'Operator Cutting' },
    { value: 'Operator Jahit', label: 'Operator Jahit' },
    { value: 'Operator QC', label: 'Operator QC' },
    { value: 'Operator Packing', label: 'Operator Packing' },
    { value: 'Operator Steam', label: 'Operator Steam' },
    { value: 'Lainnya', label: 'Lainnya' },
  ];

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
            <Select value={jabatan} onChange={setJabatan} options={jabatanOptions} />
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
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--color-bg-secondary)', borderRadius: '0 0 12px 12px' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}
