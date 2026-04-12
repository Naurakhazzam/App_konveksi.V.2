'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heading, Label } from '../../atoms/Typography';
import PageTransition from '../../atoms/PageTransition';
import styles from './PageWrapper.module.css';

export interface PageWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  kpiRow?: React.ReactNode;
  filterBar?: React.ReactNode;
  action?: React.ReactNode;
}

const staggerItem = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 1.0, 
      delay,
      ease: [0.22, 1, 0.36, 1] as any
    }
  },
});

export default function PageWrapper({ title, subtitle, children, kpiRow, filterBar, action }: PageWrapperProps) {
  return (
    <PageTransition type="driftNatural">
      <div className={styles.page}>
        <motion.header 
          className={styles.header}
          {...staggerItem(0)}
        >
          <div className={styles.titleWrap}>
            <Heading level={2}>{title}</Heading>
            {subtitle && <Label color="sub" size="sm">{subtitle}</Label>}
          </div>
          {action && <div className={styles.actions}>{action}</div>}
        </motion.header>

        {kpiRow && (
          <motion.div 
            className={styles.kpiRow}
            {...staggerItem(0.24)}
          >
            {kpiRow}
          </motion.div>
        )}

        {filterBar && (
          <motion.div 
            className={styles.filterBar}
            {...staggerItem(0.48)}
          >
            {filterBar}
          </motion.div>
        )}
        
        <motion.div 
          className={styles.content}
          {...staggerItem(filterBar ? 0.72 : kpiRow ? 0.48 : 0.24)}
        >
          {children}
        </motion.div>
      </div>
    </PageTransition>
  );
}
