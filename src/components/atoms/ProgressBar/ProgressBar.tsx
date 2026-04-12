import React from 'react';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number; // 0-100
  color?: 'cyan' | 'green' | 'yellow' | 'red';
  height?: number; // default 6px
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({ value, color = 'cyan', height = 6, showLabel, className }: ProgressBarProps) {
  const clampValue = Math.min(Math.max(value, 0), 100);
  const fillStyle = {
    width: `${clampValue}%`,
    backgroundColor: `var(--color-${color})`
  };

  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      <div 
        className={styles.track} 
        style={{ height: `${height}px`, borderRadius: `${height / 2}px` }}
      >
        <div 
          className={styles.fill} 
          style={fillStyle} 
        />
      </div>
      {showLabel && (
        <span className={styles.label}>{Math.round(clampValue)}%</span>
      )}
    </div>
  );
}
