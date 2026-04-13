import { create } from 'zustand';
import { SerahTerimaJahit } from '../types';

interface SerahTerimaState {
  records: SerahTerimaJahit[];
  addRecord: (record: SerahTerimaJahit) => void;
  getByBarcode: (barcode: string) => SerahTerimaJahit | undefined;
}

export const useSerahTerimaStore = create<SerahTerimaState>((set, get) => ({
  records: [],
  
  addRecord: (record) => set((state) => ({ 
    records: [...state.records, record] 
  })),
  
  getByBarcode: (barcode) => get().records.find(r => r.barcode === barcode),
}));
