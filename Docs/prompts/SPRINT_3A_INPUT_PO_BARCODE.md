# PROMPT — Sprint 3A: Input PO, Barcode Generation & Store Infrastructure

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1 (foundation), Sprint 2A (auth + master detail + produk HPP), Sprint 2A Patch (HPP restructuring), dan Sprint 2B (master karyawan, klien, lainnya) sudah selesai.

**Status saat ini:**
- Login page dan role switcher sudah berfungsi (floating bottom-right)
- `useMasterStore` memiliki CRUD untuk: Kategori, Model, Size, Warna, Produk, Karyawan, Klien, JenisReject, KategoriTrx, Satuan, HPPKomponen, ProdukHPPItem
- `useAuthStore` memiliki CRUD untuk User + role management
- Semua 8+ halaman Master Data sudah fungsional
- Semua data dikelola via Zustand store — **TIDAK ADA database atau API server**

**Sprint 3A ini akan membangun:**
1. Zustand stores untuk PO dan Bundle (`usePOStore`, `useBundleStore`)
2. Halaman **Input PO** — form membuat Purchase Order baru
3. **Barcode generation** — format khusus dengan global sequence counter
4. **Detail PO** — preview + print barcode labels
5. Dummy data PO & Bundle untuk development

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css` + `index.ts` (jika perlu)
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/` (contoh: `@/components/atoms/Button`)
5. **Data CRUD** = baca/tulis ke Zustand store. Tidak ada API call.
6. **Komponen reusable** yang sudah ada WAJIB digunakan:
   - `PageWrapper`, `Panel`, `DataTable`, `Modal`, `Button`, `Badge`, `TextInput`, `NumberInput`, `Select`
7. **Feature components** disimpan di `src/features/produksi/`
8. **Types** yang sudah ada di `src/types/po.types.ts` dan `src/types/bundle.types.ts` — BACA DULU, gunakan, dan PERLUAS jika perlu (jangan duplikasi)

---

## BAGIAN 1: Perbarui Types (jika perlu)

### 1.1 Review types yang sudah ada

**`src/types/po.types.ts`** sudah memiliki:
```ts
interface POItem {
  id: string;
  poId: string;
  modelId: string;
  warnaId: string;
  sizeId: string;
  qty: number;
  qtyPerBundle: number;
  skuKlien: string;
  skuInternal: string;
}

interface Artikel {
  id: string;
  poId: string;
  modelId: string;
  warnaId: string;
  sizeId: string;
  qtyTarget: number;
}

interface PurchaseOrder {
  id: string;
  klienId: string;
  nomorPO: string;
  tanggalInput: string;
  items: POItem[];
  status: 'draft' | 'aktif' | 'selesai';
}
```

**`src/types/bundle.types.ts`** sudah memiliki:
```ts
interface StatusTahap {
  status: null | 'terima' | 'selesai';
  qtyTerima: number;
  qtySelesai: number;
  waktuTerima: string | null;
  waktuSelesai: string | null;
  karyawan: string | null;
  koreksiStatus: null | 'pending' | 'approved' | 'rejected';
  koreksiAlasan: string | null;
}

interface Bundle {
  barcode: string;
  po: string;
  model: string;
  warna: string;
  size: string;
  qtyBundle: number;
  skuKlien: string;
  skuInternal: string;
  statusTahap: {
    cutting: StatusTahap;
    jahit: StatusTahap;
    lkancing: StatusTahap;
    bbenang: StatusTahap;
    qc: StatusTahap;
    steam: StatusTahap;
    packing: StatusTahap;
  };
}
```

### 1.2 Tambahkan field yang diperlukan

Tambahkan ke `PurchaseOrder` jika belum ada:
```ts
tanggalDeadline?: string;    // Target deadline
catatan?: string;            // Catatan PO
```

Tambahkan ke `POItem` jika belum ada:
```ts
jumlahBundle: number;        // Math.ceil(qty / qtyPerBundle)
```

---

## BAGIAN 2: Zustand Stores

### 2.1 `usePOStore` — `src/stores/usePOStore.ts`

