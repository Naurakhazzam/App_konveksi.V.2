import { create } from 'zustand';
import { KoreksiQTY } from '@/types';

interface KoreksiState {
  koreksiList: KoreksiQTY[];

  addKoreksi: (data: KoreksiQTY) => void;
  cancelKoreksi: (id: string) => void;
  approveKoreksiLebih: (id: string, approvedBy: string) => void;
  rejectKoreksiLebih: (id: string) => void;

  getKoreksiByTahap: (tahap: string) => KoreksiQTY[];
  getKoreksiByKaryawan: (karyawanId: string) => KoreksiQTY[];
  getPendingApproval: () => KoreksiQTY[];
  getActiveRejectByTahap: (tahap: string) => KoreksiQTY[];
  getPendingCount: () => number;
}

export const useKoreksiStore = create<KoreksiState>((set, get) => ({
  koreksiList: [],

  addKoreksi: (data) =>
    set((state) => ({ koreksiList: [...state.koreksiList, data] })),

  cancelKoreksi: (id) =>
    set((state) => ({
      koreksiList: state.koreksiList.map((k) =>
        k.id === id
          ? { ...k, statusPotongan: 'cancelled' as const, waktuSelesai: new Date().toISOString() }
          : k
      ),
    })),

  approveKoreksiLebih: (id, approvedBy) =>
    set((state) => ({
      koreksiList: state.koreksiList.map((k) =>
        k.id === id
          ? {
              ...k,
              statusApproval: 'approved' as const,
              approvedBy,
              approvedAt: new Date().toISOString(),
            }
          : k
      ),
    })),

  rejectKoreksiLebih: (id) =>
    set((state) => ({
      koreksiList: state.koreksiList.map((k) =>
        k.id === id ? { ...k, statusApproval: 'ditolak' as const } : k
      ),
    })),

  getKoreksiByTahap: (tahap) =>
    get().koreksiList.filter((k) => k.tahapDitemukan === tahap),

  getKoreksiByKaryawan: (karyawanId) =>
    get().koreksiList.filter(
      (k) =>
        k.karyawanBertanggungJawab === karyawanId ||
        k.karyawanPelapor === karyawanId
    ),

  getPendingApproval: () =>
    get().koreksiList.filter(
      (k) => k.jenisKoreksi === 'lebih' && k.statusApproval === 'menunggu'
    ),

  getActiveRejectByTahap: (tahap) =>
    get().koreksiList.filter(
      (k) =>
        k.tahapBertanggungJawab === tahap &&
        k.statusPotongan === 'pending'
    ),

  getPendingCount: () =>
    get().koreksiList.filter(
      (k) => k.jenisKoreksi === 'lebih' && k.statusApproval === 'menunggu'
    ).length,
}));
