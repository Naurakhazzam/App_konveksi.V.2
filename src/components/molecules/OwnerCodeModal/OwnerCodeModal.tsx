import React, { useState } from 'react';
import { Modal } from '../../organisms/Modal';
import { Heading, Label } from '../../atoms/Typography';
import TextInput from '../../atoms/Input/TextInput';
import Button from '../../atoms/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import styles from './OwnerCodeModal.module.css';

export interface OwnerCodeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export default function OwnerCodeModal({ 
  open, 
  onClose, 
  onSuccess,
  title = "Otorisasi Owner",
  description = "Masukkan PIN Owner untuk melanjutkan."
}: OwnerCodeModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { validateOwnerCode } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateOwnerCode(code)) {
      setError('');
      setCode('');
      onSuccess();
    } else {
      setError('Kode PIN tidak valid atau Anda bukan Owner.');
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <form onSubmit={handleSubmit} className={styles.container}>
        <div className={styles.header}>
          <Heading level={4}>{title}</Heading>
          <Label color="sub">{description}</Label>
        </div>
        
        <div className={styles.body}>
          <TextInput 
            value={code}
            onChange={(val) => {
              setCode(val);
              if (error) setError('');
            }}
            placeholder="......"
            type="password"
            autoFocus
            style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px' }}
          />
          {error && <span className={styles.error}>{error}</span>}
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="ghost" onClick={handleClose}>Batal</Button>
          <Button type="submit" variant="primary">Validasi</Button>
        </div>
      </form>
    </Modal>
  );
}
