# PROMPT — Sprint 5C: Keuangan & Laporan (Jurnal Umum, Ringkasan, 4 Laporan)

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1-4, Sprint 5A (penggajian), dan Sprint 5B (inventory) sudah selesai.

**Status saat ini:**
- `useJurnalStore` sudah ada dengan actions CRUD dasar (addEntry, getByPeriode, getByJenis)
- Entri `direct_upah` sudah bisa ditulis dari modul Penggajian (Sprint 5A)
- Inventory sudah fungsional (stok bisa bertambah/berkurang)
- `useMasterStore` memiliki kategori transaksi dengan field `jenis`
- `pemakaianBahan` sudah tersimpan di `usePOStore` (dari Sprint 4A)
- Route pages untuk semua halaman keuangan sudah ada tapi berisi placeholder

**Sprint 5C ini akan membangun:**
1. **Jurnal Umum** — Input transaksi manual (kecuali `direct_upah`) dengan form kondisional
2. **Ringkasan Keuangan** — Overview arus kas
3. **Laporan Per PO** — HPP Estimasi vs Realisasi per PO (kalkulasi paling kompleks)
4. **Laporan Per Bulan** — Ringkasan keuangan bulanan
5. **Laporan Gaji** — Verifikasi biaya tenaga kerja
6. **Laporan Reject** — Ringkasan produk cacat dan biaya terkait

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css`
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/`
5. **Data CRUD** = baca/tulis ke Zustand store
6. **Komponen reusable** yang sudah ada WAJIB digunakan
7. **Feature components** disimpan di `src/features/keuangan/`
8. **Margin & HPP** HANYA boleh tampil di halaman Keuangan ini — DILARANG di Produksi/Pengiriman

---

## BAGIAN 1: JURNAL UMUM

### 1.1 Halaman `/keuangan/jurnal-umum` — JurnalUmumView

