import React from 'react';
import styles from '../Panduan.module.css';

interface DocSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function DocSection({ title, icon, children }: DocSectionProps) {
  return (
    <div className={styles.docSection}>
      <div className={styles.sectionTitleRow}>
        {icon && <span className={styles.sectionIcon}>{icon}</span>}
        <h2 className={styles.sectionTitleText}>{title}</h2>
      </div>
      <div className={styles.sectionContent}>
        {children}
      </div>
    </div>
  );
}

interface StepItemProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

export function StepItem({ number, title, children }: StepItemProps) {
  return (
    <div className={styles.stepItem}>
      <div className={styles.stepNumber}>{number}</div>
      <div className={styles.stepBody}>
        <h4 className={styles.stepTitle}>{title}</h4>
        <div className={styles.stepDesc}>{children}</div>
      </div>
    </div>
  );
}

interface AlertProps {
  type: 'info' | 'warning' | 'tip';
  title: string;
  children: React.ReactNode;
}

export function DocAlert({ type, title, children }: AlertProps) {
  return (
    <div className={`${styles.docAlert} ${styles['alert_' + type]}`}>
      <div className={styles.alertHeader}>
        <span className={styles.alertType}>{type.toUpperCase()}</span>
        <span className={styles.alertTitle}>{title}</span>
      </div>
      <div className={styles.alertContent}>{children}</div>
    </div>
  );
}
