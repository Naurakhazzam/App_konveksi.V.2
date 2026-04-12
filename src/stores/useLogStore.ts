import { create } from 'zustand';
import { AuditEntry } from '../types/audit.types';

interface LogState {
  logs: AuditEntry[];
  addLog: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
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
