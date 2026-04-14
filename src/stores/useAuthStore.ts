import { create } from 'zustand';
import { User, RoleDefinition, AccessLevel } from '../types';
import { ROLES } from '../lib/constants/roles';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  roleDefinitions: RoleDefinition[];
  users: User[];
  
  // Actions
  login: (username: string, password_or_pin: string) => { success: boolean, message?: string };
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  removeUser: (id: string) => void;
  approveUser: (id: string) => void; // NEW
  
  // Role Management
  addRole: (role: RoleDefinition) => void;
  updateRole: (id: string, data: Partial<RoleDefinition>) => void;
  removeRole: (id: string) => void;
  
  // Permission Selectors
  canAccess: (path: string) => boolean;
  canEdit: (path: string) => boolean;
  hasRole: (roleId: string) => boolean;
  
  isPreviewMode: boolean;
  togglePreviewMode: () => void;
  
  validateOwnerCode: (code: string) => boolean;
  switchRole: (roles: string[]) => void;
}

// Initial default roles (Seed data)
const allPaths = [
  '/dashboard', '/dashboard/produksi', '/dashboard/keuangan', '/dashboard/penggajian',
  '/produksi', '/produksi/input-po', '/produksi/cutting', '/produksi/monitoring', '/produksi/approval-qty',
  '/produksi/scan/cutting', '/produksi/scan/jahit', '/produksi/scan/lubang-kancing', 
  '/produksi/scan/buang-benang', '/produksi/scan/qc', '/produksi/scan/steam', '/produksi/scan/packing',
  '/pengiriman', '/pengiriman/buat-surat-jalan', '/pengiriman/riwayat',
  '/penggajian', '/penggajian/rekap-gaji', '/penggajian/kasbon', '/penggajian/slip-gaji',
  '/inventory', '/inventory/overview', '/inventory/transaksi-keluar', '/inventory/alert-order',
  '/keuangan', '/keuangan/ringkasan', '/keuangan/jurnal-umum', '/keuangan/laporan-po', 
  '/keuangan/laporan-bulan', '/keuangan/laporan-gaji', '/keuangan/laporan-reject',
  '/retur', '/retur/penerimaan', '/retur/perbaikan', '/retur/pengiriman', '/retur/monitoring',
  '/master-data', '/master-data/detail', '/master-data/produk-hpp', '/master-data/hpp-komponen', 
  '/master-data/karyawan', '/master-data/jabatan', '/master-data/klien', '/master-data/jenis-reject', 
  '/master-data/alasan-reject', '/master-data/kategori-transaksi', '/master-data/satuan', '/master-data/pendaftaran',
  '/koreksi-data', '/audit-log', '/panduan', '/settings'
];

const defaultRoles: RoleDefinition[] = [
  { id: 'godadmin', label: 'Godadmin', permissions: [] },
  { id: 'owner', label: 'Owner', permissions: allPaths.map(path => ({ path, access: true, level: 'edit' })) },
  { id: 'visitor_owner', label: 'Visitor Owner', permissions: allPaths.map(path => ({ path, access: true, level: 'view' })) },
  { id: 'supervisor_admin', label: 'Supervisor Admin', permissions: allPaths.map(path => ({ 
    path, 
    access: true, 
    level: (path === '/produksi/input-po' || path === '/retur/penerimaan' || path === '/settings') ? 'edit' : 'view' 
  })) },
  { id: 'supervisor_produksi', label: 'Supervisor Produksi', permissions: allPaths
    .filter(path => {
      const hidden = ['/keuangan', '/master-data', '/koreksi-data', '/audit-log'];
      return !hidden.some(h => path.startsWith(h));
    })
    .map(path => ({ 
      path, 
      access: true, 
      level: (path.startsWith('/dashboard') && path !== '/settings') ? 'view' : 'edit' 
    })) 
  },
];

const dummyOwner: User = {
  id: 'USR-FAUZAN',
  username: 'Fauzan',
  nama: 'Fauzan',
  roles: ['godadmin'],
  pin: '030503'
};

const dummyUsers: User[] = [
  dummyOwner
];

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: dummyOwner,
  isAuthenticated: true,
  isPreviewMode: false,
  roleDefinitions: defaultRoles,
  users: dummyUsers,

  togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),

  addUser: (item) => set((state) => ({ users: [...state.users, { ...item, isPending: true }] })),
  updateUser: (id, data) => set((state) => ({ users: state.users.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeUser: (id) => set((state) => ({ users: state.users.filter(i => i.id !== id) })),
  approveUser: (id) => set((state) => ({ users: state.users.map(u => u.id === id ? { ...u, isPending: false } : u) })),
  
  addRole: (role) => set((state) => ({ roleDefinitions: [...state.roleDefinitions, role] })),
  updateRole: (id, data) => set((state) => ({ roleDefinitions: state.roleDefinitions.map(r => r.id === id ? { ...r, ...data } : r) })),
  removeRole: (id) => set((state) => ({ roleDefinitions: state.roleDefinitions.filter(r => r.id !== id) })),

  canAccess: (path) => {
    if (get().isPreviewMode) return true;
    const user = get().currentUser;
    if (!user) return false;
    
    // Admin God & Owner pass all
    if (user.roles.includes('godadmin') || user.roles.includes('owner')) return true;
    
    // Visitor Owner: Access all viewing
    if (user.roles.includes('visitor_owner')) return true;

    // Supervisor Admin: Access all
    if (user.roles.includes('supervisor_admin')) return true;

    // Supervisor Produksi: Specific restrictions
    if (user.roles.includes('supervisor_produksi')) {
      const hiddenPaths = ['/keuangan', '/master-data', '/koreksi-data', '/audit-log'];
      if (hiddenPaths.some(hp => path.startsWith(hp))) return false;
      return true;
    }
    
    return false;
  },

  canEdit: (path) => {
    if (get().isPreviewMode) return true;
    const user = get().currentUser;
    if (!user) return false;
    
    if (user.roles.includes('godadmin') || user.roles.includes('owner')) return true;
    if (user.roles.includes('visitor_owner')) return false;

    if (user.roles.includes('supervisor_admin')) {
      const editAllowed = ['/produksi/input-po', '/retur/penerimaan'];
      return editAllowed.some(ea => path.startsWith(ea));
    }

    if (user.roles.includes('supervisor_produksi')) {
      if (path.startsWith('/dashboard/produksi')) return false;
      return true;
    }
    
    return false;
  },

  hasRole: (roleId) => {
    const user = get().currentUser;
    return user ? user.roles.includes(roleId) : false;
  },

  login: (username, password_or_pin) => {
    const user = get().users.find(u => u.username === username);
    if (!user) return { success: false, message: 'User tidak ditemukan' };
    
    // Checks (Since we use PIN and Password interchangeably here based on user data)
    const isOwnerLogin = user.roles.includes('godadmin') || user.roles.includes('owner');
    const validPass = isOwnerLogin 
      ? (user.pin === password_or_pin || (user as any).password === password_or_pin) 
      : (user as any).password === password_or_pin;

    if (!validPass) return { success: false, message: 'Password/PIN salah' };
    if ((user as any).isPending) return { success: false, message: 'Akun Anda sedang menunggu persetujuan Admin' };

    set({ currentUser: user, isAuthenticated: true });
    return { success: true };
  },
  
  logout: () => set({ currentUser: null, isAuthenticated: false }),
  
  validateOwnerCode: (code) => {
    const user = get().currentUser;
    if (!user) return false;
    if (user.roles.includes('owner')) {
      return user.pin === code;
    }
    return false;
  },

  switchRole: (roles) => {
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, roles } : null
    }));
  }
}));

