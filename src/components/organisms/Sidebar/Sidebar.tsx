"use client";

import React, { useState } from 'react';
import { Menu, User, LogOut, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SidebarItem from './SidebarItem';
import ThemeToggle from '../../atoms/ThemeToggle/ThemeToggle';
import { NAV } from '../../../lib/constants/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  currentPath: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentPath, isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { logout, canAccess, currentUser, isPreviewMode, togglePreviewMode } = useAuthStore();
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    NAV.forEach(item => {
      initialState[item.label] = currentPath.startsWith(item.basePath);
    });
    return initialState;
  });

  const toggleExpand = (label: string) => {
    if (collapsed) setCollapsed(false);
    setExpandedItems(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.header}>
        {!collapsed && (
          <div className={styles.brand}>
            <div className={styles.logoBadge}>S</div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>STITCHLYX</span>
              <span className={styles.brandSuffix}>.SYNCORE</span>
            </div>
          </div>
        )}
        <button 
          type="button" 
          className={styles.collapseBtn} 
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu size={20} />
        </button>
      </div>
      
      {!collapsed && (
        <div className={styles.systemInfo}>
          <div className={`${styles.systemStatus} ${isPreviewMode ? styles.statusPreview : ''}`} onClick={togglePreviewMode} style={{ cursor: 'pointer' }}>
            <span className={styles.statusDot} />
            {isPreviewMode ? (
              <div className={styles.previewLabel}>
                <Eye size={12} />
                <span>GOD MODE ACTIVE</span>
              </div>
            ) : (
              <span>SERVER: OPERATIONAL</span>
            )}
          </div>
        </div>
      )}

      <div className={styles.navArea}>
        {NAV.filter(item => canAccess(item.basePath)).map(item => {
          const isActive = currentPath.startsWith(item.basePath);
          return (
            <SidebarItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              color={item.color}
              basePath={item.basePath}
              subs={item.subs}
              isActive={isActive}
              isExpanded={!!expandedItems[item.label]}
              onToggle={() => toggleExpand(item.label)}
              collapsed={collapsed}
              currentPath={currentPath}
            />
          );
        })}
      </div>

      <div className={styles.footer}>
        <ThemeToggle collapsed={collapsed} />
        
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            <User size={18} />
          </div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <div className={styles.userName}>{currentUser?.nama || 'Guest'}</div>
              <div className={styles.userRole}>
                {currentUser?.roles?.filter(r => r !== 'godadmin').join(', ') || ''}
              </div>
            </div>
          )}
        </div>
        
        <button 
          className={styles.logoutBtn} 
          onClick={() => {
            logout();
            router.push('/login');
          }}
          title="Keluar dari sistem"
        >
          <LogOut size={18} />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
