import React from 'react';
import styles from './StatusDot.module.css';

export interface StatusDotProps {
  color: 'cyan' | 'green' | 'yellow' | 'red' | 'purple' | 'blue' | 'orange';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export default function StatusDot({ color, size = 'sm', pulse }: StatusDotProps) {
  const bg = `var(--color-${color})`;
  return (
    <span 
      className={`${styles.dot} ${styles[`size-${size}`]} ${pulse ? styles.pulse : ''}`}
      style={{ backgroundColor: bg }}
    />
  );
}
