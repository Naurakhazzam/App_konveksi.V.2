'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeMode } from '@/lib/hooks/useThemeMode';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export default function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeMode();

  return (
    <button 
      className={`${styles.toggle} ${collapsed ? styles.collapsed : ''}`}
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className={styles.iconWrapper}>
        {theme === 'dark' ? (
          <Sun size={18} className={styles.icon} />
        ) : (
          <Moon size={18} className={styles.icon} />
        )}
      </div>
      {!collapsed && (
        <span className={styles.label}>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
