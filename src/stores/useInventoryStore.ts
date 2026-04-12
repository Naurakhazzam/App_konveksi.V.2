import { create } from 'zustand';
import { InventoryItem, TransaksiMasuk, TransaksiKeluar } from '../types';
import { initialInventoryItems } from '../data/initial-production-data';

interface InventoryState {
  items: InventoryItem[];
  trxKeluar: TransaksiKeluar[];
  trxMasuk: TransaksiMasuk[];
  
  addItem: (item: InventoryItem) => void;
  updateStock: (id: string, qty: number) => void; 
  addTrxKeluar: (trx: TransaksiKeluar) => void;
  addTrxMasuk: (trx: TransaksiMasuk) => void;   
  getAlertItems: () => InventoryItem[];         
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: initialInventoryItems,
  trxKeluar: [],
  trxMasuk: [],
  
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  
  updateStock: (id, qty) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, stokAktual: i.stokAktual + qty } : i)
  })),
  
  addTrxKeluar: (trx) => {
    set((state) => ({ trxKeluar: [...state.trxKeluar, trx] }));
    get().updateStock(trx.itemId, -trx.qty);
  },
  
  addTrxMasuk: (trx) => {
    set((state) => ({ trxMasuk: [...state.trxMasuk, trx] }));
    get().updateStock(trx.itemId, trx.qty);
  },
  
  getAlertItems: () => get().items.filter(i => i.stokAktual <= i.stokMinimum)
}));
