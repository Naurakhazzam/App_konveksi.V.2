# PROMPT — Sprint 3B: Scan Stations & Logika Sinkron Produksi

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1-2 (foundation, auth, master data) dan Sprint 3A (input PO, barcode, stores) sudah selesai.

**Status saat ini:**
- `usePOStore` sudah memiliki CRUD untuk PurchaseOrder + barcode generation
- `useBundleStore` sudah memiliki CRUD untuk Bundle + statusTahap per tahap
- Barcode generator utility sudah ada di `src/lib/utils/barcode-generator.ts`
- Halaman Input PO sudah bisa membuat PO + generate bundles
- Dummy PO dan bundles sudah tersedia di store

**Sprint 3B ini akan membangun:**
1. **7 Scan Stations** dalam 1 dynamic route (`[tahap]`)
2. Komponen **ScanInput** untuk input barcode (simulasi scanner)
3. **ModalQtySelesai** — input hasil produksi per tahap
4. **ModalReject** — pencatatan cacat produk
5. **Logika sinkron antar tahap** — chain validation yang ketat
6. **Integrasi Owner auth** untuk koreksi QTY yang melebihi target

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css` + `index.ts` (jika perlu)
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/` (contoh: `@/components/atoms/Button`)
5. **Data CRUD** = baca/tulis ke Zustand store. Tidak ada API call.
6. **Komponen reusable** yang sudah ada WAJIB digunakan
7. **Feature components** disimpan di `src/features/produksi/ScanStation/`

---

## ALUR LOGIKA PRODUKSI (WAJIB DIPAHAMI)

### Tahap Produksi (7 tahap berurutan):
```
cutting → jahit → lkancing → bbenang → qc → steam → packing
```

### Alur per Bundle per Tahap:
1. **SCAN barcode** → sistem temukan bundle → tampilkan info bundle
2. **TERIMA** (tombol): Set `statusTahap[tahap].status = 'terima'`, catat `qtyTerima = qtyBundle`, catat waktu
3. **Operator bekerja** (di dunia nyata, di sistem kita langsung ke step 4)
4. **SELESAI** (tombol): Buka `ModalQtySelesai` → input `qtySelesai`
5. **Validasi QTY:**
   - `qtySelesai === qtyTerima` → OK, simpan langsung
   - `qtySelesai < qtyTerima` → Wajib input ALASAN (kurang karena reject/cacat) → simpan + auto-approved
   - `qtySelesai > qtyTerima` → **TIDAK BOLEH LANGSUNG**:
     a. Minta Owner Auth Code (modal PIN)
     b. Jika PIN benar → set `koreksiStatus = 'pending'`, simpan qtySelesai tapi **block bundle** ke tahap berikutnya
     c. Bundle masuk ke antrian Koreksi Data (Sprint 4)

### Validasi Chain Antar Tahap:
- Tahap `jahit` TIDAK BISA terima bundle jika `cutting.status !== 'selesai'`
- Tahap `lkancing` TIDAK BISA terima bundle jika `jahit.status !== 'selesai'`
- dst. untuk semua tahap
- **EXCEPTION**: `cutting` adalah tahap pertama, langsung bisa terima
- **BLOCK**: Jika `koreksiStatus === 'pending'` di tahap manapun → bundle **DIBLOKIR** dari semua tahap berikutnya

### Validasi QTY Terima:
- `qtyTerima` di tahap N **MAKSIMAL** = `qtySelesai` di tahap N-1
- Contoh: cutting selesai 10 pcs → jahit hanya bisa terima maks 10 pcs

### Karyawan:
- Hanya tahap `cutting` dan `jahit` yang **WAJIB** pilih karyawan
- Tahap lain tidak perlu input karyawan

---

## BAGIAN 1: Struktur File

```
src/features/produksi/ScanStation/
├── ScanStationView.tsx         # View utama (1 component untuk 7 tahap)
├── ScanStationView.module.css
├── ScanInput.tsx               # Input barcode + autocomplete
├── ScanInput.module.css
├── ScanResult.tsx              # Display info bundle yang sudah di-scan
├── ScanResult.module.css
├── ModalQtySelesai.tsx         # Modal input qty selesai
├── ModalReject.tsx             # Modal input reject/cacat
├── ActionButtons.tsx           # Tombol Terima, Selesai, Reject
└── index.ts
```

---

## BAGIAN 2: ScanStationView

### 2.1 Dynamic Route
Route: `src/app/(dashboard)/produksi/scan/[tahap]/page.tsx`

```tsx
'use client';
import { useParams } from 'next/navigation';
import ScanStationView from '@/features/produksi/ScanStation';

export default function ScanPage() {
  const { tahap } = useParams<{ tahap: string }>();
  return <ScanStationView tahap={tahap} />;
}
```

### 2.2 Props & Logic
- Prop: `tahap` — salah satu dari: `cutting`, `jahit`, `lubang-kancing`, `buang-benang`, `qc`, `steam`, `packing`
- **PENTING**: Map slug URL ke key bundle:
  - `lubang-kancing` → `lkancing`
  - `buang-benang` → `bbenang`
  - Sisanya sama dengan slug

