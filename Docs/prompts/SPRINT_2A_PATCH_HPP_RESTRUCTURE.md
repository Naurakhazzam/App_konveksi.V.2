# PROMPT — Sprint 2A PATCH: Restrukturisasi HPP (Harga Pokok Produksi)

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 2A Auth & Master Detail sudah selesai, TAPI struktur HPP yang dibangun **terlalu sederhana**.
HPP lama hanya punya 3 field statis (upahPerPcs, bahanPerPcs, aksesorisPerPcs).
Pada kenyataannya, setiap produk bisa punya **belasan komponen** biaya yang berbeda-beda.

Patch ini akan **menghancurkan dan membangun ulang** seluruh sistem HPP.

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Maks 200 baris per file** — pecah jadi sub-komponen
3. **Import alias** `@/` — contoh: `@/components/atoms/Button`
4. **Data CRUD** = Zustand store. Tidak ada API/backend/database.
5. **ROLE-BASED VISIBILITY**: Data keuangan (harga jual, harga modal, HPP, margin) **HANYA** bisa dilihat oleh role `owner` dan `admin_keuangan`. Role lain **TIDAK BOLEH** melihat data ini.
6. **Semua file yang sudah ada** di Sprint sebelumnya tetap berfungsi — jangan rusak.

---

## BAGIAN 1: ARSITEKTUR DATA (Types)

### 1.1 Hapus HPPDetail lama
**File:** `src/types/master.types.ts`
HAPUS interface `HPPDetail` yang lama. Ganti dengan yang baru di bawah.

### 1.2 Tambah Types Baru
**File:** `src/types/master.types.ts`

```ts
/**
 * Master komponen HPP — daftar global semua jenis biaya yang mungkin.
 * Owner bisa CRUD kapan saja. Contoh: "Puring", "Upah Jahit", "Biaya Sewa".
 */
export interface HPPKomponen {
  id: string;
  nama: string;
  kategori: 'bahan_baku' | 'biaya_produksi' | 'overhead';
  satuan: string;       // "meter", "pcs", "kg", "yard", "bulan", dll
  deskripsi?: string;   // opsional, penjelasan komponen
}

/**
 * Item HPP per produk — satu baris = satu komponen biaya untuk satu produk.
 * Setiap produk (Model × Size × Warna) punya kumpulan items sendiri.
 * Subtotal dihitung: harga × qty (JANGAN simpan, selalu compute).
 */
export interface ProdukHPPItem {
  id: string;
  produkId: string;     // → Produk.id
  komponenId: string;   // → HPPKomponen.id
  harga: number;        // harga per satuan (Rp)
  qty: number;          // qty per 1 pcs produk jadi
}
```

### 1.3 Update Interface Produk
**File:** `src/types/master.types.ts`

Tambahkan field `hargaJual` ke interface `Produk`:
```ts
export interface Produk {
  id: string;
  modelId: string;
  sizeId: string;
  warnaId: string;
  skuInternal: string;
  skuKlien: string;
  aktif: boolean;
  hargaJual: number;    // ← TAMBAH INI — estimasi harga jual per pcs
}
```

### 1.4 Update index.ts
**File:** `src/types/index.ts`
Pastikan `HPPKomponen` dan `ProdukHPPItem` di-export. Hapus export `HPPDetail`.

---

## BAGIAN 2: DUMMY DATA

### 2.1 Dummy HPPKomponen
**File:** `src/data/dummy-master.ts`

Buat minimal 15 komponen realistis:

