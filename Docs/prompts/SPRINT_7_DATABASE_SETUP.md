# [SELESAI] Target: Setup Infrastruktur Database (Supabase)
Tugas utama pada sprint ini adalah memindahkan definisi data struktural dari tipe dummy menjadi skema database real menggunakan PostgreSQL via Supabase dan Prisma ORM.

## Tugas
1. **Inisialisasi Proyek Supabase/Prisma:**
   - Install SDK Prisma (`npm install prisma --save-dev`, `npx prisma init`).
   - Setup Environment Variables (`.env`) untuk koneksi ke database Supabase (Local/Remote).
2. **Desain Skema Prisma (`schema.prisma`):**
   - Buat skema untuk: Master Data (Kategori, Model, Size, Warna, Klien, Karyawan, Satuan, dll).
   - Buat skema untuk: Auth & Role (User, Role).
   - Buat skema untuk: Produksi (PO, Bundle, Scan Tracking).
   - Buat skema untuk: Inventory & Keuangan (Jurnal, Ledger Gaji, Stok).
   - Pastikan relasi antar tabel (One-to-Many, Many-to-Many) sudah benar (misal: ProdukHPPItem berelasi ke KomponenHPP dan Produk).
3. **Database Migration & Seed:**
   - Jalankan `npx prisma migrate dev` untuk membangun struktur database di Supabase.
   - Buat script `seed.ts` yang membaca data dari file `src/data/dummy-master.ts` (dll) lalu memasukkannya ke database.
4. **Setup Supabase Client:**
   - Buat utility connection untuk Prisma client (`src/lib/db.ts`) agar tidak terjadi connetion limit di development.

## Kriteria Selesai (Definition of Done)
- [x] Prisma Client / Supabase SDK berhasil digenerate.
- [x] Struktur tabel PostgreSQL sudah terbuat di database.
- [x] Script seeding berhasil mengisi data referensi (Master Data) ke database.
- [x] Koneksi Cloud Jaringan Stabil (Test Koneksi Online).
