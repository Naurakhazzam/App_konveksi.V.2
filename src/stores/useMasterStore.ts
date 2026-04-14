import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  Kategori, Model, Size, Warna, Karyawan, Klien, JenisReject, KategoriTrx, Satuan, Produk, HPPKomponen, ProdukHPPItem, AlasanReject, Jabatan
} from '../types';
import { 
  initialClients, initialKategori, initialModels, initialWarna, initialSizes, initialHPPKomponen, initialProduk, initialProdukHPPItems 
} from '../data/initial-production-data';
import {
  dummyJenisReject, dummyKategoriTrx, dummySatuan, dummyKaryawan, dummyAlasanReject
} from '../data/dummy-master';

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
  
  // Supabase Actions
  isLoading: boolean;
  initializeMasterData: () => Promise<void>;
  
  importProdukBulk: (data: {
    kategori: Kategori[],
    klien: Klien[],
    model: Model[],
    warna: Warna[],
    sizes: Size[],
    hppKomponen: HPPKomponen[],
    produk: Produk[],
    produkHPPItems: ProdukHPPItem[]
  }) => void;
  
  // Actions
  addKategori: (item: Kategori) => void;
  updateKategori: (id: string, data: Partial<Kategori>) => void;
  removeKategori: (id: string) => void;

  addModel: (item: Model) => void;
  updateModel: (id: string, data: Partial<Model>) => void;
  removeModel: (id: string) => void;

  addSize: (item: Size) => void;
  updateSize: (id: string, data: Partial<Size>) => void;
  removeSize: (id: string) => void;

  addWarna: (item: Warna) => void;
  updateWarna: (id: string, data: Partial<Warna>) => void;
  removeWarna: (id: string) => void;

  addKaryawan: (item: Karyawan) => Promise<void>;
  updateKaryawan: (id: string, data: Partial<Karyawan>) => Promise<void>;
  removeKaryawan: (id: string) => Promise<void>;

  addJabatan: (item: Jabatan) => void;
  updateJabatan: (id: string, data: Partial<Jabatan>) => void;
  removeJabatan: (id: string) => void;

  addKlien: (item: Klien) => void;
  updateKlien: (id: string, data: Partial<Klien>) => void;
  removeKlien: (id: string) => void;

  addJenisReject: (item: JenisReject) => void;
  updateJenisReject: (id: string, data: Partial<JenisReject>) => void;
  removeJenisReject: (id: string) => void;

  addAlasanReject: (item: AlasanReject) => void;
  updateAlasanReject: (id: string, data: Partial<AlasanReject>) => void;
  removeAlasanReject: (id: string) => void;

  addKategoriTrx: (item: KategoriTrx) => void;
  updateKategoriTrx: (id: string, data: Partial<KategoriTrx>) => void;
  removeKategoriTrx: (id: string) => void;

  addSatuan: (item: Satuan) => void;
  updateSatuan: (id: string, data: Partial<Satuan>) => void;
  removeSatuan: (id: string) => void;

  addProduk: (item: Produk) => void;
  updateProduk: (id: string, data: Partial<Produk>) => void;
  removeProduk: (id: string) => void;

  addHPPKomponen: (item: HPPKomponen) => void;
  updateHPPKomponen: (id: string, data: Partial<HPPKomponen>) => void;
  removeHPPKomponen: (id: string) => void;

  addProdukHPPItem: (item: ProdukHPPItem) => void;
  updateProdukHPPItem: (id: string, data: Partial<ProdukHPPItem>) => void;
  removeProdukHPPItem: (id: string) => void;

  getHPPItemsByProduk: (produkId: string) => ProdukHPPItem[];
  getTotalHPP: (produkId: string) => number;
  getTotalHPPByKategori: (produkId: string, kategori: string) => number;
  getMargin: (produkId: string) => { nominal: number; persen: number };
  copyHPP: (fromProdukId: string, toProdukId: string) => void;
  copyHPPToAllSizes: (fromProdukId: string) => void;
}

