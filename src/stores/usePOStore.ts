import { create } from 'zustand';
import { PurchaseOrder, PemakaianBahan } from '@/types';
import { useLogStore } from './useLogStore';
import { useAuthStore } from './useAuthStore';
import { useBundleStore } from './useBundleStore';
import { initialRealPOs, initialGlobalSequence } from '../data/real-po-data';

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
  // NEW: Atomic PO & Bundle Creation
  createPOWithBundles: (po: PurchaseOrder, bundles: any[]) => void;
}

export const usePOStore = create<POState>((set, get) => ({
  poList: initialRealPOs,
  globalSequence: initialGlobalSequence,

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

    // Cleanup associated bundles and corrections
    const { useKoreksiStore } = require('./useKoreksiStore');
    useBundleStore.getState().removeBundlesByPO(id);
    useKoreksiStore.getState().removeKoreksiByPO(id);

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
    return current;
  },
  stuckThresholdHours: 24,
  setStuckThreshold: (hours: number) => set({ stuckThresholdHours: hours }),
  pemakaianBahan: [],
  addPemakaianBahan: (data: PemakaianBahan) => {
    // 1. Update internal PO store
    set((state: POState) => ({ pemakaianBahan: [...state.pemakaianBahan, data] }));

    // 2. LOGIKA BARU: Potong Stok Inventori (FIFO)
    if (data.inventoryItemId) {
      const { useInventoryStore } = require('./useInventoryStore');
      const invStore = useInventoryStore.getState();
      const inventoryItem = invStore.items.find((i: any) => i.id === data.inventoryItemId);
      
      if (inventoryItem) {
        // Cari total QTY untuk artikel ini dari PO
        const currentPO = get().poList.find(p => p.id === data.po);
        const poItem = currentPO?.items.find(it => 
          it.modelId === data.modelId && 
          it.warnaId === data.warnaId && 
          it.sizeId === data.sizeId
        );

        if (poItem) {
          const totalQty = poItem.qty;
          let qtyToConsume = 0;
          let unitLabel = '';

          // Logika dual-indicator: Cek satuan di gudang
          // Jika m/yard -> gunakan cm input
          // Jika kg/g/pcs -> gunakan gram input
          const satuan = inventoryItem.satuanId.toLowerCase();
          
          if (satuan === 'm' || satuan === 'uom-001' || satuan === 'yard') {
            // Konversi cm ke Meter
            const meterTotal = (data.pemakaianKainMeter / 100) * totalQty;
            qtyToConsume = invStore.convertToMeter(meterTotal, 'm');
            unitLabel = 'Meter';
          } else if (satuan === 'kg' || satuan === 'uom-002') {
            // Konversi gram ke Kg
            qtyToConsume = (data.pemakaianBeratGram / 1000) * totalQty;
            unitLabel = 'Kg';
          } else {
            // Satuan lain (pcs/lsn) -> gunakan gram input sebagai raw qty jika tidak ada meter
            qtyToConsume = (data.pemakaianKainMeter || data.pemakaianBeratGram) * totalQty;
            unitLabel = satuan;
          }

          if (qtyToConsume > 0) {
            invStore.consumeFIFO(data.inventoryItemId, qtyToConsume);
            
            // Log Activity
            useLogStore.getState().addLog({
              user: { id: 'SYSTEM', nama: 'System', role: 'System' },
              modul: 'inventory',
              aksi: 'Auto-Potong Stok (Cutting)',
              target: inventoryItem.nama,
              metadata: { 
                po: data.po, 
                qtyDipotong: qtyToConsume, 
                unit: unitLabel,
                artikel: data.artikelNama
              }
            });
          }
        }
      }
    }
  },
  getPemakaianBahan: (poId: string, modelId: string, warnaId: string, sizeId: string) => 
    get().pemakaianBahan.find((p: PemakaianBahan) => p.po === poId && p.modelId === modelId && p.warnaId === warnaId && p.sizeId === sizeId),
  updateItemCuttingStatus: (itemId: string, status: 'waiting' | 'started' | 'finished') => set((state) => ({
    poList: state.poList.map(po => ({
      ...po,
      items: po.items.map(item => item.id === itemId ? { ...item, statusCutting: status } : item)
    }))
  })),

  createPOWithBundles: (po, bundles) => {
    // 1. Update PO list and sequence in ONE set call
    set((state) => ({
      poList: [...state.poList, po],
      globalSequence: state.globalSequence + bundles.length
    }));

    // 2. Update bundle store
    useBundleStore.getState().addBundles(bundles);

    // 3. Log Activity
    const user = useAuthStore.getState().currentUser;
    if (user) {
      useLogStore.getState().addLog({
        user: { id: user.id, nama: user.nama, role: user.roles[0] || 'User' },
        modul: 'produksi',
        aksi: 'Buat PO Baru (Atomic)',
        target: po.nomorPO,
        metadata: { items: po.items.length, bundles: bundles.length }
      });
    }
  }
}));
