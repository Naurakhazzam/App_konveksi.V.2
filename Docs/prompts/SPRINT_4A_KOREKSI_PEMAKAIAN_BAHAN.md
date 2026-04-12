# PROMPT — Sprint 4A: Koreksi Data & Pemakaian Bahan

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1-3 (foundation, auth, master data, produksi core, monitoring) sudah selesai.

**Status saat ini:**
- `useKoreksiStore` sudah ada dengan interface `KoreksiItem` dan actions CRUD dasar (addToQueue, approve, reject)
- `useBundleStore` memiliki `updateStatusTahap` yang sudah bisa set `koreksiStatus: 'pending'` saat QTY > target
- `ModalQtySelesai` di ScanStation sudah mengintegrasikan Owner Auth Code (030503) dan mem-flag bundle sebagai `koreksiStatus: 'pending'`
- `production-helpers.ts` sudah mendeteksi `koreksiStatus === 'pending'` di `getWarnings()` dan di `validateCanTerima()` (block chain)
-  Type `PemakaianBahan` sudah didefinisikan di `production.types.ts`
- Route `/koreksi-data` sudah ada di `navigation.ts` tapi halamannya belum ada
- Dummy koreksi item (`KOR-001`) sudah ada di `useKoreksiStore`

**Sprint 4A ini akan membangun:**
1. **Halaman Koreksi Data** — Owner me-review & approve/reject bundel yang QTY-nya melebihi target
2. **Integrasi Koreksi ↔ Bundle** — saat approve/reject, `useBundleStore` diupdate dan bundel di-unblock
3. **Pemakaian Bahan (Phase 2B)** — modal pemakaian kain yang muncul otomatis saat cutting bundel pertama per artikel

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css`
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/` (contoh: `@/components/atoms/Button`)
5. **Data CRUD** = baca/tulis ke Zustand store. Tidak ada API call.
6. **Komponen reusable** yang sudah ada WAJIB digunakan (DataTable, Modal, Badge, Button, KpiCard, Panel, PageWrapper, OwnerCodeModal)
7. **Feature components** disimpan sesuai domain:
   - Koreksi → `src/features/koreksi/`
   - Pemakaian Bahan → `src/features/produksi/ScanStation/` (karena terintegrasi ke scan flow)

---

## BAGIAN 1: KOREKSI DATA — Halaman Review Owner

### 1.1 Alur Bisnis Koreksi

```
[ScanStation] QTY > Target → Owner Auth → koreksiStatus='pending' → BUNDLE DIBLOKIR
                                                    ↓
                                        [Halaman Koreksi Data]
                                                    ↓
                                    ┌─────────────────────────────────┐
                                    │   Owner me-review item pending  │
                                    │                                 │
                                    │  APPROVE → keep qtySelesai      │
                                    │    → koreksiStatus='approved'   │
                                    │    → bundle UNBLOCK (lanjut)    │
                                    │                                 │
                                    │  REJECT → revert qtySelesai     │
                                    │    → qtySelesai = qtyTerima     │
                                    │    → koreksiStatus='rejected'   │
                                    │    → bundle UNBLOCK (lanjut)    │
                                    └─────────────────────────────────┘
```

### 1.2 Halaman `/koreksi-data` — KoreksiView

**File:** `src/features/koreksi/KoreksiView.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  PageWrapper: "Koreksi Data Produksi"            │
│                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │Pending│ │Apprvd│ │Rjctd │ │Total │          │
│  │  KPI  │ │  KPI │ │  KPI │ │  KPI │          │
│  └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                  │
│  [Filter: Status ▼] [Search barcode/PO]          │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  DataTable: KoreksiTable                  │    │
│  │  Kolom:                                   │    │
│  │  - Barcode                                │    │
│  │  - Tahap                                  │    │
│  │  - QTY Target | QTY Aktual | Selisih      │    │
│  │  - Tipe (Badge: lebih/kurang)             │    │
│  │  - Alasan                                 │    │
│  │  - Status (Badge)                         │    │
│  │  - Diajukan Oleh | Waktu                  │    │
│  │  - Aksi (Approve/Reject buttons)          │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [Klik Approve/Reject → ModalApproveReject]      │
└──────────────────────────────────────────────────┘
```

### 1.3 KoreksiTable

**File:** `src/features/koreksi/KoreksiTable.tsx`

