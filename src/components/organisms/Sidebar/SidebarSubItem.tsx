import React from 'react';
import Link from 'next/link';
import styles from './Sidebar.module.css';

export interface SidebarSubItemProps {
  label: string;
  href: string;
  isActive: boolean;
  color: string;
}

export default function SidebarSubItem({ label, href, isActive, color }: SidebarSubItemProps) {
  const activeStyle = isActive ? { color: `var(--color-${color})` } : {};
  
  return (
    <Link href={href} className={`${styles.subItem} ${isActive ? styles.subItemActive : ''}`}>
      <span 
        className={styles.subDot} 
        style={isActive ? { backgroundColor: `var(--color-${color})` } : {}}
      />
      <span style={activeStyle}>{label}</span>
    </Link>
  );
}
