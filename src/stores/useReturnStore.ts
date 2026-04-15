import { create } from 'zustand';
import { ReturnItem, ReturnStatus } from '@/types/production.types';
import { supabase } from '@/lib/supabase';

interface ReturnState {
  returns: ReturnItem[];
  isLoading: boolean;

  loadReturns: () => Promise<void>;
  addReturn: (item: ReturnItem) => Promise<void>;
  updateReturnStatus: (id: string, status: ReturnStatus, updates?: Partial<ReturnItem>) => Promise<void>;
  getReturnByBarcode: (barcode: string) => ReturnItem | undefined;
  isBarcodeInReturn: (barcode: string) => boolean;
  getPendingReturns: () => ReturnItem[];
  removeReturnByBarcode: (barcode: string) => Promise<void>;
  removeReturnsByPO: (poId: string) => Promise<void>;
}

// ── Helper: DB row → ReturnItem ───────────────────────────────────────────────

function mapReturn(row: any): ReturnItem {
  return {
    id: row.id,
    barcode: row.barcode,
    poId: row.po_id,
    klienId: row.klien_id ?? '',
    artikelNama: row.artikel_nama ?? '',
    originalSize: row.original_size ?? '',
    currentSize: row.current_size ?? '',
    karyawanOriginal: row.karyawan_original ?? '',
    karyawanPerbaikan: row.karyawan_perbaikan ?? null,
    alasanRejectId: row.alasan_reject_id ?? '',
    jenisReject: row.jenis_reject,
    status: row.status,
    nominalPotongan: Number(row.nominal_potongan ?? 0),
    qtyBundle: Number(row.qty_bundle ?? 0),
    waktuDiterima: row.waktu_diterima ?? '',
    waktuPerbaikan: row.waktu_perbaikan ?? undefined,
    waktuDikirim: row.waktu_dikirim ?? undefined,
    isSelfRepair: row.is_self_repair ?? false,
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useReturnStore = create<ReturnState>((set, get) => ({
  returns: [],
  isLoading: false,

  // ── LOAD ──────────────────────────────────────────────────────────────────

  loadReturns: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('return_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ returns: (data ?? []).map(mapReturn), isLoading: false });
    } catch (err) {
      console.error('[useReturnStore] loadReturns error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD RETURN ────────────────────────────────────────────────────────────

  addReturn: async (item) => {
    set((state) => ({ returns: [item, ...state.returns] }));
    try {
      const { error } = await supabase.from('return_items').insert({
        id: item.id,
        barcode: item.barcode,
        po_id: item.poId,
        klien_id: item.klienId,
        artikel_nama: item.artikelNama,
        original_size: item.originalSize,
        current_size: item.currentSize,
        karyawan_original: item.karyawanOriginal,
        karyawan_perbaikan: item.karyawanPerbaikan ?? null,
        alasan_reject_id: item.alasanRejectId,
        jenis_reject: item.jenisReject,
        status: item.status,
        nominal_potongan: item.nominalPotongan,
        qty_bundle: item.qtyBundle,
        waktu_diterima: item.waktuDiterima,
        waktu_perbaikan: item.waktuPerbaikan ?? null,
        waktu_dikirim: item.waktuDikirim ?? null,
        is_self_repair: item.isSelfRepair ?? false,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[useReturnStore] addReturn error:', err);
      set((state) => ({ returns: state.returns.filter((r) => r.id !== item.id) }));
    }
  },

  // ── UPDATE STATUS ─────────────────────────────────────────────────────────

  updateReturnStatus: async (id, status, updates) => {
    set((state) => ({
      returns: state.returns.map((r) =>
        r.id === id ? { ...r, status, ...updates } : r
      ),
    }));
    try {
      const dbUpdate: Record<string, any> = { status };
      if (updates?.karyawanPerbaikan !== undefined)
        dbUpdate.karyawan_perbaikan = updates.karyawanPerbaikan;
      if (updates?.waktuPerbaikan !== undefined)
        dbUpdate.waktu_perbaikan = updates.waktuPerbaikan;
      if (updates?.waktuDikirim !== undefined)
        dbUpdate.waktu_dikirim = updates.waktuDikirim;
      if (updates?.currentSize !== undefined)
        dbUpdate.current_size = updates.currentSize;
      if (updates?.isSelfRepair !== undefined)
        dbUpdate.is_self_repair = updates.isSelfRepair;

      const { error } = await supabase
        .from('return_items')
        .update(dbUpdate)
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[useReturnStore] updateReturnStatus error:', err);
    }
  },

  // ── GETTERS ───────────────────────────────────────────────────────────────

  getReturnByBarcode: (barcode) =>
    get().returns.find((r) => r.barcode === barcode && r.status !== 'selesai'),

  isBarcodeInReturn: (barcode) =>
    get().returns.some((r) => r.barcode === barcode && r.status !== 'selesai'),

  getPendingReturns: () =>
    get().returns.filter((r) => r.status !== 'selesai'),

  // ── REMOVE BY BARCODE ─────────────────────────────────────────────────────

  removeReturnByBarcode: async (barcode) => {
    set((state) => ({ returns: state.returns.filter((r) => r.barcode !== barcode) }));
    try {
      const { error } = await supabase
        .from('return_items')
        .delete()
        .eq('barcode', barcode);
      if (error) throw error;
    } catch (err) {
      console.error('[useReturnStore] removeReturnByBarcode error:', err);
    }
  },

  // ── REMOVE BY PO ──────────────────────────────────────────────────────────

  removeReturnsByPO: async (poId) => {
    set((state) => ({ returns: state.returns.filter((r) => r.poId !== poId) }));
    try {
      const { error } = await supabase
        .from('return_items')
        .delete()
        .eq('po_id', poId);
      if (error) throw error;
    } catch (err) {
      console.error('[useReturnStore] removeReturnsByPO error:', err);
    }
  },
}));
