import React from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SidebarSubItem from './SidebarSubItem';
import { getSubPath } from '../../../lib/constants/navigation';
import styles from './Sidebar.module.css';

export interface SidebarItemProps {
  label: string;
  icon: string;
  color: string;
  basePath: string;
  subs: string[];
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  collapsed: boolean;
  currentPath: string;
}

export default function SidebarItem({
  label, icon, color, basePath, subs, isActive, isExpanded, onToggle, collapsed, currentPath
}: SidebarItemProps) {
  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Circle;
  const hasSubs = subs && subs.length > 0;
  
  const content = (
    <div 
      className={`${styles.item} ${isActive && !hasSubs ? styles.itemActive : ''}`}
      onClick={hasSubs ? onToggle : undefined}
      style={hasSubs ? {} : { color: isActive ? `var(--color-${color})` : 'inherit' }}
    >
      {isActive && !hasSubs && (
        <motion.div
          layoutId="sidebar-active"
          className={styles.liquidActive}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ borderColor: `var(--color-${color})` }}
        />
      )}
      <IconComponent 
        size={18} 
        className={styles.itemIcon} 
        style={isActive && !hasSubs ? { color: `var(--color-${color})`, zIndex: 2 } : { zIndex: 2, position: 'relative' }} 
      />
      {!collapsed && (
        <>
          <span 
            className={styles.itemLabel} 
            style={isActive && !hasSubs ? { color: `#fff`, textShadow: `0 0 10px var(--color-${color})`, zIndex: 2 } : { zIndex: 2, position: 'relative' }}
          >
            {label}
          </span>
          {hasSubs && (
            <ChevronRight 
              size={14} 
              className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} 
              style={{ zIndex: 2, position: 'relative' }}
            />
          )}
        </>
      )}
    </div>
  );

  return (
    <div className={styles.itemContainer}>
      {hasSubs ? content : <Link href={basePath} style={{ textDecoration: 'none' }}>{content}</Link>}
      
      {hasSubs && !collapsed && isExpanded && (
        <div className={styles.subsList}>
          {subs.map(subLabel => {
            const href = getSubPath(basePath, subLabel);
            const isSubActive = href === basePath 
              ? currentPath === href 
              : currentPath.startsWith(href);
            return (
              <SidebarSubItem 
                key={subLabel}
                label={subLabel}
                href={href}
                isActive={isSubActive}
                color={color}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
