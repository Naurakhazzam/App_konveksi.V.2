'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './DashboardTabs.module.css';

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan Utama', path: '/dashboard' },
  { id: 'produksi', label: 'Produksi', path: '/dashboard/produksi' },
  { id: 'keuangan', label: 'Keuangan', path: '/dashboard/keuangan' },
  { id: 'penggajian', label: 'Penggajian', path: '/dashboard/penggajian' },
];

export default function DashboardTabs() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={styles.container}>
      <div className={styles.tabList}>
        {TABS.map((tab) => {
          const isActive = pathname === tab.path || (tab.path !== '/dashboard' && pathname?.startsWith(tab.path));
          
          return (
            <div
              key={tab.id}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.tabContent}>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="dashboard-tab-pill"
                  className={styles.pill}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 180, 
                    damping: 25,
                    mass: 1.2
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
