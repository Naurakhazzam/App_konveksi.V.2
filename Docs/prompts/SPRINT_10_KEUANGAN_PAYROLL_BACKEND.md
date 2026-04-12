# Target: Backend Akuntansi & Modul Penggajian
Mengunci integritas finansial dengan memindahkan buku jurnal akuntansi, rekapan gaji ledger, dan HPP aktual ke server Prisma secara transaksional.

## Tugas
1. **Jurnal & Keuangan API:**
   - Server Actions khusus pencatatan *Jurnal Umum* (Entri In/Out kas perusahaan).
   - Buat Prisma Transaction Logic yang berjalan di background: saat terjadi pemotongan stok bahan dari API Produksi/Inventory (Sprint 9), secara otomatis Prisma akan meng-insert row jurnal pengeluaran bahan ke tabel JurnalKeuangan.
2. **Penggajian / Payroll Ledger API:**
   - Hapus state dummy `usePayrollStore.ts`.
   - Modifikasi logic tabel Dashboard Gaji untuk mengambil hasil agregasi upah dari Server. Backend berfungsi menghitung nominal Rp yang wajib dibayar dengan melakukan Query ke tabel Scan Produksi (mengalikan qty dengan master HPP komisi upah jahitan/potong).
   - Logika pemotongan denda/kasbon dijalankan melalui transaksi database agar tidak dimanipulasi dari client-side.
3. **Advanced Querying (Reports):**
   - Laporan HPP Realisasi vs Estimasi PO wajib menggunakan Server Component.
   - Buat fungsi query SQL aggregasi (atau Prisma `groupBy`) untuk menyajikan Laporan Per Bulan, memuat Total Pendapatan, Beban, Overhead, dan Laba Bersih secara terpusat langsung dari server.

## Kriteria Selesai
- Transaksi gaji sinkron secara time-real dengan aktivitas di lantai pabrik, tanpa input manual.
- Catatan jurnal uang hanya dapat bertambah, dan tercatat permanen di cloud (Database).
- Ringkasan profit di halaman awal Dashboard langsung diambil dari Data Agregasi Server.