State:
```ts
poList: PurchaseOrder[];
globalSequence: number;      // Global barcode counter (never resets)
```

Actions:
```ts
addPO: (po: PurchaseOrder) => void;
updatePO: (id: string, data: Partial<PurchaseOrder>) => void;
removePO: (id: string) => void;
getPOById: (id: string) => PurchaseOrder | undefined;
getNextNomorPO: () => string;    // Auto-increment: PO-001, PO-002, ...
incrementGlobalSequence: (count: number) => number;  // Returns starting index
```

Inisialisasi dengan **2-3 dummy PO** yang sudah berstatus `aktif` (isian realistis: klien, items, qty).

### 2.2 `useBundleStore` — `src/stores/useBundleStore.ts`

State:
```ts
bundles: Bundle[];
```

Actions:
```ts
addBundle: (bundle: Bundle) => void;
addBundles: (bundles: Bundle[]) => void;   // Bulk add saat PO disimpan
getBundlesByPO: (poId: string) => Bundle[];
getBundleByBarcode: (barcode: string) => Bundle | undefined;
updateStatusTahap: (barcode: string, tahap: string, data: Partial<StatusTahap>) => void;
```

Inisialisasi dengan **dummy bundles** yang sesuai dengan dummy PO di atas. Minimal 5-10 bundles.

---

## BAGIAN 3: Barcode Generator Utility

### 3.1 File: `src/lib/utils/barcode-generator.ts`

Fungsi utama:
```ts
generateBarcode(params: {
  nomorPO: string;
  model: string;       // Kode model (singkatan, maks 3 huruf)
  warna: string;       // Kode warna (singkatan, maks 3 huruf)
  size: string;        // Kode size
  globalSequence: number;   // Urutan global
  bundleIndex: number;      // Nomor urut bundle dalam item ini
  tanggal: Date;
}): string
```

**Format barcode:**
`PO[nopo]-[mdl]-[wrn]-[sz]-[urutglobal]-BDL[nourut]-[DD-MM-YY]`

Contoh: `PO001-JKT-BLK-XL-00042-BDL03-12-04-26`

Aturan:
- `nopo`: Nomor PO tanpa prefix "PO-", pad 3 digit (001, 002, ...)
- `mdl`: 3 karakter pertama nama model (uppercase)
- `wrn`: 3 karakter pertama nama warna (uppercase)
- `sz`: Nama size (uppercase)
- `urutglobal`: Pad 5 digit, **never resets** (00001, 00002, ...)
- `nourut`: Pad 2 digit, nomor bundle dalam 1 item
- `DD-MM-YY`: Tanggal input

---

## BAGIAN 4: Input PO

### 4.1 Struktur File
```
src/features/produksi/InputPO/
├── InputPOView.tsx             # View utama
├── InputPOView.module.css
├── FormInputPO.tsx             # Form buat PO baru
├── FormInputPO.module.css
├── POItemRow.tsx               # Satu baris item PO (model+warna+size+qty)
├── DetailPO.tsx                # Preview PO setelah disimpan
├── DetailPO.module.css
├── BarcodeVisual.tsx           # Komponen visual 1 barcode label
├── BarcodeVisual.module.css
├── TiketBarcode.tsx            # Grid print area untuk semua barcode
├── TiketBarcode.module.css
└── index.ts
```

### 4.2 InputPOView
- `PageWrapper` title: "Input PO", subtitle: "Buat Purchase Order baru dan generate barcode"
- **Dua mode:**
  - Mode LIST: Tabel daftar semua PO (DataTable) + tombol "+ Buat PO Baru"
    - Kolom: No. PO (mono), Klien, Jumlah Artikel, Total QTY, Tanggal, Status (Badge), Aksi
    - Klik row → buka DetailPO
  - Mode FORM: FormInputPO (buka di modal full-screen atau panel besar)

### 4.3 FormInputPO
Form membuat PO baru:
1. **Header:**
   - Nomor PO (auto-generated, read-only, mono font)
   - Select Klien (dari `useMasterStore.klien`)
   - Tanggal Input (auto: hari ini)
   - Tanggal Deadline (optional)
   - Catatan (optional textarea)

