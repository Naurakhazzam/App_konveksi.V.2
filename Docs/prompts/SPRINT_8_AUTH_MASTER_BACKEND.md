# Target: API Routes & Master Data Integration
Sprint ini berfokus pada transisi data Master dan Authentication dari Zustand-state (dummy) ke server-state (database) dengan Next.js Server Actions / API Routes.

## Tugas
1. **Authentication Backend:**
   - Setup AuthJS (NextAuth v5) atau Supabase Auth.
   - Buat endpoint otentikasi yang memvalidasi `username`/`role` user dari database.
   - Setup Middleware Next.js untuk proteksi route (hanya sesi valid yang bisa akses `/dashboard`).
2. **Master Data Server Actions:**
   - Buat Server Actions untuk operasi CRUD di folder `src/app/actions/`.
   - Meliputi entitas: Karyawan, Klien, Kategori, Model, Size, Warna, Satuan, KategoriTrx, JenisReject.
   - Sinkronisasi Master Produk dan struktur HPP di dalam DB.
3. **Refactor Zustand Store:**
   - Hapus/modifikasi inisialisasi dummy data di `useMasterStore.ts`.
   - Ganti logika klien dengan React Server Components (fetching via Prisma) atau fetching client via Server Actions ketika butuh interaktivitas.
4. **Validasi & Testing:**
   - Pastikan halaman Master Data (contoh: FormKaryawan) berhasil menyimpan data ke database riil.
   - Hapus cache atau pastikan revalidasi jalur (revalidatePath) berfungsi dengan benar setelah form di-submit.

## Kriteria Selesai
- User bisa login hanya jika ada datanya di PostgreSQL.
- Operasi Tambah/Edit/Hapus pada Master Data berhasil mengubah isi tabel di DB.
- Menghilangkan sepenuhnya *Data Klien, Karyawan, Master* palsu dari environment aplikasi.
