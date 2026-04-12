import React from 'react';
import styles from './Modal.module.css';

export interface ModalFooterProps {
  children: React.ReactNode;
}

export default function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className={styles.footer}>
      {children}
    </div>
  );
}
