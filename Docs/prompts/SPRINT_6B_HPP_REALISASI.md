# PROMPT — Sprint 6B: HPP Realisasi Akurat & Laporan Per PO

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` terlebih dahulu.
Sprint 6A sudah memperbaiki Jurnal Umum dan Ringkasan.

**Masalah yang ditemukan di Sprint 5C terkait HPP:**
1. `finance-calculations.ts` terlalu sederhana — overhead hanya difilter per PO (salah total)
2. Tidak ada kalkulasi HPP Estimasi (dari Master Produk & HPP Komponen)
3. Tidak ada perbandingan Estimasi vs Realisasi (kolom "Gap")
4. Tidak ada integrasi `pemakaianBahan` dari `usePOStore` ke biaya bahan
5. Harga per meter kain tidak dihitung dari jurnal pembelian
6. Laporan Per PO tidak menampilkan nama klien dan total QTY
7. Overhead belum dialokasikan proporsional berdasarkan PCS terkirim

**Sprint 6B ini akan membangun:**
1. Engine HPP Realisasi yang akurat berdasarkan spesifikasi PROJECT_CONTEXT
2. Engine HPP Estimasi dari Master Produk & HPP Komponen  
3. Perbandingan Estimasi vs Realisasi dengan status Hemat/Boncos
4. Laporan Per PO yang lengkap dan detail

## Aturan Wajib
(Sama dengan Sprint 6A)

---

## BAGIAN 1: UPGRADE `finance-calculations.ts`

### 1.1 Kalkulasi HPP Bahan (Realisasi)

**Formula sesuai PROJECT_CONTEXT:**
```
hargaPerMeter = totalNilaiBeliKain / totalMeterDibeli
biayaBahanPerPCS = pemakaianKainMeter × hargaPerMeter
biayaBahanPO = biayaBahanPerPCS × totalQtyPO
```

**Data sources:**
- `pemakaianKainMeter`: dari `usePOStore.pemakaianBahan` (per artikel)
- `totalNilaiBeliKain`: dari jurnal `direct_bahan` yang di-tag ke PO ini
- `totalMeterDibeli`: perlu field baru di TransaksiMasuk inventory ATAU dihitung dari jurnal keterangan

**Simplifikasi yang diizinkan:**
- Jika `pemakaianBahan` tidak tersedia untuk PO tertentu, gunakan fallback: total biaya bahan yang di-tag / totalQty
- Jika overhead tidak bisa dialokasi proporsional, gunakan pembagian merata ke PO aktif

### 1.2 Kalkulasi HPP Estimasi

**Formula:**
```
hppEstimasiPerPCS = Σ (komponen.harga × komponen.qty) untuk setiap ProdukHPPItem
hppEstimasiPO = Σ (hppEstimasiPerPCS × qty) untuk setiap item PO
```

**Data sources:**
- `ProdukHPPItem`: dari `useMasterStore.produkHPP`
- `HPPKomponen`: dari `useMasterStore.hppKomponen`

### 1.3 Kalkulasi Overhead (Proporsional)

**Formula sesuai PROJECT_CONTEXT:**
```
totalOverheadBulan = Σ jurnal.overhead (periode bulan yang sama)
totalPCSTerkirimBulan = Σ bundles yang sudah shipped (dari usePengirimanStore atau useBundleStore)
overheadPerPCS = totalOverheadBulan / totalPCSTerkirimBulan
overheadPO = overheadPerPCS × pcsTerkirimPO
```

### 1.4 POFinancialSummary (Diperkaya)

```typescript
export interface POFinancialSummary {
  poId: string;
  noPO: string;
  klien: string;
  totalQty: number;
  totalPcsTerkirim: number;
  
  // HPP Estimasi
  hppEstimasi: number;
  
  // HPP Realisasi
  biayaBahan: number;
  biayaUpah: number;
  biayaOverhead: number;
  totalRealisasi: number;
  
  // Pemasukan
  nilaiProject: number; // dari harga jual × qty
  pembayaranDiterima: number; // dari jurnal masuk
  
  // Analisa
  gap: number; // realisasi - estimasi (+boncos, -hemat)
  grossProfit: number; // pembayaran - realisasi
  marginPersen: number;
  status: 'hemat' | 'boncos' | 'on_budget';
}
```

---

## BAGIAN 2: UPGRADE LAPORAN PER PO

### 2.1 `LaporanPerPOView.tsx` (REBUILD)

**File:** `src/features/keuangan/LaporanPO/LaporanPerPOView.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  PageWrapper: "Laporan HPP Realisasi per PO"            │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │Total │ │Rata2 │ │PO    │ │PO    │                   │
│  │Profit│ │Margin│ │Hemat │ │Boncos│                   │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
│                                                         │
│  ┌──────────────────────────────────────────────┐       │
│  │  DataTable: Laporan HPP                       │       │
│  │  Kolom:                                       │       │
│  │  - No. PO                                     │       │
│  │  - Klien                                      │       │
│  │  - Total QTY                                  │       │
│  │  - HPP Estimasi                               │       │
│  │  - Biaya Bahan (Real)                         │       │
│  │  - Biaya Upah (Real)                          │       │
│  │  - Overhead (Alokasi)                         │       │
│  │  - Total Realisasi                            │       │
│  │  - Gap (Estimasi vs Realisasi)                │       │
│  │  - Status (Badge: Hemat/Boncos/On Budget)     │       │
│  └──────────────────────────────────────────────┘       │
│                                                         │
│  [Klik baris → Expand Detail Breakdown Per Artikel]     │
└─────────────────────────────────────────────────────────┘
```

### 2.2 DetailPOPanel (Expandable Row)

Saat klik baris PO tertentu, tampilkan panel di bawahnya:
- Breakdown per artikel (Model-Warna-Size)
- `pemakaianKainMeter` vs harga kain yang dibeli
- HPP Estimasi per PCS vs Realisasi per PCS

---

## BAGIAN 3: DUMMY DATA HPP

### 3.1 Tambah/Update Dummy Data

- Pastikan `useMasterStore.produkHPP` dan `hppKomponen` memiliki data yang cukup
- Pastikan `usePOStore.pemakaianBahan` memiliki data untuk PO-001 dan PO-002
- Pastikan `dummyJurnal` memiliki entri `direct_bahan` yang di-tag ke PO aktif

---

## Deliverable Sprint 6B

- [ ] `finance-calculations.ts` mendukung HPP Estimasi + Realisasi + Overhead proporsional
- [ ] `POFinancialSummary` interface diperkaya sesuai spesifikasi
- [ ] `LaporanPerPOView` menampilkan semua kolom + KPI cards + status badge  
- [ ] Gap = Realisasi - Estimasi, dengan status Hemat/Boncos/On Budget
- [ ] Detail breakdown per artikel (expandable row)
- [ ] Dummy data HPP lengkap untuk testing
- [ ] `npx tsc --noEmit` = 0 errors
