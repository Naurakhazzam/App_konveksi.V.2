import React from 'react';
import { X } from 'lucide-react';
import { Heading, Label } from '../../atoms/Typography';
import styles from './Modal.module.css';

export interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
}

export default function ModalHeader({ title, subtitle, onClose }: ModalHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleWrap}>
        <Heading level={3}>{title}</Heading>
        {subtitle && <Label size="sm" color="sub">{subtitle}</Label>}
      </div>
      {onClose && (
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>
      )}
    </div>
  );
}
