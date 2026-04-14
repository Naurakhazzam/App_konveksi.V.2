'use client';

import React, { useState } from 'react';
import Modal from '@/components/organisms/Modal/Modal';
import Button from '@/components/atoms/Button';
import { Label, Heading } from '@/components/atoms/Typography';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface ModalAuthProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export default function ModalAuth({ 
  open, 
  onClose, 
  onSuccess, 
  title = 'Otentikasi Diperlukan',
  description = 'Tindakan ini berisiko tinggi. Masukkan PIN Owner untuk melanjutkan.'
}: ModalAuthProps) {
  const { ownerPin } = useSettingsStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleVerify = () => {
    if (pin === ownerPin) {
      onSuccess();
      setPin('');
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
        <Heading level={3}>{title}</Heading>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          {description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Label>PIN Owner</Label>
          <input 
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{
              background: 'var(--color-bg)',
              border: `1px solid ${error ? 'var(--color-status-danger)' : 'var(--color-border)'}`,
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '24px',
              letterSpacing: '8px',
              color: 'var(--color-text)'
            }}
            maxLength={4}
            autoFocus
          />
          {error && (
            <span style={{ color: 'var(--color-status-danger)', fontSize: '12px' }}>
              PIN salah. Silakan coba lagi.
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <Button variant="ghost" fullWidth onClick={onClose}>Batal</Button>
          <Button variant="primary" fullWidth onClick={handleVerify}>Verifikasi</Button>
        </div>
      </div>
    </Modal>
  );
}
