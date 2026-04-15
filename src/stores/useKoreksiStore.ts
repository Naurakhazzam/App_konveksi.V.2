import { create } from 'zustand';
import { KoreksiQTY } from '@/types';
import { supabase } from '@/lib/supabase';

export interface ActionApproval {
  id: string;
  type: 'delete_po' | 'pay_salary' | 'recap_journal' | 'edit_karyawan';
  label: string;
  payload: any;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface KoreksiState {
  koreksiList: KoreksiQTY[];
  pendingActions: ActionApproval[];
  isLoading: boolean;

  loadKoreksi: () => Promise<void>;
  addKoreksi: (data: KoreksiQTY) => Promise<void>;
  cancelKoreksi: (id: string) => Promise<void>;
  approveKoreksiLebih: (id: string, approvedBy: string) => Promise<void>;
  rejectKoreksiLebih: (id: string) => Promise<void>;
  resolveKoreksiLebih: (id: string, action: 'approve' | 'reject', approvedBy?: string) => Promise<void>;
  removeKoreksiByPO: (poId: string) => Promise<void>;

  getKoreksiByTahap: (tahap: string) => KoreksiQTY[];
  getKoreksiByKaryawan: (karyawanId: string) => KoreksiQTY[];
  getPendingApproval: () => KoreksiQTY[];
  getActiveRejectByTahap: (tahap: string) => KoreksiQTY[];
  getPendingCount: () => number;

  addActionApproval: (action: Omit<ActionApproval, 'id' | 'status' | 'requestedAt'>) => Promise<void>;
  resolveActionApproval: (id: string, decision: 'approved' | 'rejected', approvedBy?: string) => Promise<void>;
}

// ── Helper: DB status_approval mapping ───────────────────────────────────────
// DB pakai 'rejected', TypeScript pakai 'ditolak'

function toDbApproval(val?: string) {
  if (val === 'ditolak') return 'rejected';
  return val ?? null;
}
function fromDbApproval(val?: string): KoreksiQTY['statusApproval'] {
  if (val === 'rejected') return 'ditolak';
  return val as KoreksiQTY['statusApproval'];
}

// ── Helper: DB row → KoreksiQTY ──────────────────────────────────────────────

function mapKoreksi(row: any): KoreksiQTY {
  return {
    id: row.id,
    barcode: row.barcode ?? row.bundle_id ?? '',
    poId: row.po_id ?? '',
    tahapDitemukan: row.tahap_ditemukan ?? row.tahap ?? '',
    tahapBertanggungJawab: row.tahap_bertanggung_jawab ?? row.tahap ?? '',
    karyawanPelapor: row.karyawan_pelapor ?? '',
    karyawanBertanggungJawab: row.karyawan_id ?? '',
    jenisKoreksi: row.jenis_koreksi,
    alasanRejectId: row.alasan_reject_id ?? undefined,
    alasanLebih: row.alasan_lebih ?? undefined,
    alasanLebihText: row.alasan_lebih_text ?? undefined,
    qtyKoreksi: Number(row.qty_selisih ?? 0),
    nominalPotongan: Number(row.nominal_potongan ?? 0),
    statusPotongan: row.status_potongan ?? 'pending',
    statusApproval: fromDbApproval(row.status_approval),
    approvedBy: row.approved_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    waktuLapor: row.waktu_lapor ?? row.created_at ?? '',
    waktuSelesai: row.waktu_selesai ?? undefined,
  };
}

function mapAction(row: any): ActionApproval {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    payload: row.payload,
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
    status: row.status,
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useKoreksiStore = create<KoreksiState>((set, get) => ({
  koreksiList: [],
  pendingActions: [],
  isLoading: false,

  // ── LOAD ──────────────────────────────────────────────────────────────────

  loadKoreksi: async () => {
    set({ isLoading: true });
    try {
      const [koreksiRes, actionRes] = await Promise.all([
        supabase.from('koreksi').select('*').order('created_at', { ascending: false }),
        supabase.from('action_approval').select('*').order('created_at', { ascending: false }),
      ]);

      if (koreksiRes.error) throw koreksiRes.error;

      set({
        koreksiList: (koreksiRes.data ?? []).map(mapKoreksi),
        pendingActions: (actionRes.data ?? []).map(mapAction),
        isLoading: false,
      });
    } catch (err) {
      console.error('[useKoreksiStore] loadKoreksi error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD KOREKSI ───────────────────────────────────────────────────────────

  addKoreksi: async (data) => {
    set((state) => ({ koreksiList: [...state.koreksiList, data] }));
    try {
      const { error } = await supabase.from('koreksi').insert({
        id: data.id,
        barcode: data.barcode,
        bundle_id: data.barcode,
        po_id: data.poId,
        tahap: data.tahapDitemukan,
        tahap_ditemukan: data.tahapDitemukan,
        tahap_bertanggung_jawab: data.tahapBertanggungJawab,
        karyawan_id: data.karyawanBertanggungJawab,
        karyawan_pelapor: data.karyawanPelapor,
        jenis_koreksi: data.jenisKoreksi,
        alasan_reject_id: data.alasanRejectId ?? null,
        alasan: data.alasanLebihText ?? null,
        alasan_lebih: data.alasanLebih ?? null,
        alasan_lebih_text: data.alasanLebihText ?? null,
        qty_selisih: data.qtyKoreksi,
        nominal_potongan: data.nominalPotongan,
        status_potongan: data.statusPotongan,
        status_approval: toDbApproval(data.statusApproval) ?? null,
        waktu_lapor: data.waktuLapor,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[useKoreksiStore] addKoreksi error:', err);
      set((state) => ({ koreksiList: state.koreksiList.filter((k) => k.id !== data.id) }));
    }
  },

  // ── CANCEL KOREKSI ────────────────────────────────────────────────────────

  cancelKoreksi: async (id) => {
    const waktuSelesai = new Date().toISOString();
    set((state) => ({
      koreksiList: state.koreksiList.map((k) =>
        k.id === id ? { ...k, statusPotongan: 'cancelled' as const, waktuSelesai } : k
      ),
    }));
    try {
      const { error } = await supabase
        .from('koreksi')
        .update({ status_potongan: 'cancelled', waktu_selesai: waktuSelesai })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[useKoreksiStore] cancelKoreksi error:', err);
    }
  },

  // ── APPROVE / REJECT KOREKSI LEBIH ───────────────────────────────────────

  approveKoreksiLebih: async (id, approvedBy) => {
    const approvedAt = new Date().toISOString();
    set((state) => ({
      koreksiList: state.koreksiList.map((k) =>
        k.id === id ? { ...k, statusApproval: 'approved' as const, approvedBy, approvedAt } : k
      ),
    }));
    try {
      const { error } = await supabase
        .from('koreksi')
        .update({ status_approval: 'approved', approved_by: approvedBy, approved_at: approvedAt })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[useKoreksiStore] approveKoreksiLebih error:', err);
    }
  },

  rejectKoreksiLebih: async (id) => {
    set((state) => ({
      koreksiList: state.koreksiList.map((k) =>
        k.id === id ? { ...k, statusApproval: 'ditolak' as const } : k
      ),
    }));
    try {
      const { error } = await supabase
        .from('koreksi')
        .update({ status_approval: 'rejected' })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[useKoreksiStore] rejectKoreksiLebih error:', err);
    }
  },

  // ── RESOLVE KOREKSI LEBIH (atomic) ────────────────────────────────────────

  resolveKoreksiLebih: async (id, action, approvedBy) => {
    const record = get().koreksiList.find((k) => k.id === id);
    if (!record) return;

    const newApproval = action === 'approve' ? 'approved' as const : 'ditolak' as const;
    const approvedAt = action === 'approve' ? new Date().toISOString() : undefined;

    set((state) => ({
      koreksiList: state.koreksiList.map((k) =>
        k.id === id
          ? { ...k, statusApproval: newApproval, approvedBy: approvedBy, approvedAt }
          : k
      ),
    }));

    try {
      await supabase.from('koreksi').update({
        status_approval: action === 'approve' ? 'approved' : 'rejected',
        approved_by: approvedBy ?? null,
        approved_at: approvedAt ?? null,
      }).eq('id', id);
    } catch (err) {
      console.error('[useKoreksiStore] resolveKoreksiLebih error:', err);
    }

    // Update bundle status tahap
    const { useBundleStore } = require('./useBundleStore');
    const { bundles, updateStatusTahap } = useBundleStore.getState();
    const bundle = (bundles as any[]).find((b: any) => b.barcode === record.barcode);
    if (bundle) {
      if (action === 'approve') {
        const currentQty = bundle.statusTahap[record.tahapDitemukan as any]?.qtySelesai || 0;
        await updateStatusTahap(bundle.barcode, record.tahapDitemukan, {
          qtySelesai: currentQty + record.qtyKoreksi,
          koreksiStatus: 'approved',
        });
      } else {
        await updateStatusTahap(record.barcode, record.tahapDitemukan, {
          koreksiStatus: 'rejected',
        });
      }
    }
  },

  // ── REMOVE BY PO ──────────────────────────────────────────────────────────

  removeKoreksiByPO: async (poId) => {
    set((state) => ({ koreksiList: state.koreksiList.filter((k) => k.poId !== poId) }));
    try {
      const { error } = await supabase.from('koreksi').delete().eq('po_id', poId);
      if (error) throw error;
    } catch (err) {
      console.error('[useKoreksiStore] removeKoreksiByPO error:', err);
    }
  },

  // ── GETTERS ───────────────────────────────────────────────────────────────

  getKoreksiByTahap: (tahap) =>
    get().koreksiList.filter((k) => k.tahapDitemukan === tahap),

  getKoreksiByKaryawan: (karyawanId) =>
    get().koreksiList.filter(
      (k) => k.karyawanBertanggungJawab === karyawanId || k.karyawanPelapor === karyawanId
    ),

  getPendingApproval: () =>
    get().koreksiList.filter(
      (k) => k.jenisKoreksi === 'lebih' && k.statusApproval === 'menunggu'
    ),

  getActiveRejectByTahap: (tahap) =>
    get().koreksiList.filter(
      (k) => k.tahapBertanggungJawab === tahap && k.statusPotongan === 'pending'
    ),

  getPendingCount: () =>
    get().koreksiList.filter(
      (k) => k.jenisKoreksi === 'lebih' && k.statusApproval === 'menunggu'
    ).length,

  // ── ACTION APPROVAL ───────────────────────────────────────────────────────

  addActionApproval: async (action) => {
    const newAction: ActionApproval = {
      ...action,
      id: `ACT-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    set((state) => ({ pendingActions: [newAction, ...state.pendingActions] }));
    try {
      const { error } = await supabase.from('action_approval').insert({
        id: newAction.id,
        type: newAction.type,
        label: newAction.label,
        payload: newAction.payload,
        requested_by: newAction.requestedBy,
        requested_at: newAction.requestedAt,
        status: 'pending',
      });
      if (error) throw error;
    } catch (err) {
      console.error('[useKoreksiStore] addActionApproval error:', err);
    }
  },

  resolveActionApproval: async (id, decision, approvedBy) => {
    const action = get().pendingActions.find((a) => a.id === id);
    if (!action || action.status !== 'pending') return;

    // 1. Update status lokal
    set((state) => ({
      pendingActions: state.pendingActions.map((a) =>
        a.id === id ? { ...a, status: decision } : a
      ),
    }));

    // 2. Update di Supabase
    try {
      await supabase.from('action_approval').update({
        status: decision,
        approved_by: approvedBy ?? null,
        approved_at: new Date().toISOString(),
      }).eq('id', id);
    } catch (err) {
      console.error('[useKoreksiStore] resolveActionApproval DB error:', err);
    }

    // 3. Eksekusi jika disetujui
    if (decision === 'approved') {
      const { type, payload } = action;

      if (type === 'delete_po') {
        const { usePOStore } = require('./usePOStore');
        const { useTrashStore } = require('./useTrashStore');
        const po = usePOStore.getState().getPOById(payload.id);
        if (po) {
          await useTrashStore.getState().addToTrash({
            id: po.id, type: 'po', label: po.nomorPO,
            data: po, trashedBy: approvedBy || 'SYSTEM',
          });
          await usePOStore.getState().removePO(payload.id);
        }
      }

      if (type === 'pay_salary') {
        const { usePayrollStore } = require('./usePayrollStore');
        await usePayrollStore.getState().prosesBayar(
          payload.karyawanId, payload.entryIds, payload.inputKasbon, payload.hariKerja
        );
      }
    }
  },
}));
