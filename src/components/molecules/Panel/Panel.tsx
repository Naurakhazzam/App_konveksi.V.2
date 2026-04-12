import React from 'react';
import MacDots from '../../atoms/MacDots';
import styles from './Panel.module.css';

export interface PanelProps {
  title: string;
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
  accent?: string;
  className?: string;
}

export default function Panel({ title, children, action, onAction, accent, className }: PanelProps) {
  const accentStyle = accent ? { borderTopColor: `var(--color-${accent})` } : {};
  
  return (
    <div className={`${styles.panel} ${className || ''}`} style={accentStyle}>
      <div className={styles.header}>
        <MacDots />
        <h3 className={styles.title}>{title}</h3>
        {action && (
          <button type="button" className={styles.actionBtn} onClick={onAction}>
            {action}
          </button>
        )}
      </div>
      <div className={styles.body}>
        {children}
      </div>
    </div>
  );
}
