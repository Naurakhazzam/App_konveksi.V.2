'use client';

import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Role } from '@/types';
import Select from '@/components/atoms/Select/Select';
import styles from './RoleSwitcher.module.css';

export default function RoleSwitcher() {
  const { currentUser, switchRole } = useAuthStore();
  
  if (!currentUser) return null;

  const currentRole = currentUser.roles[0] || 'owner';
  
  const roleOptions = [
    { value: 'owner', label: 'Owner' },
    { value: 'admin_produksi', label: 'Admin Produksi' },
    { value: 'admin_keuangan', label: 'Admin Keuangan' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'mandor', label: 'Mandor' },
  ];

  return (
    <div className={styles.container}>
      <span className={styles.label}>Mode:</span>
      <Select 
        value={currentRole}
        onChange={(val) => switchRole([val as Role])}
        options={roleOptions}
      />
    </div>
  );
}
