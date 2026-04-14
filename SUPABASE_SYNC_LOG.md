# STITCHLYX.SYNCORE - Supabase Integration & Sync Log

File ini berfungsi sebagai panduan teknis bagi AI Assistant untuk menjaga konsistensi antara aplikasi (Next.js) dan Cloud Database (Supabase).

## 📍 Koneksi Utama
- **URL Proyek**: `https://jyhtqogfimgoaporddaw.supabase.co`
- **Region**: `ap-southeast-1` (Singapore)
- **Client Initialization**: `src/lib/supabase.ts`

## 📊 Rancangan Skema Tabel (PostgreSQL)

### 1. Tabel: `karyawan`
Digunakan untuk data SDM dan validasi scan barcode produksi.
| Nama Kolom | Tipe Data | Deskripsi |
|------------|-----------|-----------|
| `id` | `TEXT` | Primary Key (Contoh: EMP-001) |
| `nama` | `TEXT` | Nama Lengkap Karyawan |
| `jabatan` | `TEXT` | Jabatan atau Role Produksi |
| `tahap_list`| `TEXT[]` | Array tahap kerja (Cutting, Jahit, dll) |
| `gaji_pokok`| `NUMERIC` | Nominal Gaji Bulanan |
| `aktif` | `BOOLEAN` | Status karyawan aktif |

### 2. Tabel: `users`
Digunakan untuk hak akses login sistem.
| Nama Kolom | Tipe Data | Deskripsi |
|------------|-----------|-----------|
| `id` | `TEXT` | Primary Key (USR-XXXX) |
| `username` | `TEXT` | Login ID |
| `nama` | `TEXT` | Display Name |
| `roles` | `TEXT[]` | Array Roles (godadmin, owner, dll) |
| `pin` | `TEXT` | 6 Digit PIN Akses |
| `is_pending`| `BOOLEAN` | Registrasi menunggu approval |

## 🛠 Status Sinkronisasi
- [x] **Phase 0**: Login Enforcement (Aplikasi terkunci sebelum login).
- [x] **Phase 1**: Connection Diagnostic (Halaman `/test-koneksi` aktif).
- [ ] **Phase 3**: Master Store Sync (Sedang Dikerjakan).
- [ ] **Phase 4**: Production Data Sync (Pending).

## ⚠️ Instruksi untuk AI Assistant
1. Pastikan setiap penambahan data di `useMasterStore.ts` melakukan `await supabase.from('...').insert(...)`.
2. Jika ada error "Karyawan tidak terdaftar", periksa apakah `id` karyawan di Supabase sesuai dengan `id` di data lokal aplikasi.
3. Gunakan `supabase.rpc()` jika ada perhitungan gaji massal untuk efisiensi.