export const useMasterStore = create<MasterState>((set, get) => ({
  kategori: initialKategori,
  model: initialModels,
  sizes: initialSizes,
  warna: initialWarna,
  klien: initialClients,
  jenisReject: dummyJenisReject,
  alasanReject: dummyAlasanReject,
  kategoriTrx: dummyKategoriTrx,
  satuan: dummySatuan,
  produk: initialProduk,
  hppKomponen: initialHPPKomponen,
  produkHPPItems: initialProdukHPPItems,
  jabatan: [
    { id: 'JAB-001', nama: 'Supervisor_Produksi' },
    { id: 'JAB-002', nama: 'Supervisor_Finising' },
    { id: 'JAB-003', nama: 'Operator Cutting' },
    { id: 'JAB-004', nama: 'Operator Jahit' },
  ],
  karyawan: [], // Start empty for Supabase fetch
  isLoading: false,

  initializeMasterData: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('karyawan')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        // Jika tabel belum ada atau error koneksi, gunakan dummy sebagai fallback
        console.warn('[Supabase] Gagal mengambil data karyawan, menggunakan dummy:', error.message);
        set({ karyawan: dummyKaryawan });
      } else if (data && data.length > 0) {
        // Mapping data dari Supabase (snake_case ke camelCase jika perlu)
        const mapped = data.map(k => ({
          id: k.id,
          nama: k.nama,
          jabatan: k.jabatan,
          tahapList: k.tahap_list || [],
          gajiPokok: k.gaji_pokok || 0,
          aktif: k.aktif !== undefined ? k.aktif : true
        }));
        set({ karyawan: mapped });
      } else {
        // Tabel kosong
        set({ karyawan: [] });
      }
    } catch (err) {
      console.error('[Supabase] Critical Error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  importProdukBulk: (data) => set((state) => {
    const merge = <T extends { id: string }>(original: T[], incoming: T[]): T[] => {
      const map = new Map();
      original.forEach(item => map.set(item.id, item));
      incoming.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
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
      produkHPPItems: merge(state.produkHPPItems, data.produkHPPItems)
    };
  }),

  addKategori: (item) => set((state) => ({ kategori: [...state.kategori, item] })),
  updateKategori: (id, data) => set((state) => ({ kategori: state.kategori.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeKategori: (id) => set((state) => ({ kategori: state.kategori.filter(i => i.id !== id) })),

  addKaryawan: async (item) => {
    // 1. Update Cloud
    const { error } = await supabase.from('karyawan').insert([{
      id: item.id,
      nama: item.nama,
      jabatan: item.jabatan,
      tahap_list: item.tahapList,
      gaji_pokok: item.gajiPokok,
      aktif: item.aktif
    }]);

    if (!error) {
      // 2. Update Local State
      set((state) => ({ karyawan: [...state.karyawan, item] }));
    } else {
      console.error('[Supabase] Add Gagal:', error.message);
      throw error;
    }
  },

  updateKaryawan: async (id, data) => {
    // 1. Update Cloud (Snake case mapping)
    const updateData: any = {};
    if (data.nama) updateData.nama = data.nama;
    if (data.jabatan) updateData.jabatan = data.jabatan;
    if (data.tahapList) updateData.tahap_list = data.tahapList;
    if (data.gajiPokok !== undefined) updateData.gaji_pokok = data.gajiPokok;
    if (data.aktif !== undefined) updateData.aktif = data.aktif;

    const { error } = await supabase.from('karyawan').update(updateData).eq('id', id);

    if (!error) {
      // 2. Update Local State
      set((state) => ({ 
        karyawan: state.karyawan.map(i => i.id === id ? { ...i, ...data } : i) 
      }));
    } else {
      console.error('[Supabase] Update Gagal:', error.message);
      throw error;
    }
  },

  removeKaryawan: async (id) => {
    const { error } = await supabase.from('karyawan').delete().eq('id', id);
    if (!error) {
      set((state) => ({ karyawan: state.karyawan.filter(i => i.id !== id) }));
    } else {
      console.error('[Supabase] Delete Gagal:', error.message);
      throw error;
    }
  },

  // ... (Sisa fungsi CRUD Client-side yang lain tetap menggunakan logic set lokal untuk sekarang)
  // Master lainnya akan dimigrasikan bertahap di fase berikutnya.
  
  addModel: (item) => set((state) => ({ model: [...state.model, item] })),
  updateModel: (id, data) => set((state) => ({ model: state.model.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeModel: (id) => set((state) => ({ model: state.model.filter(i => i.id !== id) })),

  addSize: (item) => set((state) => ({ sizes: [...state.sizes, item] })),
  updateSize: (id, data) => set((state) => ({ sizes: state.sizes.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeSize: (id) => set((state) => ({ sizes: state.sizes.filter(i => i.id !== id) })),

  addWarna: (item) => set((state) => ({ warna: [...state.warna, item] })),
  updateWarna: (id, data) => set((state) => ({ warna: state.warna.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeWarna: (id) => set((state) => ({ warna: state.warna.filter(i => i.id !== id) })),

  addJabatan: (item) => set((state) => ({ jabatan: [...state.jabatan, item] })),
  updateJabatan: (id, data) => set((state) => ({ jabatan: state.jabatan.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeJabatan: (id) => set((state) => ({ jabatan: state.jabatan.filter(i => i.id !== id) })),

  addKlien: (item) => set((state) => ({ klien: [...state.klien, item] })),
  updateKlien: (id, data) => set((state) => ({ klien: state.klien.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeKlien: (id) => set((state) => ({ klien: state.klien.filter(i => i.id !== id) })),

  addJenisReject: (item) => set((state) => ({ jenisReject: [...state.jenisReject, item] })),
  updateJenisReject: (id, data) => set((state) => ({ jenisReject: state.jenisReject.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeJenisReject: (id) => set((state) => ({ jenisReject: state.jenisReject.filter(i => i.id !== id) })),

  addAlasanReject: (item) => set((state) => ({ alasanReject: [...state.alasanReject, item] })),
  updateAlasanReject: (id, data) => set((state) => ({ alasanReject: state.alasanReject.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeAlasanReject: (id) => set((state) => ({ alasanReject: state.alasanReject.filter(i => i.id !== id) })),

  addKategoriTrx: (item) => set((state) => ({ kategoriTrx: [...state.kategoriTrx, item] })),
  updateKategoriTrx: (id, data) => set((state) => ({ kategoriTrx: state.kategoriTrx.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeKategoriTrx: (id) => set((state) => ({ kategoriTrx: state.kategoriTrx.filter(i => i.id !== id) })),

  addSatuan: (item) => set((state) => ({ satuan: [...state.satuan, item] })),
  updateSatuan: (id, data) => set((state) => ({ satuan: state.satuan.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeSatuan: (id) => set((state) => ({ satuan: state.satuan.filter(i => i.id !== id) })),

  addProduk: (item) => set((state) => ({ produk: [...state.produk, item] })),
  updateProduk: (id, data) => set((state) => ({ produk: state.produk.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeProduk: (id) => set((state) => ({ produk: state.produk.filter(i => i.id !== id) })),

  addHPPKomponen: (item) => set((state) => ({ hppKomponen: [...state.hppKomponen, item] })),
  updateHPPKomponen: (id, data) => set((state) => ({ hppKomponen: state.hppKomponen.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeHPPKomponen: (id) => set((state) => ({ hppKomponen: state.hppKomponen.filter(i => i.id !== id) })),

  addProdukHPPItem: (item) => set((state) => ({ produkHPPItems: [...state.produkHPPItems, item] })),
  updateProdukHPPItem: (id, data) => set((state) => ({ produkHPPItems: state.produkHPPItems.map(i => i.id === id ? { ...i, ...data } : i) })),
  removeProdukHPPItem: (id) => set((state) => ({ produkHPPItems: state.produkHPPItems.filter(i => i.id !== id) })),

  getHPPItemsByProduk: (produkId) => get().produkHPPItems.filter(i => i.produkId === produkId),
  
  getTotalHPP: (produkId) => {
    const items = get().produkHPPItems.filter(i => i.produkId === produkId);
    return items.reduce((acc, curr) => acc + (curr.harga * curr.qty), 0);
  },
  
  getTotalHPPByKategori: (produkId, kategori) => {
    const state = get();
    const items = state.produkHPPItems.filter(i => i.produkId === produkId);
    return items.reduce((acc, curr) => {
      const kom = state.hppKomponen.find(k => k.id === curr.komponenId);
      if (kom && kom.kategori === kategori) {
        return acc + (curr.harga * curr.qty);
      }
      return acc;
    }, 0);
  },
  
  getMargin: (produkId) => {
    const state = get();
    const prod = state.produk.find(p => p.id === produkId);
    const hargaJual = prod?.hargaJual || 0;
    const totalHpp = state.getTotalHPP(produkId);
    const nominal = hargaJual - totalHpp;
    const persen = hargaJual > 0 ? (nominal / hargaJual) * 100 : 0;
    return { nominal, persen };
  },

  copyHPP: (fromProdukId, toProdukId) => set((state) => {
    const filtered = state.produkHPPItems.filter(i => i.produkId !== toProdukId);
    const sourceItems = state.produkHPPItems.filter(i => i.produkId === fromProdukId);
    const newItems = sourceItems.map(item => ({
      ...item,
      id: `PHI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      produkId: toProdukId
    }));
    return { produkHPPItems: [...filtered, ...newItems] };
  }),

  copyHPPToAllSizes: (fromProdukId) => set((state) => {
    const sourceProd = state.produk.find(p => p.id === fromProdukId);
    if (!sourceProd) return state;
    
    const sameModelProds = state.produk.filter(
      p => p.modelId === sourceProd.modelId && p.id !== fromProdukId
    );
    
    const sourceItems = state.produkHPPItems.filter(i => i.produkId === fromProdukId);
    const targetIds = sameModelProds.map(p => p.id);
    let remaining = state.produkHPPItems.filter(
      i => !targetIds.includes(i.produkId)
    );
    
    const newItems: import('../types').ProdukHPPItem[] = [];
    sameModelProds.forEach(targetProd => {
      sourceItems.forEach(item => {
        newItems.push({
          ...item,
          id: `PHI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          produkId: targetProd.id
        });
      });
    });
    
    return { produkHPPItems: [...remaining, ...sourceItems, ...newItems] };
  })
}));
