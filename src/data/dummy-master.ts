import { Kategori, Model, Size, Warna, Karyawan, Klien, JenisReject, AlasanReject, KategoriTrx, Satuan, HPPKomponen, ProdukHPPItem } from '../types';

export const dummyKategori: Kategori[] = [
  { id: 'KAT-001', nama: 'Kaos' },
  { id: 'KAT-002', nama: 'Kemeja' },
  { id: 'KAT-003', nama: 'Jaket' },
];

export const dummyModel: Model[] = [
  { id: 'MDL-001', nama: 'Airflow', kategoriId: 'KAT-001', targetPoin: 8 },
  { id: 'MDL-002', nama: 'Nectar', kategoriId: 'KAT-001', targetPoin: 10 },
  { id: 'MDL-003', nama: 'Breeze', kategoriId: 'KAT-002', targetPoin: 12 },
];

export const dummySize: Size[] = [
  { id: 'SZ-001', nama: 'S' },
  { id: 'SZ-002', nama: 'M' },
  { id: 'SZ-003', nama: 'L' },
  { id: 'SZ-004', nama: 'XL' },
  { id: 'SZ-005', nama: 'XXL' },
];

export const dummyWarna: Warna[] = [
  { id: 'WRN-001', nama: 'Black', kodeHex: '#000000' },
  { id: 'WRN-002', nama: 'White', kodeHex: '#ffffff' },
  { id: 'WRN-003', nama: 'Navy', kodeHex: '#000080' },
  { id: 'WRN-004', nama: 'Maroon', kodeHex: '#800000' },
];

export const dummyKaryawan: Karyawan[] = [];

export const dummyKlien: Klien[] = [
  { id: 'KLN-001', nama: 'PT Elysian Fashion', kontak: 'Diana', alamat: 'Jl. Gatot Subroto 45, Jakarta' },
  { id: 'KLN-002', nama: 'CV Garuda Textile', kontak: 'Rudi', alamat: 'Jl. Asia Afrika 78, Bandung' },
  { id: 'KLN-003', nama: 'Toko Maju Jaya', kontak: 'Sinta', alamat: 'Jl. Pemuda 12, Semarang' },
];

export const dummyKategoriTrx: KategoriTrx[] = [
  { id: 'KTR-001', nama: 'Pembelian Bahan Baku', jenis: 'direct_bahan' },
  { id: 'KTR-002', nama: 'Upah Karyawan', jenis: 'direct_upah' },
  { id: 'KTR-003', nama: 'Operasional Listrik', jenis: 'overhead' },
  { id: 'KTR-004', nama: 'Operasional Rumah', jenis: 'overhead' },
  { id: 'KTR-005', nama: 'Penerimaan PO', jenis: 'masuk' },
  { id: 'KTR-006', nama: 'Uang Makan', jenis: 'overhead' },
  { id: 'KTR-007', nama: 'Pembelian Aksesori', jenis: 'direct_bahan' },
  { id: 'KTR-008', nama: 'Pinjaman', jenis: 'masuk' },
];

export const dummyJenisReject: JenisReject[] = [
  { id: 'RJT-001', nama: 'Jahitan Loncat', potongan: 5000 },
  { id: 'RJT-002', nama: 'Noda Kain', potongan: 3000 },
  { id: 'RJT-003', nama: 'Ukuran Tidak Sesuai', potongan: 10000 },
  { id: 'RJT-004', nama: 'Benang Putus', potongan: 2000 },
  { id: 'RJT-005', nama: 'Kancing Lepas', potongan: 4000 },
];

export const dummyAlasanReject: AlasanReject[] = [
  { id: 'AR-001', nama: 'Cacat Kain (Bolong/Gores)', tahapBertanggungJawab: 'cutting', bisaDiperbaiki: false, dampakPotongan: 'hpp_po' },
  { id: 'AR-002', nama: 'Salah Potong Pola', tahapBertanggungJawab: 'cutting', bisaDiperbaiki: false, dampakPotongan: 'hpp_po' },
  { id: 'AR-003', nama: 'Jahitan Loncat/Kendor', tahapBertanggungJawab: 'jahit', bisaDiperbaiki: true, dampakPotongan: 'upah_tahap' },
  { id: 'AR-004', nama: 'Noda Oli/Kotor', tahapBertanggungJawab: 'jahit', bisaDiperbaiki: true, dampakPotongan: 'upah_tahap' },
  { id: 'AR-005', nama: 'Lubang Kancing Miring', tahapBertanggungJawab: 'lkancing', bisaDiperbaiki: true, dampakPotongan: 'upah_tahap' },
  { id: 'AR-006', nama: 'Salah Pasang Label', tahapBertanggungJawab: 'jahit', bisaDiperbaiki: true, dampakPotongan: 'upah_tahap' },
  { id: 'AR-007', nama: 'Kain Tergunting (QC)', tahapBertanggungJawab: 'bbenang', bisaDiperbaiki: false, dampakPotongan: 'hpp_po' },
];

