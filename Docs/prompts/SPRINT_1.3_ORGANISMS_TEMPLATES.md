# PROMPT — Sprint 1.3: Organisms + Templates + Sidebar

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1.1 (setup) dan 1.2 (atoms + molecules) sudah selesai.
Semua atoms dan molecules sudah ada di `src/components/atoms/` dan `src/components/molecules/`.

Kamu akan membangun **organisms** (gabungan molecules yang membentuk section utuh) dan **templates** (layout halaman).

## Aturan Wajib

1. Setiap komponen = **1 folder** berisi: `NamaKomponen.tsx` + `NamaKomponen.module.css` + `index.ts`
2. **Gunakan komponen atoms dan molecules yang sudah ada** — JANGAN buat ulang
3. Import path contoh: `import Button from '@/components/atoms/Button'`
4. Styling menggunakan CSS Modules + CSS Variables
5. Maks **200 baris** per file `.tsx`. Jika lebih, pecah menjadi sub-komponen dalam folder yang sama
6. **TIDAK** menggunakan Tailwind CSS atau inline styles

## Organisms — `src/components/organisms/`

### 1. DataTable (`src/components/organisms/DataTable/`)

Ini adalah komponen tabel **generik** yang dipakai di SELURUH aplikasi. Harus fleksibel.

Pecah menjadi beberapa sub-file:

**DataTable.tsx** (komponen utama):
```ts
interface Column<T> {
  key: string;
  header: string;
  width?: string;                // "120px" atau "20%"
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;  // Custom cell renderer
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;              // Field unik untuk React key
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  striped?: boolean;             // Alternating row colors (default true)
  compact?: boolean;             // Padding lebih kecil
  maxHeight?: string;            // Untuk scroll vertikal
  stickyHeader?: boolean;
}
```

**DataTableHeader.tsx:**
- Render `<thead>` dengan styling:
  - Background: var(--color-border) dengan opacity 0.3
  - Font: body, size 9px, weight 700, uppercase, letter-spacing 0.07em, color text-sub
  - Padding: 9px 14px
  - No wrap
- Sortable columns: tampilkan arrow icon, clickable

**DataTableRow.tsx:**
- Render `<tr>` dengan styling:
  - Border bottom: 1px solid var(--color-border)
  - Even rows: var(--color-card), Odd rows: var(--color-card2)
  - Hover: sedikit lebih terang
  - Padding cells: 12px 14px
  - Font default: body 12px, untuk angka: mono 12px
- Jika ada `render` function di column, gunakan itu. Jika tidak, tampilkan value langsung.

**DataTableFooter.tsx** (opsional):
```ts
interface DataTableFooterProps {
  children: React.ReactNode;    // Custom footer content (total row, dll)
}
```

