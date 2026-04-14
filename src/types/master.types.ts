export interface Kategori {
  id: string;
  nama: string;
}

export interface Model {
  id: string;
  nama: string;
  kategoriId: string;
  targetPoin: number;
}

export interface Size {
  id: string;
  nama: string;
}

export interface Warna {
  id: string;
  nama: string;
  kodeHex: string;
}

export interface Jabatan {
  id: string;
  nama: string;
}

export interface Karyawan {
  id: string;
  nama: string;
  jabatan: string; // Linked by ID or Name (keeping as name for compatibility, but dynamic)
  aktif: boolean;
  tahapList: string[];
  gajiPokok: number; // New: Fixed salary component
}

export interface Klien {
  id: string;
  nama: string;
  kontak: string;
  alamat: string;
}

export interface JenisReject {
  id: string;
  nama: string;
  potongan: number;
}

export interface KategoriTrx {
  id: string;
  nama: string;
  jenis: 'direct_bahan' | 'direct_upah' | 'overhead' | 'masuk';
}

export interface Satuan {
  id: string;
  nama: string;
}

export interface Produk {
  id: string;
  modelId: string;
  sizeId: string;
  warnaId: string;
  skuInternal: string;
  skuKlien: string;
  nama?: string;
  aktif: boolean;
  hargaJual: number;
}

export interface HPPKomponen {
  id: string;
  nama: string;
  kategori: 'bahan_baku' | 'biaya_produksi' | 'overhead';
  satuan: string;
  deskripsi?: string;
  trackInventory?: boolean;    // BARU: centang jika item ini di-track stok-nya
  inventoryItemId?: string;    // BARU: link ke InventoryItem.id di gudang
}

export interface ProdukHPPItem {
  id: string;
  produkId: string;
  komponenId: string;
  harga: number;
  qty: number;
  qtyFisik?: number;  // BARU: berapa unit FISIK per 1 baju (contoh: 5 kancing per baju)
}

export interface AlasanReject {
  id: string;
  nama: string;                    // e.g., "Rusak Jahitan", "Bolong", "Kain Sobek", "Salah Potong"
  tahapBertanggungJawab: string;   // Tahap mana yang kena (e.g., 'jahit', 'cutting')
  bisaDiperbaiki: boolean;         // true = bisa di-scan ulang, false = masuk kerugian permanen
  dampakPotongan: 'upah_tahap' | 'hpp_po';
  // 'upah_tahap' = potong upah karyawan di tahap tsb
  // 'hpp_po' = potong sesuai HPP PO (untuk salah potong kain)
}