export const dummySatuan: Satuan[] = [
  { id: 'UOM-001', nama: 'm' },
  { id: 'UOM-002', nama: 'kg' },
  { id: 'UOM-003', nama: 'g' },
  { id: 'UOM-004', nama: 'pcs' },
  { id: 'UOM-005', nama: 'roll' },
  { id: 'UOM-006', nama: 'lsn' },
];

export const dummyProduk = [
  { id: 'PRD-001', modelId: 'MDL-001', sizeId: 'SZ-001', warnaId: 'WRN-001', skuInternal: 'LYX-0001-BLK-S', skuKlien: 'AIR-BLK-S', aktif: true, hargaJual: 55000 },
  { id: 'PRD-002', modelId: 'MDL-001', sizeId: 'SZ-002', warnaId: 'WRN-001', skuInternal: 'LYX-0001-BLK-M', skuKlien: 'AIR-BLK-M', aktif: true, hargaJual: 60000 },
  { id: 'PRD-003', modelId: 'MDL-002', sizeId: 'SZ-003', warnaId: 'WRN-003', skuInternal: 'LYX-0002-NVY-L', skuKlien: 'NEC-NVY-L', aktif: true, hargaJual: 75000 },
  { id: 'PRD-004', modelId: 'MDL-003', sizeId: 'SZ-004', warnaId: 'WRN-004', skuInternal: 'LYX-0003-MRN-XL', skuKlien: 'BRZ-MRN-XL', aktif: true, hargaJual: 90000 },
  { id: 'PRD-005', modelId: 'MDL-001', sizeId: 'SZ-003', warnaId: 'WRN-001', skuInternal: 'LYX-0001-BLK-L', skuKlien: 'AIR-BLK-L', aktif: true, hargaJual: 65000 },
  { id: 'PRD-006', modelId: 'MDL-002', sizeId: 'SZ-002', warnaId: 'WRN-003', skuInternal: 'LYX-0002-NVY-M', skuKlien: 'NEC-NVY-M', aktif: true, hargaJual: 70000 },
];

export const dummyHPPKomponen: HPPKomponen[] = [
  { id: 'KOMP-001', nama: 'Modal Bahan (Kain Utama)', kategori: 'bahan_baku', satuan: 'meter', deskripsi: 'Kain utama body' },
  { id: 'KOMP-002', nama: 'Puring', kategori: 'bahan_baku', satuan: 'meter', deskripsi: 'Kain lapisan dalam' },
  { id: 'KOMP-003', nama: 'Sleting Badan', kategori: 'bahan_baku', satuan: 'pcs' },
  { id: 'KOMP-004', nama: 'Sleting Saku', kategori: 'bahan_baku', satuan: 'pcs' },
  { id: 'KOMP-005', nama: 'Kain Kantong', kategori: 'bahan_baku', satuan: 'meter' },
  { id: 'KOMP-006', nama: 'Tali', kategori: 'bahan_baku', satuan: 'meter' },
  { id: 'KOMP-007', nama: 'Bordir', kategori: 'bahan_baku', satuan: 'pcs' },
  { id: 'KOMP-008', nama: 'Mata Itik', kategori: 'bahan_baku', satuan: 'pcs' },
  { id: 'KOMP-009', nama: 'Stoper', kategori: 'bahan_baku', satuan: 'pcs' },
  { id: 'KOMP-010', nama: 'Upah Jahit', kategori: 'biaya_produksi', satuan: 'pcs', deskripsi: 'Ongkos jahit per pcs' },
  { id: 'KOMP-011', nama: 'Upah Cutting', kategori: 'biaya_produksi', satuan: 'pcs' },
  { id: 'KOMP-012', nama: 'Upah Buang Benang', kategori: 'biaya_produksi', satuan: 'pcs' },
  { id: 'KOMP-013', nama: 'Upah Packing', kategori: 'biaya_produksi', satuan: 'pcs' },
  { id: 'KOMP-014', nama: 'Upah Steam', kategori: 'biaya_produksi', satuan: 'pcs' },
  { id: 'KOMP-015', nama: 'Upah QC', kategori: 'biaya_produksi', satuan: 'pcs' },
  { id: 'KOMP-016', nama: 'Biaya Sewa Rumah', kategori: 'overhead', satuan: 'pcs', deskripsi: 'Alokasi sewa per pcs' },
  { id: 'KOMP-017', nama: 'Biaya Listrik', kategori: 'overhead', satuan: 'pcs' },
  { id: 'KOMP-018', nama: 'Biaya Makan', kategori: 'overhead', satuan: 'pcs' },
  { id: 'KOMP-019', nama: 'Biaya Operasional', kategori: 'overhead', satuan: 'pcs', deskripsi: 'Biaya tak terduga' },
];