```ts
import { HPPKomponen, ProdukHPPItem } from '../types';

export const dummyHPPKomponen: HPPKomponen[] = [
  // === BAHAN BAKU ===
  { id: 'KOMP-001', nama: 'Modal Bahan (Kain Utama)', kategori: 'bahan_baku', satuan: 'meter', deskripsi: 'Kain utama body' },
  { id: 'KOMP-002', nama: 'Puring', kategori: 'bahan_baku', satuan: 'meter', deskripsi: 'Kain lapisan dalam' },
  { id: 'KOMP-003', nama: 'Sleting Badan', kategori: 'bahan_baku', satuan: 'pcs' },
  { id: 'KOMP-004', nama: 'Sleting Saku', kategori: 'bahan_baku', satuan: 'pcs' },
  { id: 'KOMP-005', nama: 'Kain Kantong', kategori: 'bahan_baku', satuan: 'meter' },
  { id: 'KOMP-006', nama: 'Tali', kategori: 'bahan_baku', satuan: 'meter' },
  { id: 'KOMP-007', nama: 'Bordir', kategori: 'bahan_baku', satuan: 'pcs' },
  { id: 'KOMP-008', nama: 'Mata Itik', kategori: 'bahan_baku', satuan: 'pcs' },
  { id: 'KOMP-009', nama: 'Stoper', kategori: 'bahan_baku', satuan: 'pcs' },
  
  // === BIAYA PRODUKSI ===
  { id: 'KOMP-010', nama: 'Upah Jahit', kategori: 'biaya_produksi', satuan: 'pcs', deskripsi: 'Ongkos jahit per pcs' },
  { id: 'KOMP-011', nama: 'Upah Cutting', kategori: 'biaya_produksi', satuan: 'pcs' },
  { id: 'KOMP-012', nama: 'Upah Buang Benang', kategori: 'biaya_produksi', satuan: 'pcs' },
  { id: 'KOMP-013', nama: 'Upah Packing', kategori: 'biaya_produksi', satuan: 'pcs' },
  { id: 'KOMP-014', nama: 'Upah Steam', kategori: 'biaya_produksi', satuan: 'pcs' },
  { id: 'KOMP-015', nama: 'Upah QC', kategori: 'biaya_produksi', satuan: 'pcs' },
  
  // === OVERHEAD ===
  { id: 'KOMP-016', nama: 'Biaya Sewa Rumah', kategori: 'overhead', satuan: 'pcs', deskripsi: 'Alokasi sewa per pcs' },
  { id: 'KOMP-017', nama: 'Biaya Listrik', kategori: 'overhead', satuan: 'pcs' },
  { id: 'KOMP-018', nama: 'Biaya Makan', kategori: 'overhead', satuan: 'pcs' },
  { id: 'KOMP-019', nama: 'Biaya Operasional', kategori: 'overhead', satuan: 'pcs', deskripsi: 'Biaya tak terduga' },
];
```

### 2.2 Dummy ProdukHPPItem
```ts
export const dummyProdukHPPItems: ProdukHPPItem[] = [
  // === Produk PRD-001 (Jaket, Size S) ===
  { id: 'PHI-001', produkId: 'PRD-001', komponenId: 'KOMP-001', harga: 15000, qty: 1.0 },  // Modal Bahan 1.0m
  { id: 'PHI-002', produkId: 'PRD-001', komponenId: 'KOMP-002', harga: 10000, qty: 1.0 },  // Puring 1.0m
  { id: 'PHI-003', produkId: 'PRD-001', komponenId: 'KOMP-003', harga: 8000, qty: 1 },     // Sleting Badan
  { id: 'PHI-004', produkId: 'PRD-001', komponenId: 'KOMP-010', harga: 5000, qty: 1 },     // Upah Jahit
  { id: 'PHI-005', produkId: 'PRD-001', komponenId: 'KOMP-011', harga: 2000, qty: 1 },     // Upah Cutting
  { id: 'PHI-006', produkId: 'PRD-001', komponenId: 'KOMP-016', harga: 1000, qty: 1 },     // Sewa
  { id: 'PHI-007', produkId: 'PRD-001', komponenId: 'KOMP-017', harga: 1000, qty: 1 },     // Listrik
  { id: 'PHI-008', produkId: 'PRD-001', komponenId: 'KOMP-018', harga: 2000, qty: 1 },     // Makan
  
  // === Produk PRD-002 (Jaket, Size M) — PERHATIKAN qty bahan beda ===
  { id: 'PHI-009', produkId: 'PRD-002', komponenId: 'KOMP-001', harga: 15000, qty: 1.2 },  // Modal Bahan 1.2m ← lebih banyak
  { id: 'PHI-010', produkId: 'PRD-002', komponenId: 'KOMP-002', harga: 10000, qty: 1.2 },  // Puring 1.2m
  { id: 'PHI-011', produkId: 'PRD-002', komponenId: 'KOMP-003', harga: 8000, qty: 1 },     // Sleting Badan
  { id: 'PHI-012', produkId: 'PRD-002', komponenId: 'KOMP-010', harga: 5000, qty: 1 },     // Upah Jahit (sama)
  { id: 'PHI-013', produkId: 'PRD-002', komponenId: 'KOMP-011', harga: 2000, qty: 1 },     // Upah Cutting (sama)
  { id: 'PHI-014', produkId: 'PRD-002', komponenId: 'KOMP-016', harga: 1000, qty: 1 },     // Sewa (sama)
  { id: 'PHI-015', produkId: 'PRD-002', komponenId: 'KOMP-017', harga: 1000, qty: 1 },     // Listrik (sama)
  { id: 'PHI-016', produkId: 'PRD-002', komponenId: 'KOMP-018', harga: 2000, qty: 1 },     // Makan (sama)
];
```

