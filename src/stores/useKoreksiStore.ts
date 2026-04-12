import { create } from 'zustand';
import { TahapKey } from '@/lib/utils/production-helpers';

export interface KoreksiItem {
  id: string;
  barcode: string;
  tahap: TahapKey;
  qtyTarget: number;
  qtyAktual: number;
  tipe: 'lebih' | 'kurang';
  alasan: string;
  status: 'pending' | 'approved' | 'rejected';
  diajukanOleh: string;
  waktuAjukan: string;
  diReviewOleh?: string;
  waktuReview?: string;
}

interface KoreksiState {
  queue: KoreksiItem[];
  
  addToQueue: (item: KoreksiItem) => void;
  approve: (id: string, reviewer: string) => void;
  reject: (id: string, reviewer: string) => void;
  getByStatus: (status: string) => KoreksiItem[];
  getPendingCount: () => number;
}

export const useKoreksiStore = create<KoreksiState>((set, get) => ({
  queue: [
    {
      id: 'KOR-001',
      barcode: 'PO001-JAK-HIT-M-00003-BDL03-01-10-23',
      tahap: 'cutting',
      qtyTarget: 12,
      qtyAktual: 14,
      tipe: 'lebih',
      alasan: 'Sisa bahan panjang',
      status: 'pending',
      diajukanOleh: 'KRY-001',
      waktuAjukan: new Date().toISOString()
    },
    {
      id: 'KOR-002',
      barcode: 'PO001-JAK-HIT-M-00004-BDL04-01-10-23',
      tahap: 'jahit',
      qtyTarget: 12,
      qtyAktual: 13,
      tipe: 'lebih',
      alasan: 'Part cadangan terpakai',
      status: 'approved',
      diajukanOleh: 'KRY-002',
      waktuAjukan: new Date().toISOString(),
      diReviewOleh: 'OWNER',
      waktuReview: new Date().toISOString()
    }
  ],
  
  addToQueue: (item: KoreksiItem) => set((state: KoreksiState) => ({ queue: [...state.queue, item] })),
  
  approve: (id: string, reviewer: string) => set((state: KoreksiState) => ({
    queue: state.queue.map((q: KoreksiItem) => q.id === id ? { ...q, status: 'approved' as const, diReviewOleh: reviewer, waktuReview: new Date().toISOString() } : q)
  })),
  
  reject: (id: string, reviewer: string) => set((state: KoreksiState) => ({
    queue: state.queue.map((q: KoreksiItem) => q.id === id ? { ...q, status: 'rejected' as const, diReviewOleh: reviewer, waktuReview: new Date().toISOString() } : q)
  })),
  
  getByStatus: (status: string) => get().queue.filter((q: KoreksiItem) => q.status === status),
  
  getPendingCount: () => get().queue.filter((q: KoreksiItem) => q.status === 'pending').length
}));
