'use client';

import React, { useState, useMemo } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { useAuthStore } from '@/stores/useAuthStore';
import { User } from '@/types';
import styles from './PendaftaranView.module.css';

export default function PendaftaranView() {
  const { users, approveUser, removeUser, currentUser } = useAuthStore();
  
  // Filter hidden users (Fauzan) and only show pending ones or all non-godadmins
  const displayUsers = useMemo(() => {
    return users.filter(u => !u.roles.includes('godadmin'));
  }, [users]);

  const columns: Column<User>[] = [
    { key: 'nama', header: 'Nama Lengkap' },
    { key: 'username', header: 'Username' },
    { 
      key: 'roles', 
      header: 'Role Terpilih',
      render: (roles: string[]) => (
        <span style={{ textTransform: 'capitalize' }}>
          {roles.join(', ').replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'isPending',
      header: 'Status',
      render: (v: any) => (
        <Badge variant={v ? 'warning' : 'success'}>
          {v ? '🟡 Menunggu Persetujuan' : '🟢 Aktif'}
        </Badge>
      )
    },
    {
      key: 'id',
      header: 'Aksi',
      render: (id: string, row: User) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {(row as any).isPending && (
            <Button size="sm" variant="primary" onClick={() => approveUser(id)}>
              ✅ Setujui
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => {
            if(confirm(`Hapus pendaftaran ${row.nama}?`)) removeUser(id);
          }}>
            🗑️ Hapus
          </Button>
        </div>
      )
    }
  ];

  return (
    <PageWrapper 
      title="Manajemen Pendaftaran User" 
      subtitle="Kelola persetujuan akun staf baru dan hak akses mereka"
    >
      <div className={styles.container}>
        <Panel title="Antrian Persetujuan Akun">
          <DataTable 
            columns={columns} 
            data={displayUsers} 
            keyField="id" 
            emptyMessage="Tidak ada antrian pendaftaran saat ini."
          />
        </Panel>

        <div className={styles.infoBox}>
          <h3>💡 Petunjuk Admin</h3>
          <ul>
            <li>User baru yang mendaftar secara mandiri akan muncul di sini dengan status <strong>Menunggu Persetujuan</strong>.</li>
            <li>Klik tombol <strong>Setujui</strong> agar mereka bisa mulai login ke sistem.</li>
            <li>Akun dengan level <strong>Godadmin</strong> tidak akan muncul di daftar ini demi keamanan sistem.</li>
          </ul>
        </div>
      </div>
    </PageWrapper>
  );
}
