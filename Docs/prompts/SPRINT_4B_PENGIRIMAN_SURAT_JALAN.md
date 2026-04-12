# PROMPT — Sprint 4B: Modul Pengiriman (Surat Jalan & Riwayat Kirim)

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1-3 dan Sprint 4A (koreksi data, pemakaian bahan) sudah selesai.

**Status saat ini:**
- Bundle yang sudah melewati 7 tahap produksi (cutting → packing) dan berstatus `selesai` siap untuk dikirim
- Navigation untuk `/pengiriman` sudah ada dengan 2 sub-menu: 'Buat Surat Jalan' dan 'Riwayat Kirim'
- Route path mapping sudah ada di `navigation.ts`
- Belum ada store untuk pengiriman
- ProductionFlowBoard di Monitoring sudah menunjukkan slot "KIRIM" di ujung kanan — ini yang akan terisi saat surat jalan dibuat

**Sprint 4B ini akan membangun:**
1. **Store Pengiriman** — `usePengirimanStore` untuk Surat Jalan dan item-itemnya
2. **Buat Surat Jalan** — scan bundle → kumpulkan → generate SJ
3. **Riwayat Kirim** — histori semua pengiriman + detail

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css`
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/` (contoh: `@/components/atoms/Button`)
5. **Data CRUD** = baca/tulis ke Zustand store. Tidak ada API call.
6. **Komponen reusable** yang sudah ada WAJIB digunakan
7. **Feature components** disimpan di `src/features/pengiriman/`

---

## BAGIAN 1: TIPE DATA & STORE

### 1.1 Tipe Data Baru

**File baru:** `src/types/pengiriman.types.ts`

```typescript
export interface SuratJalanItem {
  id: string;
  bundleBarcode: string;   // referensi ke bundle
  poId: string;            // PO mana
  modelId: string;
  warnaId: string;
  sizeId: string;
  skuKlien: string;        // ★ Surat jalan pakai SKU Klien
  qty: number;             // qty bundle
}

export interface SuratJalan {
  id: string;               // SJ-001, SJ-002, ...
  nomorSJ: string;          // Nomor surat jalan
  klienId: string;          // Surat jalan per klien
  tanggal: string;          // ISO date
  items: SuratJalanItem[];   // Bundle-bundle yang dikirim
  totalQty: number;          // Total pcs
  totalBundle: number;       // Total bundle
  catatan: string;
  status: 'draft' | 'dikirim' | 'diterima';
  dibuatOleh: string;       // userId
  pengirim: string;          // Nama/ID kurir/driver
}
```

### 1.2 Store Pengiriman

**File baru:** `src/stores/usePengirimanStore.ts`

```typescript
interface PengirimanState {
  suratJalanList: SuratJalan[];
  
  addSuratJalan: (sj: SuratJalan) => void;
  updateSuratJalan: (id: string, data: Partial<SuratJalan>) => void;
  getSuratJalanById: (id: string) => SuratJalan | undefined;
  getNextNomorSJ: () => string;   // Auto increment: SJ-001, SJ-002
  getSJByKlien: (klienId: string) => SuratJalan[];
}
```

**Dummy data:** 1-2 surat jalan contoh dengan status 'dikirim'.

---

## BAGIAN 2: BUAT SURAT JALAN

### 2.1 Alur Bisnis

```
                      ┌─────────────────────────────┐
                      │  Halaman Buat Surat Jalan    │
                      └─────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              [Pilih Klien]   [Scan Bundles]   [Daftar Bundle]
                    │               │               │
                    │      Scan barcode bundle      │
                    │      yang SUDAH PACKING       │
                    │      SELESAI                   │
                    │               │               │
                    │      Validasi:                 │
                    │      ✓ Status packing=selesai  │
                    │      ✓ Belum masuk SJ lain     │
                    │      ✓ Klien = klien PO         │
                    │               │               │
                    ▼               ▼               ▼
              ┌─────────────────────────────────────┐
              │  Review → Simpan → Generate SJ      │
              └─────────────────────────────────────┘
```

### 2.2 Halaman `/pengiriman/buat-surat-jalan`

