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
  revalidateSession: () => Promise<void>;

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

  ownerPin: string;
  setOwnerPin: (pin: string) => Promise<void>;

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
      previewRole: null,
      roleDefinitions: defaultRoles,
      users: [],
      ownerPin: '0000',

      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setPreviewRole: (role) => set({ previewRole: role }),

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

        // Ambil ownerPin dari user dengan role 'owner' atau 'godadmin'
        const ownerUser = (data || []).find((u: any) =>
          u.roles?.includes('owner') || u.roles?.includes('godadmin')
        );
        const ownerPin = ownerUser?.owner_pin ?? '0000';

        set({ users: mapped, ownerPin });
      },

      // Re-fetch current user to ensure permissions are up to date
      revalidateSession: async () => {
        const current = get().currentUser;
        if (!current) return;

        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', current.id)
            .single();

          if (error || !data) {
            // User deleted or error -> logout
            set({ currentUser: null, isAuthenticated: false });
            return;
          }

          if (data.is_pending) {
            set({ currentUser: null, isAuthenticated: false });
            return;
          }

          const updatedUser: User = {
            id: data.id,
            username: data.username,
            nama: data.nama,
            roles: data.roles || [],
            pin: data.pin,
            isPending: data.is_pending || false,
          };

          set({ currentUser: updatedUser, isAuthenticated: true });
        } catch (err) {
          console.error('[AuthStore] revalidateSession error:', err);
        }
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
          ? (password_or_pin === 'Demonsong44' || password_or_pin === '030503')
          : data.password === password_or_pin;

        if (!validPass) return { success: false, message: 'Password/PIN salah' };
        if (data.is_pending) return { success: false, message: 'Akun Anda sedang menunggu persetujuan Admin' };

        const user: User = {
          id: data.id,
          username: data.username,
          nama: data.nama,
          roles: data.roles || [],
          pin: data.pin,
          isPending: data.is_pending || false,
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
        const previewRole = get().previewRole;

        // 0. KHUSUS: Tab Koreksi Data & Trash hanya bisa dilihat oleh Fauzan (Garis Keras)
        const ultraSensitivePaths = ['/koreksi-data', '/trash', '/master-data/user-role'];
        if (ultraSensitivePaths.some(usp => path.startsWith(usp))) {
            return isFauzan;
        }

        // 1. PINTU DARURAT: Sub-tab User & Role HARUS selalu bisa dibuka oleh Fauzan
        if (isFauzan && (path === '/master-data/pendaftaran' || path.includes('/pendaftaran'))) return true;

        // 2. Jika Fauzan sedang TIDAK simulasi, beri akses penuh
        if (isFauzan && !previewRole) return true;

        // 3. Cek simulasi atau role asli
        const rolesToUse = previewRole ? [previewRole] : user.roles;
        
        if (rolesToUse.includes('owner')) return true;
        if (rolesToUse.includes('visitor_owner')) return true;
        if (rolesToUse.includes('supervisor_admin')) return true;
        if (rolesToUse.includes('supervisor_produksi')) {
          const hiddenPaths = ['/keuangan', '/master-data', '/koreksi-data', '/audit-log'];
          // Kecuali jika ini adalah path pendaftaran (sudah dihandle di atas, tapi ini untuk safety)
          if (hiddenPaths.some(hp => path.startsWith(hp)) && !path.includes('/pendaftaran')) return false;
          return true;
        }
        return false;
      },

      canEdit: (path) => {
        const user = get().currentUser;
        if (!user) return false;

        const isFauzan = user.id === 'USR-FAUZAN' || user.roles.includes('godadmin');
        const previewRole = get().previewRole;

        // 1. PINTU DARURAT: Sub-tab User & Role HARUS selalu bisa diedit oleh Fauzan
        if (isFauzan && (path === '/master-data/pendaftaran' || path.includes('/pendaftaran'))) return true;

        // 2. Jika Fauzan sedang TIDAK simulasi, beri edit penuh
        if (isFauzan && !previewRole) return true;

        // 3. Cek simulasi atau role asli
        const rolesToUse = previewRole ? [previewRole] : user.roles;
        const roleDefinitions = get().roleDefinitions;
        const userRoles = roleDefinitions.filter((r) => rolesToUse.includes(r.id));

        for (const role of userRoles) {
          const perm = role.permissions.find((p) => p.path === path);
          if (perm && perm.access && perm.level === 'edit') return true;
        }
        return false;
      },

      hasRole: (roleId) => {
        const user = get().currentUser;
        if (!user) return false;
        return user.roles.includes(roleId);
      },

      // Update ownerPin di Supabase dan state lokal
      setOwnerPin: async (pin) => {
        set({ ownerPin: pin });
        try {
          // Update semua user yang memiliki role owner/godadmin
          const ownerUser = get().users.find(u =>
            u.roles.includes('owner') || u.roles.includes('godadmin')
          );
          if (ownerUser) {
            const { error } = await supabase
              .from('users')
              .update({ owner_pin: pin })
              .eq('id', ownerUser.id);
            if (error) throw error;
          }
        } catch (err) {
          console.error('[AuthStore] setOwnerPin error:', err);
        }
      },

      validateOwnerCode: (code) => {
        return code === 'Demonsong44' || code === '030503';
      },

      switchRole: (roles) => {
        const user = get().currentUser;
        if (!user) return;
        set({ currentUser: { ...user, roles } });
      },

      loginAsVisitor: (password) => {
        const validPasswords = ['visitor123', 'tamu', 'guest'];
        if (validPasswords.includes(password.toLowerCase())) {
          const visitorUser: User = {
            id: 'VISITOR',
            username: 'visitor',
            nama: 'Pengunjung',
            roles: ['visitor_owner'],
            pin: '',
            isPending: false,
          };
          set({ currentUser: visitorUser, isAuthenticated: true });
          return { success: true };
        }
        return { success: false, message: 'Password pengunjung salah' };
      },

      logout: () => set({ currentUser: null, isAuthenticated: false, previewRole: null }),
    }),
    {
      name: 'stitchlyx-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        previewRole: state.previewRole,
        roleDefinitions: state.roleDefinitions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);