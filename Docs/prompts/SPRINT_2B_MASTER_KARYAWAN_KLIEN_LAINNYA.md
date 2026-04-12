# PROMPT — Sprint 2B: Master Karyawan, Klien, dan Master Lainnya

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1 (foundation) dan Sprint 2A (auth + master detail + produk HPP) sudah selesai.

**Status saat ini:**
- Login page dan role switcher sudah berfungsi
- `useMasterStore` sudah memiliki CRUD actions untuk semua entity
- `MasterFormModal` reusable sudah ada di `src/features/master-data/MasterDetail/`
- Halaman Master Detail dan Produk & HPP sudah fungsional
- Semua data dikelola via Zustand store — **TIDAK ADA database atau API server**

Kamu akan:
1. Membuat **halaman Master Karyawan** (CRUD + search + filter)
2. Membuat **halaman Master Klien** (CRUD)
3. Membuat **4 halaman Master Lainnya** (Jenis Reject, Kategori Transaksi, Satuan, User & Role)

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS atau inline styles
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css` + `index.ts`
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/` (contoh: `@/components/atoms/Button`)
5. **Data CRUD** = baca/tulis ke Zustand store (`useMasterStore`). Tidak ada API call.
6. **Komponen reusable** yang sudah ada WAJIB digunakan:
   - `PageWrapper`, `Panel`, `DataTable`, `Modal`, `Button`, `Badge`, `TextInput`, `NumberInput`, `Select`
   - `MasterFormModal` dari Sprint 2A (jika cocok polanya)
7. **Feature components** disimpan di `src/features/master-data/`
8. **BACA DULU** file-file di `src/features/master-data/MasterDetail/` untuk memahami pattern yang sudah dibuat di Sprint 2A. **IKUTI pattern yang sama** agar konsisten.

---

## BAGIAN 1: Master Karyawan

### 1.1 Struktur File
```
src/features/master-data/MasterKaryawan/
├── MasterKaryawanView.tsx       # View utama
├── MasterKaryawanView.module.css
├── FormKaryawan.tsx             # Form modal tambah/edit
└── index.ts
```

### 1.2 MasterKaryawanView
- `PageWrapper` title: "Karyawan", subtitle: "Manajemen Data Karyawan"
- **Search bar** di atas tabel (filter by nama)
- **Filter** by jabatan (Select: semua jabatan unik dari data)
- **Filter** by status (aktif / nonaktif)
- **DataTable** dengan kolom:
  - ID (mono font)
  - Nama
  - Jabatan
  - Status (Badge: hijau "Aktif" / abu-abu "Nonaktif")
  - Aksi (Edit + Toggle Aktif)
- Tombol "Tambah Karyawan" di kanan atas
- **Total KPI** ditampilkan di atas: Total Karyawan, Total Aktif, Total Nonaktif

### 1.3 FormKaryawan
Modal form dengan fields:
- Nama (TextInput, required)
- Jabatan (Select: Operator Cutting, Operator Jahit, Operator QC, Operator Packing, Operator Steam, Lainnya)
- Status Aktif (toggle/checkbox)

CRUD: panggil `useMasterStore` add/update actions.

### 1.4 Types
Types `Karyawan` sudah ada di `src/types/master.types.ts`:
```ts
interface Karyawan { id: string; nama: string; jabatan: string; aktif: boolean; }
```
Tidak perlu diubah.

---

## BAGIAN 2: Master Klien

### 2.1 Struktur File
```
src/features/master-data/MasterKlien/
├── MasterKlienView.tsx
├── MasterKlienView.module.css
├── FormKlien.tsx
└── index.ts
```

### 2.2 MasterKlienView
- `PageWrapper` title: "Klien", subtitle: "Manajemen Data Klien"
- **Search bar** (filter by nama/kontak)
- **DataTable** dengan kolom:
  - ID (mono font)
  - Nama Perusahaan
  - Kontak
  - Alamat (truncate jika panjang)
  - Aksi (Edit + Hapus)
- Tombol "Tambah Klien"

### 2.3 FormKlien
Modal form dengan fields:
- Nama Perusahaan (TextInput, required)
- Kontak (TextInput, required)
- Alamat (TextInput/textarea)

---

## BAGIAN 3: Jenis Reject

### 3.1 Struktur File
```
src/features/master-data/MasterLainnya/
├── JenisRejectView.tsx
├── JenisRejectView.module.css
└── index.ts
```

### 3.2 JenisRejectView
- `PageWrapper` title: "Jenis Reject"
- **DataTable** dengan kolom:
  - ID
  - Nama Reject
  - Potongan per pcs (format Rupiah, mono font)
  - Aksi (Edit + Hapus)
