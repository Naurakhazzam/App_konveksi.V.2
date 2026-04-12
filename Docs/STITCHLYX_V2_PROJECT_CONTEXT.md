# STITCHLYX.SYNCORE V2 — Master Project Context
# Berikan dokumen ini ke AI (sesi baru) di awal sesi
# Terakhir diupdate: Rebuild V2 — Migrasi dari monolith ke arsitektur modular

---

## IDENTITAS PROYEK

Nama Aplikasi  : STITCHLYX.SYNCORE V2
Tagline        : Garment Operating System — Precision Engine
Tipe           : Full-Stack Web Application (rencana dijual sebagai SaaS)
Pemilik        : Owner konveksi skala menengah, omset miliaran
Tujuan         : Menggantikan sistem Excel manual dengan sistem digital terintegrasi
Status         : **PHASE 1 & 2 SELESAI (100%)** — Core workflow produksi (Cutting Room) & payroll sudah stabil.
Identitas Visual: **2026 High-End Aesthetics** (Refined Charcoal & Muted Copper)
Terakhir Update : 12 April 2026 (Ultimate Design Overhaul & Liquid Glass)

> **PENTING — KONTEKS PROYEK SAAT INI:**
> Aplikasi telah berhasil dipindahkan dari versi monolith ke arsitektur modular Next.js 15.
> Saat ini, UI dan Logika Bisnis (State) secara frontend sudah **95% selesai**.
> Sesi berikutnya harus menjalankan perintah yang ada di **`Docs/prompts/SPRINT_6.5_FINAL_POLISH.md`** 
> untuk membereskan 5% sisa fitur (Print, Empty States, Validasi) sebelum masuk ke **Sprint 7** (Migrasi Database).
> **File V1 TIDAK digunakan lagi.** Jangan referensi atau edit file V1.

---

## TECH STACK

| Layer | Teknologi | Catatan |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | File-based routing, Server Components |
| **Bahasa** | TypeScript (.tsx / .ts) | Type-safe, memudahkan AI analisa kode |
| **Styling** | CSS Modules + CSS Variables | Modular, tidak tabrakan antar komponen |
| **State** | Zustand (store per domain) | Ringan, tanpa boilerplate, support slices |
| **Database** | Zustand + Dummy Data (fase awal) | Migrasi ke database dilakukan di fase terpisah nanti |
| **Auth** | Dummy Auth (Zustand) | Role-based access via useAuthStore |
| **Forms** | React Hook Form + Zod | Validasi form |
| **Icons** | Lucide React | Tree-shakeable, konsisten |
| **Animation** | Framer Motion | Liquid glass effects, smooth transitions |
| **PDF** | @react-pdf/renderer (nanti) | Export surat jalan, slip gaji |
| **Barcode** | react-barcode + react-qr-code (nanti) | Cetak label barcode |

---

## LOKASI FILE & STRUKTUR PROYEK

