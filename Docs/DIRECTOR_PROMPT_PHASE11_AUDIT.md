# DIRECTOR PROMPT — Phase 11: Audit Master Data & RBAC

## KONTEKS PROJECT
Kamu sedang bekerja di project `STITCHLYX SYNCORE V2` — aplikasi manajemen produksi konveksi berbasis Next.js + TypeScript + Zustand + Supabase.

Lakukan audit menyeluruh terhadap modul Master Data dan sistem RBAC (Role-Based Access Control).

Mulai dengan menjelajahi:
- `src/stores/useAuthStore.ts`
- `src/lib/hooks/` (semua file hooks)
- `src/features/master-data/` (semua subfolder)
- `src/components/templates/` (layout/wrapper yang mengatur akses)
- `src/app/(dashboard)/` (route guards)

Baca setiap file secara penuh sebelum mengaudit.

---

## AUDIT A — Route Guard & Proteksi Halaman
- Apakah semua halaman dalam `(dashboard)` sudah dilindungi dari akses tanpa login?
- Apakah ada middleware atau layout yang mengecek `isAuthenticated` sebelum render konten?
- Apakah ada halaman yang bisa diakses langsung via URL tanpa login?
- Apakah redirect ke login sudah benar ketika session expired?

## AUDIT B — Role-Based Access Control
- Apakah fungsi `canAccess(path)` dan `canEdit(path)` dipanggil secara konsisten di semua halaman sensitif?
- Apakah ada halaman yang seharusnya memerlukan role tertentu tapi tidak ada pengecekan role sama sekali?
- Apakah role `supervisor_produksi` benar-benar tidak bisa mengakses `/keuangan`, `/master-data`, dan `/koreksi-data`?
- Apakah ada komponen yang menampilkan tombol Edit/Hapus tanpa mengecek `canEdit` terlebih dahulu?
- Apakah `godadmin` (Fauzan) mendapat akses penuh ke semua halaman?

## AUDIT C — Master Data Validasi & Guard Hapus
- Untuk setiap master data (Model, Warna, Size, Klien, Karyawan, HPP Komponen, dll): apakah ada guard yang mencegah penghapusan data yang masih dipakai di tempat lain?
  - Contoh: Menghapus Model yang masih dipakai di Bundle aktif harus diblokir
  - Contoh: Menghapus Karyawan yang masih punya upah belum dibayar harus diblokir
- Apakah form tambah/edit master data memiliki validasi input (nama tidak boleh kosong, duplikasi dicegah)?
- Apakah ada proteksi double-submit pada semua form master data?

## AUDIT D — Manajemen User
- Apakah proses pendaftaran user baru menggunakan `is_pending: true` dan perlu approval?
- Apakah hanya godadmin/owner yang bisa approve, update role, atau hapus user?
- Apakah ada perlindungan agar godadmin tidak bisa dihapus atau role-nya diubah oleh user lain?
- Apakah ada validasi bahwa username tidak boleh duplikat saat pendaftaran?

## AUDIT E — Session & Keamanan
- Apakah ada mekanisme session timeout (auto logout setelah tidak aktif)?
- Apakah PIN owner tersimpan dengan aman (tidak di localStorage dalam plaintext)?
- Apakah emergency code di `.env.local` tidak ter-expose ke client bundle secara tidak sengaja (misalnya `NEXT_PUBLIC_` prefix membuat semua nilai env terbaca di browser)?
- Apakah `previewRole` (mode simulasi role) bisa di-abuse oleh user biasa untuk mendapat akses lebih tinggi?

---

## FORMAT LAPORAN
Simpan hasil audit sebagai `AUDIT_REPORT_PHASE11_RBAC.md` di folder `Docs/`.

Format: ringkasan eksekutif, temuan per audit (A/B/C/D/E), tabel severity dengan kode dan label (🔴 KRITIS / 🟠 TINGGI / 🟡 SEDANG / 🔵 INFO), serta verifikasi file integrity (baris terakhir tiap file yang dibaca).
