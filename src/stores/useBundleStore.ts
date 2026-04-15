import { create } from 'zustand';
import { Bundle, StatusTahap } from '../types';
import { supabase } from '@/lib/supabase';

export interface RejectRecord {
  id: string;
  barcode: string;
  tahap: string;
  jenisRejectId: string;
  qty: number;
  catatan: string;
  waktu: string;
}

interface BundleState {
  bundles: Bundle[];
  rejectRecords: RejectRecord[];
  isLoading: boolean;
  // Map internal: barcode → DB id (untuk operasi bundle_status_tahap)
  _bundleIdMap: Record<string, string>;

  loadBundles: () => Promise<void>;
  addBundle: (bundle: Bundle) => Promise<void>;
  addBundles: (newBundles: Bundle[]) => void;
  updateStatusTahap: (barcode: string, tahap: string, updates: Partial<StatusTahap>) => Promise<void>;
  getBundleByBarcode: (barcode: string) => Bundle | undefined;
  getBundlesByPO: (poId: string) => Bundle[];
  markUpahPaid: (poId: string) => Promise<void>;
  addRejectRecord: (record: RejectRecord) => void;
  removeBundlesByPO: (poId: string) => Promise<void>;
  updateBundleSuratJalan: (barcodes: string[], sjId: string) => Promise<void>;
}

// ── Nilai default satu StatusTahap ───────────────────────────────────────────

const defaultStatus: StatusTahap = {
  status: null,
  qtyTerima: null,
  qtySelesai: null,
  waktuTerima: null,
  waktuSelesai: null,
  karyawan: null,
  koreksiStatus: null,
  koreksiAlasan: null,
};

const ALL_TAHAP = ['cutting', 'jahit', 'lkancing', 'bbenang', 'qc', 'steam', 'packing'] as const;

// ── Helper: buat statusTahap kosong ─────────────────────────────────────────

function emptyStatusTahap() {
  return Object.fromEntries(ALL_TAHAP.map((t) => [t, { ...defaultStatus }])) as Bundle['statusTahap'];
}

// ── Helper: DB rows → Bundle ─────────────────────────────────────────────────

