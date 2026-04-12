'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../../organisms/Sidebar';
import RoleSwitcher from '../../molecules/RoleSwitcher';
import MobileHeader from '../../molecules/MobileHeader/MobileHeader';
import { useSidebar } from '@/lib/hooks/useSidebar';
import styles from './DashboardLayout.module.css';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { isOpen, toggleSidebar, closeSidebar } = useSidebar();

  // Helper to get title from pathname
  const getPageTitle = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    const last = segments[segments.length - 1];
    return last.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className={styles.overlay} 
          onClick={closeSidebar}
        />
      )}

      <Sidebar 
        currentPath={pathname || '/'} 
        isOpen={isOpen} 
        onClose={closeSidebar}
      />
      
      <div className={styles.wrapper}>
        <MobileHeader 
          onMenuClick={toggleSidebar} 
          title={getPageTitle(pathname || '')} 
        />
        
        <main className={styles.mainContent}>
          <div className={styles.fabContainer}>
            <RoleSwitcher />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
