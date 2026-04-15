import { create } from 'zustand';
import { InventoryItem, TransaksiMasuk, TransaksiKeluar, InventoryBatch } from '../types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './useAuthStore';

interface InventoryState {
  items: InventoryItem[];
  batches: InventoryBatch[];
  trxKeluar: TransaksiKeluar[];
  trxMasuk: TransaksiMasuk[];
  invoiceCounter: number;
  isLoading: boolean;

  loadInventory: () => Promise<void>;
  addItem: (item: InventoryItem) => Promise<void>;
  updateStock: (id: string, qty: number) => Promise<void>;
  addBatch: (batch: InventoryBatch) => Promise<void>;
  addTrxKeluar: (trx: TransaksiKeluar) => Promise<void>;
  addTrxMasuk: (trx: TransaksiMasuk) => Promise<void>;
  getAlertItems: () => InventoryItem[];

  // FIFO — logika bisnis tidak berubah, hanya storage dipindah ke Supabase
  consumeFIFO: (itemId: string, qtyNeeded: number) => Promise<{
    totalCost: number;
    consumedBatches: { batchId: string; qty: number; harga: number }[];
    insufficient?: boolean;
    qtyShortfall?: number;
  }>;
  generateInvoiceNo: () => Promise<string>;
  getHargaRataRata: (itemId: string) => number;
  convertToMeter: (val: number, fromUnit: string) => number;
}

// ── Helper: DB → TypeScript ──────────────────────────────────────────────────

function mapItem(row: any): InventoryItem {
  return {
    id: row.id,
    nama: row.nama,
    jenisBahan: row.jenis_bahan ?? undefined,
    satuanId: row.satuan_id ?? '',
    stokAktual: Number(row.stok ?? 0),
    stokMinimum: Number(row.stok_minimum ?? 0),
  };
}

function mapBatch(row: any): InventoryBatch {
  return {
    id: row.id,
    itemId: row.item_id,
    invoiceNo: row.invoice_no,
    qty: Number(row.qty ?? 0),
    qtyTerpakai: Number(row.qty_terpakai ?? 0),
    hargaSatuan: Number(row.harga_satuan ?? 0),
    tanggal: row.tanggal,
    keterangan: row.keterangan ?? undefined,
  };
}

function mapTrxKeluar(row: any): TransaksiKeluar {
  return {
    id: row.id,
    itemId: row.inventory_item_id,
    qty: Number(row.jumlah ?? 0),
    tanggal: row.tanggal ?? '',
    referensiPO: row.referensi_po ?? row.po_id ?? '',
    keterangan: row.keterangan ?? '',
    fifoData: row.fifo_data ?? undefined,
  };
}

