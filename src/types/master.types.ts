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

export interface Karyawan {
  id: string;
  nama: string;
  jabatan: string;
  aktif: boolean;
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
}

export interface ProdukHPPItem {
  id: string;
  produkId: string;
  komponenId: string;
  harga: number;
  qty: number;
}
