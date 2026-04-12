import { create } from 'zustand';
import { Bundle, StatusTahap } from '@/types';

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
  addBundles: (bundles: Bundle[]) => void;
  getBundlesByPO: (poId: string) => Bundle[];
  getBundleByBarcode: (barcode: string) => Bundle | undefined;
  updateStatusTahap: (barcode: string, tahap: keyof Bundle['statusTahap'], data: Partial<StatusTahap>) => void;
  addRejectRecord: (record: RejectRecord) => void;
  markUpahPaid: (poId: string) => void;
}

const defaultStatus: StatusTahap = {
  status: null, qtyTerima: 0, qtySelesai: 0,
  waktuTerima: null, waktuSelesai: null, karyawan: null,
  koreksiStatus: null, koreksiAlasan: null
};

// Generate dummy bundles — PO-001 bundles (10 bundles, ukuran M)
const dummyBundles: Bundle[] = [];
for (let i = 1; i <= 10; i++) {
  const seq = i.toString().padStart(5, '0');
  const bdl = i.toString().padStart(2, '0');
  dummyBundles.push({
    barcode: `PO001-JAK-HIT-M-${seq}-BDL${bdl}-01-10-23`,
    po: 'PO-001',
    model: 'MDL-001',
    warna: 'WRN-001',
    size: 'SZ-001',
    qtyBundle: 12,
    skuKlien: 'SKU-001',
    skuInternal: 'INT-001',
    statusTahap: {
      cutting: { ...defaultStatus },
      jahit: { ...defaultStatus },
      lkancing: { ...defaultStatus },
      bbenang: { ...defaultStatus },
      qc: { ...defaultStatus },
      steam: { ...defaultStatus },
      packing: { ...defaultStatus },
    }
  });
}

export const useBundleStore = create<BundleState>((set, get) => ({
  bundles: dummyBundles,
  rejectRecords: [],

  addBundle: (bundle) => set((state) => ({ bundles: [...state.bundles, bundle] })),

  addBundles: (newBundles) => set((state) => ({ bundles: [...state.bundles, ...newBundles] })),

  getBundlesByPO: (poId) => get().bundles.filter(b => b.po === poId),

  getBundleByBarcode: (barcode) => get().bundles.find(b => b.barcode === barcode),

  updateStatusTahap: (barcode, tahap, data) => set((state) => ({
    bundles: state.bundles.map(b => {
      if (b.barcode === barcode) {
        return {
          ...b,
          statusTahap: {
            ...b.statusTahap,
            [tahap]: { ...b.statusTahap[tahap], ...data }
          }
        };
      }
      return b;
    })
  })),

  addRejectRecord: (record) => set((state) => ({
    rejectRecords: [...state.rejectRecords, record]
  })),

  markUpahPaid: (poId) => set((state) => ({
    bundles: state.bundles.map(b => {
      if (b.po === poId) {
        const newStatusTahap = { ...b.statusTahap };
        Object.keys(newStatusTahap).forEach(tahap => {
          const key = tahap as keyof Bundle['statusTahap'];
          if (newStatusTahap[key].status === 'selesai') {
            newStatusTahap[key] = { ...newStatusTahap[key], upahDibayar: true };
          }
        });
        return { ...b, statusTahap: newStatusTahap };
      }
      return b;
    })
  })),
}));
