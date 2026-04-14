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
import { User, RoleDefinition, PagePermission } from '@/types';
import ModalEditorRole from './ModalEditorRole';
import styles from './UserRoleView.module.css';

export default function UserRoleView() {
  const { 
    users, addUser, updateUser, removeUser, 
    roleDefinitions, addRole, updateRole, removeRole 
  } = useAuthStore();
  
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);

  // User Form State
  const [username, setUsername] = useState('');
  const [nama, setNama] = useState('');
  const [pin, setPin] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  const openUserModal = (item?: User) => {
    if (item) {
      setEditingUser(item);
      setUsername(item.username);
      setNama(item.nama);
      setPin(item.pin || '');
      setSelectedRoles(new Set(item.roles));
    } else {
      setEditingUser(null);
      setUsername('');
      setNama('');
      setPin('');
      setSelectedRoles(new Set());
    }
    setUserModalOpen(true);
  };

  const openRoleModal = (item?: RoleDefinition) => {
    setEditingRole(item || null);
    setRoleModalOpen(true);
  };

  const toggleUserRole = (roleId: string) => {
    const newSet = new Set(selectedRoles);
    if (newSet.has(roleId)) newSet.delete(roleId);
    else newSet.add(roleId);
    setSelectedRoles(newSet);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<User> = {
      username,
      nama,
      roles: Array.from(selectedRoles),
      pin: pin || undefined
    };

    if (editingUser) {
      updateUser(editingUser.id, data);
    } else {
      addUser({
        id: `USR-${Date.now()}`,
        ...data
      } as User);
    }
    setUserModalOpen(false);
  };

  const handleRoleSave = (role: RoleDefinition) => {
    if (editingRole) {
      updateRole(role.id, role);
    } else {
      addRole(role);
    }
    setRoleModalOpen(false);
  };

  const userColumns: Column<User>[] = [
    { key: 'id', header: 'ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'username', header: 'Username' },
    { key: 'nama', header: 'Nama', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'roles', header: 'Roles', render: (val: string[]) => (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {Array.isArray(val) ? val.map(r => {
            const def = roleDefinitions.find(rd => rd.id === r);
            return <Badge key={r} variant={r === 'owner' ? 'success' : 'info'}>{def?.label || r}</Badge>;
        }) : null}
      </div>
    )},
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => openUserModal(row)}>Edit</Button>
        {row.roles.includes('owner') ? null : (
           <Button variant="danger" size="sm" onClick={() => removeUser(row.id)}>Hapus</Button>
        )}
      </div>
    )}
  ];

  const roleColumns: Column<RoleDefinition>[] = [
    { key: 'id', header: 'Role ID', render: (val) => <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span> },
    { key: 'label', header: 'Label', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'permissions', header: 'Akses Sub-Menu', render: (val: PagePermission[]) => {
       const accessCount = val?.filter((p: PagePermission) => p.access).length || 0;
       return <Badge variant={accessCount > 0 ? 'info' : 'neutral'}>{accessCount} Menu Aktif</Badge>;
    }},
    { key: 'action', header: '', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={() => openRoleModal(row)}>Edit Izin</Button>
        {row.id === 'owner' ? null : (
           <Button variant="danger" size="sm" onClick={() => removeRole(row.id)}>Hapus</Button>
        )}
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
              <Button variant="primary" onClick={() => openUserModal()}>+ Tambah User</Button>
            </div>
            <DataTable columns={userColumns} data={users} keyField="id" />
          </Panel>
        </div>

        <div>
          <Panel title="Daftar Roles & Izin Matriks">
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => openRoleModal()}>+ Tambah Role Baru</Button>
            </div>
            <DataTable columns={roleColumns} data={roleDefinitions} keyField="id" />
          </Panel>
        </div>
      </div>

      {userModalOpen && (
        <Modal open={userModalOpen} onClose={() => setUserModalOpen(false)} size="sm">
            <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
                <Heading level={4}>{editingUser ? 'Edit User' : 'Tambah User'}</Heading>
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
                    {roleDefinitions.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                        type="checkbox" 
                        id={`role-${r.id}`} 
                        checked={selectedRoles.has(r.id)} 
                        onChange={() => toggleUserRole(r.id)} 
                        />
                        <label htmlFor={`role-${r.id}`} style={{ fontSize: '14px', cursor: 'pointer' }}>{r.label}</label>
                    </div>
                    ))}
                </div>
                </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--color-bg-secondary)', borderRadius: '0 0 12px 12px' }}>
                <Button type="button" variant="ghost" onClick={() => setUserModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" disabled={selectedRoles.size === 0}>Simpan User</Button>
            </div>
            </form>
        </Modal>
      )}

      {roleModalOpen && (
        <ModalEditorRole 
            role={editingRole}
            onClose={() => setRoleModalOpen(false)}
            onSave={handleRoleSave}
        />
      )}
    </PageWrapper>
  );
}