export const dummyProdukHPPItems: ProdukHPPItem[] = [
  { id: 'PHI-001', produkId: 'PRD-001', komponenId: 'KOMP-001', harga: 15000, qty: 1.0 },
  { id: 'PHI-002', produkId: 'PRD-001', komponenId: 'KOMP-002', harga: 10000, qty: 1.0 },
  { id: 'PHI-003', produkId: 'PRD-001', komponenId: 'KOMP-003', harga: 8000, qty: 1 },
  { id: 'PHI-004', produkId: 'PRD-001', komponenId: 'KOMP-010', harga: 5000, qty: 1 },
  { id: 'PHI-005', produkId: 'PRD-001', komponenId: 'KOMP-011', harga: 2000, qty: 1 },
  { id: 'PHI-006', produkId: 'PRD-001', komponenId: 'KOMP-016', harga: 1000, qty: 1 },
  { id: 'PHI-007', produkId: 'PRD-001', komponenId: 'KOMP-017', harga: 1000, qty: 1 },
  { id: 'PHI-008', produkId: 'PRD-001', komponenId: 'KOMP-018', harga: 2000, qty: 1 },
  
  { id: 'PHI-009', produkId: 'PRD-002', komponenId: 'KOMP-001', harga: 15000, qty: 1.2 },
  { id: 'PHI-010', produkId: 'PRD-002', komponenId: 'KOMP-002', harga: 10000, qty: 1.2 },
  { id: 'PHI-011', produkId: 'PRD-002', komponenId: 'KOMP-003', harga: 8000, qty: 1 },
  { id: 'PHI-012', produkId: 'PRD-002', komponenId: 'KOMP-010', harga: 5000, qty: 1 },
  { id: 'PHI-013', produkId: 'PRD-002', komponenId: 'KOMP-011', harga: 2000, qty: 1 },
  { id: 'PHI-014', produkId: 'PRD-002', komponenId: 'KOMP-016', harga: 1000, qty: 1 },
  { id: 'PHI-015', produkId: 'PRD-002', komponenId: 'KOMP-017', harga: 1000, qty: 1 },
  { id: 'PHI-016', produkId: 'PRD-002', komponenId: 'KOMP-018', harga: 2000, qty: 1 },

  // MDL-001 SZ-003 (PRD-005)
  { id: 'PHI-017', produkId: 'PRD-005', komponenId: 'KOMP-001', harga: 15000, qty: 1.4 },
  { id: 'PHI-018', produkId: 'PRD-005', komponenId: 'KOMP-010', harga: 5000, qty: 1 },
  { id: 'PHI-019', produkId: 'PRD-005', komponenId: 'KOMP-011', harga: 2000, qty: 1 },

  // MDL-002 SZ-003 (PRD-003)
  { id: 'PHI-020', produkId: 'PRD-003', komponenId: 'KOMP-001', harga: 20000, qty: 1.5 },
  { id: 'PHI-021', produkId: 'PRD-003', komponenId: 'KOMP-010', harga: 7000, qty: 1 },
  { id: 'PHI-022', produkId: 'PRD-003', komponenId: 'KOMP-011', harga: 3000, qty: 1 },

  // MDL-002 SZ-002 (PRD-006)
  { id: 'PHI-023', produkId: 'PRD-006', komponenId: 'KOMP-001', harga: 20000, qty: 1.3 },
  { id: 'PHI-024', produkId: 'PRD-006', komponenId: 'KOMP-010', harga: 7000, qty: 1 },
  { id: 'PHI-025', produkId: 'PRD-006', komponenId: 'KOMP-011', harga: 3000, qty: 1 },
];
