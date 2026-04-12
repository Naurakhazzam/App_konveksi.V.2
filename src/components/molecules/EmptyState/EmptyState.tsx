import React from 'react';
import { Heading } from '../../atoms/Typography';
import Button from '../../atoms/Button';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      {icon && <div className={styles.iconWrapper}>{icon}</div>}
      <Heading level={4} className={styles.title}>{title}</Heading>
      {message && <p className={styles.message}>{message}</p>}
      {action && (
        <div className={styles.action}>
          <Button variant="secondary" onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  );
}