**Direktori Proyek:** `d:\Project Konveksi.V.2\`

> PENTING: Proyek V1 ada di `d:\Project Konveksi\stitchlyx-web\` — JANGAN edit file di sana.
> Semua pekerjaan dilakukan di `d:\Project Konveksi.V.2\`

### Arsitektur Folder

```
d:\Project Konveksi.V.2\
├── Docs/                         # Dokumentasi proyek
│   └── STITCHLYX_V2_PROJECT_CONTEXT.md  ← FILE INI
│
├── public/
│   └── fonts/                    # Self-hosted fonts
│
├── src/
│   ├── app/                      # Next.js 15 App Router (routing)
│   │   ├── layout.tsx            # Root layout (fonts, metadata, providers)
│   │   ├── page.tsx              # Landing → redirect ke /dashboard
│   │   ├── globals.css           # CSS Variables (Design System)
│   │   │
│   │   ├── (auth)/               # Route group: halaman publik
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   └── (dashboard)/          # Route group: halaman terproteksi
│   │       ├── layout.tsx        # Sidebar + TopBar + Auth Guard
│   │       ├── dashboard/
│   │       │   ├── produksi/page.tsx
│   │       │   ├── keuangan/page.tsx
│   │       │   └── penggajian/page.tsx
│   │       ├── produksi/
│   │       │   ├── input-po/page.tsx
│   │       │   ├── cutting/page.tsx         # NEW: Antrian Cutting & Print SPK
│   │       │   ├── scan/[tahap]/page.tsx    # Dynamic: cutting, jahit, dll
│   │       │   └── monitoring/page.tsx
│   │       ├── pengiriman/
│   │       │   ├── buat-surat-jalan/page.tsx
│   │       │   └── riwayat/page.tsx
│   │       ├── penggajian/
│   │       │   ├── rekap-gaji/page.tsx
│   │       │   ├── kasbon/page.tsx
│   │       │   └── slip-gaji/page.tsx
│   │       ├── inventory/
│   │       │   ├── overview/page.tsx
│   │       │   ├── transaksi-keluar/page.tsx
│   │       │   └── alert-order/page.tsx
│   │       ├── keuangan/
│   │       │   ├── ringkasan/page.tsx
│   │       │   ├── jurnal-umum/page.tsx
│   │       │   ├── laporan-po/page.tsx
│   │       │   ├── laporan-bulan/page.tsx
│   │       │   ├── laporan-gaji/page.tsx
│   │       │   └── laporan-reject/page.tsx
│   │       ├── master-data/
│   │       │   ├── detail/page.tsx
│   │       │   ├── produk-hpp/page.tsx
│   │       │   ├── karyawan/page.tsx
│   │       │   ├── klien/page.tsx
│   │       │   ├── jenis-reject/page.tsx
│   │       │   ├── kategori-transaksi/page.tsx
│   │       │   ├── satuan/page.tsx
│   │       │   └── user-role/page.tsx
│   │       ├── koreksi-data/page.tsx
│   │       └── audit-log/page.tsx
│   │
│   ├── components/               # Komponen Reusable (Atomic Design)
│   │   ├── atoms/                # Terkecil, tidak bisa dipecah lagi
│   │   │   ├── MacDots/
│   │   │   │   ├── MacDots.tsx
│   │   │   │   ├── MacDots.module.css
│   │   │   │   └── index.ts
│   │   │   ├── Button/
│   │   │   ├── Badge/
│   │   │   ├── Input/            # TextInput, NumberInput, SearchInput
│   │   │   ├── Select/           # Select, MultiSelect
│   │   │   ├── Typography/       # Heading (Syne), Label (Instrument Sans), MonoText (Geist Mono)
│   │   │   ├── StatusDot/
│   │   │   ├── ProgressBar/
│   │   │   └── Spinner/
│   │   │
│   │   ├── molecules/            # Gabungan atoms, satu fungsi
│   │   │   ├── Panel/            # MacDots + title + children (wajib di setiap card)
│   │   │   ├── KpiCard/          # Icon + label + value + trend
│   │   │   ├── FormField/        # Label + Input + Error
│   │   │   ├── SearchBar/
│   │   │   ├── ConfirmDialog/
│   │   │   ├── EmptyState/
│   │   │   ├── BarcodeLabel/
│   │   │   └── Autocomplete/     # Scan autocomplete (↑↓ Enter Esc)
│   │   │
│   │   ├── organisms/            # Gabungan molecules, section utuh
│   │   │   ├── DataTable/        # Generic table: sortable, filterable, custom cells
│   │   │   ├── KpiRow/           # Row of KPI cards
│   │   │   ├── FilterBar/        # Search + filters + date range
│   │   │   ├── FormPanel/        # Panel wrapper for forms
│   │   │   ├── Modal/            # Base modal: backdrop, animation, header/body/footer
│   │   │   └── Sidebar/          # Navigation sidebar
│   │   │
│   │   └── templates/            # Page layouts
│   │       ├── DashboardLayout/  # Sidebar + content area
│   │       └── PageWrapper/      # Title + KPI + content
│   │
│   ├── features/                 # Komponen spesifik per fitur (BUKAN reusable)
│   │   ├── dashboard/
│   │   ├── master-data/
│   │   ├── produksi/
│   │   ├── pengiriman/
│   │   ├── penggajian/
│   │   ├── inventory/
│   │   ├── keuangan/
│   │   ├── koreksi/
│   │   └── audit-log/
│   │
│   ├── stores/                   # Zustand stores (1 store per domain)
│   │   ├── useBundleStore.ts     # BundleDB + statusTahap
│   │   ├── useScanStore.ts       # NEW: Persisted scan history (manual)
│   │   ├── useKoreksiStore.ts    # Koreksi queue
│   │   ├── useInventoryStore.ts  # Inventory + transaksi
│   │   ├── useJurnalStore.ts     # Jurnal keuangan
│   │   ├── usePayrollStore.ts    # Gaji ledger + kasbon
│   │   ├── usePOStore.ts         # Purchase Orders
│   │   ├── useMasterStore.ts     # Master data (kategori, model, dll)
│   │   └── useAuthStore.ts       # Auth state + user role
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── constants/            # Nilai tetap
│   │   │   ├── theme.ts          # Palet warna (C object)
│   │   │   ├── navigation.ts     # NAV array sidebar
│   │   │   ├── barcode.ts        # Format barcode rules
│   │   │   ├── production.ts     # Tahap produksi
│   │   │   └── roles.ts          # Role definitions
│   │   ├── utils/                # Fungsi helper
│   │   │   ├── formatters.ts     # Format Rupiah, tanggal, angka
│   │   │   ├── calculations.ts   # HPP, margin, overhead
│   │   │   ├── barcode-generator.ts
│   │   │   └── validators.ts     # Zod schemas
│   │   └── hooks/                # Custom React hooks
│   │       ├── useScan.ts        # Scanner logic
│   │       ├── useDebounce.ts
│   │       ├── useConfirm.ts
│   │       └── usePagination.ts
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── po.types.ts
│   │   ├── bundle.types.ts
│   │   ├── production.types.ts
│   │   ├── payroll.types.ts
│   │   ├── inventory.types.ts
│   │   ├── finance.types.ts
│   │   ├── master.types.ts
│   │   └── auth.types.ts
│   │
│   └── data/                     # Dummy data (fase awal, nanti diganti API)
│       ├── dummy-master.ts       # Kategori, model, size, warna, karyawan, klien
│       ├── dummy-po.ts           # PO + bundles
│       ├── dummy-production.ts   # Scan records
│       ├── dummy-inventory.ts    # Stok + transaksi
│       ├── dummy-journal.ts      # Jurnal entries
│       └── dummy-payroll.ts      # Gaji ledger + kasbon
│
├── next.config.ts
├── tsconfig.json
├── package.json
└── Docs/
    └── STITCHLYX_V2_PROJECT_CONTEXT.md
