'use client';

import React from 'react';
import styles from './ProductionStatusCard.module.css';

interface ProductionStatusCardProps {
  poNumber: string;
  piecesTotal: number;
  piecesDone: number;
  currentStation: string;
}

export default function ProductionStatusCard({ poNumber, piecesTotal, piecesDone, currentStation }: ProductionStatusCardProps) {
  const percentage = Math.round((piecesDone / piecesTotal) * 100) || 0;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.poInfo}>
          <span className={styles.label}>PO AKTIF</span>
          <strong className={styles.value}>{poNumber}</strong>
        </div>
        <div className={styles.percentage}>{percentage}%</div>
      </div>
      
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${percentage}%` }} />
      </div>

      <div className={styles.footer}>
        <div className={styles.stat}>
          <span>Terjahit / Target</span>
          <strong>{piecesDone} / {piecesTotal} PCS</strong>
        </div>
        <div className={styles.stat}>
          <span>Stasiun Saat Ini</span>
          <strong className={styles.station}>{currentStation}</strong>
        </div>
      </div>
    </div>
  );
}
