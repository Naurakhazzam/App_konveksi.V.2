import React, { useState, useEffect, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import DataTable, { Column } from '@/components/organisms/DataTable';
import { NAV, getSubPath } from '@/lib/constants/navigation';
import { RoleDefinition, PagePermission, AccessLevel } from '@/types';

interface ModalEditorRoleProps {
  role: RoleDefinition | null;
  onClose: () => void;
  onSave: (role: RoleDefinition) => void;
}

interface FlattenedMenu {
  id: string; // path as ID
  label: string;
  path: string;
  isSub: boolean;
  parentLabel?: string;
}

export default function ModalEditorRole({ role, onClose, onSave }: ModalEditorRoleProps) {
  const [label, setLabel] = useState('');
  const [permissions, setPermissions] = useState<PagePermission[]>([]);

  // 1. Flatten Navigation (Phase 2)
  const flattenedData = useMemo(() => {
    const flat: FlattenedMenu[] = [];
    NAV.forEach(nav => {
      // Parent
      flat.push({
        id: nav.basePath,
        label: nav.label,
        path: nav.basePath,
        isSub: false
      });

      // Children
      if (nav.subs && nav.subs.length > 0) {
        nav.subs.forEach(sub => {
          const subPath = getSubPath(nav.basePath, sub);
          // Skip if subPath is same as parent (e.g. Dashboard > Ringkasan Utama)
          if (subPath !== nav.basePath) {
            flat.push({
              id: subPath,
              label: sub,
              path: subPath,
              isSub: true,
              parentLabel: nav.label
            });
          }
        });
      }
    });
    return flat;
  }, []);

  useEffect(() => {
    if (role) {
      setLabel(role.label);
      setPermissions(role.permissions);
    } else {
      setLabel('');
      // Initialize with all flattened entries
      const initial: PagePermission[] = flattenedData.map(item => ({
        path: item.path,
        access: false,
        level: 'view'
      }));
      setPermissions(initial);
    }
  }, [role, flattenedData]);

  const toggleAccess = (path: string) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.path === path);
      if (existing) {
        return prev.map(p => p.path === path ? { ...p, access: !p.access } : p);
      }
      return [...prev, { path, access: true, level: 'view' }];
    });
  };

  const toggleLevel = (path: string) => {
    setPermissions(prev => {
      return prev.map(p => {
        if (p.path === path) {
          const newLevel: AccessLevel = p.level === 'view' ? 'edit' : 'view';
          // Sebenarnya "Bisa Edit" otomatis menyiratkan "Tampilkan"
          return { ...p, level: newLevel, access: true };
        }
        return p;
      });
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: role?.id || `role-${Date.now()}`,
      label,
      permissions
    });
  };

  const columns: Column<FlattenedMenu>[] = [
    { 
      key: 'label', 
      header: 'Nama Menu / Sub-Menu', 
      render: (val, row) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          paddingLeft: row.isSub ? '24px' : '0',
          cursor: 'pointer'
        }} onClick={() => toggleAccess(row.path)}>
           {row.isSub && <span style={{ color: 'var(--color-text-sub)' }}>└</span>}
           <span style={{ fontWeight: row.isSub ? 400 : 600, color: row.isSub ? 'var(--color-text-sub)' : 'var(--color-text)' }}>
            {row.label}
           </span>
           <span style={{ fontSize: '10px', color: 'var(--color-text-sub)', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
            {row.path}
           </span>
        </div>
      ) 
    },
    { 
      key: 'access', 
      header: 'Tampilkan',
      align: 'center',
      render: (_, row) => {
        const perm = permissions.find(p => p.path === row.path);
        return (
          <input 
            type="checkbox" 
            checked={perm?.access || false} 
            onChange={() => toggleAccess(row.path)} 
            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
          />
        );
      }
    },
    { 
      key: 'level', 
      header: 'Bisa Edit',
      align: 'center',
      render: (_, row) => {
        const perm = permissions.find(p => p.path === row.path);
        const canEdit = perm?.access && perm?.level === 'edit';
        
        return (
          <input 
            type="checkbox" 
            checked={canEdit || false} 
            onChange={() => toggleLevel(row.path)}
            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
          />
        );
      }
    }
  ];

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <ModalHeader title={role ? `Edit Izin: ${role.label}` : 'Tambah Role Baru'} onClose={onClose} />
      <ModalBody>
        <form id="role-form" onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label>Nama Role (Contoh: Admin Gudang)</Label>
            <input 
              type="text" 
              value={label} 
              onChange={e => setLabel(e.target.value)} 
              placeholder="Masukkan nama role..."
              required
              style={{
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                padding: '10px',
                borderRadius: '8px',
                color: 'var(--color-text)'
              }}
            />
          </div>

          <div>
             <div style={{ marginBottom: '12px' }}>
                <Label>Matriks Izin Akses (Detail per Sub-Menu)</Label>
                <p style={{ fontSize: '12px', color: 'var(--color-text-sub)' }}>
                    Tentukan sub-menu mana saja yang muncul dan apakah mereka boleh melakukan transaksi (Bisa Edit).
                </p>
             </div>
             
             <DataTable 
                columns={columns} 
                data={flattenedData} 
                keyField="id" 
             />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button type="submit" form="role-form" variant="primary">Simpan Role & Izin</Button>
      </ModalFooter>
    </Modal>
  );
}