- Form modal: Nama (TextInput) + Potongan (NumberInput, format Rupiah)

Tipe `JenisReject` sudah ada: `{ id, nama, potongan }`

---

## BAGIAN 4: Kategori Transaksi

### 4.1 File: `src/features/master-data/MasterLainnya/KategoriTrxView.tsx` + `.module.css`

- `PageWrapper` title: "Kategori Transaksi"
- **DataTable** dengan kolom:
  - ID
  - Nama Kategori
  - Jenis (Badge berwarna):
    - `direct_bahan` → Badge hijau "Bahan Langsung"
    - `direct_upah` → Badge biru "Upah Langsung"
    - `overhead` → Badge kuning "Overhead"
    - `masuk` → Badge cyan "Pemasukan"
  - Aksi (Edit + Hapus)
- Form modal: Nama (TextInput) + Jenis (Select: direct_bahan, direct_upah, overhead, masuk)

Tipe `KategoriTrx` sudah ada: `{ id, nama, jenis }`

---

## BAGIAN 5: Satuan (UOM)

### 5.1 File: `src/features/master-data/MasterLainnya/SatuanView.tsx` + `.module.css`

- `PageWrapper` title: "Satuan (UOM)"
- **DataTable** kolom: ID, Nama Satuan, Aksi
- Paling sederhana — form modal hanya 1 field: Nama (TextInput)

Tipe `Satuan` sudah ada: `{ id, nama }`

---

## BAGIAN 6: User & Role

### 6.1 Struktur File
```
src/features/master-data/MasterLainnya/
├── UserRoleView.tsx
├── UserRoleView.module.css
```

### 6.2 UserRoleView
- `PageWrapper` title: "User & Role"
- **Dua section** dalam satu halaman:

**Section 1: Daftar Role (read-only)**
- Tampilkan 5 role dari `src/lib/constants/roles.ts`
- Tabel: Role, Label, Hak Akses (list permissions)
- Tidak bisa CRUD (role fixed dari constant)

**Section 2: Daftar User**
- DataTable: ID, Username, Nama, Role(s) (Badge), Aksi
- Form tambah/edit: username (TextInput), nama (TextInput), roles (multi-select atau checkbox group dari 5 role)
- CRUD ke `useAuthStore` (tambahkan `users: User[]` dan CRUD actions jika belum ada)

### 6.3 Update useAuthStore (jika perlu)
Tambahkan:
```ts
users: User[];
addUser: (user: User) => void;
updateUser: (id: string, data: Partial<User>) => void;
removeUser: (id: string) => void;
```
Initialize dengan dummy data (minimal 3 user: Owner, Admin Produksi, Mandor).

---

## BAGIAN 7: Update Halaman page.tsx

Ganti isi placeholder `page.tsx` di 6 halaman:

1. `src/app/(dashboard)/master-data/karyawan/page.tsx` → `MasterKaryawanView`
2. `src/app/(dashboard)/master-data/klien/page.tsx` → `MasterKlienView`
3. `src/app/(dashboard)/master-data/jenis-reject/page.tsx` → `JenisRejectView`
4. `src/app/(dashboard)/master-data/kategori-transaksi/page.tsx` → `KategoriTrxView`
5. `src/app/(dashboard)/master-data/satuan/page.tsx` → `SatuanView`
6. `src/app/(dashboard)/master-data/user-role/page.tsx` → `UserRoleView`

Pattern:
```tsx
'use client';
import MasterKaryawanView from '@/features/master-data/MasterKaryawan';

export default function KaryawanPage() {
  return <MasterKaryawanView />;
}
```

---

## Verifikasi

Setelah selesai, pastikan:
1. `npx tsc --noEmit` — 0 error
2. Semua 6 halaman master data menampilkan tabel dengan data dari Zustand
3. Bisa tambah, edit, dan hapus data di setiap halaman
4. Search/filter berfungsi di halaman Karyawan dan Klien
5. Badge jenis transaksi berwarna sesuai tipe
6. User & Role menampilkan daftar role + CRUD user
7. Data persisted di Zustand (selama tab browser tidak di-refresh)

## JANGAN Lakukan

- ❌ Jangan setup database/Supabase/API apapun
- ❌ Jangan ubah design system (warna, font) yang sudah ada
- ❌ Jangan ubah komponen atoms/molecules/organisms yang sudah ada (kecuali ada bug)
- ❌ Jangan ubah file-file Sprint 2A yang sudah jadi
- ❌ Jangan gunakan Tailwind CSS
- ❌ Jangan buat file lebih dari 200 baris
