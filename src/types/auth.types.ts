export type AccessLevel = 'view' | 'edit';

export type Role = 'owner' | 'admin_produksi' | 'admin_keuangan' | 'supervisor' | 'mandor';

export interface PagePermission {
  path: string;
  access: boolean;
  level: AccessLevel;
}

export interface RoleDefinition {
  id: string;
  label: string;
  permissions: PagePermission[];
}

export interface User {
  id: string;
  username: string;
  nama: string;
  roles: string[]; // Sekarang mereferensikan ID dari RoleDefinition
  pin: string;
  isPending: boolean;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: string;
}

