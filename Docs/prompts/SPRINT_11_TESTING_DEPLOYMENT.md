# Target: Final Polish, Security & Deployment
Etape pungkas proyek di mana sistem dipersiapkan secara keseluruhan untuk siap digunakan (Go-Live) di lantai produksi pabrik konveksi.

## Tugas
1. **Keamanan Data Server (Securing Data):**
   - Atur mekanisme proteksi *Row Level Security* (RLS) di environment PostgreSQL Supabase. 
   - Pastikan Role "Mandor" tidak bisa memanggil API query Keuangan. 
   - Validasi sesi dari token (JWT) menggunakan file middleware aplikasi Next.js.
2. **Setup Pencetakan (Printer Thermal & Laporan):**
   - Sesuaikan layout komponen UI menggunakan `@media print` CSS atau *React-PDF*.
   - Integrasikan halaman-halaman penting seperti (1) Tiket Barcode PO, (2) Surat Jalan, dan (3) Slip Gaji PDF untuk di-print dengan mudah di device admin.
3. **Optimisasi Perfoma UI & PWA (Opsional):**
   - Tuntaskan masalah hydrate/rendering. Buat *loading states*, *suspense boundaries* agar UI tidak macet saat loading data dari backend lambat.
   - Aktivasi standar Manifest PWA, sehingga aplikasi dapat di-install secara native (Add to Homescreen) di tablet operator Scan.
4. **Environment Deployment:**
   - Sambungkan proyek ke repository.
   - Buat file `.env.production` dan hubungkan API Key asli Supabase ke server.
   - Lakukan Build Testing `npm run build`, analisis error/typo Typescript yang terlewat `npx tsc --noEmit`.
   - Lakukan Deployment proyek ke layanan Hosting seperti Vercel.

## Kriteria Selesai
- URL Staging/Production berhasil diakses via Web maupun Tablet HP.
- PDF Printer bekerja secara responsif dan rapi.
- Aplikasi lulus uji kemanan akses berdasarkan hak role Admin / Mandor / Owner.
