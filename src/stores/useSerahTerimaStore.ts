import { create } from 'zustand';
import { SerahTerimaJahit, SerahTerimaItem } from '../types';
import { supabase } from '@/lib/supabase';

interface SerahTerimaState {
  records: SerahTerimaJahit[];
  isLoading: boolean;

  loadSerahTerima: () => Promise<void>;
  addRecord: (record: SerahTerimaJahit) => Promise<void>;
  getByBarcode: (barcode: string) => SerahTerimaJahit | undefined;
}

// ── Helper: DB rows → SerahTerimaJahit ───────────────────────────────────────

function mapSTJ(row: any, items: SerahTerimaItem[]): SerahTerimaJahit {
  return {
    id: row.id,
    barcode: row.barcode,
    poNomor: row.po_nomor ?? '',
    modelId: row.model_id ?? '',
    warnaId: row.warna_id ?? '',
    sizeId: row.size_id ?? '',
    qtyBundle: Number(row.qty_bundle ?? 0),
    karyawanId: row.karyawan_id ?? '',
    tanggal: row.tanggal ?? '',
    status: row.status,
    items,
  };
}

function mapSTJItem(row: any): SerahTerimaItem {
  return {
    komponenHPPId: row.komponen_hpp_id ?? '',
    inventoryItemId: row.inventory_item_id ?? '',
    qtyDiserahkan: Number(row.qty_diserahkan ?? 0),
    qtyFisikPerPcs: Number(row.qty_fisik_per_pcs ?? 0),
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useSerahTerimaStore = create<SerahTerimaState>((set, get) => ({
  records: [],
  isLoading: false,

  // ── LOAD ──────────────────────────────────────────────────────────────────

  loadSerahTerima: async () => {
    set({ isLoading: true });
    try {
      const [stjRes, itemsRes] = await Promise.all([
        supabase
          .from('serah_terima_jahit')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('serah_terima_items').select('*'),
      ]);

      if (stjRes.error) throw stjRes.error;

      // Group items by parent ID
      const itemsByParent: Record<string, SerahTerimaItem[]> = {};
      (itemsRes.data ?? []).forEach((row: any) => {
        if (!itemsByParent[row.serah_terima_id]) itemsByParent[row.serah_terima_id] = [];
        itemsByParent[row.serah_terima_id].push(mapSTJItem(row));
      });

      const records = (stjRes.data ?? []).map((row: any) =>
        mapSTJ(row, itemsByParent[row.id] ?? [])
      );

      set({ records, isLoading: false });
    } catch (err) {
      console.error('[useSerahTerimaStore] loadSerahTerima error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD RECORD ────────────────────────────────────────────────────────────

  addRecord: async (record) => {
    set((state) => ({ records: [record, ...state.records] }));
    try {
      // 1. Insert header
      const { error: stjError } = await supabase.from('serah_terima_jahit').insert({
        id: record.id,
        barcode: record.barcode,
        po_nomor: record.poNomor,
        model_id: record.modelId,
        warna_id: record.warnaId,
        size_id: record.sizeId,
        qty_bundle: record.qtyBundle,
        karyawan_id: record.karyawanId,
        tanggal: record.tanggal,
        status: record.status,
      });
      if (stjError) throw stjError;

      // 2. Insert items (jika ada)
      if (record.items.length > 0) {
        const { error: itemsError } = await supabase.from('serah_terima_items').insert(
          record.items.map((item, idx) => ({
            id: `STJ-ITEM-${record.id}-${idx}`,
            serah_terima_id: record.id,
            komponen_hpp_id: item.komponenHPPId,
            inventory_item_id: item.inventoryItemId,
            qty_diserahkan: item.qtyDiserahkan,
            qty_fisik_per_pcs: item.qtyFisikPerPcs,
          }))
        );
        if (itemsError) throw itemsError;
      }
    } catch (err) {
      console.error('[useSerahTerimaStore] addRecord error:', err);
      set((state) => ({
        records: state.records.filter((r) => r.id !== record.id),
      }));
    }
  },

  // ── GETTER ────────────────────────────────────────────────────────────────

  getByBarcode: (barcode) =>
    get().records.find((r) => r.barcode === barcode),
}));
