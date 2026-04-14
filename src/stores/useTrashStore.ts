import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addToTrash: (item: Omit<TrashItem, 'trashedAt'>) => void;
  restoreItem: (id: string) => TrashItem | null;
  purgeItem: (id: string) => void;
  clearTrash: () => void;
}

export const useTrashStore = create<TrashState>()(
  persist(
    (set, get) => ({
      trashedItems: [],

      addToTrash: (item) => {
        const newItem: TrashItem = {
          ...item,
          trashedAt: new Date().toISOString(),
        };
        set((state) => ({ trashedItems: [newItem, ...state.trashedItems] }));
      },

      restoreItem: (id) => {
        const item = get().trashedItems.find((i) => i.id === id);
        if (!item) return null;

        set((state) => ({
          trashedItems: state.trashedItems.filter((i) => i.id !== id),
        }));
        return item;
      },

      purgeItem: (id) => {
        set((state) => ({
          trashedItems: state.trashedItems.filter((i) => i.id !== id),
        }));
      },

      clearTrash: () => set({ trashedItems: [] }),
    }),
    {
      name: 'stitchlyx-trash-storage',
    }
  )
);
