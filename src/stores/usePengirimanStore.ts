import { create } from 'zustand';
import { SuratJalan } from '@/types';

interface PengirimanState {
  suratJalanList: SuratJalan[];
  
  addSuratJalan: (sj: SuratJalan) => void;
  updateStatusSJ: (id: string, status: SuratJalan['status']) => void;
  getSuratJalanById: (id: string) => SuratJalan | undefined;
  getNextNomorSJ: () => string;
}

export const usePengirimanStore = create<PengirimanState>((set, get) => ({
  suratJalanList: [
    {
      id: 'SJ-0001',
      nomorSJ: 'SJ/202310/001',
      klienId: 'KLN-001',
      tanggal: '2023-10-12T08:00:00Z',
      items: [],
      totalQty: 240,
      totalBundle: 20,
      catatan: 'Kirim via JNE',
      status: 'dikirim',
      dibuatOleh: 'ADMIN',
      pengirim: 'Pak Budi'
    }
  ],

  addSuratJalan: (sj: SuratJalan) => set((state: PengirimanState) => ({ 
    suratJalanList: [...state.suratJalanList, sj] 
  })),

  updateStatusSJ: (id: string, status: SuratJalan['status']) => set((state: PengirimanState) => ({
    suratJalanList: state.suratJalanList.map((sj: SuratJalan) => sj.id === id ? { ...sj, status } : sj)
  })),

  getSuratJalanById: (id: string) => get().suratJalanList.find((sj: SuratJalan) => sj.id === id),

  getNextNomorSJ: () => {
    const list = get().suratJalanList;
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const sequence = list.length + 1;
    return `SJ/${yearMonth}/${sequence.toString().padStart(3, '0')}`;
  }
}));
