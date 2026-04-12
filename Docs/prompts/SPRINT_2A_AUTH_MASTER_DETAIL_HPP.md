# PROMPT — Sprint 2A: Dummy Auth + Master Detail + Produk & HPP

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1 sudah selesai (1.1 setup, 1.2 atoms+molecules, 1.3 organisms+templates, 1.4 routing+stores+dummy).

**Status saat ini:**
- 33 halaman placeholder sudah ada (semua rute berfungsi)
- Sidebar navigasi berfungsi penuh
- Zustand stores sudah ada: `useAuthStore`, `useMasterStore`, `usePOStore`, `useBundleStore`, `useKoreksiStore`, `useInventoryStore`, `useJurnalStore`, `usePayrollStore`
- Dummy data sudah ada di `src/data/`
- Semua data dikelola via Zustand store — **TIDAK ADA database atau API server**

Kamu akan:
1. Membuat **halaman login** (dummy — selalu berhasil)
2. Membuat **role switching UI** untuk testing
3. Membuat **3 halaman Master Data fungsional** (Detail, Produk & HPP, plus update store)

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS atau inline styles
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css` + `index.ts`
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/` (contoh: `@/components/atoms/Button`)
5. **Data CRUD** = baca/tulis ke Zustand store (`useMasterStore`). Tidak ada API call.
6. **Komponen reusable** yang sudah ada WAJIB digunakan:
   - `PageWrapper` — wrapper setiap halaman
   - `Panel` — wrapper setiap card/section
   - `DataTable` — untuk menampilkan tabel data
   - `Modal` — untuk dialog form
   - `Button`, `Badge`, `TextInput`, `NumberInput`, `Select` — atoms
7. **Feature components** disimpan di `src/features/` (bukan di `src/components/`)

---

## BAGIAN 1: Dummy Authentication (UI Only)

### 1.1 Halaman Login
**File:** `src/app/(auth)/login/page.tsx` + `Login.module.css`

Buat halaman login yang indah sesuai design system (dark theme, cyan accent):
- Input: username + password
- Button: "Masuk"
- Login **selalu berhasil** — langsung panggil `useAuthStore.login()` lalu redirect ke `/dashboard/produksi`
- Default user = Owner (sudah di-set di `useAuthStore`)
- Tampilkan logo/nama aplikasi: "STITCHLYX.SYNCORE"

**File:** `src/app/(auth)/layout.tsx`
Layout khusus halaman auth — tanpa sidebar, centered di layar.

### 1.2 Update useAuthStore
**File:** `src/stores/useAuthStore.ts`

Tambahkan actions berikut (jangan hapus yang sudah ada):
```ts
switchRole: (role: Role) => void;  // Ganti role aktif untuk testing
validateOwnerCode: (code: string) => boolean;  // Cek apakah kode = '030503'
```

`switchRole` mengubah `currentUser.roles` ke role yang dipilih. Ini untuk testing role-based access.

### 1.3 Role Switcher Component
**File:** `src/components/molecules/RoleSwitcher/RoleSwitcher.tsx` + `.module.css` + `index.ts`

Komponen kecil (dropdown/select) yang menampilkan role aktif dan bisa diganti:
- Owner, Admin Produksi, Admin Keuangan, Supervisor, Mandor
- Panggil `useAuthStore.switchRole()` saat dipilih
- Tampilkan di pojok kanan atas layout dashboard (modifikasi `DashboardLayout` jika perlu)
- Style: kecil, tidak mencolok, badge-style

### 1.4 Owner Code Modal
**File:** `src/components/molecules/OwnerCodeModal/OwnerCodeModal.tsx` + `.module.css` + `index.ts`

Modal yang muncul saat sistem membutuhkan validasi Owner:
- Input: kode 6 digit
- Button: "Validasi"
- Jika kode = `030503` → return true (valid)
- Jika salah → tampilkan error "Kode tidak valid"
- Gunakan komponen `Modal` yang sudah ada sebagai base

---

## BAGIAN 2: Master Detail Page (Kategori, Model, Size, Warna)

Bangun halaman `/master-data/detail` yang menampilkan 4 entitas dalam satu halaman dengan tabs.

### 2.1 Struktur File
```
src/features/master-data/MasterDetail/
├── MasterDetailView.tsx       # View utama: tabs + render section aktif
├── MasterDetailView.module.css
├── KategoriSection.tsx        # Tabel + tombol tambah + form modal
├── ModelSection.tsx           # Tabel + tombol tambah + form modal (ada select kategori)
├── SizeSection.tsx            # Tabel + tombol tambah + form modal
├── WarnaSection.tsx           # Tabel + tombol tambah + form modal (ada input hex)
├── MasterFormModal.tsx        # Reusable form modal untuk semua entity
└── index.ts
```

