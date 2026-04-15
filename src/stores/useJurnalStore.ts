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

  addEntry: async (entry: JurnalEntry) => {
    // 1. Audit Trail: Siapa yang mencatat transaksi ini?
    const { useAuthStore } = require('./useAuthStore');
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      console.error('[useJurnalStore] addEntry ditolak: Session user tidak ditemukan.');
      return;
    }

    const backup = get().entries;
    set((state) => ({ entries: [entry, ...state.entries] }));

    try {
      const tipe = entry.jenis === 'masuk' ? 'masuk' : 'keluar';

      // ── LOGIKA ATOMIK: PEMBELIAN BAHAN ─────────────────────────────────────
      if (entry.jenis === 'direct_bahan' && entry.inventoryItemId) {
        const batchId = `BTC-AUTO-${Date.now()}`;
        const qty = entry.qty || 0;
        const hargaSatuan = entry.nominal / (qty || 1);

        const { error: rpcError } = await supabase.rpc('record_purchase_atomic', {
          p_jurnal_row: {
            id: entry.id,
            kategori: entry.kategoriTrxId,
            jenis: entry.jenis,
            tipe,
            nominal: entry.nominal,
            keterangan: entry.keterangan,
            tanggal: entry.tanggal,
            qty: qty,
            inventory_item_id: entry.inventoryItemId
          },
          p_batch_row: {
            id: batchId,
            item_id: entry.inventoryItemId,
            qty: qty,
            harga_satuan: hargaSatuan,
            tanggal: new Date(entry.tanggal).toISOString(),
            invoice_no: entry.noFaktur || 'VIA-JURNAL',
            keterangan: `Input otomatis via Jurnal: ${entry.keterangan}`
          }
        });

        if (rpcError) throw rpcError;
        
        // Refresh inventory store agar tampilan stok terupdate
        const { useInventoryStore } = require('./useInventoryStore');
        await useInventoryStore.getState().loadInventory();
        
      } else {
        // ── LOGIKA STANDAR (Non-Bahan) ───────────────────────────────────────
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

        // Insert detail upah jika ada
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
      }

      // Log aktivitas sukses
      const { useLogStore } = require('./useLogStore');
      useLogStore.getState().addLog({
        user: { id: currentUser.id, nama: currentUser.nama, role: currentUser.roles[0] || 'User' },
        modul: 'keuangan',
        aksi: 'Tambah Jurnal',
        target: entry.id,
        metadata: { nominal: entry.nominal, jenis: entry.jenis }
      });

    } catch (err) {
      console.error('[useJurnalStore] addEntry failed, rolling back:', err);
      set({ entries: backup });
      throw err;
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
          const detailRows = 