**Penting:**
- Wajib dibungkus `<div>` dengan `overflow-x: auto`
- Wajib pakai `<table>` HTML standar (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`)
- BUKAN CSS Grid — sesuai aturan PRD

### 2. KpiRow (`src/components/organisms/KpiRow/`)
```ts
interface KpiRowProps {
  children: React.ReactNode;    // KpiCard components
  columns?: 2 | 3 | 4 | 5;     // default 4
}
```
- Responsive grid layout
- Desktop: sesuai columns prop
- Tablet: 2 kolom
- Mobile: 1 kolom
- Gap: 12px

### 3. FilterBar (`src/components/organisms/FilterBar/`)
```ts
interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;   // Slot untuk Select filters, date pickers, dll
}
```
- SearchBar di kiri, children (filters) di kanan
- Responsive: stack di mobile
- Margin bottom: 16px

### 4. FormPanel (`src/components/organisms/FormPanel/`)
```ts
interface FormPanelProps {
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  loading?: boolean;
  footer?: React.ReactNode;     // Custom footer (selain tombol submit)
}
```
- Gunakan komponen `Panel` sebagai wrapper
- Children = FormField components
- Footer: tombol submit + optional custom content
- Padding body: 20px

### 5. Modal (`src/components/organisms/Modal/`)

Pecah menjadi sub-files:

**Modal.tsx** (komponen utama):
```ts
interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  closeOnBackdrop?: boolean;     // default true
  closeOnEsc?: boolean;          // default true
}
```
- Backdrop: background rgba(0,0,0,0.7), backdrop-filter blur(2px)
- Card centered: bg var(--color-card), border, border-radius 16px
- Size: sm=400px, md=540px, lg=720px, xl=900px max-width
- Animasi open: fade in + translateY(-10px → 0)
- Animasi close: fade out
- Z-index: 1000
- `Esc` key listener untuk close
- Click backdrop untuk close (jika closeOnBackdrop)

**ModalHeader.tsx:**
```ts
interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
}
```
- Title + close button (X) di kanan
- Border bottom
- Padding: 16px 20px

**ModalBody.tsx:**
- Scrollable content area
- Padding: 20px
- Max height: 70vh, overflow-y auto

**ModalFooter.tsx:**
```ts
interface ModalFooterProps {
  children: React.ReactNode;    // Tombol-tombol aksi
}
```
- Flex row, justify end, gap 8px
- Border top
- Padding: 14px 20px

### 6. Sidebar (`src/components/organisms/Sidebar/`)

**INI ADALAH KOMPONEN KUNCI** — sidebar navigasi utama aplikasi.

Pecah menjadi sub-files:

**Sidebar.tsx** (komponen utama):
```ts
interface SidebarProps {
  currentPath: string;           // URL path aktif (dari usePathname)
}
```
- Render daftar nav dari `NAV` constant (import dari `@/lib/constants/navigation`)
- Background: var(--color-sidebar) atau rgba(6, 13, 31, 0.7)
- Width: 260px (expanded), 70px (collapsed)
- Height: 100vh, fixed position
- Overflow-y: auto
- Logo area di atas: "STITCHLYX" text, font heading, size 13px, letter-spacing 0.1em
- Collapse toggle button di bawah logo

**SidebarItem.tsx:**
```ts
interface SidebarItemProps {
  label: string;
  icon: string;                  // Nama icon dari lucide-react
  color: string;                 // Dari NAV constant
  basePath: string;
  subs: string[];
  isActive: boolean;
  isExpanded: boolean;           // Apakah sub-menu terbuka
  onToggle: () => void;
  collapsed: boolean;            // Sidebar collapsed mode
}
```
- Icon (dari lucide-react) + label
- Jika punya subs: tampilkan chevron, click untuk expand/collapse sub-menu
- Jika tidak punya subs (Koreksi Data, Audit Log): langsung navigasi
- Active state: background highlight, accent color sesuai item
- Hover: subtle background change
- Font: body, size 12px, weight 500
- Padding: 10px 16px
- Transition: background 0.15s ease

**SidebarSubItem.tsx:**
```ts
interface SidebarSubItemProps {
  label: string;
  href: string;                  // URL path
  isActive: boolean;
  color: string;
}
```
- Indented dari parent (padding-left lebih besar)
- Active: text warna accent, dot indicator di kiri
- Font: body, size 11px
- Padding: 8px 16px 8px 44px

**URL Mapping Logic:**
Gunakan mapping berikut untuk convert sub-label ke URL path:

```ts
function getSubPath(basePath: string, subLabel: string): string {
  const mapping: Record<string, Record<string, string>> = {
    '/dashboard': {
      'Produksi': '/dashboard/produksi',
      'Keuangan': '/dashboard/keuangan',
      'Penggajian': '/dashboard/penggajian',
    },
    '/produksi': {
      'Input PO': '/produksi/input-po',
      'Cutting': '/produksi/scan/cutting',
      'Jahit': '/produksi/scan/jahit',
      'Lubang Kancing': '/produksi/scan/lubang-kancing',
      'Buang Benang': '/produksi/scan/buang-benang',
      'QC': '/produksi/scan/qc',
      'Steam': '/produksi/scan/steam',
      'Packing': '/produksi/scan/packing',
      'Monitoring': '/produksi/monitoring',
    },
    '/pengiriman': {
      'Buat Surat Jalan': '/pengiriman/buat-surat-jalan',
      'Riwayat Kirim': '/pengiriman/riwayat',
    },
    '/penggajian': {
      'Rekap Gaji': '/penggajian/rekap-gaji',
      'Kasbon': '/penggajian/kasbon',
      'Slip Gaji': '/penggajian/slip-gaji',
    },
    '/inventory': {
      'Overview Stok': '/inventory/overview',
      'Transaksi Keluar': '/inventory/transaksi-keluar',
      'Alert Order': '/inventory/alert-order',
    },
    '/keuangan': {
      'Ringkasan': '/keuangan/ringkasan',
      'Jurnal Umum': '/keuangan/jurnal-umum',
      'Laporan Per PO': '/keuangan/laporan-po',
      'Laporan Per Bulan': '/keuangan/laporan-bulan',
      'Laporan Gaji': '/keuangan/laporan-gaji',
      'Laporan Reject': '/keuangan/laporan-reject',
    },
    '/master-data': {
      'Master Detail': '/master-data/detail',
      'Produk & HPP': '/master-data/produk-hpp',
      'Karyawan': '/master-data/karyawan',
      'Klien': '/master-data/klien',
      'Jenis Reject': '/master-data/jenis-reject',
      'Kategori Transaksi': '/master-data/kategori-transaksi',
      'Satuan (UOM)': '/master-data/satuan',
      'User & Role': '/master-data/user-role',
    },
  };
  return mapping[basePath]?.[subLabel] || basePath;
}
```

Taruh mapping ini di `src/lib/constants/navigation.ts` agar bisa dipakai di tempat lain juga.

**Navigasi:** Gunakan `next/link` dan `usePathname()` dari `next/navigation`.

---

## Templates — `src/components/templates/`

### 7. DashboardLayout (`src/components/templates/DashboardLayout/`)
```ts
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```
- Flex row: Sidebar di kiri (fixed), content di kanan (scrollable)
- Content area: padding 24px, margin-left sesuai sidebar width
- Responsive: sidebar collapse otomatis di layar < 1024px
- Content area: max-width 1400px (optional, agar tidak terlalu lebar di monitor besar)

### 8. PageWrapper (`src/components/templates/PageWrapper/`)
```ts
interface PageWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  kpiRow?: React.ReactNode;      // Slot untuk KpiRow
  filterBar?: React.ReactNode;   // Slot untuk FilterBar
  action?: React.ReactNode;      // Tombol aksi di kanan judul
}
```
- Header: title (Heading h2) + action button
- Optional: KpiRow di bawah header
- Optional: FilterBar di bawah KPI
- Children: content utama

---

## Integrasi: Dashboard Layout

Setelah semua komponen selesai, update file `src/app/(dashboard)/layout.tsx`:

```tsx
// src/app/(dashboard)/layout.tsx
'use client';

import DashboardLayout from '@/components/templates/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
```

## Verifikasi

Setelah selesai, pastikan:
1. `npm run dev` — berjalan tanpa error
2. Sidebar muncul di sebelah kiri, bisa diklik expand/collapse menu
3. Klik sub-menu → URL berubah (walaupun halaman belum ada, URL harus benar)
4. Active state sidebar berubah sesuai URL
5. Semua organisms berfungsi:
   - DataTable bisa render data array
   - Modal bisa open/close dengan animasi
   - FilterBar + SearchBar terintegrasi
6. Layout responsive: sidebar collapse di layar kecil
7. Update halaman test di `src/app/page.tsx` untuk demo DataTable dan Modal
8. Tidak ada file lebih dari 200 baris

## JANGAN Lakukan

- ❌ Jangan buat halaman fitur (produksi, keuangan, dll — itu Sprint 1.4)
- ❌ Jangan buat Zustand stores (itu Sprint 1.4)
- ❌ Jangan buat dummy data (itu Sprint 1.4)
- ❌ Jangan ubah atoms/molecules yang sudah ada (kecuali ada bug)
