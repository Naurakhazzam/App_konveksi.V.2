import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  Kategori, Model, Size, Warna, Karyawan, Klien, JenisReject,
  KategoriTrx, Satuan, Produk, HPPKomponen, ProdukHPPItem, AlasanReject, Jabatan
} from '../types';

interface MasterState {
  kategori: Kategori[];
  model: Model[];
  sizes: Size[];
  warna: Warna[];
  karyawan: Karyawan[];
  klien: Klien[];
  jenisReject: JenisReject[];
  alasanReject: AlasanReject[];
  kategoriTrx: KategoriTrx[];
  satuan: Satuan[];
  produk: Produk[];
  hppKomponen: HPPKomponen[];
  produkHPPItems: ProdukHPPItem[];
  jabatan: Jabatan[];
  isLoading: boolean;

  initializeMasterData: () => Promise<void>;
  importProdukBulk: (data: {
    kategori: Kategori[]; klien: Klien[]; model: Model[];
    warna: Warna[]; sizes: Size[]; hppKomponen: HPPKomponen[];
    produk: Produk[]; produkHPPItems: ProdukHPPItem[];
  }) => void;

  addKategori: (item: Kategori) => Promise<void>;
  updateKategori: (id: string, data: Partial<Kategori>) => Promise<void>;
  removeKategori: (id: string) => Promise<void>;

  addModel: (item: Model) => Promise<void>;
  updateModel: (id: string, data: Partial<Model>) => Promise<void>;
  removeModel: (id: string) => Promise<void>;

  addSize: (item: Size) => Promise<void>;
  updateSize: (id: string, data: Partial<Size>) => Promise<void>;
  removeSize: (id: string) => Promise<void>;

  addWarna: (item: Warna) => Promise<void>;
  updateWarna: (id: string, data: Partial<Warna>) => Promise<void>;
  removeWarna: (id: string) => Promise<void>;

  addKaryawan: (item: Karyawan) => Promise<void>;
  updateKaryawan: (id: string, data: Partial<Karyawan>) => Promise<void>;
  removeKaryawan: (id: string) => Promise<void>;

  addJabatan: (item: Jabatan) => Promise<void>;
  updateJabatan: (id: string, data: Partial<Jabatan>) => Promise<void>;
  removeJabatan: (id: string) => Promise<void>;

  addKlien: (item: Klien) => Promise<void>;
  updateKlien: (id: string, data: Partial<Klien>) => Promise<void>;
  removeKlien: (id: string) => Promise<void>;

  addJenisReject: (item: JenisReject) => Promise<void>;
  updateJenisReject: (id: string, data: Partial<JenisReject>) => Promise<void>;
  removeJenisReject: (id: string) => Promise<void>;

  addAlasanReject: (item: AlasanReject) => Promise<void>;
  updateAlasanReject: (id: string, data: Partial<AlasanReject>) => Promise<void>;
  removeAlasanReject: (id: string) => Promise<void>;

  addKategoriTrx: (item: KategoriTrx) => Promise<void>;
  updateKategoriTrx: (id: string, data: Partial<KategoriTrx>) => Promise<void>;
  removeKategoriTrx: (id: string) => Promise<void>;

  addSatuan: (item: Satuan) => Promise<void>;
  updateSatuan: (id: string, data: Partial<Satuan>) => Promise<void>;
  removeSatuan: (id: string) => Promise<void>;

  addProduk: (item: Produk) => Promise<void>;
  updateProduk: (id: string, data: Partial<Produk>) => Promise<void>;
  removeProduk: (id: string) => Promise<void>;

  addHPPKomponen: (item: HPPKomponen) => Promise<void>;
  updateHPPKomponen: (id: string, data: Partial<HPPKomponen>) => Promise<void>;
  removeHPPKomponen: (id: string) => Promise<void>;

  addProdukHPPItem: (item: ProdukHPPItem) => Promise<void>;
  updateProdukHPPItem: (id: string, data: Partial<ProdukHPPItem>) => Promise<void>;
  removeProdukHPPItem: (id: string) => Promise<void>;