**File:** `src/features/pengiriman/BuatSuratJalan/BuatSuratJalanView.tsx`

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  PageWrapper: "Buat Surat Jalan"                           │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Panel: "Setup Pengiriman"                          │    │
│  │                                                     │    │
│  │  [Klien: ▼ Pilih Klien]   [Pengirim: __________]   │    │
│  │  [Catatan: ___________________________________]     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Panel: "Scan Bundle"                               │    │
│  │                                                     │    │
│  │  [🔍 Scan/ketik barcode... ]                        │    │
│  │                                                     │    │
│  │  ✅ "PO001-JAK-HIT-M-00001..." ditambahkan         │    │
│  │  ❌ "PO002-..." — klien tidak sesuai                │    │
│  │  ❌ "PO001-..." — bundle belum selesai packing      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Panel: "Daftar Bundle Surat Jalan (12 bundle)"     │    │
│  │                                                     │    │
│  │  DataTable:                                         │    │
│  │  | No | SKU Klien | PO | Model | Warna | Size | Q | │    │
│  │  |----|-----------|-----|-------|-------|------|---|  │    │
│  │  | 1  | SKU-001   |PO01| Jaket | Hitam | M   |12 |  │    │
│  │  | 2  | SKU-001   |PO01| Jaket | Hitam | M   |12 |  │    │
│  │  |    |           |     Total: 24 pcs / 2 bundle    │    │
│  │                                                     │    │
│  │  [❌ Hapus Terpilih]                                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌──────────────────────────────────┐                      │
│  │  [Batal]  [📄 Buat Surat Jalan] │                      │
│  └──────────────────────────────────┘                      │
└────────────────────────────────────────────────────────────┘
```

### 2.3 ScanBarcodeSJ

**File:** `src/features/pengiriman/BuatSuratJalan/ScanBarcodeSJ.tsx`

**Logika Scan:**
1. User mengetik/scan barcode
2. Cari bundle di `useBundleStore.getBundleByBarcode()`
3. **Validasi:**
   - ✅ Bundle ditemukan
   - ✅ `statusTahap.packing.status === 'selesai'`
   - ✅ Bundle belum masuk ke surat jalan lain (cek semua SJ di store)
   - ✅ PO dari bundle ini punya `klienId` yang sama dengan klien yang dipilih
   - ✅ Bundle belum ada di daftar SJ saat ini (no duplicate)
4. Jika valid → tambahkan ke daftar SJ (local state)
5. Jika invalid → tampilkan pesan error spesifik

**Fitur Partial Search:**
Seperti di ScanStation, izinkan search parsial (ketik kode singkat).
Filter hanya bundle yang:
- `packing.status === 'selesai'`
- Belum masuk SJ lain
- PO-nya milik klien yang dipilih

### 2.4 FormSuratJalan (Review Panel)

**File:** `src/features/pengiriman/BuatSuratJalan/FormSuratJalan.tsx`

**Props:**
```typescript
interface FormSuratJalanProps {
  klienId: string;
  pengirim: string;
  catatan: string;
  items: SuratJalanItem[];
  onRemoveItem: (barcode: string) => void;
  onSubmit: () => void;
}
```

**Kolom DataTable:**
| Kolom | Deskripsi |
|---|---|
| No | Auto-number |
| SKU Klien | `skuKlien` dari bundle |
| No. PO | Nomor PO |
| Model | Nama model |
| Warna | Nama warna |
| Size | Nama size |
| QTY | pcs per bundle |
| Aksi | ❌ Remove button |

**Footer:** Total QTY (`Σ qty pcs`) dan Total Bundle.

### 2.5 Aksi Simpan Surat Jalan

1. Generate `nomorSJ` dari `getNextNomorSJ()`
2. Buat objek `SuratJalan` lengkap
3. Simpan ke `usePengirimanStore.addSuratJalan()`
4. **Update status bundle:** Untuk setiap bundle yang masuk SJ, tambahkan tracking bahwa bundle sudah dikirim (opsional: tambah field `dikirim: true` atau cukup tracking via SJ)
5. Redirect ke halaman Riwayat Kirim atau tampilkan success message

---

## BAGIAN 3: RIWAYAT KIRIM

### 3.1 Halaman `/pengiriman/riwayat`

**File:** `src/features/pengiriman/RiwayatKirim/RiwayatKirimView.tsx`

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  PageWrapper: "Riwayat Pengiriman"                         │
│                                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │Total │ │Draft │ │Dikirim│ │Diterima│                    │
│  │  SJ  │ │      │ │       │ │       │                    │
│  └──────┘ └──────┘ └──────┘ └──────┘                      │
│                                                            │
│  [Search: No SJ / Klien]  [Filter Status ▼]                │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │  DataTable:                                       │      │
│  │  | No SJ | Klien | Tanggal | Bundle | QTY | Sts | │      │
│  │  |-------|-------|---------|--------|-----|-----|  │      │
│  │  | SJ-01 | PT..  | 12 Apr  |   10   | 120 | 🚚 |  │      │
│  │  | SJ-02 | CV..  | 11 Apr  |    5   |  60 | ✅ |  │      │
│  │                                                   │      │
│  │  [Klik Row → Expand Detail SJ]                     │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Detail Surat Jalan (Expandable / Modal)

Saat row diklik, tampilkan detail:
- Informasi header SJ (No SJ, Klien, Tanggal, Pengirim, Catatan)
- **DataTable detail** berisi semua bundle dengan kolom:
  - SKU Klien, No PO, Model, Warna, Size, QTY
- Tombol aksi: **Tandai Diterima** (update status SJ → 'diterima')

---

## BAGIAN 4: ROUTING

**File baru:**

1. `src/app/(dashboard)/pengiriman/buat-surat-jalan/page.tsx`
```typescript
'use client';
import BuatSuratJalanView from '@/features/pengiriman/BuatSuratJalan/BuatSuratJalanView';
export default function BuatSuratJalanPage() {
  return <BuatSuratJalanView />;
}
```

2. `src/app/(dashboard)/pengiriman/riwayat/page.tsx`
```typescript
'use client';
import RiwayatKirimView from '@/features/pengiriman/RiwayatKirim/RiwayatKirimView';
export default function RiwayatKirimPage() {
  return <RiwayatKirimView />;
}
```

---

## Deliverable Sprint 4B

- [ ] **Store Pengiriman** (`usePengirimanStore`) functional
- [ ] **Buat Surat Jalan** — scan, validasi, review, simpan
- [ ] **Partial search** untuk scan barcode (fitur yang sudah ada di ScanStation)
- [ ] **Riwayat Kirim** — list SJ + detail expandable + update status
- [ ] **Integrasi** dengan `useBundleStore` (cek packing selesai) dan `usePOStore` (cek klien)
- [ ] Dummy data tersedia untuk testing
- [ ] `npx tsc --noEmit` = 0 errors

## File yang akan dibuat/dimodifikasi

### File Baru:
| File | Deskripsi |
|---|---|
| `src/types/pengiriman.types.ts` | Tipe data SuratJalan |
| `src/stores/usePengirimanStore.ts` | Store pengiriman |
| `src/features/pengiriman/BuatSuratJalan/BuatSuratJalanView.tsx` | Halaman utama |
| `src/features/pengiriman/BuatSuratJalan/BuatSuratJalanView.module.css` | Styles |
| `src/features/pengiriman/BuatSuratJalan/ScanBarcodeSJ.tsx` | Komponen scan |
| `src/features/pengiriman/BuatSuratJalan/ScanBarcodeSJ.module.css` | Styles |
| `src/features/pengiriman/BuatSuratJalan/FormSuratJalan.tsx` | Panel review |
| `src/features/pengiriman/BuatSuratJalan/index.ts` | Export barrel |
| `src/features/pengiriman/RiwayatKirim/RiwayatKirimView.tsx` | Halaman riwayat |
| `src/features/pengiriman/RiwayatKirim/RiwayatKirimView.module.css` | Styles |
| `src/features/pengiriman/RiwayatKirim/index.ts` | Export barrel |
| `src/app/(dashboard)/pengiriman/buat-surat-jalan/page.tsx` | Route page |
| `src/app/(dashboard)/pengiriman/riwayat/page.tsx` | Route page |

### File Dimodifikasi:
| File | Perubahan |
|---|---|
| `src/types/index.ts` | Export tipe pengiriman baru |
| `src/stores/useBundleStore.ts` | Mungkin tambah field tracking `dikirim` (opsional) |

---

## Catatan Arsitektur

### ★ Surat Jalan Bisa Lintas PO (Same Client)
Satu surat jalan bisa berisi bundle dari PO berbeda, **asalkan klien-nya sama**. Ini penting untuk efisiensi pengiriman.

### ★ SKU di Surat Jalan = SKU Klien
Berbeda dari barcode internal, surat jalan menggunakan `skuKlien` karena ini adalah dokumen yang dikirim ke klien.

### ★ Validasi Ketat Sebelum Kirim
Bundle HANYA bisa masuk surat jalan jika:
1. Packing sudah selesai
2. Belum masuk surat jalan lain
3. Klien PO-nya sesuai
