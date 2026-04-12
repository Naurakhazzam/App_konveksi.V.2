import React from 'react';
import MasterFormModal, { FormFieldConfig } from '../MasterDetail/MasterFormModal';
import { Klien } from '@/types';

export interface FormKlienProps {
  open: boolean;
  onClose: () => void;
  initialValues?: Klien | null;
  onSubmit: (data: Partial<Klien>) => void;
}

export default function FormKlien({ open, onClose, initialValues, onSubmit }: FormKlienProps) {
  const fields: FormFieldConfig[] = [
    { key: 'nama', label: 'Nama Perusahaan', type: 'text', required: true },
    { key: 'kontak', label: 'Kontak', type: 'text', required: true },
    { key: 'alamat', label: 'Alamat', type: 'text' },
  ];

  return (
    <MasterFormModal
      open={open}
      onClose={onClose}
      title={initialValues ? 'Edit Klien' : 'Tambah Klien'}
      fields={fields}
      initialValues={initialValues || {}}
      onSubmit={onSubmit}
    />
  );
}
