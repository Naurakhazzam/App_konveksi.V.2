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
  className?: string;
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

export default function KpiCard({ label, value, icon, trend, accent = 'cyan', format, className }: KpiCardProps) {
  const formattedValue = formatValue(value, format);
  
  return (
    <div className={`${styles.card} ${styles[`accent-${accent}`]} ${className || ''}`}>
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
