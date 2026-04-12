import React from 'react';
import styles from './Modal.module.css';

export interface ModalBodyProps {
  children: React.ReactNode;
}

export default function ModalBody({ children }: ModalBodyProps) {
  return (
    <div className={styles.body}>
      {children}
    </div>
  );
}
