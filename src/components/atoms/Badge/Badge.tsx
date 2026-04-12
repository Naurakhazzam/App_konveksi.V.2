import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export default function Badge({ children, variant, size = 'sm', dot, className }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[`size-${size}`]} ${className || ''}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
