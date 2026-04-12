# SPRINT 6.5: UI/UX & Native Polish

## Context
Aplikasi telah berfungsi dengan baik secara "Mockup Frontend". Namun sebelum beralih ke Database (Supabase) di Sprint 7, kita harus memastikan 100% fitur, logika validasi, serta kelengkapan UI (UX, Notifikasi, Print Mode) benar-benar tuntas.

## Objective
Menyelesaikan "10%" terakhir dari aplikasi Frontend untuk menjadikannya benar-benar siap dipresentasikan atau digunakan sebagai Prototipe Sempurna.

## Task List

### 1. Print & Export PDF (Native CSS)
*Dokumen yang dicetak harus berpenampilan profesional dan menghilangkan sidebar/header.*
- [ ] Buka file `src/app/globals.css` dan tambahkan aturan `@media print` untuk menyembunyikan `.sidebar`, mengatur layout menjadi full width, dan menyembunyikan elemen non-cetak (tombol, dll).
- [ ] Pasang tombol **"Cetak Slip"** pada komponen Slip Gaji (`SlipGajiTemplate`) yang memicu `window.print()`.
- [ ] Pasang tombol **"Cetak Surat Jalan"** pada komponen Surat Jalan.
- [ ] Tambahkan opsi cetak pada tabel Laporan (Laporan Per PO & Laporan Bulan).

### 2. Advanced Validation & Error Handling
*Mencegah input yang membingungkan atau berpotensi merusak data.*
- [ ] **Validasi Kasbon**: Di `FormKasbon`, pastikan ada pengecekan agar nilai Kasbon yang diinput tidak melebihi sisa gaji berjalan karyawan saat ini. Tampilkan pesan peringatan warna merah jika lebih.
- [ ] **Block Ubah/Hapus PO**: Pada daftar PO (misal di halaman Input PO atau Monitoring), jika PO sudah memiliki "Progress Produksi" (bukan sekedar Draft/Baru dibuat), sembunyikan/nonaktifkan opsi untuk menghapus PO tersebut.
- [ ] **Validasi Tanggal**: Di semua fitur DateRangePicker (Laporan Keuangan, Rekap Gaji, dll), pastikan `Tanggal Akhir` selalu lebih besar atau sama dengan `Tanggal Awal`.

### 3. Empty States & Toast Notifications
- [ ] **Empty State**: Buat komponen `<EmptyState />` secara global (jika belum selesai di Sprint 1). Implementasikan pada: Tabel `MonitoringView` (jika tidak ada PO aktif), `AuditLogView` (jika belum ada log), dan `TransaksiKeluarView` (jika tidak ada riwayat).
- [ ] **Global Toast System**: Buat komponen Notifikasi (atau gunakan Library Toast jika diperbolehkan). Munculkan Toast sukses saat: 
  - "PO Berhasil Dibuat"
  - "Gaji Telah Terbayar"
  - "Koreksi Disetujui"
  - "Surat Jalan Dibuat"

### 4. Audit Log & Koreksi Data Finishment
- [ ] Pastikan halaman `/audit-log` benar-benar membaca data dari `useLogStore` secara *descending* (terbaru di atas) dan memiliki filter berdasarkan modul (Ketik, Produksi, Keuangan).
- [ ] Pastikan halaman `/koreksi-data` menampilkan antrian koreksi dari `useKoreksiStore` dan fitur "Approve/Reject"-nya bekerja sinkron dengan `useBundleStore`.

## Definition of Done (DoD)
- [ ] Fitur print/cetak berjalan mulus ketika ditekan CTRL+P atau tombol di UI (tampilan bersih).
- [ ] UI tidak memecahkan aplikasi jika ada aksi yang tidak valid (kasbon kemahalan, hapus data penting).
- [ ] Pengguna mendapat umpan balik visual (Toast) untuk setiap aksi penting.
- [ ] Halaman Audit Log dan Koreksi Data berfungsi secara logic dan menarik secara UI.
