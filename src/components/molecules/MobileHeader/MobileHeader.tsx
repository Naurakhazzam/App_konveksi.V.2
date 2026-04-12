'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import ThemeToggle from '../../atoms/ThemeToggle/ThemeToggle';
import styles from './MobileHeader.module.css';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title: string;
}

export default function MobileHeader({ onMenuClick, title }: MobileHeaderProps) {
  return (
    <header className={styles.mobileHeader}>
      <button 
        className={styles.hamburger}
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu size={24} />
      </button>
      
      <div className={styles.titleWrapper}>
        <div className={styles.logoBadge}>S</div>
        <span className={styles.title}>{title}</span>
      </div>
      
      <div className={styles.actions}>
        <ThemeToggle collapsed={true} />
      </div>
    </header>
  );
}
