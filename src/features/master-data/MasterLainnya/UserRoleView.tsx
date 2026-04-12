import React, { useState } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import Panel from '@/components/molecules/Panel';
import DataTable, { Column } from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { Modal } from '@/components/organisms/Modal';
import { Heading, Label } from '@/components/atoms/Typography';
import TextInput from '@/components/atoms/Input/TextInput';
import { useAuthStore } from '@/stores/useAuthStore';
import { User, Role } from '@/types';
import { ROLES, ROLE_PERMISSIONS } from '@/lib/constants/roles';
import styles from './UserRoleView.module.css';

export default function UserRoleView() {
  const { users, addUser, updateUser, removeUser } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [nama, setNama] = useState('');
  const [pin, setPin] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  const availableRoleKeys = Object.keys(ROLES);

  const openModal = (item?: User) => {
    if (item) {
      setEditingItem(item);
      setUsername(item.username);
      setNama(item.nama);
      setPin(item.pin || '');
      setSelectedRoles(new Set(item.roles));
    } else {
      setEditingItem(null);
      setUsername('');
      setNama('');
      setPin('');
      setSelectedRoles(new Set());
    }
    setModalOpen(true);
  };

  const toggleRole = (role: string) => {
    const newSet = new Set(selectedRoles);
    if (newSet.has(role)) newSet.delete(role);
    else newSet.add(role);
    setSelectedRoles(newSet);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<User> = {
      username,
      nama,
      roles: Array.from(selectedRoles) as Role[],
      pin: pin || undefined
    };

    if (editingItem) {
      updateUser(editingItem.id, data);
    } else {
      addUser({
        id: `USR-${Date.now()}`,
        ...data
      } as User);
    }
    setModalOpen(false);
  };

  const userColumns: Column<User>[] = [
    { key: 'id', header: 'ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'username', header: 'Username' },
    { key: 'nama', header: 'Nama', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'roles', header: 'Roles', render: (val: Role[]) => (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {Array.isArray(val) ? val.map(r => <Badge key={r} variant="info">{r}</Badge>) : null}
      </div>
    )},
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => openModal(row)}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => removeUser(row.id)}>Hapus</Button>
      </div>
    )}
  ];

  const roleList = Object.entries(ROLES).map(([key, val]) => {
    return { id: key, label: val, permissions: ROLE_PERMISSIONS[val as Role] || [] };
  });

  const roleColumns: Column<any>[] = [
    { key: 'id', header: 'Role ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'label', header: 'Label', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'permissions', header: 'Permissions', render: (val: string[]) => (
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '400px' }}>
        {Array.isArray(val) ? val.map(p => <span key={p} style={{ fontSize: '10px' }}><Badge variant="neutral">{p}</Badge></span>) : null}
      </div>
    )}
  ];

  return (
    <PageWrapper 
      title="User & Role" 
      subtitle="Manajemen akun pengguna dan hak akses sistem"
    >
      <div className={styles.container}>
        <div style={{ marginBottom: '32px' }}>
          <Panel title="Daftar Pengguna (User)">
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => openModal()}>+ Tambah User</Button>
            </div>
            <DataTable columns={userColumns} data={users} keyField="id" />
          </Panel>
        </div>

        <div>
          <Panel title="Roles & Permissions (Read-Only)">
            <DataTable columns={roleColumns} data={roleList} keyField="id" />
          </Panel>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="sm">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
            <Heading level={4}>{editingItem ? 'Edit User' : 'Tambah User'}</Heading>
          </div>
          
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label>Username <span style={{ color: 'var(--color-danger)' }}>*</span></Label>
              <TextInput value={username} onChange={setUsername} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label>Nama Lengkap <span style={{ color: 'var(--color-danger)' }}>*</span></Label>
              <TextInput value={nama} onChange={setNama} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label>PIN (Opsional, untuk Owner)</Label>
              <TextInput value={pin} onChange={setPin} placeholder="Contoh: 030503" />
            </div>

            <div style={{ marginTop: '8px' }}>
              <Label>Pilih Roles <span style={{ color: 'var(--color-danger)' }}>*</span></Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', border: '1px solid var(--color-border)', padding: '12px', borderRadius: '8px', background: 'var(--color-bg-primary)' }}>
                {Object.values(ROLES).map(r => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      id={`role-${r}`} 
                      checked={selectedRoles.has(r)} 
                      onChange={() => toggleRole(r)} 
                    />
                    <label htmlFor={`role-${r}`} style={{ fontSize: '14px', cursor: 'pointer' }}>{r}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--color-bg-secondary)', borderRadius: '0 0 12px 12px' }}>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" disabled={selectedRoles.size === 0}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
