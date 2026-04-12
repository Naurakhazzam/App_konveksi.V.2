import { create } from 'zustand';
import { AuditEntry } from '../types/audit.types';

interface LogState {
  logs: AuditEntry[];
  addLog: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

const dummyLogs: AuditEntry[] = [
  { id: 'LOG-001', user: { id: 'U-01', nama: 'Admin Utama', role: 'Owner' }, modul: 'keuangan', aksi: 'Tambah Transaksi', target: 'Pembelian Kain', timestamp: '2026-04-12T08:00:00Z' },
  { id: 'LOG-002', user: { id: 'U-01', nama: 'Admin Utama', role: 'Owner' }, modul: 'penggajian', aksi: 'Bayar Gaji', target: 'Ahmad Fauzi', timestamp: '2026-04-12T09:30:00Z' },
  { id: 'LOG-003', user: { id: 'U-01', nama: 'Admin Utama', role: 'Owner' }, modul: 'inventory', aksi: 'Update Stok', target: 'Kain Katun', timestamp: '2026-04-12T10:15:00Z' },
];

export const useLogStore = create<LogState>((set) => ({
  logs: dummyLogs,
  addLog: (entry) => set((state) => ({
    logs: [
      {
        ...entry,
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString()
      },
      ...state.logs
    ].slice(0, 100) // Keep last 100 logs
  })),
  clearLogs: () => set({ logs: [] })
}));
