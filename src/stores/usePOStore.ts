import { create } from 'zustand';
import { PurchaseOrder, PemakaianBahan } from '@/types';
import { useLogStore } from './useLogStore';
import { useAuthStore } from './useAuthStore';
import { fixedPOs } from '../data/fixed-testing-data';

interface POState {
  poList: PurchaseOrder[];
  globalSequence: number;
  addPO: (po: PurchaseOrder) => void;
  updatePO: (id: string, data: Partial<PurchaseOrder>) => void;
  removePO: (id: string) => void;
  getPOById: (id: string) => PurchaseOrder | undefined;
  getNextNomorPO: () => string;
  incrementGlobalSequence: (count: number) => number;
  stuckThresholdHours: number;
  setStuckThreshold: (hours: number) => void;
  pemakaianBahan: PemakaianBahan[];
  addPemakaianBahan: (data: PemakaianBahan) => void;
  getPemakaianBahan: (poId: string, modelId: string, warnaId: string, sizeId: string) => PemakaianBahan | undefined;
  updateItemCuttingStatus: (itemId: string, status: 'waiting' | 'started' | 'finished') => void;
}

export const usePOStore = create<POState>((set, get) => ({
  poList: [],
  globalSequence: 1,

  addPO: (po: PurchaseOrder) => {
    set((state: POState) => ({ poList: [...state.poList, po] }));
    
    // Log Activity
    const user = useAuthStore.getState().currentUser;
    if (user) {
      useLogStore.getState().addLog({
        user: { id: user.id, nama: user.nama, role: user.roles[0] || 'User' },
        modul: 'produksi',
        aksi: 'Buat PO Baru',
        target: po.nomorPO,
        metadata: { items: po.items.length }
      });
    }
  },
  
  updatePO: (id: string, data: Partial<PurchaseOrder>) => {
    set((state: POState) => ({
      poList: state.poList.map((p: PurchaseOrder) => p.id === id ? { ...p, ...data } : p)
    }));

    // Log Activity
    const user = useAuthStore.getState().currentUser;
    const po = get().getPOById(id);
    if (user && po) {
      useLogStore.getState().addLog({
        user: { id: user.id, nama: user.nama, role: user.roles[0] || 'User' },
        modul: 'produksi',
        aksi: 'Update PO',
        target: po.nomorPO
      });
    }
  },

  removePO: (id: string) => {
    const po = get().getPOById(id);
    set((state: POState) => ({
      poList: state.poList.filter((p: PurchaseOrder) => p.id !== id)
    }));

    // Log Activity
    const user = useAuthStore.getState().currentUser;
    if (user && po) {
      useLogStore.getState().addLog({
        user: { id: user.id, nama: user.nama, role: user.roles[0] || 'User' },
        modul: 'produksi',
        aksi: 'Hapus PO',
        target: po.nomorPO
      });
    }
  },

  getPOById: (id: string) => get().poList.find((p: PurchaseOrder) => p.id === id),

  getNextNomorPO: () => {
    const list = get().poList;
    if (list.length === 0) return 'PO-001';
    const lastPO = list[list.length - 1];
    const sequence = parseInt(lastPO.nomorPO.replace('PO-', '')) || 0;
    return `PO-${(sequence + 1).toString().padStart(3, '0')}`;
  },

  incrementGlobalSequence: (count: number) => {
    const current = get().globalSequence;
    set({ globalSequence: current + count });
    return current + 1;
  },
  stuckThresholdHours: 24,
  setStuckThreshold: (hours: number) => set({ stuckThresholdHours: hours }),
  pemakaianBahan: [],
  addPemakaianBahan: (data: PemakaianBahan) => set((state: POState) => ({ pemakaianBahan: [...state.pemakaianBahan, data] })),
  getPemakaianBahan: (poId: string, modelId: string, warnaId: string, sizeId: string) => 
    get().pemakaianBahan.find((p: PemakaianBahan) => p.po === poId && p.modelId === modelId && p.warnaId === warnaId && p.sizeId === sizeId),
  updateItemCuttingStatus: (itemId: string, status: 'waiting' | 'started' | 'finished') => set((state) => ({
    poList: state.poList.map(po => ({
      ...po,
      items: po.items.map(item => item.id === itemId ? { ...item, statusCutting: status } : item)
    }))
  }))
}));
