import React from 'react';
import styles from './KpiRow.module.css';

export interface KpiRowProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export default function KpiRow({ children, columns = 4, className }: KpiRowProps) {
  return (
    <div className={`${styles.row} ${styles[`cols-${columns}`]} ${className || ''}`}>
      {children}
    </div>
  );
}
