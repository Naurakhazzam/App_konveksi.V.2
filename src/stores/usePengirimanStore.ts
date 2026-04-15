import { create } from 'zustand';
import { SuratJalan, SuratJalanItem } from '@/types';
import { supabase } from '@/lib/supabase';

interface PengirimanState {
  suratJalanList: SuratJalan[];
  isLoading: boolean;

  loadPengiriman: () => Promise<void>;
  addSuratJalan: (sj: SuratJalan) => Promise<void>;
  updateStatusSJ: (id: string, status: SuratJalan['status']) => Promise<void>;
  getSuratJalanById: (id: string) => SuratJalan | undefined;
  getNextNomorSJ: () => Promise<string>;
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

  // ── ADD SURAT JALAN ───────────────────────────────────────────────────────

  addSuratJalan: async (sj) => {
    set((state) => ({ suratJalanList: [sj, ...state.suratJalanList] }));
    try {
      // 1. Insert header
      const { error: sjError } = await supabase.from('surat_jalan').insert({
        id: sj.id,
        nomor_sj: sj.nomorSJ,
        klien_id: sj.klienId,
        tanggal: sj.tanggal,
        total_qty: sj.totalQty,
        total_bundle: sj.totalBundle,
        catatan: sj.catatan,
        status: sj.status,
        dibuat_oleh: sj.dibuatOleh,
        pengirim: sj.pengirim,
      });
      if (sjError) throw sjError;

      // 2. Insert items (jika ada)
      if (sj.items.length > 0) {
        const { error: itemsError } = await supabase.from('surat_jalan_items').insert(
          sj.items.map((item) => ({
            id: item.id,
            surat_jalan_id: sj.id,
            bundle_barcode: item.bundleBarcode,
            po_id: item.poId,
            model_id: item.modelId,
            warna_id: item.warnaId,
            size_id: item.sizeId,
            sku_klien: item.skuKlien,
            qty: item.qty,
            qty_packing: item.qtyPacking,
            alasan_selisih: item.alasanSelisih ?? null,
          }))
        );
        if (itemsError) throw itemsError;
      }
    } catch (err) {
      console.error('[usePengirimanStore] addSuratJalan error:', err);
      set((state) => ({
        suratJalanList: state.suratJalanList.filter((s) => s.id !== sj.id),
      }));
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

  // ── GET NEXT NOMOR SJ (aman dari duplikasi) ───────────────────────────────
  // Query DB langsung untuk sequence terakhir pada bulan ini.

  getNextNomorSJ: async () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `SJ/${yearMonth}/`;

    try {
      const { data, error } = await supabase
        .from('surat_jalan')
        .select('nomor_sj')
        .like('nomor_sj', `${prefix}%`)
        .order('nomor_sj', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextSeq = 1;
      if (data && data.length > 0) {
        const lastNomor = data[0].nomor_sj as string;
        const lastSeq = parseInt(lastNomor.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }

      return `${prefix}${String(nextSeq).padStart(3, '0')}`;
    } catch (err) {
      console.error('[usePengirimanStore] getNextNomorSJ error:', err);
      // Fallback: pakai panjang list lokal supaya tidak crash
      const seq = get().suratJalanList.length + 1;
      return `${prefix}${String(seq).padStart(3, '0')}`;
    }
  },
}));