### 2.3 Update dummyProduk
Tambahkan field `hargaJual` ke setiap produk yang sudah ada:
```ts
export const dummyProduk = [
  { id: 'PRD-001', ..., hargaJual: 55000 },
  { id: 'PRD-002', ..., hargaJual: 60000 },
  // ... dst
];
```

### 2.4 HAPUS dummyHPP lama
Hapus `export const dummyHPP = [...]` yang lama (array HPPDetail[]).

---

## BAGIAN 3: UPDATE ZUSTAND STORE

### 3.1 Update useMasterStore
**File:** `src/stores/useMasterStore.ts`

**Hapus semua yang berkaitan dengan `hppDetail` dan `HPPDetail`.**

**Tambahkan state dan actions baru berikut:**

```ts
// === STATE BARU ===
hppKomponen: HPPKomponen[];
produkHPPItems: ProdukHPPItem[];

// === CRUD HPPKomponen ===
addHPPKomponen: (item: HPPKomponen) => void;
updateHPPKomponen: (id: string, data: Partial<HPPKomponen>) => void;
removeHPPKomponen: (id: string) => void;

// === CRUD ProdukHPPItem ===
addProdukHPPItem: (item: ProdukHPPItem) => void;
updateProdukHPPItem: (id: string, data: Partial<ProdukHPPItem>) => void;
removeProdukHPPItem: (id: string) => void;

// === COMPUTED/HELPER ===
getHPPItemsByProduk: (produkId: string) => ProdukHPPItem[];
getTotalHPP: (produkId: string) => number;      // sum of (harga × qty) all items
getTotalHPPByKategori: (produkId: string, kategori: string) => number;
getMargin: (produkId: string) => { nominal: number; persen: number };

// === COPY HPP ===
copyHPP: (fromProdukId: string, toProdukId: string) => void;
// Logika: ambil semua ProdukHPPItem dari source, duplikat ke target (id baru)
// Jika target sudah punya items, REPLACE semuanya.

// === BULK APPLY (per model) ===
// Salin HPP dari 1 produk ke semua produk dengan model sama (semua size)
copyHPPToAllSizes: (fromProdukId: string) => void;
```

