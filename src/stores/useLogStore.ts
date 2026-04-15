import { create } from 'zustand';
import { AuditEntry } from '../types/audit.types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './useAuthStore';

interface LogState {
  logs: AuditEntry[];
  isLoading: boolean;
  loadLogs: () => Promise<void>;
  addLog: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  isLoading: false,

  // ── LOAD (ambil 100 log terbaru dari Supabase) ────────────────────────────

  loadLogs: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const logs: AuditEntry[] = (data ?? []).map((row: any) => ({
        id: row.id,
        user: {
          id: row.user_id ?? '',
          nama: row.detail?.user_nama ?? '',
          role: row.detail?.user_role ?? '',
        },
        modul: (row.target_tabel ?? 'produksi') as AuditEntry['modul'],
        aksi: row.aksi ?? '',
        target: row.target_id ?? '',
        timestamp: row.created_at ?? '',
        metadata: row.detail?.metadata ?? undefined,
      }));

      set({ logs, isLoading: false });
    } catch (err) {
      console.error('[useLogStore] loadLogs error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD LOG (fire-and-forget — tidak memblokir UI) ────────────────────────

  addLog: (entry) => {
    // Update state lokal langsung (tidak menunggu DB)
    const currentUser = useAuthStore.getState().currentUser;
    const finalUser = (entry.user.id === 'SYSTEM' || !entry.user.id) && currentUser
      ? { id: currentUser.id, nama: currentUser.nama, role: currentUser.roles[0] || 'User' }
      : entry.user;

    const newLog: AuditEntry = {
      ...entry,
      user: finalUser,
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      logs: [newLog, ...state.logs].slice(0, 100),
    }));

    // Simpan ke Supabase secara async tanpa blocking
    supabase.from('audit_log').insert({
      id: newLog.id,
      user_id: finalUser.id,
      aksi: entry.aksi,
      target_tabel: entry.modul,
      target_id: entry.target,
      detail: {
        user_nama: finalUser.nama,
        user_role: finalUser.role,
        metadata: entry.metadata ?? null,
      },
    }).then(({ error }) => {
      if (error) console.error('[useLogStore] addLog save error:', error.message);
    });
  },

  // ── CLEAR (hanya clear state lokal, data DB tetap tersimpan) ─────────────

  clearLogs: () => set({ logs: [] }),
}));
