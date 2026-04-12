import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './Sidebar.module.css';

export interface SidebarSubItemProps {
  label: string;
  href: string;
  isActive: boolean;
  color: string;
}

export default function SidebarSubItem({ label, href, isActive, color }: SidebarSubItemProps) {
  const activeStyle = isActive ? { color: '#fff', textShadow: `0 0 8px var(--color-${color})`, zIndex: 2, position: 'relative' as any } : { zIndex: 2, position: 'relative' as any };
  
  return (
    <Link href={href} className={`${styles.subItem} ${isActive ? styles.subItemActive : ''}`}>
      {isActive && (
        <motion.div
          layoutId="sidebar-sub-active"
          className={styles.liquidActiveSub}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ borderColor: `var(--color-${color})` }}
        />
      )}
      <span 
        className={styles.subDot} 
        style={isActive ? { backgroundColor: `var(--color-${color})`, zIndex: 2, position: 'relative' } : { zIndex: 2, position: 'relative' }}
      />
      <span style={activeStyle}>{label}</span>
    </Link>
  );
}
