# PROMPT — Sprint 3C: Monitoring Produksi Real-Time

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1-2 (foundation, auth, master data), Sprint 3A (input PO, barcode), dan Sprint 3B (scan stations, logika sinkron) sudah selesai.

**Status saat ini:**
- `usePOStore` memiliki CRUD PurchaseOrder + global sequence
- `useBundleStore` memiliki CRUD Bundle + statusTahap per tahap + scan records
- 7 Scan Stations berfungsi dengan chain validation antar tahap
- Barcode generation, Owner auth, dan koreksi flow sudah berjalan
- Dummy PO dan bundle data sudah tersedia

**Sprint 3C ini akan membangun:**
1. **Monitoring Per PO** — progress tracker untuk setiap PO aktif
2. **Monitoring Per Artikel** — detail breakdown per artikel dalam PO
3. **Warning Proses** — alert untuk bundle yang mandek/terlambat
4. **Dashboard mini** dengan KPI produksi

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css` + `index.ts` (jika perlu)
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/` (contoh: `@/components/atoms/Button`)
5. **Data** = baca dari Zustand store (`usePOStore`, `useBundleStore`, `useMasterStore`). Computed values.
6. **Komponen reusable** yang sudah ada WAJIB digunakan:
   - `PageWrapper`, `Panel`, `DataTable`, `Badge`, `ProgressBar`, `Button`
7. **Feature components** disimpan di `src/features/produksi/Monitoring/`

---

## BAGIAN 1: Struktur File

```
src/features/produksi/Monitoring/
├── MonitoringView.tsx            # View utama + tab switching
├── MonitoringView.module.css
├── MonitoringPerPO.tsx           # Tab 1: progress per PO
├── MonitoringPerPO.module.css
├── MonitoringPerArtikel.tsx      # Tab 2: detail per artikel
├── MonitoringPerArtikel.module.css
├── WarningProses.tsx             # Tab 3: daftar warning/alert
├── WarningProses.module.css
├── ProgressTimeline.tsx          # Sub-component: mini timeline 7 tahap
├── ProgressTimeline.module.css
└── index.ts
```

---

## BAGIAN 2: MonitoringView

### 2.1 Route
`src/app/(dashboard)/produksi/monitoring/page.tsx` → render `MonitoringView`

### 2.2 Layout
- `PageWrapper` title: "Monitoring Produksi", subtitle: "Pantau progress real-time semua Purchase Order"
- **KPI Row** (4 cards di atas):
  - Total PO Aktif
  - Total Bundle Aktif
  - Bundle Selesai (sampai Packing)
  - Bundle Bermasalah (koreksi pending atau warning)
- **3 Tab**: Per PO | Per Artikel | Warning

---

## BAGIAN 3: MonitoringPerPO (Tab 1)

### 3.1 Deskripsi
Tabel yang menampilkan **progress setiap PO** di seluruh tahap produksi.

### 3.2 DataTable Columns:
| Kolom | Deskripsi |
|---|---|
| No. PO | Nomor PO (mono font, klik → expand) |
| Klien | Nama klien |
| Total Bundle | Jumlah total bundle dalam PO |
| Cutting | Progress bar: `selesai / total` (%) |
| Jahit | Progress bar |
| L.Kancing | Progress bar |
| B.Benang | Progress bar |
| QC | Progress bar |
| Steam | Progress bar |
| Packing | Progress bar |
| Status | Badge: Draft / Aktif / Selesai |

### 3.3 Logika Kalkulasi Progress
Untuk setiap PO dan setiap tahap:
```
progress = (jumlah bundle dengan statusTahap[tahap].status === 'selesai') / totalBundle × 100
```

### 3.4 Visual
- Progress bar warna:
  - 0% → abu-abu
  - 1-49% → kuning
  - 50-99% → biru/cyan
  - 100% → hijau
- Tampilkan angka di dalam bar: "8/10"

### 3.5 Expand Row (optional, jika memungkinkan)
Saat klik PO → expand baris, tampilkan detail artikel-artikel di dalam PO tersebut.

---

## BAGIAN 4: MonitoringPerArtikel (Tab 2)

### 4.1 Deskripsi
Breakdown lebih granular per **artikel** (kombinasi Model × Warna × Size dalam PO).