**Logika `copyHPP`:**
```ts
copyHPP: (fromProdukId, toProdukId) => set((state) => {
  // 1. Hapus semua items milik toProdukId
  const filtered = state.produkHPPItems.filter(i => i.produkId !== toProdukId);
  // 2. Ambil items milik fromProdukId
  const sourceItems = state.produkHPPItems.filter(i => i.produkId === fromProdukId);
  // 3. Duplikat dengan id baru dan produkId = toProdukId
  const newItems = sourceItems.map(item => ({
    ...item,
    id: `PHI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    produkId: toProdukId
  }));
  return { produkHPPItems: [...filtered, ...newItems] };
})
```

**Logika `copyHPPToAllSizes`:**
```ts
copyHPPToAllSizes: (fromProdukId) => set((state) => {
  const sourceProd = state.produk.find(p => p.id === fromProdukId);
  if (!sourceProd) return state;
  
  // Cari semua produk dengan model yang sama (kecuali source)
  const sameModelProds = state.produk.filter(
    p => p.modelId === sourceProd.modelId && p.id !== fromProdukId
  );
  
  const sourceItems = state.produkHPPItems.filter(i => i.produkId === fromProdukId);
  
  // Hapus items lama dari target, lalu duplikat dari source
  const targetIds = sameModelProds.map(p => p.id);
  let remaining = state.produkHPPItems.filter(
    i => !targetIds.includes(i.produkId)
  );
  
  const newItems: ProdukHPPItem[] = [];
  sameModelProds.forEach(targetProd => {
    sourceItems.forEach(item => {
      newItems.push({
        ...item,
        id: `PHI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        produkId: targetProd.id
      });
    });
  });
  
  return { produkHPPItems: [...remaining, ...sourceItems, ...newItems] };
})
```

---

## BAGIAN 4: UI — Halaman Master HPP Komponen

### 4.1 Buat halaman baru di Master Data
**Route:** `/master-data/hpp-komponen`

**File:** `src/features/master-data/MasterHPPKomponen/`
```
MasterHPPKomponen/
├── MasterHPPKomponenView.tsx
├── MasterHPPKomponenView.module.css
└── index.ts
```

### 4.2 MasterHPPKomponenView
- `PageWrapper` title: "Komponen HPP", subtitle: "Kelola daftar jenis biaya produksi"
- Tombol "Tambah Komponen" di kanan atas
- **DataTable** kolom:
  - ID (mono font)
  - Nama Komponen (bold)
  - Kategori (Badge berwarna):
    - `bahan_baku` → Badge hijau "Bahan Baku"
    - `biaya_produksi` → Badge biru "Biaya Produksi"
    - `overhead` → Badge kuning "Overhead"
  - Satuan (mono font)
  - Deskripsi (truncate jika panjang, warna sub)
  - Aksi (Edit + Hapus)
- **Filter tabs** di atas tabel: Semua | Bahan Baku | Biaya Produksi | Overhead
- Form modal (gunakan `MasterFormModal` yang sudah ada):
  - Nama (TextInput, required)
  - Kategori (Select: bahan_baku, biaya_produksi, overhead)
  - Satuan (TextInput, required)
  - Deskripsi (TextInput, opsional)

### 4.3 Page route
**File:** `src/app/(dashboard)/master-data/hpp-komponen/page.tsx`
```tsx
'use client';
import MasterHPPKomponenView from '@/features/master-data/MasterHPPKomponen';
export default function HPPKomponenPage() {
  return <MasterHPPKomponenView />;
}
```

### 4.4 Update Sidebar
Tambahkan link ke `/master-data/hpp-komponen` di navigasi sidebar, di bawah "Produk & HPP":
- Label: "Komponen HPP"
- Icon: sesuaikan dengan Lucide (contoh: `Layers` atau `Component`)

---

## BAGIAN 5: UI — Restrukturisasi Halaman Produk & HPP

### 5.1 Struktur File Baru
Hapus/refactor file lama di `src/features/master-data/MasterProduk/`:
```
MasterProduk/
├── MasterProdukView.tsx         # View utama (sudah ada, MODIFIKASI)
├── TabelProduk.tsx              # Tabel produk (sudah ada, MODIFIKASI)
├── FormProduk.tsx               # Form tambah produk (sudah ada, UPDATE: tambah hargaJual)
├── HPPEditor/                   # ← BARU — Sub-folder editor HPP
│   ├── HPPEditorPanel.tsx       # Panel editor HPP lengkap
│   ├── HPPEditorPanel.module.css
│   ├── HPPItemRow.tsx           # Satu baris item HPP (editable)
│   ├── HPPSummary.tsx           # Ringkasan total per kategori + margin
│   ├── AddKomponenModal.tsx     # Modal pilih komponen dari master
│   ├── CopyHPPModal.tsx         # Modal salin HPP dari produk lain
│   └── index.ts
├── PanelHPP.tsx                 # HAPUS — diganti HPPEditor
├── FormHPP.tsx                  # HAPUS — diganti HPPEditor
└── index.ts
```

### 5.2 MasterProdukView (Modifikasi Layout)
Layout baru:
```
┌─────────────────────────────────────────────────────────────────────┐
│ PageWrapper: "Produk & HPP"                            [+Produk]   │
├──────────────────────────────────┬──────────────────────────────────┤
│ Tabel Produk (kiri, 60%)       │ HPP Editor (kanan, 40%)          │
│                                 │                                  │
│ (Klik produk → editor muncul)  │ (Panel interaktif edit HPP)      │
│                                 │                                  │
│                                 │ ┌──────────────────────────────┐ │
│                                 │ │ + Tambah Komponen            │ │
│                                 │ │ [Salin dari Produk Lain]     │ │
│                                 │ │ [Upload Massal] (disabled)   │ │
│                                 │ ├──────────────────────────────┤ │
│                                 │ │ ═══ BAHAN BAKU ═══          │ │
│                                 │ │ Modal Bahan  1.0m × 15,000  │ │
│                                 │ │ Puring       1.0m × 10,000  │ │
│                                 │ │ Sleting Badan 1pc × 8,000   │ │
│                                 │ │ Sub: Rp 33,000              │ │
│                                 │ │                              │ │
│                                 │ │ ═══ BIAYA PRODUKSI ═══      │ │
│                                 │ │ Upah Jahit    1pc × 5,000   │ │
│                                 │ │ Upah Cutting  1pc × 2,000   │ │
│                                 │ │ Sub: Rp 7,000               │ │
│                                 │ │                              │ │
│                                 │ │ ═══ OVERHEAD ═══            │ │
│                                 │ │ Sewa Rumah    1pc × 1,000   │ │
│                                 │ │ Listrik       1pc × 1,000   │ │
│                                 │ │ Makan         1pc × 2,000   │ │
│                                 │ │ Sub: Rp 4,000               │ │
│                                 │ ├──────────────────────────────┤ │
│                                 │ │ TOTAL HPP:     Rp 44,000    │ │
│                                 │ │ Harga Jual:    Rp 55,000    │ │
│                                 │ │ MARGIN:        Rp 11,000    │ │
│                                 │ │ MARGIN %:      20.0%        │ │
│                                 │ └──────────────────────────────┘ │
└──────────────────────────────────┴──────────────────────────────────┘
```

### 5.3 TabelProduk (Modifikasi)
Kolom tabel — **role-aware** (gunakan `useAuthStore` untuk cek role):

**Untuk SEMUA role:**
- SKU Internal (cyan, mono)
- SKU Klien (mono)
- Model
- Size
- Warna (preview kotak warna)
- Status (Badge aktif/nonaktif)

**HANYA untuk `owner` dan `admin_keuangan` — sembunyikan jika role lain:**
- HPP Total (format Rupiah, mono)
- Harga Jual (format Rupiah, mono)
- Margin (format Rupiah + persentase, warna hijau/merah)

**Logika cek role:**
```tsx
const { currentUser } = useAuthStore();
const canSeeFinance = currentUser?.roles.some(
  r => r === 'owner' || r === 'admin_keuangan'
);

// Lalu di kolom:
...(canSeeFinance ? [
  { key: 'hpp', header: 'HPP Total', ... },
  { key: 'hargaJual', header: 'Harga Jual', ... },
  { key: 'margin', header: 'Margin', ... },
] : [])
```

### 5.4 HPPEditorPanel
Panel di sisi kanan yang muncul saat produk dipilih.

**Props:**
```tsx
interface HPPEditorPanelProps {
  produkId: string;
  onClose: () => void;
}
```

**Logika:**
1. Ambil semua `ProdukHPPItem` untuk `produkId` dari store
2. Kelompokkan berdasarkan `kategori` komponen (bahan_baku, biaya_produksi, overhead)
3. Tampilkan per kategori dengan header berwarna
4. Setiap item = `HPPItemRow` (editable inline)
5. Bawah tampilkan `HPPSummary`

**Tombol Aksi:**
- **"+ Tambah Komponen"** → buka `AddKomponenModal`
- **"Salin dari Produk Lain"** → buka `CopyHPPModal`
- **"Salin ke Semua Size"** → konfirmasi lalu panggil `copyHPPToAllSizes`
- **"Upload Massal"** → tombol ada, TAPI `disabled` + tooltip "Segera hadir"

**PENTING: Keseluruhan HPPEditorPanel HANYA tampil jika role = owner atau admin_keuangan.**
Jika role lain klik produk, tampilkan pesan: "Anda tidak memiliki akses untuk melihat data HPP."

### 5.5 HPPItemRow
Satu baris editable untuk satu komponen:
```
┌─ Hapus ──────────────────────────────────────────────────────────┐
│ [×]  Puring    [__1.0__] meter  ×  Rp [__15,000__]  = Rp 15,000 │
└──────────────────────────────────────────────────────────────────┘
```

**Props:**
```tsx
interface HPPItemRowProps {
  item: ProdukHPPItem;
  komponen: HPPKomponen;    // dari master, untuk nama & satuan
  onUpdate: (data: Partial<ProdukHPPItem>) => void;
  onRemove: () => void;
}
```

**Fitur:**
- `qty` dan `harga` bisa diedit inline (input number)
- Subtotal = qty × harga (computed, realtime)
- Tombol hapus (×) di kiri
- Warna baris sesuai kategori (subtle background)

### 5.6 HPPSummary
Ringkasan bawah editor:

```tsx
interface HPPSummaryProps {
  produkId: string;
}
```

**Tampilkan:**
```
─────────────────────────────
Subtotal Bahan Baku:    Rp 33,000
Subtotal Biaya Produksi: Rp 7,000
Subtotal Overhead:       Rp 4,000
═════════════════════════════
TOTAL HPP:              Rp 44,000
Harga Jual:             Rp 55,000
MARGIN:                 Rp 11,000  (20.0%)
─────────────────────────────
```

Margin positif = warna hijau. Margin negatif = warna merah.

### 5.7 AddKomponenModal
Modal untuk menambah komponen ke HPP produk.

**Logika:**
1. Tampilkan daftar semua `HPPKomponen` dari master
2. **Filter out** komponen yang sudah ada di produk ini (jangan duplikat)
3. Kelompokkan per kategori (tabs: Bahan Baku | Biaya Produksi | Overhead)
4. Setiap baris = checkbox + nama + satuan
5. User centang komponen yang diinginkan → klik "Tambahkan"
6. Semua yang dicentang ditambahkan sebagai `ProdukHPPItem` dengan harga=0, qty=1

**BONUS: Tombol "Buat Komponen Baru"**
- Di dalam modal ini, ada tombol kecil "Buat Komponen Baru"
- Klik → muncul inline form: nama, kategori, satuan
- Submit → langsung masuk ke `hppKomponen` master DAN langsung tercentang di list

### 5.8 CopyHPPModal
Modal untuk menyalin HPP dari produk lain.

**Logika:**
1. Tampilkan dropdown/list semua produk (selain produk aktif)
2. Saat produk sumber dipilih, tampilkan preview HPP-nya (read-only)
3. Tombol "Salin & Terapkan" → panggil `copyHPP(fromId, toId)`
4. **Warning**: "HPP yang sudah ada di produk ini akan DITIMPA. Lanjutkan?"

### 5.9 FormProduk (Update)
Tambahkan field `hargaJual` ke form tambah produk:
```
Harga Jual (estimasi per pcs)  [________] Rp
```
Field ini **wajib** diisi. Default: 0.

---

## BAGIAN 6: UI — Upload Massal (Placeholder)

### 6.1 Tombol Upload Massal
Di `HPPEditorPanel`, tambahkan tombol:
```tsx
<Button variant="secondary" disabled>
  Upload Massal (Segera Hadir)
</Button>
```

### 6.2 Siapkan Komponen (Nonaktif)
**File:** `src/features/master-data/MasterProduk/HPPEditor/BulkUploadModal.tsx`

Buat komponen modal kosong yang menampilkan:
```
┌──────────────────────────────────────────┐
│ Upload Massal HPP                        │
│                                          │
│ Fitur ini akan segera tersedia.          │
│                                          │
│ Format yang didukung:                    │
│ • File Excel (.xlsx)                     │
│ • Kolom: Komponen, Qty, Harga           │
│ • Baris per Size akan otomatis terbaca   │
│                                          │
│ [Tutup]                                  │
└──────────────────────────────────────────┘
```

Ini hanya placeholder — **JANGAN** implementasikan logika upload apapun.

---

## BAGIAN 7: UPDATE NAVIGASI SIDEBAR

Tambahkan menu baru di bawah "Produk & HPP":
```
Master Data
├── Detail (Kategori/Model/Size/Warna)
├── Produk & HPP
├── Komponen HPP        ← BARU
├── Karyawan
├── Klien
├── ...
```

Cari file navigasi/constant (kemungkinan di `src/lib/constants/navigation.ts`) dan tambahkan entry ini.

---

## BAGIAN 8: ROLE-BASED ACCESS RULES

### 8.1 Aturan Visibility
Implementasikan logika berikut di SEMUA komponen yang menampilkan data finansial:

```ts
// Helper hook (buat di src/lib/hooks/useFinanceAccess.ts)
import { useAuthStore } from '@/stores/useAuthStore';

export function useFinanceAccess() {
  const currentUser = useAuthStore(state => state.currentUser);
  const canSeeFinance = currentUser?.roles.some(
    r => r === 'owner' || r === 'admin_keuangan'
  ) ?? false;
  return { canSeeFinance };
}
```

### 8.2 Di mana hook ini digunakan:
1. **TabelProduk** — sembunyikan kolom HPP, Harga Jual, Margin
2. **HPPEditorPanel** — sembunyikan seluruh panel jika tidak punya akses
3. **PanelHPP** — jika masih digunaakan di tempat lain
4. **Dashboard** (nanti) — sembunyikan KPI finansial

---

## Verifikasi

Setelah selesai, pastikan:
1. `npx tsc --noEmit` — 0 error
2. Halaman `/master-data/hpp-komponen` CRUD berfungsi
3. Halaman `/master-data/produk-hpp`:
   - Klik produk → HPP Editor muncul di kanan
   - Bisa tambah/hapus/edit komponen HPP
   - Total HPP, subtotal per kategori, margin terhitung realtime
   - "Salin dari Produk Lain" berfungsi
   - "Salin ke Semua Size" berfungsi
4. Role switching test:
   - Ganti role ke "mandor" via RoleSwitcher
   - Kolom harga di tabel HILANG
   - HPP Editor tidak muncul (pesan akses ditampilkan)
   - Ganti role ke "owner" → semua data keuangan tampil kembali
5. Tombol "Upload Massal" ada tapi disabled
6. Semua form modal buka/tutup dengan benar

## JANGAN Lakukan

- ❌ Jangan setup database/Supabase/API apapun
- ❌ Jangan ubah komponen atoms/molecules/organisms yang sudah ada
- ❌ Jangan gunakan Tailwind CSS
- ❌ Jangan buat file lebih dari 200 baris
- ❌ Jangan implementasikan logika upload Excel (hanya placeholder)
- ❌ Jangan hapus komponen Auth, RoleSwitcher, OwnerCodeModal yang sudah ada
