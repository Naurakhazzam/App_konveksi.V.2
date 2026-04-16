-- =========================================================================================
-- !!! PERINGATAN: SCRIPT INI AKAN MENGHAPUS DATA SECARA PERMANEN !!!
--
-- Script ini akan mereset (mengosongkan) semua tabel yang berkaitan dengan:
-- 1. Master Produk
-- 2. Master HPP Komponen
-- 3. HPP tiap Produk
-- 4. PO (Purchase Order)
-- 5. Bundle Produksi
--
-- Karena menggunakan CASCADE, segala relasi yang bergantung pada tabel di atas
-- (misal: histori scan jahit, surat jalan pengiriman, retur untuk bundle tersebut)
-- JUGA AKAN IKUT TERHAPUS untuk menjaga integritas database.
-- =========================================================================================

TRUNCATE TABLE 
  produk,
  hpp_komponen,
  produk_hpp_item,
  purchase_order,
  po_item,
  bundle
CASCADE;

-- Jika Anda ingin menyetel ulang (reset) urutan/nomor auto-increment (identity) kembali ke 1, 
-- Anda bisa menggunakan perintah ini sebagai gantinya:
--
-- TRUNCATE TABLE produk, hpp_komponen, produk_hpp_item, po, bundle RESTART IDENTITY CASCADE;
