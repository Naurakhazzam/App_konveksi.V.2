# LAPORAN AUDIT PHASE 11 — Master Data & RBAC

**Project:** STITCHLYX SYNCORE V2  
**Tanggal Audit:** 2026-04-15  
**Fase:** PHASE 11 — Master Data, RBAC, dan Manajemen User

---

## RINGKASAN EKSEKUTIF

Sistem Role-Based Access Control (RBAC) pada STITCHLYX V2 memiliki perlindungan *routing* client-side dasar yang baik. Hak rute untuk admin dan supervisor dipisahkan dengan sangat lugas dalam fungsi `canAccess`. Namun, audit ini mengungkapkan lubang keamanan yang sangat fatal di lapis variabel lingkungan (`NEXT_PUBLIC_`), serta celah pada validasi komponen UI, proteksi penghapusan *foreign key* Master Data, dan eksploitasi fitur `previewRole`.

---

## TEMUAN AUDIT

### AUDIT A — Route Guard & Proteksi Halaman
- ✅ **Proteksi Halaman (A-1):** Seluruh rute bersarang di bawah `(dashboard)` berhasil dilindungi menggunakan `layout.tsx`. Setiap *page load* akan memverifikasi status `isAuthenticated`. Jika false, pengguna diarahkan ke `/login`.
- ✅ **Akses Konten (A-2):** Selain Login, halaman diuji terhadap rute `canAccess(pathname)`. Pengguna ditendang kembali ke `/dashboard/produksi` apabila mencoba melompat ke URL yang dilarang.
- 🔴 **Kelemahan SSR (A-3):** Tidak ada `middleware.ts` berlapis untuk pengamanan Rute Next.js Server-Side. Artinya, file statis dan komponen dirender sementara sebelum `useEffect` me-redirect (dapat disiasati dengan penonaktifan JS browser).

### AUDIT B — Role-Based Access Control
- 🔴 **Inkonsistensi `canEdit` (B-1):** Fungsi `canEdit` tidak pernah dipakai di komponen UI. Misalnya pada `MasterKlienView.tsx`, tombol *Tambah Klien*, *Edit*, dan *Hapus* bebas merdeka dirender ke layar tanpa filter pengecekan `canEdit`.
- ✅ **Pembatasan Spesifik (B-2):** `supervisor_produksi` dengan sempurna ditolak saat hendak memuat halaman `/keuangan` dan kawan-kawannya, terkatrol dari *hardcode rejection* pada blok `canAccess`.
- ✅ **Akses Godadmin (B-3):** Role `godadmin` / Fauzan memiliki tiket emas (*Golden Ticket*) di blok logika `useAuthStore` untuk menembus sekat apa pun.

### AUDIT C — Master Data Validasi & Guard Hapus
- ✅ **Model & Kategori Guard (C-1):** Store `useMasterStore.ts` menolak penghapusan Model bila sedang dipakai oleh Produk, dan menolak penghapusan Kategori bila menaungi Model.
- 🔴 **Kealpaan Proteksi Hapus Karyawan, Klien, Dsb (C-2):** Menghapus Pihak Klien (`removeKlien`) atau Karyawan (`removeKaryawan`) tidak memiliki *guard* validasi sama sekali. Administrator secara teoritis dapat menghapus Karyawan yang masih memiliki tunggakan *Escrow Upah* maupun Kasbon yang belum dilunaskan, sehingga memecahkan *foreign-key* laporan keuangan masa depan.
- 🟡 **Validasi Form Kosong (C-3):** Nyaris tak ada form modal (contoh: `FormKlien`) yang memproteksi *double-click* (ketiadaan `isSubmitting`) maupun memiliki guard ketat terhadap *empty-string space*.