2. **Item Rows (dynamic, bisa tambah banyak):**
   Setiap row terdiri dari:
   - Select Model (dari `useMasterStore.model`)
   - Select Warna (dari `useMasterStore.warna`)
   - Select Size (dari `useMasterStore.size`)
   - SKU Klien (TextInput)
   - QTY Order (NumberInput) — jumlah pcs
   - Isi per Bundle (NumberInput) — default: 12
   - **Jumlah Bundle** (auto-calculated, read-only): `Math.ceil(qty / qtyPerBundle)`
   - Tombol hapus row (x)

3. **Footer:**
   - Tombol "+ Tambah Artikel"
   - Summary: Total artikel, Total QTY, Total Bundle
   - Tombol "Simpan & Generate Barcode" → trigger:
     a. Simpan PO ke `usePOStore`
     b. Generate barcode strings
     c. Buat Bundle objects → simpan ke `useBundleStore`
     d. Redirect ke DetailPO

### 4.4 DetailPO
Halaman review PO yang sudah disimpan:
- Info header PO (nomor, klien, tanggal, status)
- Tabel items (DataTable): model, warna, size, qty, bundles
- Tombol "Cetak Barcode" → buka TiketBarcode di modal atau window baru
- Tombol "Kembali ke Daftar"

### 4.5 BarcodeVisual
Komponen untuk **1 label barcode**:
- Tampilkan barcode string sebagai teks (kita TIDAK perlu library barcode visual untuk sekarang — cukup tampilkan string barcode dengan font mono dalam kotak bordered)
- Info tambahan: PO, Model, Warna, Size, QTY Bundle
- Ukuran label: kira-kira 8cm × 4cm saat print

### 4.6 TiketBarcode
Grid layout untuk cetak semua barcode dari 1 PO:
- Grid 2 kolom (agar muat di kertas A4)
- Print-friendly CSS (`@media print`)
- Tombol "Print" yang trigger `window.print()`

---

## BAGIAN 5: Route Pages

### 5.1 Update route pages:
- `src/app/(dashboard)/produksi/input-po/page.tsx` → render `InputPOView`

Pattern:
```tsx
'use client';
import InputPOView from '@/features/produksi/InputPO';
export default function InputPOPage() {
  return <InputPOView />;
}
```

---

## BAGIAN 6: Dummy Data

Buat dummy data realistis di dalam store initialization:

**Dummy PO 1:**
- PO-001, Klien: PT Maju Jaya, Status: aktif
- 3 items: Jaket/Hitam/M (120pcs, 12/bdl), Jaket/Hitam/L (96pcs, 12/bdl), Jaket/Navy/M (60pcs, 12/bdl)

**Dummy PO 2:**
- PO-002, Klien: CV Sukses Mandiri, Status: aktif
- 2 items: Polo/Putih/L (48pcs, 12/bdl), Polo/Putih/XL (36pcs, 12/bdl)

Generate bundles yang sesuai.

---

## Verifikasi

Setelah selesai, pastikan:
1. `npx tsc --noEmit` — 0 error
2. Halaman Input PO menampilkan daftar PO dari Zustand
3. Form buat PO baru bisa menambahkan multiple items
4. Barcode di-generate otomatis saat PO disimpan
5. Detail PO menampilkan info + barcode labels
6. Print barcode berfungsi via `window.print()`
7. Dummy data muncul saat halaman pertama kali dibuka

## JANGAN Lakukan

- ❌ Jangan setup database/Supabase/API apapun
- ❌ Jangan ubah design system (warna, font) yang sudah ada
- ❌ Jangan ubah komponen atoms/molecules/organisms yang sudah ada (kecuali ada bug)
- ❌ Jangan ubah file-file Sprint 2 yang sudah jadi
- ❌ Jangan gunakan Tailwind CSS
- ❌ Jangan install library barcode (cukup tampilkan teks barcode untuk sekarang)
- ❌ Jangan buat file lebih dari 200 baris