**Props:**
```typescript
interface KoreksiTableProps {
  items: KoreksiItem[];
  onApprove: (item: KoreksiItem) => void;
  onReject: (item: KoreksiItem) => void;
}
```

**Kolom DataTable:**
| Kolom | Key | Render |
|---|---|---|
| Barcode | `barcode` | `<code>` monospace |
| Tahap | `tahap` | `TAHAP_LABEL[tahap]` |
| QTY Target | `qtyTarget` | Number |
| QTY Aktual | `qtyAktual` | Number, **bold** |
| Selisih | computed | `qtyAktual - qtyTarget`, warna merah/hijau |
| Tipe | `tipe` | `Badge variant="warning"` untuk 'lebih', `variant="info"` untuk 'kurang' |
| Alasan | `alasan` | Text |
| Status | `status` | Badge: pending=warning, approved=success, rejected=danger |
| Diajukan | `diajukanOleh` + `waktuAjukan` | Nama karyawan + relative time |
| Aksi | - | 2 button: ✅ Approve + ❌ Reject (hanya tampil jika status===pending) |

### 1.4 ModalApproveReject

**File:** `src/features/koreksi/ModalApproveReject.tsx`

**Alur Modal:**
1. Tampilkan detail koreksi (barcode, tahap, selisih QTY)
2. Tampilkan 2 opsi:
   - **APPROVE**: "QTY Aktual ({X}) akan dipertahankan. Bundle akan dilanjutkan ke proses berikutnya."
   - **REJECT**: "QTY Aktual akan di-revert ke {qtyTarget}. Bundle akan dilanjutkan ke proses berikutnya."
3. Konfirmasi memerlukan **Owner Auth Code** (gunakan `OwnerCodeModal`)
4. Setelah auth berhasil:
   - Update `useKoreksiStore` → `approve()` atau `reject()`
   - **APPROVE**: Update `useBundleStore` → `updateStatusTahap(barcode, tahap, { koreksiStatus: 'approved' })`
   - **REJECT**: Update `useBundleStore` → `updateStatusTahap(barcode, tahap, { koreksiStatus: 'rejected', qtySelesai: qtyTarget })`
   - Kedua kasus → bundle unblock → bisa lanjut ke tahap berikutnya

### 1.5 Integrasi: ScanStation → KoreksiStore

**Modifikasi `ScanResult.tsx`:**
Saat ini `handleQtyConfirm` hanya meng-update `useBundleStore`. Perlu ditambahkan:
- Jika `needsKoreksi === true`, otomatis panggil `useKoreksiStore.addToQueue()` dengan data lengkap
- Generate ID koreksi baru: `KOR-{timestamp}`

---

## BAGIAN 2: PEMAKAIAN BAHAN (Phase 2B)

### 2.1 Alur Bisnis

```
[ScanStation Cutting] → TERIMA bundle → cek: apakah ini bundle PERTAMA untuk artikel ini di PO ini?
     │
     ├── JIika belum ada data pemakaian → PAKSA tampilkan ModalPemakaianBahan
     │       → Input: Pemakaian Kain (meter/pcs), Berat Bahan (gram/pcs)
     │       → Simpan ke state `pemakaianBahan` di usePOStore atau store terpisah
     │       → BARU SETELAH ITU scan dilanjutkan
     │
     └── Jika sudah ada → lanjut normal
```

**Definisi "bundle pertama per artikel per PO":**
- Artikel = kombinasi unik `modelId + warnaId + sizeId` dalam 1 PO
- Cek: apakah sudah ada entry di `pemakaianBahan[]` untuk `(poId, modelId, warnaId, sizeId)`?

### 2.2 State Management

**Tambahkan di `usePOStore` atau buat state baru:**
```typescript
// Di usePOStore atau store terpisah
pemakaianBahan: PemakaianBahan[];
addPemakaianBahan: (data: PemakaianBahan) => void;
getPemakaianBahan: (poId: string, modelId: string, warnaId: string, sizeId: string) => PemakaianBahan | undefined;
```

**Tipe `PemakaianBahan` (sudah ada di `production.types.ts`):**
```typescript
interface PemakaianBahan {
  po: string;
  skuKlien: string;
  artikelNama: string;       // "Model-Warna-Size" descriptive
  pemakaianKainMeter: number; // meter per pcs
  pemakaianBeratGram: number; // gram per pcs
  inputOleh: string;
  waktuInput: string;
}
```

