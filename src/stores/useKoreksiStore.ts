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
  
  // NEW: Action Approvals (The Vault)
  pendingActions: ActionApproval[];
  addActionApproval: (action: Omit<ActionApproval, 'id' | 'status' | 'requestedAt'>) => void;
  resolveActionApproval: (id: string, decision: 'approved' | 'rejected', approvedBy?: string) => void;
  
  // NEW: Atomic Actions
  resolveKoreksiLebih: (id: string, action: 'approve' | 'reject', approvedBy?: string) => void;
  removeKoreksiByPO: (poId: string) => void;
}

export interface ActionApproval {
  id: string;
  type: 'delete_po' | 'pay_salary' | 'recap_journal' | 'edit_karyawan';
  label: string;          // e.g. "Hapus PO-001" or "Bayar Gaji Budi"
  payload: any;           // Data yang dibutuhkan untuk eksekusi
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const useKoreksiStore = create<KoreksiState>((set, get) => ({
  koreksiList: [],
  pendingActions: [],

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

  resolveKoreksiLebih: (id, action, approvedBy) => {
    const list = get().koreksiList;
    const record = list.find(k => k.id === id);
    if (!record) return;

    // 1. Update the record status
    set((state) => ({
      koreksiList: state.koreksiList.map((k) =>
        k.id === id
          ? {
              ...k,
              statusApproval: action === 'approve' ? 'approved' as const : 'ditolak' as const,
              approvedBy: action === 'approve' ? (approvedBy || 'SYSTEM') : undefined,
              approvedAt: action === 'approve' ? new Date().toISOString() : undefined,
            }
          : k
      ),
    }));

    // 2. Update the source bundle status atomically in the same transaction
    const { useBundleStore } = require('./useBundleStore'); // Dynamic import to avoid circular dependency
    const { bundles, updateStatusTahap } = useBundleStore.getState();
    const bundle = (bundles as any[]).find((b: any) => b.barcode === record.barcode);

    if (bundle) {
      if (action === 'approve') {
        const currentQty = bundle.statusTahap[record.tahapDitemukan as any]?.qtySelesai || 0;
        updateStatusTahap(bundle.barcode, record.tahapDitemukan, {
          qtySelesai: currentQty + record.qtyKoreksi,
          koreksiStatus: 'approved',
        });
      } else {
        updateStatusTahap(record.barcode, record.tahapDitemukan, {
          koreksiStatus: 'rejected',
        });
      }
    }
  },

  removeKoreksiByPO: (poId) => set((state) => ({
    koreksiList: state.koreksiList.filter(k => k.poId !== poId)
  })),

  addActionApproval: (action) => set((state) => ({
    pendingActions: [
      {
        ...action,
        id: `ACT-${Date.now()}`,
        status: 'pending',
        requestedAt: new Date().toISOString()
      },
      ...state.pendingActions
    ]
  })),

  resolveActionApproval: (id, decision, approvedBy) => {
    const action = get().pendingActions.find(a => a.id === id);
    if (!action || action.status !== 'pending') return;

    // 1. Eksekusi Aksi jika disetujui (The Engine)
    if (decision === 'approved') {
      const { type, payload } = action;
      
      if (type === 'delete_po') {
        const { usePOStore } = require('./usePOStore');
        const { useTrashStore } = require('./useTrashStore');
        const po = usePOStore.getState().getPOById(payload.id);
        if (po) {
          useTrashStore.getState().addToTrash({
            id: po.id,
            type: 'po',
            label: po.nomorPO,
            data: po,
            trashedBy: approvedBy || 'SYSTEM'
          });
          usePOStore.getState().removePO(payload.id);
        }
      }

      if (type === 'pay_salary') {
        const { usePayrollStore } = require('./usePayrollStore');
        usePayrollStore.getState().prosesBayar(payload.karyawanId, payload.entryIds, payload.inputKasbon, payload.hariKerja);
      }

      // Add other types as needed
    }

    // 2. Update status antrean
    set((state) => ({
      pendingActions: state.pendingActions.map(a => 
        a.id === id ? { ...a, status: decision === 'approved' ? 'approved' as const : 'rejected' as const } : a
      )
    }));
  }
}));
