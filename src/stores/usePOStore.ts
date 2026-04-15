import { create } from 'zustand';
import { PurchaseOrder, POItem, PemakaianBahan } from '@/types';
import { useLogStore } from './useLogStore';
import { useAuthStore } from './useAuthStore';
import { useBundleStore } from './useBundleStore';
import { supabase } from '@/lib/supabase';

interface POState {
  poList: PurchaseOrder[];
  globalSequence: number;
  isLoading: boolean;
  loadPOs: () => Promise<void>;
  addPO: (po: PurchaseOrder) => Promise<void>;
  updatePO: (id: string, data: Partial<PurchaseOrder>) => Promise<void>;
  removePO: (id: string) => Promise<void>;
  getPOById: (id: string) => PurchaseOrder | undefined;
  getNextNomorPO: () => string;
  incrementGlobalSequence: (count: number) => number;
  stuckThresholdHours: number;
  setStuckThreshold: (hours: number) => void;
  pemakaianBahan: PemakaianBahan[];
  addPemakaianBahan: (data: PemakaianBahan) => Promise<void>;
  getPemakaianBahan: (poId: string, modelId: string, warnaId: string, sizeId: string) => PemakaianBahan | undefined;
  updateItemCuttingStatus: (itemId: string, status: 'waiting' | 'started' | 'finished') => Promise<void>;
  createPOWithBundles: (po: PurchaseOrder, bundles: any[]) => Promise<void>;
}

// ── Helper: DB row → TypeScript ──────────────────────────────────────────────

function mapPORow(row: any, items: POItem[]): PurchaseOrder {
  return {
    id: row.id,
    klienId: row.klien_id,
    nomorPO: row.nomor_po,
    tanggalInput: row.tanggal_input,
    status: row.status,
    tanggalDeadline: row.tanggal_deadline ?? undefined,
    catatan: row.catatan ?? undefined,
    items,
  };
}

function mapItemRow(row: any): POItem {
  return {
    id: row.id,
    poId: row.po_id,
    modelId: row.model_id,
    warnaId: row.warna_id,
    sizeId: row.size_id,
    qty: row.qty,
    qtyPerBundle: row.qty_per_bundle,
    jumlahBundle: row.jumlah_bundle,
    skuKlien: row.sku_klien ?? '',
    skuInternal: row.sku_internal ?? '',
    statusCutting: row.status_cutting ?? 'waiting',
  };
}

// ── Helper: TypeScript → DB row ──────────────────────────────────────────────

function toPORow(po: PurchaseOrder) {
  return {
    id: po.id,
    klien_id: po.klienId,
    nomor_po: po.nomorPO,
    tanggal_input: po.tanggalInput,
    status: po.status,
    tanggal_deadline: po.tanggalDeadline ?? null,
    catatan: po.catatan ?? null,
  };
}

