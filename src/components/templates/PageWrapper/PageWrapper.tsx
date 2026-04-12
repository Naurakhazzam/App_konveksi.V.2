import React from 'react';
import { Heading, Label } from '../../atoms/Typography';
import PageTransition from '../../atoms/PageTransition'; // Import transition
import styles from './PageWrapper.module.css';

export interface PageWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  kpiRow?: React.ReactNode;
  filterBar?: React.ReactNode;
  action?: React.ReactNode;
}

export default function PageWrapper({ title, subtitle, children, kpiRow, filterBar, action }: PageWrapperProps) {
  return (
    <PageTransition type="driftNatural">
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <Heading level={2}>{title}</Heading>
            {subtitle && <Label color="sub" size="sm">{subtitle}</Label>}
          </div>
          {action && <div className={styles.actions}>{action}</div>}
        </header>

        {kpiRow && <div className={styles.kpiRow}>{kpiRow}</div>}
        {filterBar && <div className={styles.filterBar}>{filterBar}</div>}
        
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </PageTransition>
  );
}