function buildBundleFromRows(
  bundleRow: any,
  statusRows: any[]
): Bundle {
  const statusTahap = emptyStatusTahap();

  statusRows.forEach((row: any) => {
    const tahap = row.tahap as keyof Bundle['statusTahap'];
    if (!ALL_TAHAP.includes(tahap as any)) return;
    statusTahap[tahap] = {
      status: row.status ?? null,
      qtyTerima: row.qty_terima ?? null,
      qtySelesai: row.qty_selesai ?? null,
      waktuTerima: row.waktu_terima ?? null,
      waktuSelesai: row.waktu_selesai ?? null,
      karyawan: row.karyawan_id ?? null,
      koreksiStatus: row.koreksi_status ?? null,
      koreksiAlasan: row.koreksi_alasan ?? null,
      upahDibayar: row.upah_dibayar ?? false,
    };
  });

  return {
    barcode: bundleRow.barcode,
    po: bundleRow.po_id,
    poItemId: bundleRow.po_item_id ?? undefined,
    model: bundleRow.model_id,
    warna: bundleRow.warna_id,
    size: bundleRow.size_id,
    qtyBundle: bundleRow.qty_bundle,
    skuKlien: bundleRow.sku_klien ?? '',
    skuInternal: bundleRow.sku_internal ?? '',
    suratJalanId: bundleRow.surat_jalan_id ?? undefined,
    statusTahap,
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useBundleStore = create<BundleState>((set, get) => ({
  bundles: [],
  rejectRecords: [],
  isLoading: false,
  _bundleIdMap: {},

  // ── LOAD ──────────────────────────────────────────────────────────────────

  loadBundles: async () => {
    set({ isLoading: true });
    try {
      const { data: bundleRows, error: bundleErr } = await supabase
        .from('bundle')
        .select('*')
        .order('created_at', { ascending: true });

      if (bundleErr) throw bundleErr;
      if (!bundleRows || bundleRows.length === 0) {
        set({ bundles: [], isLoading: false });
        return;
      }

      const bundleIds = bundleRows.map((r: any) => r.id);

      // Fetch semua status tahap sekaligus
      const { data: statusRows, error: statusErr } = await supabase
        .from('bundle_status_tahap')
        .select('*')
        .in('bundle_id', bundleIds);

      if (statusErr) throw statusErr;

      // Kelompokkan status per bundle_id
      const statusByBundle: Record<string, any[]> = {};
      (statusRows ?? []).forEach((row: any) => {
        if (!statusByBundle[row.bundle_id]) statusByBundle[row.bundle_id] = [];
        statusByBundle[row.bundle_id].push(row);
      });

      // Bangun Bundle objects + map barcode → id
      const bundleIdMap: Record<string, string> = {};
      const bundles: Bundle[] = bundleRows.map((row: any) => {
        bundleIdMap[row.barcode] = row.id;
        return buildBundleFromRows(row, statusByBundle[row.id] ?? []);
      });

      set({ bundles, _bundleIdMap: bundleIdMap, isLoading: false });
    } catch (err) {
      console.error('[useBundleStore] loadBundles error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD SINGLE BUNDLE ─────────────────────────────────────────────────────

  addBundle: async (bundle: Bundle) => {
    set((state) => ({ bundles: [...state.bundles, bundle] }));

    try {
      const { data, error } = await supabase
        .from('bundle')
        .insert({
          barcode: bundle.barcode,
          po_id: bundle.po,
          model_id: bundle.model,
          warna_id: bundle.warna,
          size_id: bundle.size,
          qty_bundle: bundle.qtyBundle,
          sku_klien: bundle.skuKlien ?? null,
          sku_internal: bundle.skuInternal ?? null,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Simpan mapping barcode → id
      if (data?.id) {
        set((state) => ({
          _bundleIdMap: { ...state._bundleIdMap, [bundle.barcode]: data.id },
        }));
      }
    } catch (err) {
      console.error('[useBundleStore] addBundle error:', err);
      // Rollback
      set((state) => ({ bundles: state.bundles.filter((b) => b.barcode !== bundle.barcode) }));
    }
  },

  // ── ADD MANY BUNDLES (dipanggil dari createPOWithBundles) ─────────────────
  // Insert ke Supabase sudah ditangani oleh usePOStore.createPOWithBundles.
  // Fungsi ini hanya update state lokal + idMap dari data yang sudah disimpan.

  addBundles: (newBundles: Bundle[]) => {
    set((state) => ({ bundles: [...state.bundles, ...newBundles] }));
  },

  // ── UPDATE STATUS TAHAP ───────────────────────────────────────────────────

  updateStatusTahap: async (barcode, tahap, updates) => {
    // Optimistic update lokal
    const backup = get().bundles;
    set((state) => ({
      bundles: state.bundles.map((b) =>
        b.barcode === barcode
          ? {
              ...b,
              statusTahap: {
                ...b.statusTahap,
                [tahap]: { ...b.statusTahap[tahap as keyof typeof b.statusTahap], ...updates },
              },
            }
          : b
      ),
    }));

    try {
      // Dapatkan bundle DB id
      let bundleDbId = get()._bundleIdMap[barcode];

      if (!bundleDbId) {
        // Fallback: query ke DB jika id belum ada di map
        const { data } = await supabase
          .from('bundle')
          .select('id')
          .eq('barcode', barcode)
          .single();
        if (!data?.id) return;
        bundleDbId = data.id;
        set((state) => ({
          _bundleIdMap: { ...state._bundleIdMap, [barcode]: bundleDbId },
        }));
      }

      // Map camelCase → snake_case untuk DB
      const dbRow: any = { bundle_id: bundleDbId, tahap };
      if (updates.status !== undefined) dbRow.status = updates.status;
      if (updates.qtyTerima !== undefined) dbRow.qty_terima = updates.qtyTerima;
      if (updates.qtySelesai !== undefined) dbRow.qty_selesai = updates.qtySelesai;
      if (updates.waktuTerima !== undefined) dbRow.waktu_terima = updates.waktuTerima;
      if (updates.waktuSelesai !== undefined) dbRow.waktu_selesai = updates.waktuSelesai;
      if (updates.karyawan !== undefined) dbRow.karyawan_id = updates.karyawan;
      if (updates.koreksiStatus !== undefined) dbRow.koreksi_status = updates.koreksiStatus;
      if (updates.koreksiAlasan !== undefined) dbRow.koreksi_alasan = updates.koreksiAlasan;
      if (updates.upahDibayar !== undefined) dbRow.upah_dibayar = updates.upahDibayar;

      const { error } = await supabase
        .from('bundle_status_tahap')
        .upsert(dbRow, { onConflict: 'bundle_id,tahap' });

      if (error) throw error;
    } catch (err) {
      console.error('[useBundleStore] updateStatusTahap error:', err);
      // Rollback UI
      set({ bundles: backup });
      throw err; // Lempar ke pemanggil
    }
  },

  // ── GETTERS ───────────────────────────────────────────────────────────────

  getBundleByBarcode: (barcode) => get().bundles.find((b) => b.barcode === barcode),
  getBundlesByPO: (poId) => get().bundles.filter((b) => b.po === poId),

  // ── MARK UPAH PAID ────────────────────────────────────────────────────────

  markUpahPaid: async (poId) => {
    // Optimistic update
    set((state) => ({
      bundles: state.bundles.map((b) => {
        if (b.po !== poId) return b;
        const newStatusTahap = { ...b.statusTahap };
        (Object.keys(newStatusTahap) as (keyof typeof b.statusTahap)[]).forEach((tahap) => {
          if (newStatusTahap[tahap].status === 'selesai') {
            newStatusTahap[tahap] = { ...newStatusTahap[tahap], upahDibayar: true };
          }
        });
        return { ...b, statusTahap: newStatusTahap };
      }),
    }));

    try {
      // Ambil semua bundle id untuk PO ini
      const poBundleIds = Object.entries(get()._bundleIdMap)
        .filter(([barcode]) => {
          const bundle = get().bundles.find((b) => b.barcode === barcode);
          return bundle?.po === poId;
        })
        .map(([, id]) => id);

      if (poBundleIds.length === 0) return;

      const { error } = await supabase
        .from('bundle_status_tahap')
        .update({ upah_dibayar: true })
        .in('bundle_id', poBundleIds)
        .eq('status', 'selesai');

      if (error) throw error;
    } catch (err) {
      console.error('[useBundleStore] markUpahPaid error:', err);
    }
  },

  // ── UPDATE SURAT JALAN ID ─────────────────────────────────────────────────

  updateBundleSuratJalan: async (barcodes, sjId) => {
    // Optimistic update lokal
    set((state) => ({
      bundles: state.bundles.map((b) =>
        barcodes.includes(b.barcode) ? { ...b, suratJalanId: sjId } : b
      ),
    }));
    try {
      const { error } = await supabase
        .from('bundle')
        .update({ surat_jalan_id: sjId })
        .in('barcode', barcodes);
      if (error) throw error;
    } catch (err) {
      console.error('[useBundleStore] updateBundleSuratJalan error:', err);
      // Rollback lokal
      set((state) => ({
        bundles: state.bundles.map((b) =>
          barcodes.includes(b.barcode) ? { ...b, suratJalanId: undefined } : b
        ),
      }));
    }
  },

  // ── REJECT RECORDS (lokal only, tidak perlu Supabase) ────────────────────

  addRejectRecord: (record) =>
    set((state) => ({ rejectRecords: [...state.rejectRecords, record] })),

  // ── REMOVE BUNDLES BY PO ──────────────────────────────────────────────────

  removeBundlesByPO: async (poId) => {
    // Optimistic update
    set((state) => ({
      bundles: state.bundles.filter((b) => b.po !== poId),
    }));

    try {
      // Ambil bundle ids untuk PO ini
      const { data: rows } = await supabase
        .from('bundle')
        .select('id')
        .eq('po_id', poId);

      if (rows && rows.length > 0) {
        const ids = rows.map((r: any) => r.id);

        // Hapus status tahap dulu
        await supabase.from('bundle_status_tahap').delete().in('bundle_id', ids);

        // Hapus bundle berdasarkan IDs yang sudah diambil (bukan po_id)
        // agar bundle baru yang mungkin masuk di sela operasi tidak ikut terhapus
        await supabase.from('bundle').delete().in('id', ids);

        // Bersihkan id map
        set((state) => {
          const newMap = { ...state._bundleIdMap };
          Object.entries(newMap).forEach(([barcode, id]) => {
            if (ids.includes(id)) delete newMap[barcode];
          });
          return { _bundleIdMap: newMap };
        });
      }
    } catch (err) {
      console.error('[useBundleStore] removeBundlesByPO error:', err);
    }
  },
}));
