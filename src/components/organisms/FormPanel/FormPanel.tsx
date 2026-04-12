import React from 'react';
import Panel from '../../molecules/Panel';
import Button from '../../atoms/Button';
import styles from './FormPanel.module.css';

export interface FormPanelProps {
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  loading?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export default function FormPanel({ title, children, onSubmit, submitLabel = 'Simpan', loading, footer, className }: FormPanelProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };

  return (
    <Panel title={title} className={`${styles.formPanel} ${className || ''}`}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.body}>
          {children}
        </div>
        <div className={styles.footer}>
          {footer}
          {onSubmit && (
            <Button type="submit" variant="primary" loading={loading}>
              {submitLabel}
            </Button>
          )}
        </div>
      </form>
    </Panel>
  );
}
