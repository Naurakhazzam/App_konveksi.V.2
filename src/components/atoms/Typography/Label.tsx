import React from 'react';
import styles from './Typography.module.css';

export interface LabelProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  color?: 'text' | 'sub' | 'mid' | 'cyan' | 'green' | 'yellow' | 'red';
  weight?: 400 | 500 | 600 | 700;
  uppercase?: boolean;
  className?: string;
}

export default function Label({ 
  children, 
  size = 'sm', 
  color = 'text', 
  weight = 500, 
  uppercase, 
  className 
}: LabelProps) {
  const cn = [
    styles.label,
    styles[`label-${size}`],
    styles[`color-${color}`],
    styles[`weight-${weight}`],
    uppercase ? styles.uppercase : '',
    className || ''
  ].filter(Boolean).join(' ');

  return <span className={cn}>{children}</span>;
}