```

### Aturan File & Komponen

1. **Satu komponen = satu file** — maks ~150-200 baris per file
2. **Setiap folder komponen** punya: `NamaKomponen.tsx` + `NamaKomponen.module.css` + `index.ts`
3. **`index.ts`** hanya berisi re-export: `export { default } from './NamaKomponen'`
4. **`features/`** untuk komponen spesifik fitur (tidak dipakai di modul lain)
5. **`components/`** untuk komponen reusable (dipakai di banyak tempat)
6. **`stores/`** untuk state management — JANGAN simpan state di komponen kecuali state lokal UI (toggle, dropdown open, dll)
7. **`data/`** untuk dummy data — nanti akan diganti dengan API calls

---

## DESIGN SYSTEM (WAJIB KONSISTEN — JANGAN DIUBAH)

### Palet Warna

Disimpan sebagai CSS Variables di `globals.css`:

```css
:root {
  /* Refined Charcoal Theme */
  --color-bg: #111315;
  --color-sidebar: #16181A;
  --color-card: #1A1D1F;
  --color-card2: #1E2124;
  --color-border: #2A2D31;
  --color-border2: #33363A;
  
  /* Muted Copper Theme */
  --color-cyan: #d49b6a;
  --color-cyan-dim: #7a5130;
  
  /* Glassmorphism V2 */
  --glass-bg: rgba(26, 29, 31, 0.6);
  --glass-blur: blur(20px);
  --glass-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.7);

  --color-text: #e8eaed;
  --color-text-sub: #9aa0a6;
}
```

Juga diekspor sebagai object TypeScript di `lib/constants/theme.ts`:

```ts
export const C = {
  bg: '#111315',
  sidebar: '#16181A',
  card: '#1A1D1F',
  cyan: '#d49b6a',      // Muted Copper
  text: '#e8eaed',
  textSub: '#9aa0a6',
} as const;
```

### Tipografi

```
Instrument Sans : Seluruh Body & Label (Weight 300 - Light)
Syne            : Heading & Angka KPI (Weight 600 - Semi Bold)
Geist Mono      : Data Teknis (Weight 300)
```

Aturan Visual Khusus:
- **Liquid Glass Sidebar**: Indikator menu aktif menggunakan Framer Motion `layoutId`. Indikator meluncur secara dinamis ("cair") saat berpindah menu.
- **Glassmorphism V2**: Tombol & Panel menggunakan `backdrop-filter: blur(20px)` dengan pantulan cahaya (*glare*) pada sisi atas/kiri dan bayangan dalam (*inset shadow*) untuk kesan 3D kaca asli.

### Komponen Wajib

**MacDots — wajib di setiap Panel:**
```tsx
// Lokasi: src/components/atoms/MacDots/MacDots.tsx
export default function MacDots() {
  return (
    <div className={styles.container}>
      {['#ff5f57', '#ffbd2e', '#28ca41'].map(color => (
        <div key={color} className={styles.dot} style={{ background: color }} />
      ))}
    </div>
  );
}
```

**Panel — wrapper wajib untuk semua card:**
```tsx
// Lokasi: src/components/molecules/Panel/Panel.tsx
// Harus menggunakan MacDots di header
// Props: title, children, action?, onAction?, accent?
```

**Tabel — wajib pakai `<table>` HTML + overflow-x auto**
```tsx
// Lokasi: src/components/organisms/DataTable/DataTable.tsx
// Menggunakan <table> HTML, BUKAN CSS Grid untuk data tabular
// Wajib responsive dengan overflow-x: auto
```

### Status Warna

```css
/* Parsial */
--status-parsial-bg: #1a2600;
--status-parsial-text: #4ade80;

/* Belum Kirim */
--status-belum-bg: #1a1040;
--status-belum-text: #a78bfa;

/* Selesai */
--status-selesai-bg: #001a20;
--status-selesai-text: #22d3ee;
```

---

## ATURAN PRIVASI DATA (WAJIB)

Kolom/data **Margin** dan **HPP** TIDAK BOLEH tampil di:
- Dashboard → sub-tab Produksi (tabel PO)
- Halaman Produksi (semua scan station)
- Halaman Pengiriman

Margin & HPP HANYA boleh tampil di:
- Dashboard → sub-tab Keuangan
- Halaman Keuangan (semua sub-halaman)
- Master Data (Owner only)

---

## STRUKTUR NAVIGASI SIDEBAR (FINAL)

```ts
// Lokasi: src/lib/constants/navigation.ts

