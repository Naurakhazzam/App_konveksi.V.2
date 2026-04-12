import { create } from 'zustand';
import { JurnalEntry, JenisTransaksi } from '../types';
import { dummyJurnal } from '../data/dummy-journal';

interface JurnalState {
  entries: JurnalEntry[];
  
  addEntry: (entry: JurnalEntry) => void;
  getByPeriode: (startDate: string, endDate: string) => JurnalEntry[];
  getByJenis: (jenis: JenisTransaksi) => JurnalEntry[];
  getTotalByTipe: (tipe: 'masuk' | 'keluar') => number;
}

export const useJurnalStore = create<JurnalState>((set, get) => ({
  entries: [],
  
  addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),
  
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
