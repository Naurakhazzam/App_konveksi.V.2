import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}

export default function Modal({ 
  open, 
  onClose, 
  size = 'md', 
  children, 
  closeOnBackdrop = true, 
  closeOnEsc = true 
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!open) return;
    
    // Store original overflow
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, closeOnEsc, onClose]);

  if (!open || !mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop) onClose();
  };

  const modalContent = (
    <div className={styles.overlay} onMouseDown={handleBackdropClick}>
      <div 
        className={`${styles.card} ${styles[`size-${size}`]}`} 
        onMouseDown={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