### 2.2 MasterDetailView
- Gunakan `PageWrapper` dengan title "Master Detail"
- 4 tab/tombol di atas: **Kategori** | **Model** | **Size** | **Warna**
- Render section sesuai tab aktif
- Setiap section menampilkan `DataTable` + tombol "Tambah [entity]"

### 2.3 Setiap Section (Kategori, Model, Size, Warna)

Pattern yang sama untuk semua entity:

1. **Tabel** menggunakan `DataTable` — tampilkan semua field
2. **Kolom Aksi** — tombol Edit + Hapus per baris
3. **Tombol Tambah** — di atas tabel, buka `MasterFormModal`
4. **CRUD ke Zustand** — panggil `useMasterStore` untuk add/update/remove

Sebelum CRUD bisa bekerja, **kamu HARUS update `useMasterStore`** agar punya actions lengkap untuk SEMUA entity (bukan hanya Kategori). Tambahkan:
```ts
// Untuk setiap entity (model, sizes, warna, dll):
addModel: (item: Model) => void;
updateModel: (id: string, data: Partial<Model>) => void;
removeModel: (id: string) => void;
// ... dst untuk sizes, warna, karyawan, klien, jenisReject, kategoriTrx, satuan
```

### 2.4 MasterFormModal
Modal form reusable yang menerima props:
```ts
interface MasterFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;             // "Tambah Kategori" / "Edit Model"
  fields: FormFieldConfig[]; // Array konfigurasi field
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
}

interface FormFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'color';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[]; // Untuk type select
}
```

Gunakan komponen `Modal`, `TextInput`, `NumberInput`, `Select`, `Button` yang sudah ada.

### 2.5 Khusus untuk ModelSection
- Field `kategoriId` menggunakan `Select` dengan options dari `useMasterStore.kategori`
- Field `targetPoin` menggunakan `NumberInput`

### 2.6 Khusus untuk WarnaSection
- Field `kodeHex` menampilkan preview warna (kotak kecil berwarna di samping input)

---

## BAGIAN 3: Master Produk & HPP

Halaman paling kompleks di Sprint ini. Diakses via `/master-data/produk-hpp`.

### 3.1 Konsep Bisnis
- **Produk** = kombinasi Model × Size × Warna
- Setiap produk punya **Dual SKU**: SKU Internal (auto-generate) + SKU Klien (input manual)
- **HPP** = Harga Pokok Produksi per produk:
  - Komponen **Upah** → flat (sama) untuk semua size dalam 1 model  
  - Komponen **Bahan & Aksesori** → berbeda per size
  - **Harga Jual** → berbeda per size
  - Margin = Harga Jual - HPP

### 3.2 Update Types
**File:** `src/types/master.types.ts`

Tambahkan type berikut (jangan hapus yang sudah ada):
```ts
export interface Produk {
  id: string;
  modelId: string;
  sizeId: string;
  warnaId: string;
  skuInternal: string;    // Auto: LYX-[MODEL_IDX]-[WARNA_CODE]-[SIZE]
  skuKlien: string;       // Input manual
  aktif: boolean;
}

export interface HPPDetail {
  id: string;
  produkId: string;
  upahPerPcs: number;     // Flat per model (sama semua size)
  bahanPerPcs: number;    // Berbeda per size
  aksesorisPerPcs: number; // Berbeda per size  
  hargaJual: number;      // Berbeda per size
}
```

Update `src/types/index.ts` untuk export type baru.

### 3.3 Update useMasterStore
Tambahkan state dan actions untuk `produk` dan `hppDetail`:
```ts
produk: Produk[];
hppDetail: HPPDetail[];

addProduk: (item: Produk) => void;
updateProduk: (id: string, data: Partial<Produk>) => void;
removeProduk: (id: string) => void;

setHPP: (produkId: string, hpp: Partial<HPPDetail>) => void;
getHPPByProduk: (produkId: string) => HPPDetail | undefined;
```

### 3.4 Dummy Data Produk
**File:** `src/data/dummy-master.ts` (tambahkan, jangan hapus)

