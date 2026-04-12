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
  sequenceIndex?: number;
  reverse?: boolean;
}

export default function Panel({ title, children, action, onAction, accent, className, sequenceIndex, reverse }: PanelProps) {
  const accentStyle = accent ? { borderTopColor: `var(--color-${accent})` } : {};
  
  // Automated simultaneous logic: use sequenceIndex for stable random-offset if provided
  const index = sequenceIndex ?? 0;
  const randomOffset = (index * 1.37) % 4;
  const beamDelay = { 
    animationDelay: `-${randomOffset}s`,
    '--beam-direction': reverse ? 'reverse' : 'normal'
  } as React.CSSProperties;
  
  return (
    <div 
      className={`${styles.panel} ${className || ''}`} 
      style={accentStyle}
      data-beam-container="true"
    >
      <div className="beam-border" style={beamDelay} aria-hidden="true" />
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
