import { create } from 'zustand';
import { InventoryItem, TransaksiMasuk, TransaksiKeluar, InventoryBatch } from '../types';
import { supabase } from '@/lib/supabase';

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
  }>;
  generateInvoiceNo: () => string;
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

  generateInvoiceNo: () => {
    const { invoiceCounter } = get();
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    const nextNo = String(invoiceCounter).padStart(4, '0');
    const invoiceNo = `${nextNo}/INV/${dd}/${mm}/${yy}`;
    set({ invoiceCounter: invoiceCounter + 1 });
    return invoiceNo;
  },

  // ── CONSUME FIFO ──────────────────────────────────────────────────────────
  // Logika FIFO tidak berubah. Yang bertambah: update qty_terpakai di Supabase.

  consumeFIFO: async (itemId, qtyNeeded) => {
    const { batches } = get();

    // --- Kalkulasi FIFO (sama persis seperti sebelumnya) ---
    const relevantBatches = batches
      .filter((b) => b.itemId === itemId && b.qty - b.qtyTerpakai > 0)
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    let remainingToConsume = qtyNeeded;
    let totalCost = 0;
    const consumedDetails: { batchId: string; qty: number; harga: number }[] = [];
    const updatedBatches = [...batches];

    for (const batch of relevantBatches) {
      if (remainingToConsume <= 0) break;

      const availableInBatch = batch.qty - batch.qtyTerpakai;
      const amountToTake = Math.min(availableInBatch, remainingToConsume);

      consumedDetails.push({ batchId: batch.id, qty: amountToTake, harga: batch.hargaSatuan });
      totalCost += amountToTake * batch.hargaSatuan;
      remainingToConsume -= amountToTake;

      const batchIdx = updatedBatches.findIndex((b) => b.id === batch.id);
      if (batchIdx !== -1) {
        updatedBatches[batchIdx] = {
          ...updatedBatches[batchIdx],
          qtyTerpakai: updatedBatches[batchIdx].qtyTerpakai + amountToTake,
        };
      }
    }

    // Update state lokal
    set({ batches: updatedBatches });
    await get().updateStock(itemId, -qtyNeeded);

    // --- Simpan perubahan qty_terpakai ke Supabase secara paralel ---
    try {
      await Promise.all(
        consumedDetails.map(({ batchId, qty }) => {
          const updatedBatch = updatedBatches.find((b) => b.id === batchId);
          if (!updatedBatch) return Promise.resolve();
          return supabase
            .from('inventory_batch')
            .update({ qty_terpakai: updatedBatch.qtyTerpakai })
            .eq('id', batchId);
        })
      );
    } catch (err) {
      console.error('[useInventoryStore] consumeFIFO Supabase sync error:', err);
    }

    return { totalCost, consumedBatches: consumedDetails };
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
