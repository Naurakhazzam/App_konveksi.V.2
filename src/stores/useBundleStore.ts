import { create } from 'zustand';
import { Bundle, StatusTahap } from '../types';

interface BundleState {
  bundles: Bundle[];
  rejectRecords: any[];
  addBundle: (bundle: Bundle) => void;
  updateStatusTahap: (barcode: string, tahap: string, updates: Partial<StatusTahap>) => void;
  getBundleByBarcode: (barcode: string) => Bundle | undefined;
  getBundlesByPO: (poId: string) => Bundle[];
}

const defaultStatus: StatusTahap = {
  status: null,
  qtyTerima: null,
  qtySelesai: null,
  waktuTerima: null,
  waktuSelesai: null,
  karyawan: null,
};

// Generate dummy bundles
const dummyBundles: Bundle[] = [];

// PO-001 Article 1 (SZ-002 / M) - 5 Bundles
for (let i = 1; i <= 5; i++) {
  const seq = i.toString().padStart(5, '0');
  const bdl = i.toString().padStart(2, '0');
  dummyBundles.push({
    barcode: `PO001-AIR-HIT-M-${seq}-BDL${bdl}`,
    po: 'PO-001',
    model: 'MDL-001',
    warna: 'WRN-001',
    size: 'SZ-002',
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

// PO-001 Article 2 (SZ-003 / L) - 5 Bundles
for (let i = 6; i <= 10; i++) {
  const seq = i.toString().padStart(5, '0');
  const bdl = i.toString().padStart(2, '0');
  dummyBundles.push({
    barcode: `PO001-AIR-HIT-L-${seq}-BDL${bdl}`,
    po: 'PO-001',
    model: 'MDL-001',
    warna: 'WRN-001',
    size: 'SZ-003',
    qtyBundle: 12,
    skuKlien: 'SKU-002',
    skuInternal: 'INT-002',
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

// PO-002 Article 3 (SZ-004 / XL) - 2 Bundles
for (let i = 1; i <= 2; i++) {
  const seq = i.toString().padStart(5, '0');
  const bdl = i.toString().padStart(2, '0');
  dummyBundles.push({
    barcode: `PO002-NEC-WHT-XL-${seq}-BDL${bdl}`,
    po: 'PO-002',
    model: 'MDL-002',
    warna: 'WRN-002',
    size: 'SZ-004',
    qtyBundle: 12,
    skuKlien: 'SKU-003',
    skuInternal: 'INT-003',
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
}));
