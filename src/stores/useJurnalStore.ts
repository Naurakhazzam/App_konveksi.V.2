import { create } from 'zustand';
import { JurnalEntry, JenisTransaksi } from '../types';
import { useInventoryStore } from './useInventoryStore';

interface JurnalState {
  entries: JurnalEntry[];
  
  addEntry: (entry: JurnalEntry) => void;
  getByPeriode: (startDate: string, endDate: string) => JurnalEntry[];
  getByJenis: (jenis: JenisTransaksi) => JurnalEntry[];
  getTotalByTipe: (tipe: 'masuk' | 'keluar') => number;
}

export const useJurnalStore = create<JurnalState>((set, get) => ({
  entries: [],
  
  addEntry: (entry) => {
    set((state) => ({ entries: [...state.entries, entry] }));

    // 4. LOGIKA BARU: Jika ini pembelian bahan (direct_bahan), sambungkan ke Inventory
    if (entry.jenis === 'direct_bahan' && entry.inventoryItemId) {
      const { addBatch } = useInventoryStore.getState();
      addBatch({
        id: `BTC-AUTO-${Date.now()}`,
        itemId: entry.inventoryItemId,
        qty: entry.qty || 0,
        qtyTerpakai: 0,
        hargaSatuan: entry.nominal / (entry.qty || 1),
        tanggal: entry.tanggal,
        invoiceNo: entry.noFaktur || 'VIA-JURNAL',
        keterangan: `Input otomatis via Jurnal: ${entry.keterangan}`
      });
    }
  },
  
  getByPeriode: (startDate, endDate) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return get().entries.filter(e => {
      const time = new Date(e.tanggal).getTime();
      return time >= start && time <= end;
    });
  },
  
  getByJenis: (jenis) => get().entries.filter(e => e.jenis === jenis),
  
  getTotalByTipe: (tipe) => {
    return get().entries.filter(e => {
      if (tipe === 'masuk') return e.jenis === 'masuk';
      return e.jenis !== 'masuk';
    }).reduce((acc, curr) => acc + curr.nominal, 0);
  }
}));