function mapTrxMasuk(row: any): TransaksiMasuk {
  return {
    id: row.id,
    itemId: row.item_id,
    qty: Number(row.qty ?? 0),
    tanggal: row.tanggal,
    jurnalId: row.jurnal_id ?? '',
    keterangan: row.keterangan ?? '',
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  batches: [],
  trxKeluar: [],
  trxMasuk: [],
  invoiceCounter: 1,
  isLoading: false,

  // ── LOAD ──────────────────────────────────────────────────────────────────

  loadInventory: async () => {
    set({ isLoading: true });
    try {
      const [itemsRes, batchesRes, trxKeluarRes, trxMasukRes] = await Promise.all([
        supabase.from('inventory_item').select('*').order('nama'),
        supabase.from('inventory_batch').select('*').order('tanggal', { ascending: true }),
        supabase.from('transaksi_keluar').select('*').order('created_at', { ascending: true }),
        supabase.from('transaksi_masuk').select('*').order('created_at', { ascending: true }),
      ]);

      if (itemsRes.error) throw itemsRes.error;

      const items = (itemsRes.data ?? []).map(mapItem);
      const batches = (batchesRes.data ?? []).map(mapBatch);
      const trxKeluar = (trxKeluarRes.data ?? []).map(mapTrxKeluar);
      const trxMasuk = (trxMasukRes.data ?? []).map(mapTrxMasuk);

      set({ items, batches, trxKeluar, trxMasuk, isLoading: false });
    } catch (err) {
      console.error('[useInventoryStore] loadInventory error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD ITEM ──────────────────────────────────────────────────────────────

  addItem: async (item) => {
    // Audit Trail
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      console.error('[useInventoryStore] addItem ditolak: Session user tidak ditemukan.');
      return;
    }

    set((state) => ({ items: [...state.items, item] }));
    try {
      const { error } = await supabase.from('inventory_item').insert({
        id: item.id,
        nama: item.nama,
        jenis_bahan: item.jenisBahan ?? null,
        satuan_id: item.satuanId,
        stok: item.stokAktual,
        stok_minimum: item.stokMinimum,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[useInventoryStore] addItem error:', err);
      set((state) => ({ items: state.items.filter((i) => i.id !== item.id) }));
    }
  },

  // ── UPDATE STOK ───────────────────────────────────────────────────────────
  // Dipanggil setelah addBatch atau consumeFIFO — update kolom stok di DB.

  updateStock: async (id, qty) => {
    // Update lokal dulu
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, stokAktual: i.stokAktual + qty } : i
      ),
    }));
    try {
      // Ambil nilai stok terbaru dari state (setelah update lokal)
      const updatedItem = get().items.find((i) => i.id === id);
      if (!updatedItem) return;
      const { error } = await supabase
        .from('inventory_item')
        .update({ stok: updatedItem.stokAktual })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[useInventoryStore] updateStock error:', err);
    }
  },

  // ── ADD BATCH (Pembelian Bahan Masuk) ─────────────────────────────────────

  addBatch: async (batch) => {
    // Audit Trail
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      console.error('[useInventoryStore] addBatch ditolak: Session user tidak ditemukan.');
      return;
    }

    // BUG #32: Validasi sebelum operasi
    if (!batch.qty || batch.qty <= 0) {
      throw new Error('Qty batch harus lebih dari 0.');
    }
    if (!batch.hargaSatuan || batch.hargaSatuan <= 0) {
      throw new Error('Harga satuan harus lebih dari 0.');
    }

    // 1. Update lokal
    set((state) => ({ batches: [...state.batches, batch] }));
    await get().updateStock(batch.itemId, batch.qty);

    // 2. Simpan ke Supabase
    try {
      const { error } = await supabase.from('inventory_batch').insert({
        id: batch.id,
        item_id: batch.itemId,
        invoice_no: batch.invoiceNo,
        qty: batch.qty,
        qty_terpakai: batch.qtyTerpakai,
        harga_satuan: batch.hargaSatuan,
        tanggal: batch.tanggal,
        keterangan: batch.keterangan ?? null,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[useInventoryStore] addBatch error:', err);
    }
  },

  // ── ADD TRX KELUAR ────────────────────────────────────────────────────────

  addTrxKeluar: async (trx) => {
    set((state) => ({ trxKeluar: [...state.trxKeluar, trx] }));
    try {
      const { error } = await supabase.from('transaksi_keluar').insert({
        id: trx.id,
        inventory_item_id: trx.itemId,
        jumlah: trx.qty,
        tanggal: trx.tanggal,
        referensi_po: trx.referensiPO,
        po_id: trx.referensiPO,
        keterangan: trx.keterangan,
        fifo_data: trx.fifoData ?? null,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[useInventoryStore] addTrxKeluar error:', err);
    }
  },

  // ── ADD TRX MASUK ─────────────────────────────────────────────────────────

  addTrxMasuk: async (trx) => {
    set((state) => ({ trxMasuk: [...state.trxMasuk, trx] }));
    try {
      const { error } = await supabase.from('transaksi_masuk').insert({
        id: trx.id,
        item_id: trx.itemId,
        qty: trx.qty,
        tanggal: trx.tanggal,
        jurnal_id: trx.jurnalId ?? null,
        keterangan: trx.keterangan,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[useInventoryStore] addTrxMasuk error:', err);
    }
  },

  // ── GET ALERT ITEMS ───────────────────────────────────────────────────────

  getAlertItems: () => get().items.filter((i) => i.stokAktual <= i.stokMinimum),

  // ── GENERATE INVOICE NO ───────────────────────────────────────────────────

  // BUG #31: generateInvoiceNo sekarang async — menggunakan DB SEQUENCE agar
  // nomor invoice tidak reset saat halaman di-refresh.
  generateInvoiceNo: async () => {
    const { data, error } = await supabase.rpc('get_next_invoice_number');
    if (error) {
      // Fallback ke timestamp jika RPC gagal
      console.error('[useInventoryStore] get_next_invoice_number failed, using fallback:', error);
      return `FALLBACK-${Date.now()}`;
    }
    return data as string;
  },

  // BUG #30: consumeFIFO sekarang memanggil RPC atomic dengan SELECT FOR UPDATE.
  // Keuntungan:
  //   - Mencegah race condition antar dua operator scan bersamaan
  //   - Rollback otomatis jika sebagian update gagal (single DB transaction)
  //   - Stok tidak bisa negatif (UPDATE menggunakan GREATEST(0, ...))
  //   - Mengembalikan flag insufficient + qtyShortfall untuk warning UI
  consumeFIFO: async (itemId, qtyNeeded) => {
    const { data, error } = await supabase.rpc('consume_fifo_atomic', {
      p_item_id  : itemId,
      p_qty_needed: qtyNeeded,
    });

    if (error) throw error;

    // Refresh state batches dari DB setelah konsumsi agar UI tetap akurat
    try {
      const { data: batchRows } = await supabase
        .from('inventory_batch')
        .select('*')
        .eq('item_id', itemId)
        .order('tanggal', { ascending: true });

      if (batchRows) {
        const updatedBatches = batchRows.map(mapBatch);
        set((state) => ({
          batches: [
            ...state.batches.filter((b) => b.itemId !== itemId),
            ...updatedBatches,
          ],
        }));
      }

      // Sync stok di items state
      const { data: itemRow } = await supabase
        .from('inventory_item')
        .select('stok')
        .eq('id', itemId)
        .single();
      if (itemRow) {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, stokAktual: Number(itemRow.stok) } : i
          ),
        }));
      }
    } catch (refreshErr) {
      console.warn('[useInventoryStore] consumeFIFO state refresh failed:', refreshErr);
    }

    if (data.insufficient) {
      console.warn(
        `[consumeFIFO] Stok tidak cukup untuk item ${itemId}. Shortfall: ${data.qtyShortfall}`
      );
    }

    return {
      totalCost: Number(data.totalCost ?? 0),
      consumedBatches: data.consumedBatches ?? [],
      insufficient: data.insufficient ?? false,
      qtyShortfall: data.qtyShortfall ?? 0,
    };
  },

  // ── HELPERS ───────────────────────────────────────────────────────────────

  getHargaRataRata: (itemId) => {
    const { batches } = get();
    const activeBatches = batches.filter(
      (b) => b.itemId === itemId && b.qty - b.qtyTerpakai > 0
    );
    if (activeBatches.length === 0) return 0;
    const totalQty = activeBatches.reduce((acc, b) => acc + (b.qty - b.qtyTerpakai), 0);
    const totalValue = activeBatches.reduce(
      (acc, b) => acc + (b.qty - b.qtyTerpakai) * b.hargaSatuan, 0
    );
    return totalQty > 0 ? totalValue / totalQty : 0;
  },

  convertToMeter: (val, fromUnit) => {
    const unit = fromUnit.toLowerCase();
    if (unit === 'yard' || unit === 'yd') return val * 0.9144;
    if (unit === 'cm') return val / 100;
    return val;
  },
}));
