import React from 'react';
import styles from './FormField.module.css';

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}

export default function FormField({ label, children, error, required, hint, className }: FormFieldProps) {
  return (
    <div className={`${styles.field} ${className || ''}`}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.asterisk}>*</span>}
      </label>
      <div className={styles.content}>
        {children}
      </div>
      {(error || hint) && (
        <div className={styles.footer}>
          {error ? (
            <span className={styles.error}>{error}</span>
          ) : hint ? (
            <span className={styles.hint}>{hint}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
