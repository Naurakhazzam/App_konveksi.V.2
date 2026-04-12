export type Role = 'owner' | 'admin_produksi' | 'admin_keuangan' | 'supervisor' | 'mandor';

export interface User {
  id: string;
  username: string;
  nama: string;
  roles: Role[];
  pin?: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: string;
}
