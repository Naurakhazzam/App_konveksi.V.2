import { create } from 'zustand';
import { ReturnItem, ReturnStatus } from '@/types/production.types';

interface ReturnState {
  returns: ReturnItem[];
  addReturn: (item: ReturnItem) => void;
  updateReturnStatus: (id: string, status: ReturnStatus, updates?: Partial<ReturnItem>) => void;
  getReturnByBarcode: (barcode: string) => ReturnItem | undefined;
  isBarcodeInReturn: (barcode: string) => boolean;
  getPendingReturns: () => ReturnItem[];
  removeReturnByBarcode: (barcode: string) => void;
  removeReturnsByPO: (poId: string) => void;
}

export const useReturnStore = create<ReturnState>((set, get) => ({
  returns: [],
  
  addReturn: (item) => set((state) => ({ returns: [...state.returns, item] })),
  
  updateReturnStatus: (id, status, updates) => set((state) => ({
    returns: state.returns.map((r) => 
      r.id === id ? { ...r, status, ...updates } : r
    )
  })),
  
  getReturnByBarcode: (barcode) => 
    get().returns.find(r => r.barcode === barcode && r.status !== 'selesai'),
    
  isBarcodeInReturn: (barcode) => 
    get().returns.some(r => r.barcode === barcode && r.status !== 'selesai'),

  getPendingReturns: () => 
    get().returns.filter(r => r.status !== 'selesai'),

  removeReturnByBarcode: (barcode) => set((state) => ({
    returns: state.returns.filter(r => r.barcode !== barcode)
  })),

  removeReturnsByPO: (poId) => set((state) => ({
    returns: state.returns.filter(r => r.poId !== poId)
  }))
}));