export const NAV = [
  {
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    color: 'blue',
    subs: ['Produksi', 'Keuangan', 'Penggajian'],
    basePath: '/dashboard',
  },
  {
    label: 'Produksi',
    icon: 'Factory',
    color: 'green',
    subs: ['Input PO', 'Cutting', 'Jahit', 'Lubang Kancing', 'Buang Benang', 'QC', 'Steam', 'Packing', 'Monitoring'],
    basePath: '/produksi',
  },
  {
    label: 'Pengiriman',
    icon: 'Truck',
    color: 'blue',
    subs: ['Buat Surat Jalan', 'Riwayat Kirim'],
    basePath: '/pengiriman',
  },
  {
    label: 'Penggajian',
    icon: 'Wallet',
    color: 'purple',
    subs: ['Rekap Gaji', 'Kasbon', 'Slip Gaji'],
    basePath: '/penggajian',
  },
  {
    label: 'Inventory',
    icon: 'Package',
    color: 'green',
    subs: ['Overview Stok', 'Transaksi Keluar', 'Alert Order'],
    basePath: '/inventory',
  },
  {
    label: 'Keuangan',
    icon: 'TrendingUp',
    color: 'green',
    subs: ['Ringkasan', 'Jurnal Umum', 'Laporan Per PO', 'Laporan Per Bulan', 'Laporan Gaji', 'Laporan Reject'],
    basePath: '/keuangan',
  },
  {
    label: 'Master Data',
    icon: 'Database',
    color: 'blue',
    subs: ['Master Detail', 'Produk & HPP', 'Karyawan', 'Klien', 'Jenis Reject', 'Kategori Transaksi', 'Satuan (UOM)', 'User & Role'],
    basePath: '/master-data',
  },
  {
    label: 'Koreksi Data',
    icon: 'ShieldCheck',
    color: 'yellow',
    subs: [],           // Tidak ada sub-menu
    basePath: '/koreksi-data',
  },
  {
    label: 'Audit Log',
    icon: 'ScrollText',
    color: 'cyan',
    subs: [],           // Tidak ada sub-menu
    basePath: '/audit-log',
  },
];
```

### Routing Map (Sidebar → URL → Page)

```
Sidebar                          URL Path                              Page Component
─────────────────────────────────────────────────────────────────────────────────────
Dashboard > Produksi            /dashboard/produksi                   DashProduksi
Dashboard > Keuangan            /dashboard/keuangan                   DashKeuangan
Dashboard > Penggajian          /dashboard/penggajian                 DashPenggajian

Produksi > Input PO             /produksi/input-po                    InputPO
Produksi > Cutting              /produksi/scan/cutting                ScanStation (tahap=cutting)
Produksi > Jahit                /produksi/scan/jahit                  ScanStation (tahap=jahit)
Produksi > Lubang Kancing       /produksi/scan/lubang-kancing         ScanStation (tahap=lubang-kancing)
Produksi > Buang Benang         /produksi/scan/buang-benang           ScanStation (tahap=buang-benang)
Produksi > QC                   /produksi/scan/qc                     ScanStation (tahap=qc)
Produksi > Steam                /produksi/scan/steam                  ScanStation (tahap=steam)
Produksi > Packing              /produksi/scan/packing                ScanStation (tahap=packing)
Produksi > Monitoring           /produksi/monitoring                  Monitoring

Pengiriman > Buat Surat Jalan   /pengiriman/buat-surat-jalan          BuatSuratJalan
Pengiriman > Riwayat Kirim      /pengiriman/riwayat                   RiwayatKirim

Penggajian > Rekap Gaji         /penggajian/rekap-gaji                RekapGaji
Penggajian > Kasbon             /penggajian/kasbon                    Kasbon
Penggajian > Slip Gaji          /penggajian/slip-gaji                 SlipGaji

Inventory > Overview Stok       /inventory/overview                   OverviewStok
Inventory > Transaksi Keluar    /inventory/transaksi-keluar           TransaksiKeluar
Inventory > Alert Order         /inventory/alert-order                AlertOrder

Keuangan > Ringkasan            /keuangan/ringkasan                   KeuRingkasan
Keuangan > Jurnal Umum          /keuangan/jurnal-umum                 JurnalUmum
Keuangan > Laporan Per PO       /keuangan/laporan-po                  LaporanPerPO
Keuangan > Laporan Per Bulan    /keuangan/laporan-bulan               LaporanPerBulan
Keuangan > Laporan Gaji         /keuangan/laporan-gaji                LaporanGaji
Keuangan > Laporan Reject       /keuangan/laporan-reject              LaporanReject

