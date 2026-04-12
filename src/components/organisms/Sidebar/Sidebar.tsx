import React, { useState } from 'react';
import { Menu, User } from 'lucide-react';
import SidebarItem from './SidebarItem';
import { NAV } from '../../../lib/constants/navigation';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  
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
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
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
          <div className={styles.systemStatus}>
            <span className={styles.statusDot} />
            SERVER: OPERATIONAL
          </div>
        </div>
      )}

      <div className={styles.navArea}>
        {NAV.map(item => {
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
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            <User size={18} />
          </div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <div className={styles.userName}>Administrator</div>
              <div className={styles.userRole}>root@syncore</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