Buat minimal 6 produk realistis (kombinasi dari Model, Size, Warna yang sudah ada):
```ts
export const dummyProduk: Produk[] = [
  { id: 'PRD-001', modelId: 'MDL-001', sizeId: 'SZ-001', warnaId: 'WRN-001', skuInternal: 'LYX-0001-BLK-S', skuKlien: 'AIR-BLK-S', aktif: true },
  { id: 'PRD-002', modelId: 'MDL-001', sizeId: 'SZ-002', warnaId: 'WRN-001', skuInternal: 'LYX-0001-BLK-M', skuKlien: 'AIR-BLK-M', aktif: true },
  // ... dst
];

export const dummyHPP: HPPDetail[] = [
  { id: 'HPP-001', produkId: 'PRD-001', upahPerPcs: 8000, bahanPerPcs: 25000, aksesorisPerPcs: 3000, hargaJual: 55000 },
  { id: 'HPP-002', produkId: 'PRD-002', upahPerPcs: 8000, bahanPerPcs: 27000, aksesorisPerPcs: 3500, hargaJual: 60000 },
  // ... dst
];
```

### 3.5 Struktur File Feature
```
src/features/master-data/MasterProduk/
├── MasterProdukView.tsx       # View utama
├── MasterProdukView.module.css
├── TabelProduk.tsx            # DataTable produk
├── PanelHPP.tsx               # Panel HPP detail (read-only view)
├── FormHPP.tsx                # Form edit HPP (modal)
├── FormProduk.tsx             # Form tambah produk baru (modal)
└── index.ts
```

### 3.6 MasterProdukView
- `PageWrapper` title: "Produk & HPP"
- Area atas: `FilterBar` atau search + filter by model/kategori
- Tabel utama: Semua produk dengan kolom:
  - SKU Internal (cyan, mono font)
  - SKU Klien
  - Model
  - Size
  - Warna (dengan preview kotak warna)
  - HPP Total (upah + bahan + aksesori — format Rupiah)
  - Harga Jual (format Rupiah)
  - Margin (Harga Jual - HPP — format Rupiah + persentase)
  - Status (aktif/nonaktif — Badge)
  - Aksi (Edit HPP button)
- Klik "Edit HPP" → buka `FormHPP` modal
- Tombol "Tambah Produk" → buka `FormProduk` modal

### 3.7 PanelHPP
Panel yang menampilkan breakdown HPP saat produk dipilih:
```
┌─────────────────────────────┐
│ ● ● ●  HPP BREAKDOWN       │
│                             │
│ Upah /pcs      Rp  8.000   │
│ Bahan /pcs     Rp 25.000   │
│ Aksesori /pcs  Rp  3.000   │
│ ─────────────────────────── │
│ HPP Total      Rp 36.000   │
│ Harga Jual     Rp 55.000   │
│ Margin         Rp 19.000   │
│ Margin %       34.5%       │
└─────────────────────────────┘
```

### 3.8 FormHPP
Modal untuk edit HPP produk:
- Fields: Upah /pcs, Bahan /pcs, Aksesori /pcs, Harga Jual
- Kalkulasi real-time: HPP Total, Margin nominal, Margin %
- Button: Simpan → panggil `useMasterStore.setHPP()`
- **Catatan**: Jika upah diubah, tanyakan "Upah berlaku flat untuk semua size di model ini. Terapkan?"

---

## BAGIAN 4: Update Halaman page.tsx

Ganti isi placeholder `page.tsx` di folder yang sudah ada:

1. `src/app/(dashboard)/master-data/detail/page.tsx` → import dan render `MasterDetailView`
2. `src/app/(dashboard)/master-data/produk-hpp/page.tsx` → import dan render `MasterProdukView`

Pattern:
```tsx
'use client';
import MasterDetailView from '@/features/master-data/MasterDetail';

export default function MasterDetailPage() {
  return <MasterDetailView />;
}
```

---

## Verifikasi

Setelah selesai, pastikan:
1. `npx tsc --noEmit` — 0 error
2. Halaman login tampil dan bisa redirect ke dashboard
3. Role switcher terlihat di layout dan bisa berganti role
4. `/master-data/detail` → 4 tab berfungsi, bisa CRUD semua entity
5. `/master-data/produk-hpp` → tabel produk tampil, HPP bisa diedit
6. Semua form modal buka/tutup dengan benar
7. Data persisted di Zustand (selama tab browser tidak di-refresh)

## JANGAN Lakukan

- ❌ Jangan setup database/Supabase/API apapun
- ❌ Jangan ubah design system (warna, font) yang sudah ada
- ❌ Jangan ubah komponen atoms/molecules/organisms yang sudah ada (kecuali ada bug)
- ❌ Jangan gunakan Tailwind CSS
- ❌ Jangan buat file lebih dari 200 baris
