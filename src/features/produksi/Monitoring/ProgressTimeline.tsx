import React from 'react';
import { Bundle } from '@/types';
import { TAHAP_ORDER, TahapKey } from '@/lib/utils/production-helpers';
import styles from './ProgressTimeline.module.css';

interface ProgressTimelineProps {
  bundles: Bundle[];
  poId: string;
  modelId: string;
  warnaId: string;
  sizeId: string;
}

export default function ProgressTimeline({ bundles, poId, modelId, warnaId, sizeId }: ProgressTimelineProps) {
  const artBundles = bundles.filter(b => 
    b.po === poId && b.model === modelId && b.warna === warnaId && b.size === sizeId
  );

  if (artBundles.length === 0) return null;

  return (
    <div className={styles.container}>
      {TAHAP_ORDER.map((t) => {
        const doneCount = artBundles.filter(b => b.statusTahap[t].status === 'selesai').length;
        const totalCount = artBundles.length;
        const isCompleted = doneCount > totalCount / 2; // Sesuai aturan 50%
        const isPending = artBundles.some(b => b.statusTahap[t].koreksiStatus === 'pending');
        const isOngoing = !isCompleted && artBundles.some(b => b.statusTahap[t].status === 'terima');

        let statusClass = styles.todo;
        let icon = '⬜';

        if (isPending) {
          statusClass = styles.pending;
          icon = '🔴';
        } else if (isCompleted) {
          statusClass = styles.done;
          icon = '✅';
        } else if (isOngoing) {
          statusClass = styles.ongoing;
          icon = '⏳';
        }

        const label = t.charAt(0).toUpperCase();

        return (
          <div key={t} className={styles.step} title={`${t}: ${doneCount}/${totalCount}`}>
            <div className={`${styles.circle} ${statusClass}`}>{icon}</div>
            <span className={styles.label}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
