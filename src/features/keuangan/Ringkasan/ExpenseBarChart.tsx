'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils/formatters';
import styles from './ExpenseBarChart.module.css';

interface ExpenseItem {
  label: string;
  value: number;
  color: string;
}

interface ExpenseBarChartProps {
  data: ExpenseItem[];
}

export default function ExpenseBarChart({ data }: ExpenseBarChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className={styles.chartContainer}>
      {data.map((item, index) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        
        return (
          <div key={index} className={styles.chartRow}>
            <div className={styles.labelGroup}>
              <span className={styles.dot} style={{ background: item.color }} />
              <span className={styles.label}>{item.label}</span>
            </div>
            
            <div className={styles.barWrapper}>
              <div 
                className={styles.bar} 
                style={{ 
                  width: `${percentage}%`,
                  background: item.color
                }} 
              />
              <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
            </div>
            
            <div className={styles.valueGroup}>
              <strong className={styles.value}>{formatRupiah(item.value)}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}
