import { create } from 'zustand';
import { JurnalEntry, JenisTransaksi } from '../types';
import { useInventoryStore } from './useInventoryStore';
import { supabase } from '@/lib/supabase';

interface JurnalState {
  entries: JurnalEntry[];
  isLoading: boolean;

  loadJurnal: () => Promise<void>;
  addEntry: (entry: JurnalEntry) => Promise<void>;
  getByPeriode: (startDate: string, endDate: string) => JurnalEntry[];
  getByJenis: (jenis: JenisTransaksi) => JurnalEntry[];
  getTotalByTipe: (tipe: 'masuk' | 'keluar') => number;
}

// ── Helper: DB → TypeScript ──────────────────────────────────────────────────

function mapEntry(row: any, detailUpahRows: any[]): JurnalEntry {
  const detailUpah = detailUpahRows
    .filter((d) => d.jurnal_id === row.id)
    .map((d) => ({
      karyawan: d.karyawan,
      jumlah: Number(d.jumlah ?? 0),
      po: d.po_id ?? '',
    }));

  return {
    id: row.id,
    kategoriTrxId: row.kategori ?? '',
    namaKategori: row.nama_kategori ?? undefined,
    jenis: row.jenis as JenisTransaksi,
    nominal: Number(row.jumlah ?? 0),
    tanggal: row.tanggal,
    waktu: row.waktu ?? undefined,
    noFaktur: row.no_faktur ?? undefined,
    tagPOs: row.tag_po ?? undefined,
    poId: row.po_id ?? undefined,
    keterangan: row.keterangan ?? '',
    detailUpah: detailUpah.length > 0 ? detailUpah : undefined,
    qty: row.qty ? Number(row.qty) : undefined,
    inventoryItemId: row.inventory_item_id ?? undefined,
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useJurnalStore = create<JurnalState>((set, get) => ({
  entries: [],
  isLoading: false,

  // ── LOAD ──────────────────────────────────────────────────────────────────

  loadJurnal: async () => {
    set({ isLoading: true });
    try {
      const [entriesRes, detailUpahRes] = await Promise.all([
        supabase
          .from('jurnal_entry')
          .select('*')
          .order('tanggal', { ascending: false }),
        supabase
          .from('jurnal_detail_upah')
          .select('*'),
      ]);

      if (entriesRes.error) throw entriesRes.error;

      const detailUpahRows = detailUpahRes.data ?? [];
      const entries = (entriesRes.data ?? []).map((row: any) =>
        mapEntry(row, detailUpahRows)
      );

      set({ entries, isLoading: false });
    } catch (err) {
      console.error('[useJurnalStore] loadJurnal error:', err);
      set({ isLoading: false });
    }
  },

  // ── ADD ENTRY ─────────────────────────────────────────────────────────────

  addEntry: async (entry) => {
    // 1. Optimistic update lokal
    set((state) => ({ entries: [entry, ...state.entries] }));

    try {
      // 2. Tentukan tipe berdasarkan jenis
      const tipe = entry.jenis === 'masuk' ? 'masuk' : 'keluar';

      // 3. Insert ke jurnal_entry
      const { error: entryError } = await supabase.from('jurnal_entry').insert({
        id: entry.id,
        kategori: entry.kategoriTrxId,
        nama_kategori: entry.namaKategori ?? null,
        jenis: entry.jenis,
        tipe,
        jumlah: entry.nominal,
        keterangan: entry.keterangan,
        tanggal: entry.tanggal,
        waktu: entry.waktu ?? null,
        no_faktur: entry.noFaktur ?? null,
        tag_po: entry.tagPOs ?? null,
        po_id: entry.poId ?? null,
        qty: entry.qty ?? null,
        inventory_item_id: entry.inventoryItemId ?? null,
      });
      if (entryError) throw entryError;

      // 4. Insert detail upah jika ada
      if (entry.detailUpah && entry.detailUpah.length > 0) {
        const detailRows = entry.detailUpah.map((d) => ({
          jurnal_id: entry.id,
          karyawan: d.karyawan,
          jumlah: d.jumlah,
          po_id: d.po,
        }));
        const { error: detailError } = await supabase
          .from('jurnal_detail_upah')
          .insert(detailRows);
        if (detailError) throw detailError;
      }
    } catch (err) {
      console.error('[useJurnalStore] addEntry error:', err);
      // Rollback
      set((state) => ({ entries: state.entries.filter((e) => e.id !== entry.id) }));
      return;
    }

    // 5. LOGIKA INVENTORY: Jika pembelian bahan, sambungkan ke inventory
    if (entry.jenis === 'direct_bahan' && entry.inventoryItemId) {
      const { addBatch } = useInventoryStore.getState();
      await addBatch({
        id: `BTC-AUTO-${Date.now()}`,
        itemId: entry.inventoryItemId,
        qty: entry.qty || 0,
        qtyTerpakai: 0,
        hargaSatuan: entry.nominal / (entry.qty || 1),
        tanggal: entry.tanggal,
        invoiceNo: entry.noFaktur || 'VIA-JURNAL',
        keterangan: `Input otomatis via Jurnal: ${entry.keterangan}`,
      });
    }
  },

  // ── GETTERS ───────────────────────────────────────────────────────────────

  getByPeriode: (startDate, endDate) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return get().entries.filter((e) => {
      const time = new Date(e.tanggal).getTime();
      return time >= start && time <= end;
    });
  },

  getByJenis: (jenis) => get().entries.filter((e) => e.jenis === jenis),

  getTotalByTipe: (tipe) =>
    get()
      .entries.filter((e) => (tipe === 'masuk' ? e.jenis === 'masuk' : e.jenis !== 'masuk'))
      .reduce((acc, curr) => acc + curr.nominal, 0),
}));