### AUDIT D — Manajemen User
- ✅ **Mode Pending Approval (D-1):** Pendaftaran memantik user masuk ke skema `is_pending: true`. Fitur `PendaftaranView.tsx` berfungsi merender tab Antrian Persetujuan ini dengan baik.
- ✅ **Isolasi Godadmin di UI (D-2):** Identitas dengan role `godadmin` difiltrasi agar tidak muncul di daftar tabel antrian, meminimalisir kemungkinan Godadmin ter-klik 'Hapus' oleh sesama admin.
- 🔴 **Validasi Unik Username (D-3):** Fungsi `addUser` tidak menanyai / mengecek lebih dahulu eksistensi username ke DB sebelum di-insert.
- 🟡 **Pencegahan Bypass Approval (D-4):** Fungsi `approveUser()` dan `removeUser()` di *AuthStore* dapat dipanggil tanpa melempar RPC yang memverifikasi identitas penyeru aksi adalah Sang Owner.

### AUDIT E — Session & Keamanan
- 🔴 **KODE DARURAT TERPAPAR (E-1 - KRITIS SEKSI):** Kode Darurat (Fauzan Backdoor dkk) di file `.env.local` diproklamirkan dengan afiks `NEXT_PUBLIC_`. Hal ini berakibat file rahasia tersebut **dibundle dan diekspos ke dalam JavaScript Client Browser** secara permanen. Semua pengunjung dapat membacanya melaui inspeksi Network / JS.
- 🔴 **PIN Plaintext (E-2):** PIN log-in dan `owner_pin` disimpan secara mentah/terbaca *plain-text* di Zustand localStorage sekaligus di tabel Supabase. 
- 🔴 **Eksploitasi `previewRole` (E-3):** Method `setPreviewRole` di `useAuthStore` tidak dilindungi. User biasa/usil yang mengerti manipulasi localStorage/Zustand devtools dapat membajak variabel `previewRole` = `owner` dan mendapatkan eskalasi hak istimewa seketika di semua cek akses `canAccess`.
- 🔴 **Absennya Session Timeout (E-4):** Sesi pengguna tersimpan di lokal (Zustand Persist) secara abadi tanpa parameter kedaluwarsa waktu.

---

## TABEL KATEGORISASI BUG UNTUK REMEDIASI

| Kode | Severity | Deskripsi Bug / Celah | Modul / Layanan Terdampak |
|------|----------|-----------------------------------------|--------------------------------|
| E-1  | 🔴 KRITIS| Tereksposnya `NEXT_PUBLIC_EMERGENCY_CODE` ke Publik | Root / `.env.local` & `useAuthStore` |
| E-3  | 🔴 KRITIS| `setPreviewRole` sanggup dibajak lewat Storage Browser | `useAuthStore.ts` |
| B-1  | 🟠 TINGGI| Tombol Manipulasi Data di UI tidak dipagari `canEdit` | Semua UI (*Master Data*) |
| C-2  | 🟠 TINGGI| Penghapusan Master Entitas Karyawan/Klien tak dibendung | `useMasterStore.ts` |
| E-2  | 🟠 TINGGI| PIN Disimpan Plain-text Tanpa *Hashing* | `users` Database |
| E-4  | 🟡 SEDANG| Tidak Terdapat Auto-Logout/Timeout Sesi | `useAuthStore.ts` |
| C-3  | 🟡 SEDANG| Form Registrasi Entitas miskin *isSubmitting* guard | Semua Form (Master) |
| D-3  | 🟡 SEDANG| Kurangnya intercept pada duplikasi Username Registrasi | `useAuthStore.ts` |
| A-3  | 🔵 INFO  | Route guard hanya sebatas domisili Client (React) | `layout.tsx` |

---

## VERIFIKASI INTEGRITAS FILE YANG DIAUDIT
- `useAuthStore.ts`: Baris akhir tertutup normal `);` ✅
- `layout.tsx`: Baris akhir tertutup normal `}` ✅
- `useMasterStore.ts`: Baris akhir tertutup normal `}));` ✅
- `PendaftaranView.tsx`: Baris akhir tertutup normal `}` ✅
- `.env.local`: Baris akhir normal ✅