Master Data > Master Detail     /master-data/detail                   MasterDetail
Master Data > Produk & HPP      /master-data/produk-hpp               MasterProduk
Master Data > Karyawan          /master-data/karyawan                 MasterKaryawan
Master Data > Klien             /master-data/klien                    MasterKlien
Master Data > Jenis Reject      /master-data/jenis-reject             MasterJenisReject
Master Data > Kategori Trx      /master-data/kategori-transaksi       MasterKategoriTrx
Master Data > Satuan (UOM)      /master-data/satuan                   MasterSatuan
Master Data > User & Role       /master-data/user-role                MasterUserRole

Koreksi Data                    /koreksi-data                         KoreksiData
Audit Log                       /audit-log                            AuditLog
```

---

## FORMAT BARCODE (FINAL — JANGAN DIUBAH)

Format: `PO[nopo]-[mdl]-[wrn]-[sz]-[urutglobal]-BDL[nourut]-[DD-MM-YY]`

Contoh:
- `PO0001-Air-blck-s-0001-BDL01-01-03-25`
- `PO0001-Air-blck-s-0001-BDL02-01-03-25`
- `PO0001-Air-blck-m-0002-BDL01-01-03-25`
- `PO0002-Nec-blck-s-0004-BDL01-10-03-25`

Keterangan:
- `PO0001`  = nomor PO tanpa strip
- `Air`     = 3 huruf pertama nama model (kapital huruf pertama)
- `blck`    = 4 huruf pertama warna (lowercase)
- `s`       = size lowercase
- `0001`    = nomor urut global (tidak pernah terulang, terus naik di seluruh sistem)
- `BDL01`   = nomor urut bundle dalam artikel itu (dimulai dari 01)
- `01-03-25`= tanggal PO disimpan format DD-MM-YY

Aturan:
- Barcode di-generate **SEKALI** saat PO disimpan, tidak bisa diubah
- Nomor urut global bertambah per artikel (bukan per bundle)
- Satu artikel = satu nomor urut global, bundle-nya dibedakan oleh BDL01, BDL02, dst

---

## BUSINESS LOGIC PENTING

### Sistem Scan Produksi
- **Alur Kerja Cutting (Khusus)**: 
  - Input PO -> Masuk ke **Antrian Cutting**.
  - Admin/Mandor memilih artikel & klik "Cetak SPK & Mulai Potong" (Status Artikel: Started).
  - Scan di stasiun Cutting hanya bisa dilakukan jika status Artikel sudah "Started".
  - Jika belum started, scan diblokir: *"Data tidak ada di list cutting..."*
- **Input Bertahap (Cutting)**: Saat scan cutting selesai, muncul urutan modal: 
  1. Input Pemakaian Bahan (berlaku untuk 1 artikel/PO).
  2. Input Hasil Potong (Actual Yield).
- **Stasiun Lain**: Semua 7 tahap (Cutting s/d Packing) wajib input QTY aktual setelah scan.
- **Operator**: Cutting & Jahit wajib pilih nama karyawan → upah dicatat per karyawan.
- **Riwayat**: Semua aktivitas scan dicatat di `useScanStore` dan tampil di tabel riwayat di bawah area scan.

### Logika Sinkron Antar Tahap
```
Cutting   → hasil aktual dicatat
Jahit     → maks = hasil Cutting bundle itu
L.Kancing → maks = hasil Jahit bundle itu
Buang BB  → maks = hasil L.Kancing bundle itu
QC        → maks = hasil Buang BB bundle itu
Steam     → maks = hasil QC bundle itu
Packing   → maks = hasil Steam bundle itu
```

### Autocomplete Scan
- Ketik minimal 2 karakter → dropdown suggestion muncul
- Navigasi dengan ↑↓, pilih dengan Enter, tutup dengan Esc
- Scanner fisik tetap berjalan normal (langsung scan tanpa dropdown)

### Sistem Bundle & PO
- Admin input PO → pilih klien → input SKU klien → detail produk muncul otomatis
- Input QTY order + isi/bundle → jumlah bundle otomatis (Math.ceil)
- Simpan PO → barcode di-generate sekali untuk semua bundle
- 1 PO bisa banyak model, banyak SKU klien

### Koreksi Data — Validasi QTY Produksi (Owner Review)

**Tujuan:** Mencegah overpay dengan memvalidasi QTY di setiap tahap produksi.

**Alur QTY Lebih:**
```
Scan Selesai → QTY > Target → Owner auth (kode 030503) di lapangan
       ↓
  statusTahap.koreksiStatus = "pending"
  Bundle DIBLOKIR dari tahap berikutnya
       ↓
  Masuk Halaman Koreksi Data → Owner review
       ↓
  APPROVE → qtySelesai tetap (aktual), bundle UNBLOCK
  REJECT  → qtySelesai dikembalikan ke target, bundle UNBLOCK, cegah overpay
```

**Alur QTY Kurang:**
```
Scan Selesai → QTY < Target → wajib isi alasan
       ↓
  statusTahap.koreksiStatus = "approved" (otomatis)
  Bundle TIDAK diblokir
  Owner hanya bisa lihat + acknowledge (tidak ada tombol REJECT)
