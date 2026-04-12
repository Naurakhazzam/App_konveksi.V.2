import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ScanRecord {
  id: string;
  barcode: string;
  po: string;
  tahap: string;
  aksi: 'terima' | 'selesai' | 'reject';
  qty: number;
  waktu: string;
}

interface ScanState {
  history: ScanRecord[];
  addRecord: (record: ScanRecord) => void;
  getHistoryByStage: (tahap: string) => ScanRecord[];
  clearHistory: () => void;
}

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      history: [],
      addRecord: (record) => set((state) => ({ 
        history: [record, ...state.history].slice(0, 50) // Keep last 50
      })),
      getHistoryByStage: (tahap) => get().history.filter(r => r.tahap === tahap),
      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'scan-history-storage'
    }
  )
);