**File:** `src/features/keuangan/JurnalUmum/JurnalUmumView.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  PageWrapper: "Jurnal Umum"                             │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐                             │
│  │Total │ │Masuk │ │Keluar│                             │
│  │Entry │ │      │ │      │                             │
│  └──────┘ └──────┘ └──────┘                             │
│                                                         │
│  [+ Tambah Entri]  [Filter Periode]  [Filter Jenis]     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  DataTable: JurnalTable                           │   │
│  │  Kolom:                                           │   │
│  │  - Tanggal                                        │   │
│  │  - Kategori                                       │   │
│  │  - Jenis (Badge: direct_bahan/overhead/masuk)     │   │
│  │  - Tipe (Masuk/Keluar)                            │   │
│  │  - Nominal (Rupiah)                               │   │
│  │  - Keterangan                                     │   │
│  │  - No. Faktur (jika ada)                          │   │
│  │  - Tag PO (jika ada)                              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠️ Entri "Upah Karyawan" hanya dari REKAP Penggajian   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 ModalTambahJurnal

**File:** `src/features/keuangan/JurnalUmum/ModalTambahJurnal.tsx`

**Form kondisional berdasarkan kategori yang dipilih:**

| Kategori dipilih | Jenis otomatis | Field tambahan |
|---|---|---|
| Pembelian Bahan Baku | `direct_bahan` | No. Faktur + Tag PO (multi-select) |
| Pembelian Aksesori | `direct_bahan` | No. Faktur + Tag PO |
| Upah Karyawan | `direct_upah` | **FORM DISABLED** — hanya via REKAP |
| Operasional | `overhead` | Tidak ada field tambahan |
| Penerimaan PO | `masuk` | Tag PO |

**Perilaku:**
- Pilih kategori → `jenis` otomatis terisi (tidak perlu pilih manual)
- Jika kategori = `direct_bahan` → **otomatis tambah stok** ke `useInventoryStore`
- Jika kategori = `direct_upah` → form ditolak, tampilkan pesan: "Gunakan tombol REKAP di Penggajian"

---

## BAGIAN 2: RINGKASAN KEUANGAN

### 2.1 Halaman `/keuangan/ringkasan` — RingkasanView

**File:** `src/features/keuangan/Ringkasan/RingkasanView.tsx`

**Layout:**
- KPI Cards: Total Pemasukan, Total Pengeluaran, Saldo, Margin rata-rata
- Grafik/chart sederhana: Perbandingan tipe masuk vs keluar per bulan (bisa pakai bar chart HTML sederhana)
- Tabel ringkasan per kategori transaksi

---

## BAGIAN 3: LAPORAN PER PO (PALING KOMPLEKS)

### 3.1 Halaman `/keuangan/laporan-po` — LaporanPerPOView

**File:** `src/features/keuangan/LaporanPO/LaporanPerPOView.tsx`

**Kalkulasi HPP Realisasi per PO:**

```
┌─────────────────────────────────────────────────────────┐
│  1. Biaya Bahan (Realisasi)                             │
│     = pemakaianKainMeter × hargaPerMeter × totalQty     │
│     dimana hargaPerMeter = totalNilaiBeliKain / totalM  │
│                                                         │
│  2. Biaya Upah (Realisasi)                              │
│     = Σ jurnal.detailUpah yang tag PO ini                │
│                                                         │
│  3. Overhead (Alokasi Proporsional)                     │
│     = (totalOverheadBulan / totalPCSterkirimBulan)       │
│       × pcsKirimPO                                      │
│                                                         │
│  4. Total Realisasi = Bahan + Upah + Overhead           │
│  5. HPP Estimasi = dari Master Produk & HPP             │
│  6. Gap = Realisasi - Estimasi                          │
│     (+ = boncos, - = hemat)                             │
└─────────────────────────────────────────────────────────┘
```

**Layout Tabel:**
| Kolom | Deskripsi |
|---|---|
| No. PO | Nomor PO |
| Klien | Nama klien |
| Total QTY | Total pcs order |
| HPP Estimasi | Dari master produk |
| Biaya Bahan Real | Dari pemakaianBahan |
| Biaya Upah Real | Dari jurnal direct_upah |
| Overhead Real | Dialokasikan proporsional |
| Total Realisasi | Bahan + Upah + Overhead |
| Gap | Realisasi - Estimasi |
| Status | Badge: Hemat / Boncos |

---

## BAGIAN 4: LAPORAN LAIN

### 4.1 Laporan Per Bulan
**File:** `src/features/keuangan/LaporanBulan/LaporanPerBulanView.tsx`
- Filter bulan/tahun
- Tabel ringkasan: Pemasukan, Biaya Bahan, Biaya Upah, Overhead, Total Pengeluaran, Saldo

### 4.2 Laporan Gaji
**File:** `src/features/keuangan/LaporanGaji/LaporanGajiView.tsx`
- Tabel biaya tenaga kerja per periode per karyawan
- Cross-reference dengan data jurnal `direct_upah`

### 4.3 Laporan Reject
**File:** `src/features/keuangan/LaporanReject/LaporanRejectView.tsx`
- Tabel semua reject dari `useBundleStore.rejectRecords`
- Ringkasan per tahap, per jenis reject
- Estimasi kerugian finansial (qty reject × HPP per pcs)

---

## BAGIAN 5: ROUTING

Ganti isi file placeholder berikut:
- `src/app/(dashboard)/keuangan/ringkasan/page.tsx`
- `src/app/(dashboard)/keuangan/jurnal-umum/page.tsx`
- `src/app/(dashboard)/keuangan/laporan-po/page.tsx`
- `src/app/(dashboard)/keuangan/laporan-bulan/page.tsx`
- `src/app/(dashboard)/keuangan/laporan-gaji/page.tsx`
- `src/app/(dashboard)/keuangan/laporan-reject/page.tsx`

---

## Deliverable Sprint 5C

- [ ] **Jurnal Umum** fungsional: form kondisional, integrasi inventory, block `direct_upah`
- [ ] **Ringkasan** fungsional: KPI + chart sederhana
- [ ] **Laporan Per PO** fungsional: kalkulasi HPP Realisasi yang akurat
- [ ] **Laporan Per Bulan** fungsional
- [ ] **Laporan Gaji** fungsional
- [ ] **Laporan Reject** fungsional
- [ ] `npx tsc --noEmit` = 0 errors

## File yang akan dibuat/dimodifikasi

### File Baru (~18 file):
| Grup | File |
|---|---|
| Jurnal Umum | `JurnalUmumView.tsx`, `.css`, `ModalTambahJurnal.tsx`, `.css` |
| Ringkasan | `RingkasanView.tsx`, `.css` |
| Laporan PO | `LaporanPerPOView.tsx`, `.css` |
| Laporan Bulan | `LaporanPerBulanView.tsx`, `.css` |
| Laporan Gaji | `LaporanGajiView.tsx`, `.css` |
| Laporan Reject | `LaporanRejectView.tsx`, `.css` |
| Helpers | `src/lib/utils/finance-calculations.ts` (kalkulasi HPP Realisasi) |

### File Dimodifikasi:
| File | Perubahan |
|---|---|
| `src/stores/useJurnalStore.ts` | Tambah actions yang dibutuhkan |
| 6 file `page.tsx` | Ganti placeholder |