  getHPPItemsByProduk: (produkId: string) => ProdukHPPItem[];
  getTotalHPP: (produkId: string) => number;
  getTotalHPPByKategori: (produkId: string, kategori: string) => number;
  getMargin: (produkId: string) => { nominal: number; persen: number };
  copyHPP: (fromProdukId: string, toProdukId: string) => void;
  copyHPPToAllSizes: (fromProdukId: string) => void;
}

// ── Helper generik untuk CRUD ────────────────────────────────────────────────

async function dbInsert(table: string, row: object) {
  const { error } = await supabase.from(table).insert(row);
  if (error) { console.error(`[MasterStore] insert ${table}:`, error.message); throw error; }
}
async function dbUpdate(table: string, id: string, row: object) {
  const { error } = await supabase.from(table).update(row).eq('id', id);
  if (error) { console.error(`[MasterStore] update ${table}:`, error.message); throw error; }
}
async function dbDelete(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) { console.error(`[MasterStore] delete ${table}:`, error.message); throw error; }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useMasterStore = create<MasterState>((set, get) => ({
  kategori: [],
  model: [],
  sizes: [],
  warna: [],
  karyawan: [],
  klien: [],
  jenisReject: [],
  alasanReject: [],
  kategoriTrx: [],
  satuan: [],
  produk: [],
  hppKomponen: [],
  produkHPPItems: [],
  jabatan: [],
  isLoading: false,

  // ── LOAD SEMUA DATA MASTER SEKALIGUS ──────────────────────────────────────

  initializeMasterData: async () => {
    set({ isLoading: true });
    try {
      const [
        karyawanRes, klienRes, modelRes, kategoriRes, warnaRes,
        sizeRes, satuanRes, kategoriTrxRes, jenisRejectRes, alasanRejectRes,
        produkRes, hppKomponenRes, produkHPPItemRes, jabatanRes,
      ] = await Promise.all([
        supabase.from('karyawan').select('*').order('id'),
        supabase.from('klien').select('*').order('nama'),
        supabase.from('model').select('*').order('nama'),
        supabase.from('kategori').select('*').order('nama'),
        supabase.from('warna').select('*').order('nama'),
        supabase.from('size').select('*').order('nama'),
        supabase.from('satuan').select('*').order('nama'),
        supabase.from('kategori_trx').select('*').order('nama'),
        supabase.from('jenis_reject').select('*').order('nama'),
        supabase.from('alasan_reject').select('*').order('nama'),
        supabase.from('produk').select('*'),
        supabase.from('hpp_komponen').select('*').order('nama'),
        supabase.from('produk_hpp_item').select('*'),
        supabase.from('jabatan').select('*').order('nama'),
      ]);

      set({
        karyawan: (karyawanRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama, jabatan: r.jabatan ?? '',
          aktif: r.aktif ?? true, tahapList: r.tahap_list ?? [],
          gajiPokok: Number(r.gaji_pokok ?? 0),
        })),
        klien: (klienRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama, kontak: r.kontak ?? '', alamat: r.alamat ?? '',
        })),
        model: (modelRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama, kategoriId: r.kategori_id ?? '',
          targetPoin: Number(r.target_poin ?? 0),
        })),
        kategori: (kategoriRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama,
        })),
        warna: (warnaRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama, kodeHex: r.kode_hex ?? '#000000',
        })),
        sizes: (sizeRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama,
        })),
        satuan: (satuanRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama,
        })),
        kategoriTrx: (kategoriTrxRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama, jenis: r.jenis,
        })),
        jenisReject: (jenisRejectRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama, potongan: Number(r.potongan ?? 0),
        })),
        alasanReject: (alasanRejectRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama,
          tahapBertanggungJawab: r.tahap_bertanggung_jawab ?? '',
          bisaDiperbaiki: r.bisa_diperbaiki ?? false,
          dampakPotongan: r.dampak_potongan ?? 'upah_tahap',
        })),
        produk: (produkRes.data ?? []).map((r: any) => ({
          id: r.id, modelId: r.model_id, sizeId: r.size_id, warnaId: r.warna_id,
          skuInternal: r.sku_internal ?? '', skuKlien: r.sku_klien ?? '',
          nama: r.nama ?? undefined, aktif: r.aktif ?? true,
          hargaJual: Number(r.harga_jual ?? 0),
        })),
        hppKomponen: (hppKomponenRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama, kategori: r.kategori, satuan: r.satuan,
          deskripsi: r.deskripsi ?? undefined,
          trackInventory: r.track_inventory ?? false,
          inventoryItemId: r.inventory_item_id ?? undefined,
        })),
        produkHPPItems: (produkHPPItemRes.data ?? []).map((r: any) => ({
          id: r.id, produkId: r.produk_id, komponenId: r.komponen_id,
          harga: Number(r.harga ?? r.nilai ?? 0),
          qty: Number(r.qty ?? 1),
          qtyFisik: r.qty_fisik ? Number(r.qty_fisik) : undefined,
        })),
        jabatan: (jabatanRes.data ?? []).map((r: any) => ({
          id: r.id, nama: r.nama,
        })),
        isLoading: false,
      });
    } catch (err) {
      console.error('[MasterStore] initializeMasterData error:', err);
      set({ isLoading: false });
    }
  },

  // ── IMPORT BULK (tetap lokal, untuk fitur import CSV) ────────────────────

  importProdukBulk: (data) => set((state) => {
    const merge = <T extends { id: string }>(original: T[], incoming: T[]): T[] => {
      const map = new Map(original.map((i) => [i.id, i]));
      incoming.forEach((i) => map.set(i.id, { ...map.get(i.id), ...i }));
      return Array.from(map.values());
    };
    return {
      kategori: merge(state.kategori, data.kategori),
      klien: merge(state.klien, data.klien),
      model: merge(state.model, data.model),
      warna: merge(state.warna, data.warna),
      sizes: merge(state.sizes, data.sizes),
      hppKomponen: merge(state.hppKomponen, data.hppKomponen),
      produk: merge(state.produk, data.produk),
      produkHPPItems: merge(state.produkHPPItems, data.produkHPPItems),
    };
  }),

  // ── KATEGORI ──────────────────────────────────────────────────────────────
  addKategori: async (item) => {
    const backup = get().kategori;
    set((s) => ({ kategori: [...s.kategori, item] }));
    try {
      await dbInsert('kategori', { id: item.id, nama: item.nama });
    } catch (err) {
      set({ kategori: backup });
    }
  },
  updateKategori: async (id, data) => {
    const backup = get().kategori;
    set((s) => ({ kategori: s.kategori.map((i) => i.id === id ? { ...i, ...data } : i) }));
    try {
      await dbUpdate('kategori', id, data);
    } catch (err) {
      set({ kategori: backup });
    }
  },
  removeKategori: async (id) => {
    const backup = get().kategori;
    const hasModels = get().model.some((m) => m.kategoriId === id);
    if (hasModels) {
      alert('Gagal: Kategori ini masih memiliki beberapa Model terkait.');
      return;
    }
    set((s) => ({ kategori: s.kategori.filter((i) => i.id !== id) }));
    try {
      await dbDelete('kategori', id);
    } catch (err) {
      set({ kategori: backup });
    }
  },

  // ── MODEL ─────────────────────────────────────────────────────────────────
  addModel: async (item) => {
    const backup = get().model;
    set((s) => ({ model: [...s.model, item] }));
    try {
      await dbInsert('model', { id: item.id, nama: item.nama, kategori_id: item.kategoriId, target_poin: item.targetPoin });
    } catch (err) {
      set({ model: backup });
    }
  },
  updateModel: async (id, data) => {
    const backup = get().model;
    set((s) => ({ model: s.model.map((i) => i.id === id ? { ...i, ...data } : i) }));
    try {
      const row: any = {};
      if (data.nama !== undefined) row.nama = data.nama;
      if (data.kategoriId !== undefined) row.kategori_id = data.kategoriId;
      if (data.targetPoin !== undefined) row.target_poin = data.targetPoin;
      await dbUpdate('model', id, row);
    } catch (err) {
      set({ model: backup });
    }
  },
  removeModel: async (id) => {
    const backup = get().model;
    const hasProducts = get().produk.some((p) => p.modelId === id);
    if (hasProducts) {
      alert('Gagal: Model ini masih digunakan oleh beberapa Produk/HPP.');
      return;
    }
    set((s) => ({ model: s.model.filter((i) => i.id !== id) }));
    try {
      await dbDelete('model', id);
    } catch (err) {
      set({ model: backup });
    }
  },

  // ── SIZE ──────────────────────────────────────────────────────────────────
  addSize: async (item) => {
    const backup = get().sizes;
    set((s) => ({ sizes: [...s.sizes, item] }));
    try {
      await dbInsert('size', { id: item.id, nama: item.nama });
    } catch (err) { set({ sizes: backup }); }
  },
  updateSize: async (id, data) => {
    const backup = get().sizes;
    set((s) => ({ sizes: s.sizes.map((i) => i.id === id ? { ...i, ...data } : i) }));
    try {
      await dbUpdate('size', id, data);
    } catch (err) { set({ sizes: backup }); }
  },
  removeSize: async (id) => {
    const backup = get().sizes;
    set((s) => ({ sizes: s.sizes.filter((i) => i.id !== id) }));
    try {
      await dbDelete('size', id);
    } catch (err) { set({ sizes: backup }); }
  },

  // ── WARNA ─────────────────────────────────────────────────────────────────
  addWarna: async (item) => {
    const backup = get().warna;
    set((s) => ({ warna: [...s.warna, item] }));
    try {
      await dbInsert('warna', { id: item.id, nama: item.nama, kode_hex: item.kodeHex });
    } catch (err) { set({ warna: backup }); }
  },
  updateWarna: async (id, data) => {
    const backup = get().warna;
    set((s) => ({ warna: s.warna.map((i) => i.id === id ? { ...i, ...data } : i) }));
    try {
      const row: any = {};
      if (data.nama !== undefined) row.nama = data.nama;
      if (data.kodeHex !== undefined) row.kode_hex = data.kodeHex;
      await dbUpdate('warna', id, row);
    } catch (err) { set({ warna: backup }); }
  },
  removeWarna: async (id) => {
    const backup = get().warna;
    set((s) => ({ warna: s.warna.filter((i) => i.id !== id) }));
    try {
      await dbDelete('warna', id);
    } catch (err) { set({ warna: backup }); }
  },

  // ── KARYAWAN ──────────────────────────────────────────────────────────────
  addKaryawan: async (item) => {
    const backup = get().karyawan;
    set((s) => ({ karyawan: [...s.karyawan, item] }));
    try {
      const { error } = await supabase.from('karyawan').insert({
        id: item.id, nama: item.nama, jabatan: item.jabatan,
        tahap_list: item.tahapList, gaji_pokok: item.gajiPokok, aktif: item.aktif,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[MasterStore] addKaryawan:', (err as any).message);
      set({ karyawan: backup });
    }
  },
  updateKaryawan: async (id, data) => {
    const backup = get().karyawan;
    set((s) => ({ karyawan: s.karyawan.map((i) => i.id === id ? { ...i, ...data } : i) }));
    try {
      const row: any = {};
      if (data.nama !== undefined) row.nama = data.nama;
      if (data.jabatan !== undefined) row.jabatan = data.jabatan;
      if (data.tahapList !== undefined) row.tahap_list = data.tahapList;
      if (data.gajiPokok !== undefined) row.gaji_pokok = data.gajiPokok;
      if (data.aktif !== undefined) row.aktif = data.aktif;
      const { error } = await supabase.from('karyawan').update(row).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[MasterStore] updateKaryawan:', (err as any).message);
      set({ karyawan: backup });
    }
  },
  removeKaryawan: async (id) => {
    const backup = get().karyawan;
    set((s) => ({ karyawan: s.karyawan.filter((i) => i.id !== id) }));
    try {
      const { error } = await supabase.from('karyawan').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[MasterStore] removeKaryawan:', (err as any).message);
      set({ karyawan: backup });
    }
  },

  // ── JABATAN ───────────────────────────────────────────────────────────────
  addJabatan: async (item) => {
    set((s) => ({ jabatan: [...s.jabatan, item] }));
    await dbInsert('jabatan', { id: item.id, nama: item.nama });
  },
  updateJabatan: async (id, data) => {
    set((s) => ({ jabatan: s.jabatan.map((i) => i.id === id ? { ...i, ...data } : i) }));
    await dbUpdate('jabatan', id, data);
  },
  removeJabatan: async (id) => {
    set((s) => ({ jabatan: s.jabatan.filter((i) => i.id !== id) }));
    await dbDelete('jabatan', id);
  },

  // ── KLIEN ─────────────────────────────────────────────────────────────────
  addKlien: async (item) => {
    set((s) => ({ klien: [...s.klien, item] }));
    await dbInsert('klien', { id: item.id, nama: item.nama, kontak: item.kontak, alamat: item.alamat });
  },
  updateKlien: async (id, data) => {
    set((s) => ({ klien: s.klien.map((i) => i.id === id ? { ...i, ...data } : i) }));
    await dbUpdate('klien', id, data);
  },
  removeKlien: async (id) => {
    set((s) => ({ klien: s.klien.filter((i) => i.id !== id) }));
    await dbDelete('klien', id);
  },

  // ── JENIS REJECT ──────────────────────────────────────────────────────────
  addJenisReject: async (item) => {
    set((s) => ({ jenisReject: [...s.jenisReject, item] }));
    await dbInsert('jenis_reject', { id: item.id, nama: item.nama, potongan: item.potongan });
  },
  updateJenisReject: async (id, data) => {
    set((s) => ({ jenisReject: s.jenisReject.map((i) => i.id === id ? { ...i, ...data } : i) }));
    await dbUpdate('jenis_reject', id, data);
  },
  removeJenisReject: async (id) => {
    set((s) => ({ jenisReject: s.jenisReject.filter((i) => i.id !== id) }));
    await dbDelete('jenis_reject', id);
  },

  // ── ALASAN REJECT ─────────────────────────────────────────────────────────
  addAlasanReject: async (item) => {
    set((s) => ({ alasanReject: [...s.alasanReject, item] }));
    await dbInsert('alasan_reject', {
      id: item.id, nama: item.nama,
      tahap_bertanggung_jawab: item.tahapBertanggungJawab,
      bisa_diperbaiki: item.bisaDiperbaiki,
      dampak_potongan: item.dampakPotongan,
    });
  },
  updateAlasanReject: async (id, data) => {
    set((s) => ({ alasanReject: s.alasanReject.map((i) => i.id === id ? { ...i, ...data } : i) }));
    const row: any = {};
    if (data.nama !== undefined) row.nama = data.nama;
    if (data.tahapBertanggungJawab !== undefined) row.tahap_bertanggung_jawab = data.tahapBertanggungJawab;
    if (data.bisaDiperbaiki !== undefined) row.bisa_diperbaiki = data.bisaDiperbaiki;
    if (data.dampakPotongan !== undefined) row.dampak_potongan = data.dampakPotongan;
    await dbUpdate('alasan_reject', id, row);
  },
  removeAlasanReject: async (id) => {
    set((s) => ({ alasanReject: s.alasanReject.filter((i) => i.id !== id) }));
    await dbDelete('alasan_reject', id);
  },

  // ── KATEGORI TRX ──────────────────────────────────────────────────────────
  addKategoriTrx: async (item) => {
    set((s) => ({ kategoriTrx: [...s.kategoriTrx, item] }));
    await dbInsert('kategori_trx', { id: item.id, nama: item.nama, jenis: item.jenis });
  },
  updateKategoriTrx: async (id, data) => {
    set((s) => ({ kategoriTrx: s.kategoriTrx.map((i) => i.id === id ? { ...i, ...data } : i) }));
    await dbUpdate('kategori_trx', id, data);
  },
  removeKategoriTrx: async (id) => {
    set((s) => ({ kategoriTrx: s.kategoriTrx.filter((i) => i.id !== id) }));
    await dbDelete('kategori_trx', id);
  },

  // ── SATUAN ────────────────────────────────────────────────────────────────
  addSatuan: async (item) => {
    set((s) => ({ satuan: [...s.satuan, item] }));
    await dbInsert('satuan', { id: item.id, nama: item.nama });
  },
  updateSatuan: async (id, data) => {
    set((s) => ({ satuan: s.satuan.map((i) => i.id === id ? { ...i, ...data } : i) }));
    await dbUpdate('satuan', id, data);
  },
  removeSatuan: async (id) => {
    set((s) => ({ satuan: s.satuan.filter((i) => i.id !== id) }));
    await dbDelete('satuan', id);
  },

  // ── PRODUK ────────────────────────────────────────────────────────────────
  addProduk: async (item) => {
    set((s) => ({ produk: [...s.produk, item] }));
    await dbInsert('produk', {
      id: item.id, model_id: item.modelId, size_id: item.sizeId, warna_id: item.warnaId,
      sku_internal: item.skuInternal, sku_klien: item.skuKlien ?? null,
      nama: item.nama ?? null, aktif: item.aktif, harga_jual: item.hargaJual,
    });
  },
  updateProduk: async (id, data) => {
    set((s) => ({ produk: s.produk.map((i) => i.id === id ? { ...i, ...data } : i) }));
    const row: any = {};
    if (data.modelId !== undefined) row.model_id = data.modelId;
    if (data.sizeId !== undefined) row.size_id = data.sizeId;
    if (data.warnaId !== undefined) row.warna_id = data.warnaId;
    if (data.skuInternal !== undefined) row.sku_internal = data.skuInternal;
    if (data.skuKlien !== undefined) row.sku_klien = data.skuKlien;
    if (data.nama !== undefined) row.nama = data.nama;
    if (data.aktif !== undefined) row.aktif = data.aktif;
    if (data.hargaJual !== undefined) row.harga_jual = data.hargaJual;
    await dbUpdate('produk', id, row);
  },
  removeProduk: async (id) => {
    set((s) => ({ produk: s.produk.filter((i) => i.id !== id) }));
    await dbDelete('produk', id);
  },

  // ── HPP KOMPONEN ──────────────────────────────────────────────────────────
  addHPPKomponen: async (item) => {
    set((s) => ({ hppKomponen: [...s.hppKomponen, item] }));
    await dbInsert('hpp_komponen', {
      id: item.id, nama: item.nama, kategori: item.kategori, satuan: item.satuan,
      deskripsi: item.deskripsi ?? null,
      track_inventory: item.trackInventory ?? false,
      inventory_item_id: item.inventoryItemId ?? null,
    });
  },
  updateHPPKomponen: async (id, data) => {
    set((s) => ({ hppKomponen: s.hppKomponen.map((i) => i.id === id ? { ...i, ...data } : i) }));
    const row: any = {};
    if (data.nama !== undefined) row.nama = data.nama;
    if (data.kategori !== undefined) row.kategori = data.kategori;
    if (data.satuan !== undefined) row.satuan = data.satuan;
    if (data.deskripsi !== undefined) row.deskripsi = data.deskripsi;
    if (data.trackInventory !== undefined) row.track_inventory = data.trackInventory;
    if (data.inventoryItemId !== undefined) row.inventory_item_id = data.inventoryItemId;
    await dbUpdate('hpp_komponen', id, row);
  },
  removeHPPKomponen: async (id) => {
    set((s) => ({ hppKomponen: s.hppKomponen.filter((i) => i.id !== id) }));
    await dbDelete('hpp_komponen', id);
  },

  // ── PRODUK HPP ITEM ───────────────────────────────────────────────────────
  addProdukHPPItem: async (item) => {
    set((s) => ({ produkHPPItems: [...s.produkHPPItems, item] }));
    await dbInsert('produk_hpp_item', {
      id: item.id, produk_id: item.produkId, komponen_id: item.komponenId,
      nilai: item.harga, harga: item.harga, qty: item.qty,
      qty_fisik: item.qtyFisik ?? null,
    });
  },
  updateProdukHPPItem: async (id, data) => {
    set((s) => ({ produkHPPItems: s.produkHPPItems.map((i) => i.id === id ? { ...i, ...data } : i) }));
    const row: any = {};
    if (data.harga !== undefined) { row.harga = data.harga; row.nilai = data.harga; }
    if (data.qty !== undefined) row.qty = data.qty;
    if (data.qtyFisik !== undefined) row.qty_fisik = data.qtyFisik;
    await dbUpdate('produk_hpp_item', id, row);
  },
  removeProdukHPPItem: async (id) => {
    set((s) => ({ produkHPPItems: s.produkHPPItems.filter((i) => i.id !== id) }));
    await dbDelete('produk_hpp_item', id);
  },

  // ── GETTERS & KALKULASI (logika bisnis tidak berubah) ─────────────────────

  getHPPItemsByProduk: (produkId) => get().produkHPPItems.filter((i) => i.produkId === produkId),

  getTotalHPP: (produkId) => {
    const items = get().produkHPPItems.filter((i) => i.produkId === produkId);
    return items.reduce((acc, curr) => acc + curr.harga * curr.qty, 0);
  },

  getTotalHPPByKategori: (produkId, kategori) => {
    const state = get();
    return state.produkHPPItems
      .filter((i) => i.produkId === produkId)
      .reduce((acc, curr) => {
        const kom = state.hppKomponen.find((k) => k.id === curr.komponenId);
        return kom?.kategori === kategori ? acc + curr.harga * curr.qty : acc;
      }, 0);
  },

  getMargin: (produkId) => {
    const state = get();
    const prod = state.produk.find((p) => p.id === produkId);
    const hargaJual = prod?.hargaJual || 0;
    const totalHpp = state.getTotalHPP(produkId);
    const nominal = hargaJual - totalHpp;
    return { nominal, persen: hargaJual > 0 ? (nominal / hargaJual) * 100 : 0 };
  },

  copyHPP: async (fromProdukId, toProdukId) => {
    const backup = get().produkHPPItems;
    const sourceItems = backup.filter((i) => i.produkId === fromProdukId);

    const newItems = sourceItems.map((item) => ({
      ...item,
      id: `PHI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      produkId: toProdukId,
    }));

    set((state) => ({
      produkHPPItems: [
        ...state.produkHPPItems.filter((i) => i.produkId !== toProdukId),
        ...newItems,
      ],
    }));

    try {
      await supabase.from('produk_hpp_item').delete().eq('produk_id', toProdukId);
      if (newItems.length > 0) {
        const { error } = await supabase.from('produk_hpp_item').insert(
          newItems.map((i) => ({
            id: i.id,
            produk_id: i.produkId,
            komponen_id: i.komponenId,
            harga: i.harga,
            nilai: i.harga,
            qty: i.qty,
            qty_fisik: i.qtyFisik ?? null,
          }))
        );
        if (error) throw error;
      }
    } catch (err) {
      console.error('[MasterStore] copyHPP failed, rolling back:', err);
      set({ produkHPPItems: backup });
    }
  },

  copyHPPToAllSizes: async (fromProdukId) => {
    const backup = get().produkHPPItems;
    const sourceProd = get().produk.find((p) => p.id === fromProdukId);
    if (!sourceProd) return;

    const sameModelProds = get().produk.filter(
      (p) => p.modelId === sourceProd.modelId && p.id !== fromProdukId
    );
    const sourceItems = backup.filter((i) => i.produkId === fromProdukId);
    const targetIds = sameModelProds.map((p) => p.id);

    const newItems: ProdukHPPItem[] = [];
    sameModelProds.forEach((targetProd) => {
      sourceItems.forEach((item) => {
        newItems.push({
          ...item,
          id: `PHI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${targetProd.id.slice(-4)}`,
          produkId: targetProd.id,
        });
      });
    });

    set((state) => ({
      produkHPPItems: [
        ...state.produkHPPItems.filter((i) => !targetIds.includes(i.produkId)),
        ...newItems,
      ],
    }));

    try {
      await supabase.from('produk_hpp_item').delete().in('produk_id', targetIds);
      if (newItems.length > 0) {
        const { error } = await supabase.from('produk_hpp_item').insert(
          newItems.map((i) => ({
            id: i.id,
            produk_id: i.produkId,
            komponen_id: i.komponenId,
            harga: i.harga,
            nilai: i.harga,
            qty: i.qty,
            qty_fisik: i.qtyFisik ?? null,
          }))
        );
        if (error) throw error;
      }
    } catch (err) {
      console.error('[MasterStore] copyHPPToAllSizes failed, rolling back:', err);
      set({ produkHPPItems: backup });
    }
  },
}));
      .reduc