function toItemRow(item: POItem) {
  return {
    id: item.id,
    po_id: item.poId,
    model_id: item.modelId,
    warna_id: item.warnaId,
    size_id: item.sizeId,
    qty: item.qty,
    qty_per_bundle: item.qtyPerBundle,
    jumlah_bundle: item.jumlahBundle,
    sku_klien: item.skuKlien ?? null,
    sku_internal: item.skuInternal ?? null,
    status_cutting: item.statusCutting ?? 'waiting',
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const usePOStore = create<POState>((set, get) => ({
  poList: [],
  globalSequence: 1,
  isLoading: false,
  pemakaianBahan: [],
  stuckThresholdHours: 24,

  // ── LOAD ──────────────────────────────────────────────────────────────────

  loadPOs: async () => {
    set({ isLoading: true });
    try {
      // Fetch semua PO
      const { data: poRows, error: poError } = await supabase
        .from('purchase_order')
        .select('*')
        .order('created_at', { ascending: true });

      if (poError) throw poError;
      if (!poRows || poRows.length === 0) {
        set({ poList: [], isLoading: false });
        return;
      }

      // Fetch semua PO items sekaligus
      const poIds = poRows.map((r: any) => r.id);
      const { data: itemRows, error: itemError } = await supabase
        .from('po_item')
        .select('*')
        .in('po_id', poIds);

      if (itemError) throw itemError;

      // Fetch semua pemakaian bahan
      const { data: pemakaianRows } = await supabase
        .from('pemakaian_bahan')
        .select('*')
        .in('po_id', poIds);

      // Gabungkan items ke masing-masing PO
      const itemsByPO: Record<string, POItem[]> = {};
      (itemRows ?? []).forEach((row: any) => {
        if (!itemsByPO[row.po_id]) itemsByPO[row.po_id] = [];
        itemsByPO[row.po_id].push(mapItemRow(row));
      });

      const poList: PurchaseOrder[] = poRows.map((row: any) =>
        mapPORow(row, itemsByPO[row.id] ?? [])
      );

      const pemakaianBahan: PemakaianBahan[] = (pemakaianRows ?? []).map((row: any) => ({
        po: row.po_id,
        skuKlien: row.sku_klien,
        modelId: row.model_id ?? '',
        warnaId: row.warna_id ?? '',
        sizeId: row.size_id ?? '',
        artikelNama: row.artikel_nama ?? '',
        inventoryItemId: row.inventory_item_id ?? undefined,
        pemakaianKainMeter: Number(row.pemakaian_kain_meter ?? 0),
        pemakaianBeratGram: Number(row.pemakaian_berat_gram ?? 0),
        inputOleh: row.input_oleh ?? '',
        waktuInput: row.waktu_input ?? '',
      }));

      // Set globalSequence dari jumlah bundle yang pernah ada
      const maxSeq = poList.reduce((acc, po) =>
        acc + po.items.reduce((sum, item) => sum + item.jumlahBundle, 0), 0
      );

      set({ poList, pemakaianBahan, globalSequence: maxSeq + 1, isLoading: false });
    } catch (err) {
      console.error('[usePOStore] loadPOs error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD PO ────────────────────────────────────────────────────────────────

  addPO: async (po: PurchaseOrder) => {
    // Optimistic update
    set((state) => ({ poList: [...state.poList, po] }));

    try {
      const { error: poError } = await supabase
        .from('purchase_order')
        .insert(toPORow(po));
      if (poError) throw poError;

      if (po.items.length > 0) {
        const { error: itemError } = await supabase
          .from('po_item')
          .insert(po.items.map(toItemRow));
        if (itemError) throw itemError;
      }

      // Log Activity
      const user = useAuthStore.getState().currentUser;
      if (user) {
        useLogStore.getState().addLog({
          user: { id: user.id, nama: user.nama, role: user.roles[0] || 'User' },
          modul: 'produksi',
          aksi: 'Buat PO Baru',
          target: po.nomorPO,
          metadata: { items: po.items.length }
        });
      }
    } catch (err) {
      console.error('[usePOStore] addPO error:', err);
      // Rollback
      set((state) => ({ poList: state.poList.filter((p) => p.id !== po.id) }));
    }
  },

  // ── UPDATE PO ─────────────────────────────────────────────────────────────

  updatePO: async (id: string, data: Partial<PurchaseOrder>) => {
    // Optimistic update
    set((state) => ({
      poList: state.poList.map((p) => (p.id === id ? { ...p, ...data } : p))
    }));

    try {
      const { items, ...poData } = data;

      // Update header PO jika ada field selain items
      if (Object.keys(poData).length > 0) {
        const dbRow: any = {};
        if (poData.klienId !== undefined) dbRow.klien_id = poData.klienId;
        if (poData.nomorPO !== undefined) dbRow.nomor_po = poData.nomorPO;
        if (poData.tanggalInput !== undefined) dbRow.tanggal_input = poData.tanggalInput;
        if (poData.status !== undefined) dbRow.status = poData.status;
        if (poData.tanggalDeadline !== undefined) dbRow.tanggal_deadline = poData.tanggalDeadline;
        if (poData.catatan !== undefined) dbRow.catatan = poData.catatan;

        if (Object.keys(dbRow).length > 0) {
          const { error } = await supabase
            .from('purchase_order')
            .update(dbRow)
            .eq('id', id);
          if (error) throw error;
        }
      }

      // Update items jika ada (upsert)
      if (items && items.length > 0) {
        const { error } = await supabase
          .from('po_item')
          .upsert(items.map(toItemRow));
        if (error) throw error;
      }

      // Log Activity
      const user = useAuthStore.getState().currentUser;
      const po = get().getPOById(id);
      if (user && po) {
        useLogStore.getState().addLog({
          user: { id: user.id, nama: user.nama, role: user.roles[0] || 'User' },
          modul: 'produksi',
          aksi: 'Update PO',
          target: po.nomorPO
        });
      }
    } catch (err) {
      console.error('[usePOStore] updatePO error:', err);
    }
  },

  // ── REMOVE PO ─────────────────────────────────────────────────────────────

  removePO: async (id: string) => {
    const po = get().getPOById(id);

    // Optimistic update
    set((state) => ({ poList: state.poList.filter((p) => p.id !== id) }));

    try {
      // Delete PO items terlebih dahulu
      await supabase.from('po_item').delete().eq('po_id', id);

      // Delete PO
      const { error } = await supabase
        .from('purchase_order')
        .delete()
        .eq('id', id);
      if (error) throw error;

      // Cleanup associated bundles and corrections
      const { useKoreksiStore } = require('./useKoreksiStore');
      useBundleStore.getState().removeBundlesByPO(id);
      useKoreksiStore.getState().removeKoreksiByPO(id);

      // Log Activity
      const user = useAuthStore.getState().currentUser;
      if (user && po) {
        useLogStore.getState().addLog({
          user: { id: user.id, nama: user.nama, role: user.roles[0] || 'User' },
          modul: 'produksi',
          aksi: 'Hapus PO',
          target: po.nomorPO
        });
      }
    } catch (err) {
      console.error('[usePOStore] removePO error:', err);
      // Rollback
      if (po) {
        set((state) => ({ poList: [...state.poList, po] }));
      }
    }
  },

  // ── GETTERS ───────────────────────────────────────────────────────────────

  getPOById: (id: string) => get().poList.find((p) => p.id === id),

  getNextNomorPO: () => {
    const list = get().poList;
    if (list.length === 0) return 'PO-001';
    const lastPO = list[list.length - 1];
    const sequence = parseInt(lastPO.nomorPO.replace('PO-', '')) || 0;
    return `PO-${(sequence + 1).toString().padStart(3, '0')}`;
  },

  incrementGlobalSequence: (count: number) => {
    const current = get().globalSequence;
    set({ globalSequence: current + count });
    return current;
  },

  setStuckThreshold: (hours: number) => set({ stuckThresholdHours: hours }),

  // ── PEMAKAIAN BAHAN ───────────────────────────────────────────────────────

  addPemakaianBahan: async (data: PemakaianBahan) => {
    // 1. Optimistic update store lokal
    set((state) => ({ pemakaianBahan: [...state.pemakaianBahan, data] }));

    // 2. Simpan ke Supabase
    try {
      const { error } = await supabase.from('pemakaian_bahan').insert({
        po_id: data.po,
        sku_klien: data.skuKlien,
        model_id: data.modelId,
        warna_id: data.warnaId,
        size_id: data.sizeId,
        artikel_nama: data.artikelNama,
        inventory_item_id: data.inventoryItemId ?? null,
        pemakaian_kain_meter: data.pemakaianKainMeter,
        pemakaian_berat_gram: data.pemakaianBeratGram,
        input_oleh: data.inputOleh,
        waktu_input: data.waktuInput,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[usePOStore] addPemakaianBahan error:', err);
    }

    // 3. LOGIKA FIFO: Potong Stok Inventori
    if (data.inventoryItemId) {
      const { useInventoryStore } = require('./useInventoryStore');
      const invStore = useInventoryStore.getState();
      const inventoryItem = invStore.items.find((i: any) => i.id === data.inventoryItemId);

      if (inventoryItem) {
        const currentPO = get().poList.find((p) => p.id === data.po);
        const poItem = currentPO?.items.find(
          (it) => it.modelId === data.modelId && it.warnaId === data.warnaId && it.sizeId === data.sizeId
        );

        if (poItem) {
          const totalQty = poItem.qty;
          let qtyToConsume = 0;
          let unitLabel = '';

          const satuan = inventoryItem.satuanId.toLowerCase();
          if (satuan === 'm' || satuan === 'uom-001' || satuan === 'yard') {
            const meterTotal = (data.pemakaianKainMeter / 100) * totalQty;
            qtyToConsume = invStore.convertToMeter(meterTotal, 'm');
            unitLabel = 'Meter';
          } else if (satuan === 'kg' || satuan === 'uom-002') {
            qtyToConsume = (data.pemakaianBeratGram / 1000) * totalQty;
            unitLabel = 'Kg';
          } else {
            qtyToConsume = (data.pemakaianKainMeter || data.pemakaianBeratGram) * totalQty;
            unitLabel = satuan;
          }

          if (qtyToConsume > 0) {
            await invStore.consumeFIFO(data.inventoryItemId, qtyToConsume);
            useLogStore.getState().addLog({
              user: { id: 'SYSTEM', nama: 'System', role: 'System' },
              modul: 'inventory',
              aksi: 'Auto-Potong Stok (Cutting)',
              target: inventoryItem.nama,
              metadata: {
                po: data.po,
                qtyDipotong: qtyToConsume,
                unit: unitLabel,
                artikel: data.artikelNama
              }
            });
          }
        }
      }
    }
  },

  getPemakaianBahan: (poId, modelId, warnaId, sizeId) =>
    get().pemakaianBahan.find(
      (p) => p.po === poId && p.modelId === modelId && p.warnaId === warnaId && p.sizeId === sizeId
    ),

  // ── UPDATE CUTTING STATUS ─────────────────────────────────────────────────

  updateItemCuttingStatus: async (itemId, status) => {
    // Optimistic update
    set((state) => ({
      poList: state.poList.map((po) => ({
        ...po,
        items: po.items.map((item) =>
          item.id === itemId ? { ...item, statusCutting: status } : item
        ),
      })),
    }));

    try {
      const { error } = await supabase
        .from('po_item')
        .update({ status_cutting: status })
        .eq('id', itemId);
      if (error) throw error;
    } catch (err) {
      console.error('[usePOStore] updateItemCuttingStatus error:', err);
    }
  },

  // ── CREATE PO + BUNDLES (ATOMIC) ──────────────────────────────────────────

  createPOWithBundles: async (po, bundles) => {
    // 1. Optimistic update lokal
    set((state) => ({
      poList: [...state.poList, po],
      globalSequence: state.globalSequence + bundles.length,
    }));
    useBundleStore.getState().addBundles(bundles);

    try {
      // 2. Insert PO ke Supabase
      const { error: poError } = await supabase
        .from('purchase_order')
        .insert(toPORow(po));
      if (poError) throw poError;

      // 3. Insert PO Items
      if (po.items.length > 0) {
        const { error: itemError } = await supabase
          .from('po_item')
          .insert(po.items.map(toItemRow));
        if (itemError) throw itemError;
      }

      // 4. Insert Bundles
      if (bundles.length > 0) {
        const bundleRows = bundles.map((b: any) => ({
          id: b.id,
          barcode: b.barcode,
          po_id: b.poId,
          po_item_id: b.poItemId ?? null,
          model_id: b.modelId,
          warna_id: b.warnaId,
          size_id: b.sizeId,
          qty_bundle: b.qtyBundle,
          sku_klien: b.skuKlien ?? null,
          sku_internal: b.skuInternal ?? null,
        }));
        const { error: bundleError } = await supabase
          .from('bundle')
          .insert(bundleRows);
        if (bundleError) throw bundleError;
      }

      // 5. Log Activity
      const user = useAuthStore.getState().currentUser;
      if (user) {
        useLogStore.getState().addLog({
          user: { id: user.id, nama: user.nama, role: user.roles[0] || 'User' },
          modul: 'produksi',
          aksi: 'Buat PO Baru (Atomic)',
          target: po.nomorPO,
          metadata: { items: po.items.length, bundles: bundles.length }
        });
      }
    } catch (err) {
      console.error('[usePOStore] createPOWithBundles error:', err);
      // Rollback lokal
      set((state) => ({
        poList: state.poList.filter((p) => p.id !== po.id),
        globalSequence: state.globalSequence - bundles.length,
      }));
    }
  },
}));