```

**Blocking Logic:**
- Sebelum scan tahap berikut, cek `statusTahap[tahapSebelumKey].koreksiStatus`
- Jika `"pending"` → scan ditolak: "Bundle menunggu review koreksi"

### Gaji Ledger
- **upah** = hanya dari entri tipe `"selesai"` (jumlah semua total)
- **potongan** = dari entri tipe `"reject_potong"` (jumlah semua `Math.abs(total)`)
- **rework** = dari entri tipe `"rework"` (jumlah semua total)
- **upahBersih** = upah - potongan + rework
- Kolom "Upah Bersih" di tabel = upahBersih (tanpa kasbon)
- Saat tombol BAYAR → muncul modal: upahBersih, input kasbon (default = kasbonSisa, bisa diubah)
- Yang dibayarkan = upahBersih - inputKasbon
- Setelah konfirmasi → l.lunas = true, l.kasbonSisa dikurangi
- Tampilan rekap, KPI atas, dan total footer: menampilkan angka **setelah potong kasbon** jika sudah lunas
- totalUpahPeriode di KPI = jumlah upahBersih semua karyawan (tanpa kasbon)

### Keuangan
- Jurnal "Pembelian Bahan Baku" → otomatis tambah stok inventory
- Inventory hanya punya transaksi KELUAR (untuk pemakaian produksi)
- Biaya tidak bisa dihitung per PO → dibagi rata ke semua PO aktif
- Pinjaman DIPISAH dari pengeluaran, tidak masuk kalkulasi margin
- Margin Estimasi = Harga Jual - HPP
- Margin Real = Harga Jual - Total Realisasi Biaya

### HPP
- Komponen **Upah** → flat untuk semua size dalam 1 model
- Komponen **Bahan & Aksesori** → berbeda per size
- Harga jual berbeda per size
- Input margin nominal → persentase otomatis dihitung
- Target poin per model (bukan per SKU) → untuk penilaian produktivitas

### Pengiriman
- Scan bundle → otomatis masuk surat jalan
- Satu surat jalan bisa lintas PO (klien yang sama)
- Surat jalan pakai SKU Klien
- Bundle yang di-scan → otomatis update kolom "Kirim" di Monitoring

### Dual SKU
- SKU Internal: LYX-0001-KOU (auto-generate)
- SKU Klien: kode dari klien (input manual)
- Dokumen ke klien pakai SKU Klien

### Inventory
- Stok bertambah OTOMATIS saat jurnal "Pembelian Bahan Baku" dicatat di Jurnal Umum
- Stok berkurang via Transaksi Keluar (pemakaian produksi)
- Alert Order muncul jika stok <= stok minimum

---

## ROLE & PERMISSION

```
Owner            : akses penuh semua halaman, lihat margin & HPP,
                   edit Master Data, approve koreksi, isi kasbon, input bonus
                   Kode override: 030503
Admin Produksi   : akses Produksi (scan), Dashboard Produksi, ajukan koreksi
                   TIDAK bisa lihat margin & HPP
Admin Keuangan   : Keuangan (input Jurnal Umum), Laporan (view), Dashboard Keuangan
Supervisor       : Dashboard (view), Penggajian (view + tombol approve), Keuangan (view)
Mandor (3 akun)  : hanya Scanner Station di Produksi
```

Sistem mendukung **dual role** — satu akun bisa punya lebih dari satu role.

---

## STATE MANAGEMENT (ZUSTAND)

### Prinsip
- **1 store per domain bisnis** — jangan campur data dari domain berbeda
- **Store di-consume langsung** oleh komponen yang butuh — TIDAK di-pass via props
- **State lokal UI** (toggle, dropdown open, form input sementara) tetap di komponen lokal dengan `useState`
- **Shared business state** HARUS di Zustand store

### Store Architecture

```ts
// src/stores/useBundleStore.ts
// Data: bundleDB (semua bundle + statusTahap)
// Actions: updateBundleStatus, getBundle, blockBundle, unblockBundle

// src/stores/useKoreksiStore.ts
// Data: koreksiQueue (antrian item pending)
// Actions: addToQueue, approve, reject, getByStatus

// src/stores/useInventoryStore.ts
// Data: inventory items, trxKeluar, trxMasuk
// Actions: addStock (dari jurnal), removeStock (transaksi keluar)

// src/stores/useJurnalStore.ts
// Data: jurnal entries
// Actions: addEntry, getByKategori, getByPeriode

// src/stores/usePayrollStore.ts
// Data: gajiLedger, kasbon
// Actions: calculateUpah, prosesBayar, addKasbon

// src/stores/usePOStore.ts
// Data: daftar PO, artikelPO
// Actions: createPO, generateBarcodes, getPOByKlien

// src/stores/useMasterStore.ts
// Data: kategori, model, size, warna, karyawan, klien, jenisReject, kategoriTrx, satuan
// Actions: CRUD per entity

// src/stores/useAuthStore.ts
// Data: currentUser, roles, isAuthenticated
// Actions: login, logout, hasPermission
```

### Data Flow Antar Store

```
usePOStore → useBundleStore
  (PO disimpan → bundles di-generate → masuk bundleDB)

