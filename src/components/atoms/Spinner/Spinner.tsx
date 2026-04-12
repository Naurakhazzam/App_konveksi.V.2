import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function Spinner({ size = 'md', color = 'var(--color-cyan)' }: SpinnerProps) {
  return (
    <span 
      className={`${styles.spinner} ${styles[`size-${size}`]}`} 
      style={{ borderTopColor: color }} 
    />
  );
}