### 4.2 Filter:
- Select PO (dropdown, pilih salah satu PO aktif)
- Atau tampilkan semua artikel dari semua PO

### 4.3 DataTable Columns:
| Kolom | Deskripsi |
|---|---|
| PO | Nomor PO |
| Model | Nama model |
| Warna | Nama warna |
| Size | Nama size |
| QTY Target | Total pcs yang dipesan |
| Bundle | Jumlah bundle untuk artikel ini |
| Progress | `ProgressTimeline` component (mini 7-tahap) |
| QTY Selesai | Total pcs yang sudah selesai tahap packing |
| Sisa | QTY Target - QTY Selesai |

### 4.4 ProgressTimeline
Komponen kecil yang menampilkan 7 tahap secara horizontal:
```
[C] → [J] → [K] → [B] → [Q] → [S] → [P]
 ✅     ✅    ⏳    ⬜    ⬜    ⬜    ⬜
```
- ✅ Selesai (hijau)
- ⏳ Sedang diproses (kuning/blink)
- ⬜ Belum (abu)
- 🔴 Bermasalah (merah, jika ada koreksi pending)

*Catatan: ProgressTimeline untuk artikel = mayoritas status bundles per artikel. Jika >50% bundle selesai tahap X → tahap X dianggap ✅*

---

## BAGIAN 5: WarningProses (Tab 3)

### 5.1 Deskripsi
Daftar bundle/artikel yang perlu perhatian:

### 5.2 Jenis Warning:
1. **Koreksi Pending**: Bundle yang `koreksiStatus === 'pending'` — menunggu approval owner
2. **Bundle Mandek**: Bundle yang sudah >24 jam di status `terima` tapi belum `selesai` di tahap manapun (simulasi: cek waktu terima vs waktu sekarang)
3. **QTY Kurang**: Tahap yang punya `qtySelesai < qtyTerima` (sudah approved tapi menandakan waste/reject)

### 5.3 DataTable Columns:
| Kolom | Deskripsi |
|---|---|
| Barcode | Barcode bundle (mono font) |
| PO | Nomor PO |
| Tahap | Pada tahap mana masalah terjadi |
| Jenis Warning | Badge: Koreksi Pending / Mandek / QTY Kurang |
| Detail | Penjelasan singkat |
| Waktu | Sejak kapan |
| Aksi | Tombol "Lihat Detail" (optional, bisa redirect ke scan station) |

### 5.4 KPI khusus warning:
- Koreksi Pending: X bundle
- Bundle Mandek: X bundle
- QTY Kurang: X kasus

---

## BAGIAN 6: Computed Helpers

Buat helper functions (bisa di store atau di file terpisah `src/lib/utils/production-helpers.ts`):

```ts
// Hitung progress per PO per tahap
getProgressByPO(poId: string, tahap: string): { done: number; total: number; pct: number }

// Hitung progress per artikel per tahap
getProgressByArtikel(poId: string, modelId: string, warnaId: string, sizeId: string, tahap: string): { done: number; total: number; pct: number }

// Ambil semua warnings
getWarnings(): Warning[]

// Total bundle yang sudah selesai packing
getTotalCompleted(poId: string): number
```

---

## Verifikasi

Setelah selesai, pastikan:
1. `npx tsc --noEmit` — 0 error
2. Halaman Monitoring menampilkan 3 tab yang berfungsi
3. Tab Per PO menampilkan progress bar yang akurat berdasarkan data bundle di store
4. Tab Per Artikel menampilkan breakdown granular dengan ProgressTimeline visual
5. Tab Warning menampilkan daftar bundle bermasalah (jika ada)
6. KPI cards di atas menampilkan angka yang benar
7. Progress bar berubah warna sesuai persentase
8. Data real-time dari Zustand store (jika scan di tab lain, monitoring otomatis update saat kembali ke halaman ini)

## JANGAN Lakukan

- ❌ Jangan setup database/Supabase/API apapun
- ❌ Jangan ubah design system yang sudah ada
- ❌ Jangan ubah file-file Sprint sebelumnya (kecuali menambah computed getter ke store)
- ❌ Jangan gunakan Tailwind CSS
- ❌ Jangan buat file lebih dari 200 baris
- ❌ Jangan install charting library — gunakan CSS-based progress bars
