import { create } from 'zustand';
import { PurchaseOrder, PemakaianBahan } from '@/types';

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

const dummyPOs: PurchaseOrder[] = [
  {
    id: 'PO-001',
    klienId: 'KLN-001',
    nomorPO: 'PO-001',
    tanggalInput: '2023-10-01',
    status: 'aktif',
    items: [
      { id: 'ITM-001', poId: 'PO-001', modelId: 'MDL-001', warnaId: 'WRN-001', sizeId: 'SZ-M', qty: 120, qtyPerBundle: 12, jumlahBundle: 10, skuKlien: 'SKU-001', skuInternal: 'INT-001', statusCutting: 'waiting' },
      { id: 'ITM-002', poId: 'PO-001', modelId: 'MDL-001', warnaId: 'WRN-001', sizeId: 'SZ-L', qty: 96, qtyPerBundle: 12, jumlahBundle: 8, skuKlien: 'SKU-002', skuInternal: 'INT-002', statusCutting: 'waiting' }
    ]
  },
  {
    id: 'PO-002',
    klienId: 'KLN-002',
    nomorPO: 'PO-002',
    tanggalInput: '2023-10-05',
    status: 'aktif',
    items: [
      { id: 'ITM-003', poId: 'PO-002', modelId: 'MDL-002', warnaId: 'WRN-002', sizeId: 'SZ-XL', qty: 48, qtyPerBundle: 12, jumlahBundle: 4, skuKlien: 'SKU-003', skuInternal: 'INT-003', statusCutting: 'waiting' }
    ]
  }
];

export const usePOStore = create<POState>((set, get) => ({
  poList: dummyPOs,
  globalSequence: 23,

  addPO: (po: PurchaseOrder) => set((state: POState) => ({ poList: [...state.poList, po] })),
  
  updatePO: (id: string, data: Partial<PurchaseOrder>) => set((state: POState) => ({
    poList: state.poList.map((p: PurchaseOrder) => p.id === id ? { ...p, ...data } : p)
  })),

  removePO: (id: string) => set((state: POState) => ({
    poList: state.poList.filter((p: PurchaseOrder) => p.id !== id)
  })),

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