> **Catatan**: Perlu tambahkan field identifikasi artikel:
> `modelId: string; warnaId: string; sizeId: string;`

### 2.3 ModalPemakaianBahan

**File:** `src/features/produksi/ScanStation/ModalPemakaianBahan.tsx`

**Layout:**
```
┌───────────────────────────────────────┐
│  🧵 Input Pemakaian Bahan            │
│                                       │
│  PO: PO-001                           │
│  Artikel: Jaket Air - Hitam - M       │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ Pemakaian Kain (meter/pcs) *    │  │
│  │ [____________]                  │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │ Berat Bahan (gram/pcs) *        │  │
│  │ [____________]                  │  │
│  └─────────────────────────────────┘  │
│                                       │
│  ⚠️ Data ini hanya diinput sekali     │
│     per artikel per PO. Pastikan      │
│     nilai yang diinput sudah benar.   │
│                                       │
│          [Batal]  [💾 Simpan]         │
└───────────────────────────────────────┘
```

**Perilaku:**
- Modal **tidak bisa ditutup** tanpa input (closeOnBackdrop: false, closeOnEsc: false)
- Tombol Batal → tampilkan konfirmasi: "Jika batal, scan bundle ini TIDAK akan diproses."
- Setelah simpan → data disimpan → flow terima bundle dilanjutkan

### 2.4 Integrasi ke ScanResult (Cutting only)

**Modifikasi `ScanResult.tsx` — `handleTerima()`:**
```
1. Cek tahap === 'cutting'
2. Cek apakah pemakaianBahan untuk artikel ini sudah ada
3. Jika BELUM → tampilkan ModalPemakaianBahan → tunggu save
4. Setelah save (atau jika sudah ada) → lanjutkan logika terima biasa
```

---

## BAGIAN 3: DUMMY DATA

### 3.1 Dummy Koreksi

Tambahkan 3-5 dummy koreksi items di `useKoreksiStore` dengan variasi status:
- 1 item `pending` (yang sudah ada: KOR-001)
- 1 item `approved` (riwayat)
- 1 item `rejected` (riwayat)

### 3.2 Dummy Pemakaian Bahan

Tambahkan 1-2 dummy data pemakaian bahan agar bisa terlihat di laporan nanti.

---

## BAGIAN 4: ROUTING

**File baru:** `src/app/(dashboard)/koreksi-data/page.tsx`
```typescript
'use client';
import KoreksiView from '@/features/koreksi/KoreksiView';
export default function KoreksiDataPage() {
  return <KoreksiView />;
}
```

---

## Deliverable Sprint 4A

- [ ] Halaman **Koreksi Data** fully functional dengan filter, KPI, approve/reject flow
- [ ] **Integrasi 2 arah** antara KoreksiStore ↔ BundleStore (approve unblock, reject revert)
- [ ] **ModalPemakaianBahan** terintegrasi di ScanStation (cutting only)
- [ ] **Pemakaian bahan** tersimpan per artikel per PO di store
- [ ] Dummy data tersedia untuk testing
- [ ] `npx tsc --noEmit` = 0 errors

## File yang akan dibuat/dimodifikasi

### File Baru:
| File | Deskripsi |
|---|---|
| `src/features/koreksi/KoreksiView.tsx` | Halaman utama koreksi |
| `src/features/koreksi/KoreksiView.module.css` | Styles |
| `src/features/koreksi/KoreksiTable.tsx` | Tabel koreksi |
| `src/features/koreksi/ModalApproveReject.tsx` | Modal review |
| `src/features/koreksi/ModalApproveReject.module.css` | Styles |
| `src/features/koreksi/index.ts` | Export barrel |
| `src/features/produksi/ScanStation/ModalPemakaianBahan.tsx` | Modal input bahan |
| `src/features/produksi/ScanStation/ModalPemakaianBahan.module.css` | Styles |
| `src/app/(dashboard)/koreksi-data/page.tsx` | Route page |

### File Dimodifikasi:
| File | Perubahan |
|---|---|
| `src/stores/useKoreksiStore.ts` | Tambah dummy data, perbaiki tipe |
| `src/stores/usePOStore.ts` | Tambah `pemakaianBahan[]` state & actions |
| `src/types/production.types.ts` | Tambah field `modelId, warnaId, sizeId` ke PemakaianBahan |
| `src/features/produksi/ScanStation/ScanResult.tsx` | Integrasi addToQueue koreksi + trigger pemakaian bahan |
