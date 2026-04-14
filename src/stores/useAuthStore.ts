import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, RoleDefinition, AccessLevel } from '../types';
import { ROLES } from '../lib/constants/roles';
import { supabase } from '../lib/supabase';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  roleDefinitions: RoleDefinition[];
  users: User[];

  // Actions
  login: (username: string, password_or_pin: string) => Promise<{ success: boolean, message?: string }>;
  logout: () => void;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  loadUsers: () => Promise<void>;

  // Role Management
  addRole: (role: RoleDefinition) => void;
  updateRole: (id: string, data: Partial<RoleDefinition>) => void;
  removeRole: (id: string) => void;

  // Permission Selectors
  canAccess: (path: string) => boolean;
  canEdit: (path: string) => boolean;
  hasRole: (roleId: string) => boolean;

  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  
  previewRole: string | null;
  setPreviewRole: (role: string | null) => void;

  validateOwnerCode: (code: string) => boolean;
  switchRole: (roles: string[]) => void;
  loginAsVisitor: (password: string) => { success: boolean, message?: string };
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
  { id: 'godadmin', label: 'Godadmin', permissions: [] }, // Hidden Master
  
  // 1. OWNER: Full Akses & Full Edit
  { 
    id: 'owner', 
    label: 'Owner', 
    permissions: allPaths.map(path => ({ path, access: true, level: 'edit' })) 
  },

  // 2. VISITOR OWNER: Bisa Lihat Semua, Tidak Bisa Edit Apapun
  { 
    id: 'visitor_owner', 
    label: 'Visitor Owner', 
    permissions: allPaths.map(path => ({ path, access: true, level: 'view' })) 
  },

  // 3. SUPERVISOR ADMIN: Lihat Semua, Edit Terbatas (Input PO & Retur)
  { 
    id: 'supervisor_admin', 
    label: 'Supervisor Admin', 
    permissions: allPaths.map(path => ({
      path,
      access: true,
      level: (path === '/produksi/input-po' || path === '/retur/penerimaan') ? 'edit' : 'view'
    })) 
  },

  // 4. SUPERVISOR PRODUKSI: Hanya Grup Industri, Tidak Ada Keuangan/Master
  { 
    id: 'supervisor_produksi', 
    label: 'Supervisor Produksi', 
    permissions: allPaths.map(path => {
      const isIndustrial = path.startsWith('/produksi') || 
                           path.startsWith('/pengiriman') || 
                           path.startsWith('/penggajian') || 
                           path.startsWith('/inventory') || 
                           path.startsWith('/retur') ||
                           path === '/dashboard' ||
                           path === '/dashboard/produksi' ||
                           path === '/panduan';
                           
      return {
        path,
        access: isIndustrial,
        level: isIndustrial ? 'edit' : 'view'
      };
    })
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      _hasHydrated: false,
      roleDefinitions: defaultRoles,
      users: [],

      setHasHydrated: (val) => set({ _hasHydrated: val }),

      // Load semua users dari Supabase
      loadUsers: async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('nama');
        if (error) {
          console.error('[AuthStore] Gagal load users:', error.message);
          return;
        }
        // Map snake_case DB → camelCase TypeScript
        const mapped: User[] = (data || []).map((u: any) => ({
          id: u.id,
          username: u.username,
          nama: u.nama,
          roles: u.roles || [],
          pin: u.pin,
          isPending: u.is_pending,
        }));
        set({ users: mapped });
      },

      // Login — cek dari Supabase
      login: async (username, password_or_pin) => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('username', username)
          .single();

        if (error || !data) {
          return { success: false, message: 'User tidak ditemukan' };
        }

        const isOwnerLogin = data.roles?.includes('godadmin') || data.roles?.includes('owner');
        const validPass = isOwnerLogin
          ? data.pin === password_or_pin
          : data.password === password_or_pin;

        if (!validPass) return { success: false, message: 'Password/PIN salah' };
        if (data.is_pending) return { success: false, message: 'Akun Anda sedang menunggu persetujuan Admin' };

        const user: User = {
          id: data.id,
          username: data.username,
          nama: data.nama,
          roles: data.roles || [],
          pin: data.pin,
        };

        set({ currentUser: user, isAuthenticated: true });
        return { success: true };
      },

      // Tambah user baru ke Supabase
      addUser: async (item) => {
        const { error } = await supabase.from('users').insert([{
          id: item.id,
          username: item.username,
          nama: item.nama,
          roles: item.roles,
          pin: item.pin,
          is_pending: true,
          aktif: true,
        }]);
        if (error) {
          console.error('[AuthStore] Gagal tambah user:', error.message);
          return;
        }
        set((state) => ({ users: [...state.users, { ...item, isPending: true }] }));
      },

      // Update user di Supabase
      updateUser: async (id, data) => {
        const updateData: any = {};
        if (data.nama) updateData.nama = data.nama;
        if (data.username) updateData.username = data.username;
        if (data.roles) updateData.roles = data.roles;
        if (data.pin !== undefined) updateData.pin = data.pin;

        const { error } = await supabase.from('users').update(updateData).eq('id', id);
        if (error) {
          console.error('[AuthStore] Gagal update user:', error.message);
          return;
        }
        set((state) => ({ users: state.users.map(u => u.id === id ? { ...u, ...data } : u) }));
      },

      // Hapus user dari Supabase
      removeUser: async (id) => {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) {
          console.error('[AuthStore] Gagal hapus user:', error.message);
          return;
        }
        set((state) => ({ users: state.users.filter(u => u.id !== id) }));
      },

      // Approve user (is_pending → false)
      approveUser: async (id) => {
        const { error } = await supabase.from('users').update({ is_pending: false }).eq('id', id);
        if (error) {
          console.error('[AuthStore] Gagal approve user:', error.message);
          return;
        }
        set((state) => ({ users: state.users.map(u => u.id === id ? { ...u, isPending: false } : u) }));
      },

      addRole: (role) => set((state) => ({ roleDefinitions: [...state.roleDefinitions, role] })),
      updateRole: (id, data) => set((state) => ({ roleDefinitions: state.roleDefinitions.map(r => r.id === id ? { ...r, ...data } : r) })),
      removeRole: (id) => set((state) => ({ roleDefinitions: state.roleDefinitions.filter(r => r.id !== id) })),

      canAccess: (path) => {
        const user = get().currentUser;
        if (!user) return false;
        
        const isFauzan = user.id === 'USR-FAUZAN' || user.roles.includes('godadmin');

        // 1. PINTU DARURAT/GHOST MODE: Akses penuh untuk Fauzan
        if (isFauzan) return true;

        // 2. Cek role asli user
        const rolesToUse = user.roles;
        
        if (rolesToUse.includes('owner')) return true;
        if (rolesToUse.includes('visitor_owner')) return true;
        if (rolesToUse.includes('supervisor_admin')) return true;
        if (rolesToUse.includes('supervisor_produksi')) {
          const hiddenPaths = ['/keuangan', '/master-data', '/koreksi-data', '/audit-log'];
          if (hiddenPaths.some(hp => path.startsWith(hp))) return false;
          return true;
        }
        return false;
      },

      canEdit: (path) => {
        const user = get().currentUser;
        if (!user) return false;

        // 1. GHOST MODE: Fauzan (Godadmin) selalu punya akses edit penuh
        if (user.roles.includes('godadmin') || user.id === 'USR-FAUZAN') return true;

        const rolesToUse = user.roles;

        if (rolesToUse.includes('owner')) return true;
        if (rolesToUse.includes('visitor_owner')) return false;
        if (rolesToUse.includes('supervisor_admin')) {
          const editAllowed = ['/produksi/input-po', '/retur/penerimaan'];
          return editAllowed.some(ea => path.startsWith(ea));
        }
        if (rolesToUse.includes('supervisor_produksi')) {
          if (path.startsWith('/dashboard/produksi')) return false;
          return true;
        }
        return false;
      },

      hasRole: (roleId) => {
        const user = get().currentUser;
        return user ? user.roles.includes(roleId) : false;
      },

      loginAsVisitor: (password: string) => {
        if (password === 'elyasr') {
          const visitorUser: User = {
            id: 'USR-VISITOR',
            username: 'pengunjung',
            nama: 'Pengunjung / Tamu',
            roles: ['visitor_owner']
          };
          set({ currentUser: visitorUser, isAuthenticated: true });
          return { success: true };
        }
        return { success: false, message: 'Password Pengunjung Salah' };
      },

      logout: () => set({ currentUser: null, isAuthenticated: false }),

      validateOwnerCode: (code) => {
        const user = get().currentUser;
        if (!user) return false;
        if (user.roles.includes('owner') || user.roles.includes('godadmin')) {
          return user.pin === code;
        }
        return false;
      },

      switchRole: (roles) => {
        set((state) => ({
          currentUser: state.currentUser ? { ...state.currentUser, roles } : null
        }));
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: (state) => {
        return () => state?.setHasHydrated(true);
      }
    }
  )
);
