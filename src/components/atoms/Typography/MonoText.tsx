import React from 'react';
import styles from './Typography.module.css';

export interface MonoTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'text' | 'sub' | 'cyan' | 'green' | 'yellow' | 'red';
  weight?: 400 | 500 | 600;
  className?: string;
}

export default function MonoText({ 
  children, 
  size = 'sm', 
  color = 'text', 
  weight = 400, 
  className 
}: MonoTextProps) {
  const cn = [
    styles.monoText,
    styles[`mono-${size}`],
    styles[`color-${color}`],
    styles[`weight-${weight}`],
    className || ''
  ].filter(Boolean).join(' ');

  return <span className={cn}>{children}</span>;
}
