import React, { useState } from 'react';
import { Bundle } from '@/types';
import { TAHAP_ORDER, TAHAP_LABEL, TahapKey, getBundlesByFlowState } from '@/lib/utils/production-helpers';
import FlowDetailModal from './FlowDetailModal';
import styles from './ProductionFlowBoard.module.css';

interface ProductionFlowBoardProps {
  bundles: Bundle[];
}

export default function ProductionFlowBoard({ bundles }: ProductionFlowBoardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<{ stage: string; type: string; list: Bundle[] }>({
    stage: '', type: '', list: []
  });

  const totalBundles = bundles.length;
  const getPct = (count: number) => totalBundles > 0 ? Math.round((count / totalBundles) * 100) : 0;

  const handleBoxClick = (stage: string, type: 'selesai' | 'proses') => {
    const list = getBundlesByFlowState(bundles, stage as any, type);
    setSelectedData({ stage, type, list });
    setModalOpen(true);
  };

  const stages = [
    { key: 'antri' as const, label: 'ANTRI', color: 'gray' },
    ...TAHAP_ORDER.map(t => ({
      key: t,
      label: TAHAP_LABEL[t].toUpperCase().replace('BUANG BENANG', 'BUANG BB').replace('LUBANG KANCING', 'L.KANCING'),
      color: t === 'cutting' ? 'yellow' : 
             t === 'jahit' ? 'blue' : 
             t === 'lkancing' ? 'purple' : 
             t === 'bbenang' ? 'cyan' : 
             t === 'qc' ? 'green' : 
             t === 'steam' ? 'orange' : 'teal'
    })),
    { key: 'kirim' as const, label: 'KIRIM', color: 'green-bright' }
  ];

  return (
    <div className={styles.boardContainer}>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.miniBox} ${styles.boxTop}`}></div>
          <span>kotak atas = selesai / menunggu tahap berikutnya</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.miniBox} ${styles.boxBottom}`}></div>
          <span>kotak bawah = sedang dikerjakan</span>
        </div>
      </div>

      <div className={styles.flowRow}>
        {stages.map((s, idx) => {
          if (s.key === 'antri') {
            const list = getBundlesByFlowState(bundles, 'antri', 'selesai');
            return (
              <React.Fragment key="antri">
                <div className={styles.stageColumn}>
                  <div className={`${styles.box} ${styles.singleBox}`} onClick={() => handleBoxClick('antri', 'selesai')}>
                    <span className={styles.count}>{list.length}</span>
                    <span className={styles.pct}>{getPct(list.length)}%</span>
                  </div>
                  <label className={styles.stageLabel}>{s.label}</label>
                  <span className={styles.subLabel}>CUTTING</span>
                </div>
                <div className={styles.arrow}>→</div>
              </React.Fragment>
            );
          }

          if (s.key === 'kirim') {
            const list = getBundlesByFlowState(bundles, 'kirim', 'selesai');
            return (
              <React.Fragment key="kirim">
                <div className={styles.stageColumn}>
                  <div className={`${styles.box} ${styles.singleBox} ${styles.boxKirim}`} onClick={() => handleBoxClick('kirim', 'selesai')}>
                    <span className={styles.count}>{list.length}</span>
                    <span className={styles.pct}>{getPct(list.length)}%</span>
                  </div>
                  <label className={styles.stageLabel} style={{ color: 'var(--color-green)' }}>{s.label}</label>
                  <span className={styles.subLabel}>teririm ke klien</span>
                </div>
              </React.Fragment>
            );
          }

          const selesaiList = getBundlesByFlowState(bundles, s.key, 'selesai');
          const prosesList = getBundlesByFlowState(bundles, s.key, 'proses');
          const accentClass = styles[`accent-${s.color}`];

          return (
            <React.Fragment key={s.key}>
              <div className={styles.stageColumn}>
                <div className={styles.doubleBox}>
                  <div className={`${styles.box} ${styles.boxTop} ${accentClass}`} onClick={() => handleBoxClick(s.key, 'selesai')}>
                    <span className={styles.count}>{selesaiList.length}</span>
                    <span className={styles.pct}>{getPct(selesaiList.length)}%</span>
                  </div>
                  <div className={styles.arrowDown}>▼</div>
                  <div className={`${styles.box} ${styles.boxBottom} ${accentClass}`} onClick={() => handleBoxClick(s.key, 'proses')}>
                    <span className={styles.count}>{prosesList.length}</span>
                    <span className={styles.pct}>{getPct(prosesList.length)}%</span>
                  </div>
                </div>
                <label className={styles.stageLabel} style={{ color: `var(--color-${s.color === 'yellow' ? 'yellow' : s.color})` }}>
                  {s.label}
                </label>
                <div className={styles.statusLabels}>
                  <span>↑selesai</span>
                  <span>↓proses</span>
                </div>
              </div>
              {idx < stages.length - 1 && <div className={styles.arrow}>→</div>}
            </React.Fragment>
          );
        })}
      </div>

      <FlowDetailModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        bundles={selectedData.list}
        stage={selectedData.stage}
        type={selectedData.type}
      />
    </div>
  );
}
