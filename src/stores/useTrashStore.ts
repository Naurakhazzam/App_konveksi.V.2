import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface TrashItem {
  id: string;
  type: 'po' | 'karyawan' | 'gaji' | 'klien' | 'inventory';
  label: string;      // Nama/Nomor PO untuk display
  data: any;          // Full object state before deletion
  trashedAt: string;
  trashedBy: string;
}

interface TrashState {
  trashedItems: TrashItem[];
  isLoading: boolean;

  loadTrash: () => Promise<void>;
  addToTrash: (item: Omit<TrashItem, 'trashedAt'>) => Promise<void>;
  restoreItem: (id: string) => Promise<TrashItem | null>;
  purgeItem: (id: string) => Promise<void>;
  clearTrash: () => Promise<void>;
}

// ── Helper: DB row → TrashItem ───────────────────────────────────────────────

function mapTrash(row: any): TrashItem {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    data: row.data,
    trashedAt: row.trashed_at ?? row.created_at ?? '',
    trashedBy: row.trashed_by ?? '',
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useTrashStore = create<TrashState>((set, get) => ({
  trashedItems: [],
  isLoading: false,

  // ── LOAD ──────────────────────────────────────────────────────────────────

  loadTrash: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('trash_bin')
        .select('*')
        .order('trashed_at', { ascending: false });

      if (error) throw error;

      set({ trashedItems: (data ?? []).map(mapTrash), isLoading: false });
    } catch (err) {
      console.error('[useTrashStore] loadTrash error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD TO TRASH ──────────────────────────────────────────────────────────

  addToTrash: async (item) => {
    const newItem: TrashItem = {
      ...item,
      trashedAt: new Date().toISOString(),
    };
    set((state) => ({ trashedItems: [newItem, ...state.trashedItems] }));
    try {
      const { error } = await supabase.from('trash_bin').insert({
        id: newItem.id,
        type: newItem.type,
        label: newItem.label,
        data: newItem.data,
        trashed_at: newItem.trashedAt,
        trashed_by: newItem.trashedBy,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[useTrashStore] addToTrash error:', err);
      set((state) => ({
        trashedItems: state.trashedItems.filter((i) => i.id !== newItem.id),
      }));
    }
  },

  // ── RESTORE ITEM ──────────────────────────────────────────────────────────

  restoreItem: async (id) => {
    const item = get().trashedItems.find((i) => i.id === id);
    if (!item) return null;

    set((state) => ({
      trashedItems: state.trashedItems.filter((i) => i.id !== id),
    }));
    try {
      const { error } = await supabase.from('trash_bin').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[useTrashStore] restoreItem error:', err);
      // Rollback
      set((state) => ({ trashedItems: [item, ...state.trashedItems] }));
      return null;
    }
    return item;
  },

  // ── PURGE ITEM (permanent delete) ────────────────────────────────────────

  purgeItem: async (id) => {
    set((state) => ({
      trashedItems: state.trashedItems.filter((i) => i.id !== id),
    }));
    try {
      const { error } = await supabase.from('trash_bin').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[useTrashStore] purgeItem error:', err);
    }
  },

  // ── CLEAR ALL TRASH ───────────────────────────────────────────────────────

  clearTrash: async () => {
    const prev = get().trashedItems;
    set({ trashedItems: [] });
    try {
      const { error } = await supabase.from('trash_bin').delete().neq('id', '');
      if (error) throw error;
    } catch (err) {
      console.error('[useTrashStore] clearTrash error:', err);
      set({ trashedItems: prev });
    }
  },
}));
