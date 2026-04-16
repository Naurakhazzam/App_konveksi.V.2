-- =========================================================================================
-- SUPER WIPE: MENGHAPUS SELURUH MASTER DATA & TRANSAKSI
-- =========================================================================================
-- Script ini akan menghapus Kategori, Model, Size, Warna, Satuan, Klien, dll, 
-- beserta Produk dan PO yang sudah ada.

TRUNCATE TABLE 
  kategori,
  model,
  size,
  warna,
  klien,
  karyawan,
  jabatan,
  jenis_reject,
  alasan_reject,
  kategori_trx,
  satuan,
  produk,
  hpp_komponen,
  produk_hpp_item,
  purchase_order,
  po_item,
  bundle
CASCADE;

-- Jika ingin reset nomor urutan menjadi kembali dari 1, 
-- gunakan ini (Opsional - menggantikan perintah di atas):
-- TRUNCATE TABLE kategori, model, size, warna, klien, karyawan, jabatan, jenis_reject, alasan_reject, kategori_trx, satuan, produk, hpp_komponen, produk_hpp_item, purchase_order, po_item, bundle RESTART IDENTITY CASCADE;
