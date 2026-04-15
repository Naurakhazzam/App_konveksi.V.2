import { create } from 'zustand';
import { SuratJalan, SuratJalanItem } from '@/types';
import { supabase } from '@/lib/supabase';

interface PengirimanState {
  suratJalanList: SuratJalan[];
  isLoading: boolean;

  loadPengiriman: () => Promise<void>;
  createSuratJalanAtomic: (sj: Omit<SuratJalan, 'nomorSJ'>, bundleBarcodes: string[]) => Promise<string>;
  updateStatusSJ: (id: string, status: SuratJalan['status']) => Promise<void>;
  getSuratJalanById: (id: string) => SuratJalan | undefined;
}

// ── Helper: DB rows → SuratJalan ─────────────────────────────────────────────

function mapSJ(row: any, items: SuratJalanItem[]): SuratJalan {
  return {
    id: row.id,
    nomorSJ: row.nomor_sj,
    klienId: row.klien_id,
    tanggal: row.tanggal,
    totalQty: Number(row.total_qty ?? 0),
    totalBundle: Number(row.total_bundle ?? 0),
    catatan: row.catatan ?? '',
    status: row.status,
    dibuatOleh: row.dibuat_oleh ?? '',
    pengirim: row.pengirim ?? '',
    items,
  };
}

function mapSJItem(row: any): SuratJalanItem {
  return {
    id: row.id,
    bundleBarcode: row.bundle_barcode,
    poId: row.po_id,
    modelId: row.model_id ?? '',
    warnaId: row.warna_id ?? '',
    sizeId: row.size_id ?? '',
    skuKlien: row.sku_klien ?? '',
    qty: Number(row.qty ?? 0),
    qtyPacking: Number(row.qty_packing ?? 0),
    alasanSelisih: row.alasan_selisih ?? undefined,
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const usePengirimanStore = create<PengirimanState>((set, get) => ({
  suratJalanList: [],
  isLoading: false,

  // ── LOAD ──────────────────────────────────────────────────────────────────

  loadPengiriman: async () => {
    set({ isLoading: true });
    try {
      const [sjRes, itemsRes] = await Promise.all([
        supabase.from('surat_jalan').select('*').order('created_at', { ascending: false }),
        supabase.from('surat_jalan_items').select('*'),
      ]);

      if (sjRes.error) throw sjRes.error;

      const itemsByParent: Record<string, SuratJalanItem[]> = {};
      (itemsRes.data ?? []).forEach((row: any) => {
        if (!itemsByParent[row.surat_jalan_id]) itemsByParent[row.surat_jalan_id] = [];
        itemsByParent[row.surat_jalan_id].push(mapSJItem(row));
      });

      const suratJalanList = (sjRes.data ?? []).map((row: any) =>
        mapSJ(row, itemsByParent[row.id] ?? [])
      );

      set({ suratJalanList, isLoading: false });
    } catch (err) {
      console.error('[usePengirimanStore] loadPengiriman error:', err);
      set({ isLoading: false });
    }
  },

  // ── CREATE SURAT JALAN (ATOMIC VIA RPC) ──────────────────────────────────

  createSuratJalanAtomic: async (sj, bundleBarcodes) => {
    // Optimistic update — nomor SJ placeholder sementara
    const optimisticSJ: SuratJalan = { ...sj, nomorSJ: '...' };
    set((state) => ({ suratJalanList: [optimisticSJ, ...state.suratJalanList] }));

    try {
      const sjPayload = {
        id: sj.id,
        klien_id: sj.klienId,
        tanggal: sj.tanggal,
        total_qty: sj.totalQty,
        total_bundle: sj.totalBundle,
        catatan: sj.catatan,
        status: sj.status,
        dibuat_oleh: sj.dibuatOleh,
        pengirim: sj.pengirim,
      };

      const itemsPayload = sj.items.map((item) => ({
        id: item.id,
        bundle_barcode: item.bundleBarcode,
        po_id: item.poId,
        model_id: item.modelId,
        warna_id: item.warnaId,
        size_id: item.sizeId,
        sku_klien: item.skuKlien,
        qty: item.qty,
        qty_packing: item.qtyPacking,
        alasan_selisih: item.alasanSelisih ?? null,
      }));

      const { data: nomorSJ, error } = await supabase.rpc('create_sj_atomic', {
        p_sj: sjPayload,
        p_items: itemsPayload,
        p_bundle_barcodes: bundleBarcodes,
      });

      if (error) throw error;

      // Update state lokal dengan nomor SJ yang valid dari server
      const finalNomorSJ = nomorSJ as string;
      set((state) => ({
        suratJalanList: state.suratJalanList.map((s) =>
          s.id === sj.id ? { ...s, nomorSJ: finalNomorSJ } : s
        ),
      }));

      return finalNomorSJ;
    } catch (err) {
      console.error('[usePengirimanStore] createSuratJalanAtomic error:', err);
      // Rollback optimistic update
      set((state) => ({
        suratJalanList: state.suratJalanList.filter((s) => s.id !== sj.id),
      }));
      throw err;
    }
  },

  // ── UPDATE STATUS SJ ──────────────────────────────────────────────────────

  updateStatusSJ: async (id, status) => {
    set((state) => ({
      suratJalanList: state.suratJalanList.map((sj) =>
        sj.id === id ? { ...sj, status } : sj
      ),
    }));
    try {
      const { error } = await supabase
        .from('surat_jalan')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[usePengirimanStore] updateStatusSJ error:', err);
    }
  },

  // ── GETTER ────────────────────────────────────────────────────────────────

  getSuratJalanById: (id) =>
    get().suratJalanList.find((sj) => sj.id === id),

}));
