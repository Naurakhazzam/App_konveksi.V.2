import { create } from 'zustand';
import { User, Role } from '../types';
import { ROLES, ROLE_PERMISSIONS } from '../lib/constants/roles';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  switchRole: (roles: Role[]) => void;
  validateOwnerCode: (code: string) => boolean;
  users: User[];
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  removeUser: (id: string) => void;
}

const dummyOwner: User = {
  id: 'USR-001',
  username: 'owner',
  nama: 'Owner Syncore',
  roles: [ROLES.OWNER as any],
  pin: '030503'
};

const dummyUsers: User[] = [
  dummyOwner,
  { id: 'USR-002', username: 'admin_produksi', nama: 'Budi Produksi', roles: ['admin_produksi' as any] },
  { id: 'USR-003', username: 'mandor', nama: 'Siti Mandor', roles: ['mandor' as any] },
];

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: dummyOwner,
  isAuthenticated: true,
  users: dummyUsers,

  addUser: (item) => set((state) => ({ users: [...state.users, item] })),
  updateUser: (id, data) => set((state) => ({ users: state.users.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeUser: (id) => set((state) => ({ users: state.users.filter(i => i.id !== id) })),
  
  login: (email, password) => {
    // Phase dummy: login selalu berhasil untuk email apapun
    set({ currentUser: dummyOwner, isAuthenticated: true });
    return true;
  },
  
  logout: () => set({ currentUser: null, isAuthenticated: false }),
  
  hasRole: (role) => {
    const user = get().currentUser;
    if (!user) return false;
    return user.roles.includes(role as any);
  },
  
  hasPermission: (permission) => {
    const user = get().currentUser;
    if (!user) return false;
    // Map roles to permissions based on the requested token
    // For now owner has viewMarginHPP, editMasterData, approveKoreksi, manageKasbon
    const isOwner = user.roles.includes(ROLES.OWNER as any);
    return isOwner; // Dummy implementation defaults to all true for OWNER
  },
  
  switchRole: (roles) => {
    const user = get().currentUser;
    if (!user) return;
    set({ currentUser: { ...user, roles } });
  },
  
  validateOwnerCode: (code) => {
    const user = get().currentUser;
    // We check if they have the owner role and the PIN matches their custom PIN.
    if (!user) return false;
    if (user.roles.includes(ROLES.OWNER as any)) {
      return user.pin === code;
    }
    return false;
  }
}));
