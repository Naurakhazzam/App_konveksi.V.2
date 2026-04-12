import React from 'react';
import styles from './KpiCard.module.css';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  accent?: 'cyan' | 'green' | 'yellow' | 'red' | 'purple' | 'blue';
  format?: 'number' | 'rupiah' | 'percent';
  sequenceIndex?: number;
  reverse?: boolean;
}

function formatValue(value: string | number, format: KpiCardProps['format']) {
  if (format === 'rupiah' && typeof value === 'number') {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  }
  if (format === 'percent' && typeof value === 'number') {
    return `${value}%`;
  }
  if (format === 'number' && typeof value === 'number') {
    return new Intl.NumberFormat('id-ID').format(value);
  }
  return value;
}

export default function KpiCard({ label, value, icon, trend, accent = 'cyan', format, className, sequenceIndex, reverse }: KpiCardProps) {
  const formattedValue = formatValue(value, format);
  
  // Automated simultaneous logic: use sequenceIndex for stable random-offset if provided
  // If not provided, use label length as seed for varied offsets
  const index = sequenceIndex ?? Math.abs(label.length) % 10;
  const randomOffset = (index * 2.13) % 4;
  const beamDelay = { 
    animationDelay: `-${randomOffset}s`,
    '--beam-direction': reverse ? 'reverse' : 'normal'
  } as React.CSSProperties;
  
  return (
    <div 
      className={`${styles.card} ${styles[`accent-${accent}`]} ${className || ''}`}
      data-beam-container="true"
    >
      <div className="beam-border" style={beamDelay} aria-hidden="true" />
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <div className={styles.content}>
        <div className={styles.valueRow}>
          <span className={styles.value} style={{ color: `var(--color-${accent})` }}>
            {formattedValue}
          </span>
          {trend && (
            <div className={`${styles.trend} ${trend.isUp ? styles.trendUp : styles.trendDown}`}>
              {trend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