### 2.3 Layout
```
┌──────────────────────────────────────────┐
│  PageWrapper: "Scan — [Nama Tahap]"      │
│  subtitle: "Scan barcode bundle"         │
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │
│  │  ScanInput                         │  │
│  │  [________________________] [Scan] │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  ScanResult (muncul setelah scan)  │  │
│  │  PO: PO-001 | Model: Jaket        │  │
│  │  Warna: Hitam | Size: M           │  │
│  │  QTY Bundle: 12                   │  │
│  │  Status Cutting: ✅ Selesai (12)  │  │
│  │  Status Jahit: ⏳ Belum           │  │
│  │                                    │  │
│  │  [Terima]  [Selesai]  [Reject]    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Riwayat Scan Hari Ini (tabel)    │  │
│  │  Barcode | Waktu | Aksi | QTY     │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## BAGIAN 3: ScanInput

- Input teks besar (font-size besar, untuk scanner barcode)
- Saat user ketik atau scan barcode → cari di `useBundleStore.getBundleByBarcode()`
- Jika ditemukan → tampilkan `ScanResult`
- Jika tidak → tampilkan error "Bundle tidak ditemukan"
- Autocomplete: minimal 4 karakter mulai menampilkan saran dari daftar barcode
- Enter key → langsung scan/cari

---

## BAGIAN 4: ScanResult

Menampilkan detail bundle yang ditemukan:
- Info: PO, Model, Warna, Size, QTY Bundle, SKU
- Status seluruh 7 tahap (mini timeline/progress indicator)
- **Validasi otomatis** saat tampil:
  - Cek apakah tahap sebelumnya sudah selesai
  - Cek apakah ada koreksi pending
  - Tampilkan pesan error jika bundle di-block
- Tombol aksi: Terima, Selesai, Reject (lihat BAGIAN 5)

---

## BAGIAN 5: ActionButtons

### Tombol TERIMA
- Disabled jika tahap sebelumnya belum `selesai` (kecuali cutting)
- Disabled jika ada `koreksiStatus === 'pending'` di tahap manapun sebelumnya
- Disabled jika tahap ini sudah `terima` atau `selesai`
- Klik → set `statusTahap[tahap].status = 'terima'`
- Untuk cutting & jahit → muncul Select Karyawan dulu sebelum terima
- `qtyTerima` = `qtySelesai` dari tahap sebelumnya (atau `qtyBundle` jika cutting)

### Tombol SELESAI
- Hanya aktif jika status === 'terima'
- Klik → buka `ModalQtySelesai`

### Tombol REJECT
- Hanya aktif jika status === 'terima' atau 'selesai'
- Klik → buka `ModalReject`

---

## BAGIAN 6: ModalQtySelesai

Modal input qty hasil produksi:
- Tampilkan info: `QTY Terima: X`
- Input: `QTY Selesai` (NumberInput)
- Validasi real-time:
  - Jika `qtySelesai === qtyTerima`: tampilkan ✅ "OK"
  - Jika `qtySelesai < qtyTerima`: tampilkan ⚠️ "Kurang" + wajib isi alasan (TextInput)
  - Jika `qtySelesai > qtyTerima`: tampilkan 🔴 "Melebihi target" + trigger owner auth
- Tombol Simpan:
  - Jika OK atau Kurang → langsung simpan ke store
  - Jika Melebihi → buka `OwnerCodeModal` (sudah ada di `src/components/molecules/OwnerCodeModal/`)
    - Jika PIN benar → set `koreksiStatus = 'pending'`, simpan
    - Jika PIN salah → tolak

---

## BAGIAN 7: ModalReject

Modal pencatatan reject:
- Select jenis reject (dari `useMasterStore.jenisReject`)
- QTY reject (NumberInput)
- Catatan (TextInput, optional)
- Simpan: simpan data reject (untuk sekarang, simpan ke sebuah array `rejectRecords` di `useBundleStore` atau state lokal — detail implementasi fleksibel)

---

## BAGIAN 8: Scan History (Riwayat Hari Ini)

Di bawah area scan, tampilkan tabel riwayat scan hari ini:
- DataTable: Barcode, Waktu, Aksi (Terima/Selesai), QTY, Status
- Data dari `ScanRecord` type yang sudah ada di `src/types/production.types.ts`
- Simpan scan records di state lokal komponen atau di store terpisah

---

## Verifikasi

Setelah selesai, pastikan:
1. `npx tsc --noEmit` — 0 error
2. Navigasi ke 7 scan station via sidebar berfungsi (Cutting, Jahit, L.Kancing, B.Benang, QC, Steam, Packing)
3. Scan barcode menampilkan info bundle yang benar
4. Tombol Terima hanya aktif jika tahap sebelumnya selesai
5. ModalQtySelesai memvalidasi 3 skenario (OK, Kurang, Melebihi)
6. Owner auth muncul saat QTY > target
7. Bundle dengan koreksi pending di-block dari tahap berikutnya
8. Karyawan wajib dipilih untuk Cutting & Jahit

## JANGAN Lakukan

- ❌ Jangan setup database/Supabase/API apapun
- ❌ Jangan ubah design system yang sudah ada
- ❌ Jangan ubah file-file Sprint sebelumnya (kecuali menambah field ke store/types)
- ❌ Jangan gunakan Tailwind CSS
- ❌ Jangan buat file lebih dari 200 baris
- ❌ Jangan ubah `OwnerCodeModal` yang sudah ada — gunakan apa adanya
