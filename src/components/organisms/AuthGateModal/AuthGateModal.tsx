import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X, Key, Lock } from 'lucide-react';
import Button from '../../atoms/Button';
import styles from './AuthGateModal.module.css';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'password' | 'pin';
  title?: string;
  message?: string;
  expectedValue?: string; // If provided, validates locally, otherwise just passes value to onSuccess
}

export default function AuthGateModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  type, 
  title, 
  message,
  expectedValue 
}: AuthGateModalProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!value) {
      setError(`${type === 'pin' ? 'PIN' : 'Password'} wajib diisi`);
      return;
    }

    if (expectedValue && value !== expectedValue) {
      setError(`${type === 'pin' ? 'PIN' : 'Password'} salah`);
      return;
    }

    onSuccess();
  };

  const modalContent = (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={`${styles.iconContainer} ${type === 'pin' ? styles.pinIcon : styles.passIcon}`}>
            {type === 'pin' ? <Lock size={20} /> : <Key size={20} />}
          </div>
          <div className={styles.titleArea}>
            <h3>{title || (type === 'pin' ? 'Verifikasi PIN' : 'Konfirmasi Password')}</h3>
            <p>{message || `Masukkan ${type} Anda untuk melanjutkan aksi ini.`}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.inputWrapper}>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'pin' ? '••••••' : 'Password Anda'}
              autoFocus
              className={error ? styles.inputError : ''}
              maxLength={type === 'pin' ? 6 : undefined}
              autoComplete="off"
            />
            {error && <span className={styles.errorText}>{error}</span>}
          </div>

          <div className={styles.footer}>
            <Button variant="ghost" onClick={onClose} type="button">Batal</Button>
            <Button variant="primary" type="submit" icon={<ShieldCheck size={18} />}>
              Verifikasi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  // Gunakan Portal agar modal merender di luar hierarki DOM sidebar yang sempit
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body) 
    : null;
}