useBundleStore → useKoreksiStore
  (QTY > target → masuk koreksi queue)

useKoreksiStore → useBundleStore
  (Approve/Reject → update statusTahap di bundleDB)

usePayrollStore → useJurnalStore
  (Tombol REKAP → tulis entri jurnal direct_upah)

useJurnalStore → useInventoryStore
  (Jurnal "Pembelian Bahan Baku" → auto tambah stok)

useBundleStore → usePayrollStore
  (Scan selesai + karyawan → catat upah ke ledger)
```

### BundleDB StatusTahap Structure

```ts
// src/types/bundle.types.ts

interface StatusTahap {
  status: null | 'terima' | 'selesai';
  qtyTerima: number;
  qtySelesai: number;
  waktuTerima: string | null;
  waktuSelesai: string | null;
  karyawan: string | null;        // Hanya untuk cutting & jahit
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

---

## FITUR AKUNTANSI BIAYA HPP REALISASI

> Status: Rancangan FINAL dari V1. Harus diimplementasi di V2.

### Tujuan
Menghitung biaya realisasi aktual per PO secara akurat:
- **Estimasi** → dari HPP di Master Produk (sudah ada)
- **Realisasi** → dari data aktual: pemakaian cutting + rekap gaji + jurnal overhead
- **Gap** → laporan boncos/profit per PO per bulan

---

### A. Kategori Transaksi — Field `jenis`

```ts
// Jenis yang tersedia:
type JenisTransaksi = 'direct_bahan' | 'direct_upah' | 'overhead' | 'masuk';

// Mapping kategori:
// KTR-001 Pembelian Bahan Baku   → jenis: "direct_bahan"
// KTR-002 Upah Karyawan          → jenis: "direct_upah"
// KTR-003 Operasional Listrik    → jenis: "overhead"
// KTR-004 Operasional Rumah      → jenis: "overhead"
// KTR-005 Penerimaan PO          → jenis: "masuk"
// KTR-006 Uang Makan             → jenis: "overhead"
// KTR-007 Pembelian Aksesori     → jenis: "direct_bahan"
// KTR-008 Pinjaman               → jenis: "masuk"
```

Field `jenis` wajib diisi saat tambah kategori baru di Master Data.
Field ini otomatis menentukan perilaku jurnal (tidak perlu pilih manual saat input).

---

### B. Cutting — Input Pemakaian Bahan

- Input pemakaian bahan dilakukan saat **scan bundle PERTAMA** dari suatu artikel di suatu PO
- Sistem deteksi: apakah artikel X di PO Y sudah punya data pemakaian?
  - Belum ada → **paksa muncul modal pemakaian** sebelum QTY bisa disimpan
  - Sudah ada → langsung lanjut input QTY seperti biasa
- Satu input berlaku untuk **semua bundle dari artikel yang sama dalam PO yang sama**
- Artikel yang sama di **PO berbeda** = input terpisah
- Jika modal pemakaian ditutup tanpa diisi → scan **ditolak**

```ts
// src/types/production.types.ts
interface PemakaianBahan {
  po: string;
  skuKlien: string;
  artikelNama: string;
  pemakaianKainMeter: number;   // meter per pcs
  pemakaianBeratGram: number;   // gram per pcs
  inputOleh: string;
  waktuInput: string;
}
```

---

### C. Penggajian — Tombol REKAP ke Jurnal Umum

Alur setelah tombol BAYAR dikonfirmasi:
1. Setelah berhasil → **Modal Ringkasan Periode** muncul
2. Klik **REKAP KE JURNAL UMUM** → otomatis tulis 1 entri ke jurnal:
   ```ts
   {
     kategori: 'KTR-002',
     namaKategori: 'Upah Karyawan',
     jenis: 'direct_upah',
     tipe: 'keluar',
     jumlah: 1850000,
     keterangan: 'Upah 01-07 Apr 2025',
     tagPO: null,
     detailUpah: [
       { karyawan: 'Budi Santoso', jumlah: 712000, po: 'PO-0001' },
       { karyawan: 'Ahmad Fauzi', jumlah: 398000, po: 'PO-0001' },
     ],
   }
   ```
3. Setelah REKAP → tombol berubah disabled: "✓ Sudah Direkap"
4. `direct_upah` HANYA boleh ditulis via tombol REKAP — BUKAN input manual

---

### D. Jurnal Umum — Field Tambahan

```ts
// src/types/finance.types.ts
interface JurnalEntry {
  id: string;
  kategori: string;
  namaKategori: string;
  jenis: JenisTransaksi;          // otomatis dari kategori
  tipe: 'masuk' | 'keluar';
  jumlah: number;
  keterangan: string;
  tanggal: string;
  waktu: string;
  noFaktur?: string;              // opsional, link banyak item dalam 1 faktur
  tagPO?: string[];               // untuk direct_bahan, bisa multi-PO
  detailUpah?: DetailUpah[];      // hanya untuk direct_upah
}
```

Aturan form input jurnal:
- Jika jenis = `direct_bahan`: tampil field No. Faktur + Tag PO (multi-select)
- Jika jenis = `direct_upah`: form TIDAK bisa dibuka manual — hanya via REKAP
- Jika jenis = `overhead`: tidak ada field tambahan

---

### E. Laporan — Kalkulasi Real

**Sumber data realisasi per PO:**

| Komponen | Sumber Data Aktual |
|---|---|
| **Biaya Bahan** | `pemakaianBahan` (meter/pcs × qty) × harga beli dari jurnal |
| **Biaya Upah** | `jurnal.detailUpah` per PO (dari REKAP Penggajian) |
| **Overhead** | Jurnal jenis=overhead ÷ total PCS terkirim × PCS PO per bulan |
| **HPP Estimasi** | Master Produk & HPP (per pcs per size) × qty order |
| **Gap** | Total Realisasi − HPP Estimasi |

Formula:
```
hargaPerMeter = totalNilaiBeliKain ÷ totalMeterDibeli
biayaBahanPO  = pemakaianMeter × hargaPerMeter × qtyPcs

alokasiOverhead = totalOverheadBulan ÷ totalPCSterkirimBulan × pcsKirimPO
```

---

## STATUS PHASE V2

```
PHASE 1 — Foundation ⏳ BELUM
  [ ] Setup Next.js 15 + TypeScript
  [ ] Design System (CSS Variables)
  [ ] Atomic Components (atoms, molecules, organisms)
  [ ] Sidebar Navigation + Routing
  [ ] Zustand Stores
  [ ] Dummy Data

PHASE 2 — Core Features ⏳ BELUM
  [ ] Auth (login, role, middleware) — dummy dulu
  [ ] Master Data (semua 8 sub-halaman)
  [ ] Input PO + Barcode Generation
  [ ] 7 Scan Stations + Logika Sinkron
  [ ] Monitoring
  [ ] Koreksi Data
  [ ] Pengiriman
  [ ] Penggajian + REKAP ke Jurnal
  [ ] Inventory
  [ ] Keuangan + Jurnal Umum
  [ ] Laporan (Per PO, Per Bulan, Gaji, Reject)
  [ ] Dashboard (Produksi, Keuangan, Penggajian)
  [ ] Audit Log

PHASE 3 — Database & Auth ⏳ BELUM
  [ ] Supabase setup
  [ ] Migrasi dummy → database
  [ ] Supabase Auth
  [ ] Row Level Security

PHASE 4 — Production Ready ⏳ BELUM
  [ ] PDF Export (Surat Jalan, Slip Gaji, Label Barcode)
  [ ] E2E Testing
  [ ] Performance Optimization
  [ ] Deployment ke VPS
```

---

## INSTRUKSI UNTUK AI (SESI BARU)

1. Baca dokumen ini **sepenuhnya** sebelum mulai
2. Semua pekerjaan di folder `d:\Project Konveksi.V.2\` — JANGAN sentuh folder V1
3. Jangan ubah design system (warna, font, MacDots, Panel)
4. Kolom Margin & HPP dilarang tampil di halaman Produksi dan Pengiriman
5. Semua tabel wajib pakai `<table>` HTML + `overflow-x: auto`
6. Semua panel wajib pakai komponen `Panel` dengan `MacDots`
7. **Satu komponen per file** — maks ~150-200 baris per file
8. Gunakan **CSS Modules** untuk styling — BUKAN inline styles, BUKAN Tailwind
9. Gunakan **Zustand** untuk shared state — BUKAN prop drilling
10. Gunakan **TypeScript** — semua file `.tsx` atau `.ts`
11. Masih fase **dummy data** — jangan buat koneksi database
12. Format barcode SUDAH FINAL — jangan diubah
13. Logika sinkron antar tahap produksi SUDAH FINAL — jangan diubah
14. Navigasi melalui **file-based routing Next.js** — sidebar hanya untuk navigasi URL
15. `direct_upah` di Jurnal Umum HANYA boleh ditulis via tombol REKAP dari Penggajian
16. Pemakaian bahan WAJIB diinput saat scan bundle pertama di Cutting
17. Satu pembelian bahan = satu entri per jenis bahan — gunakan No. Faktur untuk link
18. Konfirmasi perubahan ke user sebelum coding jika ada yang tidak jelas
19. Selalu ingatkan user tentang status phase di akhir sesi
20. **Jika file terlalu besar** (>200 baris), pecah menjadi sub-komponen

### Cara Menambah Fitur Baru (untuk AI)

1. Tentukan fitur masuk `components/` (reusable) atau `features/` (spesifik)
2. Buat file komponen baru di folder yang sesuai (lihat arsitektur folder di atas)
3. Buat CSS Module jika perlu: `NamaKomponen.module.css`
4. Buat `index.ts` untuk re-export
5. Jika butuh shared state → tambah action/data di Zustand store yang relevan
6. Jika butuh dummy data → tambah di `src/data/`
7. Jika butuh route baru → buat folder + `page.tsx` di `src/app/`
8. Import komponen di page.tsx yang membutuhkan
9. Test di browser: navigasi + tampilan + interaksi
