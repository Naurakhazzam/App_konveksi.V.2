import { create } from 'zustand';
import { Bundle, StatusTahap } from '../types';
import { fixedBundles } from '../data/fixed-testing-data';

export interface RejectRecord {
  id: string;
  barcode: string;
  tahap: string;
  jenisRejectId: string;
  qty: number;
  catatan: string;
  waktu: string;
}

interface BundleState {
  bundles: Bundle[];
  rejectRecords: RejectRecord[];
  addBundle: (bundle: Bundle) => void;
  updateStatusTahap: (barcode: string, tahap: string, updates: Partial<StatusTahap>) => void;
  getBundleByBarcode: (barcode: string) => Bundle | undefined;
  getBundlesByPO: (poId: string) => Bundle[];
  addBundles: (newBundles: Bundle[]) => void;
  markUpahPaid: (poId: string) => void;
  addRejectRecord: (record: RejectRecord) => void;
  removeBundlesByPO: (poId: string) => void;
}

const defaultStatus: StatusTahap = {
  status: null,
  qtyTerima: null,
  qtySelesai: null,
  waktuTerima: null,
  waktuSelesai: null,
  karyawan: null,
  koreksiStatus: null,
  koreksiAlasan: null,
};

export const useBundleStore = create<BundleState>((set, get) => ({
  bundles: [],
  rejectRecords: [],
  addBundle: (bundle) => set((state) => ({ bundles: [...state.bundles, bundle] })),
  updateStatusTahap: (barcode, tahap, updates) => set((state) => ({
    bundles: state.bundles.map((b) => 
      b.barcode === barcode 
        ? { 
            ...b, 
            statusTahap: { 
              ...b.statusTahap, 
              [tahap]: { ...b.statusTahap[tahap as keyof typeof b.statusTahap], ...updates } 
            } 
          } 
        : b
    ),
  })),
  getBundleByBarcode: (barcode) => get().bundles.find((b) => b.barcode === barcode),
  getBundlesByPO: (poId: string) => get().bundles.filter((b) => b.po === poId),
  addBundles: (newBundles) => set((state) => ({ bundles: [...state.bundles, ...newBundles] })),
  markUpahPaid: (poId) => set((state) => ({
    bundles: state.bundles.map((b) => {
      if (b.po !== poId) return b;
      const newStatusTahap = { ...b.statusTahap };
      (Object.keys(newStatusTahap) as (keyof typeof b.statusTahap)[]).forEach((tahap) => {
        if (newStatusTahap[tahap].status === 'selesai') {
          newStatusTahap[tahap] = { ...newStatusTahap[tahap], upahDibayar: true };
        }
      });
      return { ...b, statusTahap: newStatusTahap };
    }),
  })),
  addRejectRecord: (record) => set((state) => ({ rejectRecords: [...state.rejectRecords, record] })),
  removeBundlesByPO: (poId) => set((state) => ({
    bundles: state.bundles.filter((b) => b.po !== poId)
  })),
}));
