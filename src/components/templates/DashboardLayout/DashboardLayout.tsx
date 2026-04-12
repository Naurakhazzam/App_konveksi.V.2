import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../../organisms/Sidebar';
import RoleSwitcher from '../../molecules/RoleSwitcher';
import styles from './DashboardLayout.module.css';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className={styles.layout}>
      <Sidebar currentPath={pathname || '/'} />
      <main className={styles.mainContent}>
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999 }}>
          <RoleSwitcher />
        </div>
        {children}
      </main>
    </div>
  );
}
