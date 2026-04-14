import { create } from 'zustand';
import { User, RoleDefinition, AccessLevel } from '../types';
import { ROLES } from '../lib/constants/roles';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  roleDefinitions: RoleDefinition[];
  users: User[];
  
  // Actions
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  removeUser: (id: string) => void;
  
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
const defaultRoles: RoleDefinition[] = [
  { id: 'owner', label: 'Owner', permissions: [] }, // Empty permissions means full access for owner logic
  { id: 'admin_produksi', label: 'Admin Produksi', permissions: [
    { path: '/produksi', access: true, level: 'edit' },
    { path: '/dashboard/produksi', access: true, level: 'view' },
  ]},
  { id: 'mandor', label: 'Mandor', permissions: [
    { path: '/produksi/scan', access: true, level: 'edit' },
  ]},
];

const dummyOwner: User = {
  id: 'USR-001',
  username: 'owner',
  nama: 'Owner Syncore',
  roles: ['owner'],
  pin: '030503'
};

const dummyUsers: User[] = [
  dummyOwner,
  { id: 'USR-002', username: 'admin_produksi', nama: 'Budi Produksi', roles: ['admin_produksi'] },
];

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: dummyOwner,
  isAuthenticated: true,
  isPreviewMode: false,
  roleDefinitions: defaultRoles,
  users: dummyUsers,

  togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),

  addUser: (item) => set((state) => ({ users: [...state.users, item] })),
  updateUser: (id, data) => set((state) => ({ users: state.users.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeUser: (id) => set((state) => ({ users: state.users.filter(i => i.id !== id) })),
  
  addRole: (role) => set((state) => ({ roleDefinitions: [...state.roleDefinitions, role] })),
  updateRole: (id, data) => set((state) => ({ roleDefinitions: state.roleDefinitions.map(r => r.id === id ? { ...r, ...data } : r) })),
  removeRole: (id) => set((state) => ({ roleDefinitions: state.roleDefinitions.filter(r => r.id !== id) })),

  canAccess: (path) => {
    // Preview Mode bypass
    if (get().isPreviewMode) return true;

    const user = get().currentUser;
    if (!user) return false;
    
    // Owner bypass
    if (user.roles.includes('owner')) return true;
    
    // Check all user's roles for access to this path
    const roles = get().roleDefinitions.filter(rd => user.roles.includes(rd.id));
    
    return roles.some(role => 
      role.permissions.some(p => (path.startsWith(p.path) || p.path === 'all') && p.access)
    );
  },

  canEdit: (path) => {
    // Preview Mode bypass
    if (get().isPreviewMode) return true;

    const user = get().currentUser;
    if (!user) return false;
    
    // Owner bypass
    if (user.roles.includes('owner')) return true;
    
    const roles = get().roleDefinitions.filter(rd => user.roles.includes(rd.id));
    
    return roles.some(role => 
      role.permissions.some(p => (path.startsWith(p.path) || p.path === 'all') && p.access && p.level === 'edit')
    );
  },

  hasRole: (roleId) => {
    const user = get().currentUser;
    return user ? user.roles.includes(roleId) : false;
  },

  login: () => {
    set({ currentUser: dummyOwner, isAuthenticated: true });
    return true;
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

