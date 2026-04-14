import { create } from 'zustand';
import { InventoryItem, TransaksiMasuk, TransaksiKeluar, InventoryBatch } from '../types';
import { initialInventoryItems } from '../data/initial-production-data';

interface InventoryState {
  items: InventoryItem[];
  batches: InventoryBatch[];
  trxKeluar: TransaksiKeluar[];
  trxMasuk: TransaksiMasuk[];
  invoiceCounter: number;
  
  addItem: (item: InventoryItem) => void;
  updateStock: (id: string, qty: number) => void; 
  addBatch: (batch: InventoryBatch) => void;
  addTrxKeluar: (trx: TransaksiKeluar) => void;
  addTrxMasuk: (trx: TransaksiMasuk) => void;   
  getAlertItems: () => InventoryItem[];
  
  // FIFO Actions
  consumeFIFO: (itemId: string, qtyNeeded: number) => { 
    totalCost: number; 
    consumedBatches: { batchId: string; qty: number; harga: number }[] 
  };
  generateInvoiceNo: () => string;
  getHargaRataRata: (itemId: string) => number;
  convertToMeter: (val: number, fromUnit: string) => number;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: initialInventoryItems,
  batches: [],
  trxKeluar: [],
  trxMasuk: [],
  invoiceCounter: 1,
  
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  
  updateStock: (id, qty) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, stokAktual: i.stokAktual + qty } : i)
  })),

  addBatch: (batch) => {
    set((state) => ({ 
      batches: [...state.batches, batch]
    }));
    get().updateStock(batch.itemId, batch.qty);
  },
  
  addTrxKeluar: (trx) => {
    set((state) => ({ trxKeluar: [...state.trxKeluar, trx] }));
    // updateStock is handled inside consumeFIFO if called, 
    // but standard addTrxKeluar still needs to sync item stock if not using FIFO.
    // However, the redesign expects consumeFIFO to be called before this.
  },
  
  addTrxMasuk: (trx) => {
    set((state) => ({ trxMasuk: [...state.trxMasuk, trx] }));
    // Note: In the new system, we prefer using addBatch for material purchases.
  },
  
  getAlertItems: () => get().items.filter(i => i.stokAktual <= i.stokMinimum),

  generateInvoiceNo: () => {
    const { invoiceCounter } = get();
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    
    const nextNo = String(invoiceCounter).padStart(4, '0');
    const invoiceNo = `${nextNo}/INV/${dd}/${mm}/${yy}`;
    
    set({ invoiceCounter: invoiceCounter + 1 });
    return invoiceNo;
  },

  consumeFIFO: (itemId, qtyNeeded) => {
    const { batches } = get();
    // Sort items by date ASC - FIFO
    const relevantBatches = batches
      .filter(b => b.itemId === itemId && (b.qty - b.qtyTerpakai) > 0)
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    let remainingToConsume = qtyNeeded;
    let totalCost = 0;
    const consumedDetails: { batchId: string; qty: number; harga: number }[] = [];
    const updatedBatches = [...batches];

    for (const batch of relevantBatches) {
      if (remainingToConsume <= 0) break;

      const availableInBatch = batch.qty - batch.qtyTerpakai;
      const amountToTake = Math.min(availableInBatch, remainingToConsume);

      // Record consumption
      consumedDetails.push({
        batchId: batch.id,
        qty: amountToTake,
        harga: batch.hargaSatuan
      });

      totalCost += amountToTake * batch.hargaSatuan;
      remainingToConsume -= amountToTake;

      // Update current batch in our updated array
      const batchIdx = updatedBatches.findIndex(b => b.id === batch.id);
      if (batchIdx !== -1) {
        updatedBatches[batchIdx] = {
          ...updatedBatches[batchIdx],
          qtyTerpakai: updatedBatches[batchIdx].qtyTerpakai + amountToTake
        };
      }
    }

    set({ batches: updatedBatches });
    get().updateStock(itemId, -qtyNeeded);

    return { totalCost, consumedBatches: consumedDetails };
  },

  getHargaRataRata: (itemId) => {
    const { batches } = get();
    const activeBatches = batches.filter(b => b.itemId === itemId && (b.qty - b.qtyTerpakai) > 0);
    
    if (activeBatches.length === 0) return 0;

    const totalQty = activeBatches.reduce((acc, b) => acc + (b.qty - b.qtyTerpakai), 0);
    const totalValue = activeBatches.reduce((acc, b) => acc + ((b.qty - b.qtyTerpakai) * b.hargaSatuan), 0);
    
    return totalQty > 0 ? totalValue / totalQty : 0;
  },

  convertToMeter: (val, fromUnit) => {
    const unit = fromUnit.toLowerCase();
    if (unit === 'yard' || unit === 'yd') return val * 0.9144;
    if (unit === 'cm') return val / 100;
    return val; // Default assume meters
  }
}));
