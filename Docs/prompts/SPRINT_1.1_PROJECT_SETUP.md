# PROMPT — Sprint 1.1: Project Setup + Design System

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Kamu sedang membangun ulang aplikasi Stitchlyx.Syncore V2 — sebuah Garment Operating System.
Ini adalah **Sprint 1.1** dari total 8 sprint.

## Tugas

### 1. Inisialisasi Proyek Next.js 15

Buat proyek Next.js 15 di folder ini (`d:\Project Konveksi.V.2\`) dengan konfigurasi:
- Next.js 15 dengan **App Router** (BUKAN Pages Router)
- **TypeScript** — semua file `.tsx` / `.ts`
- **TANPA Tailwind CSS** — kita pakai CSS Modules
- **TANPA `src/` prefix** — SALAH. Gunakan `src/` folder. Struktur: `src/app/`, `src/components/`, dll
- ESLint default

Jalankan perintah init yang sesuai. Pastikan folder `Docs/` yang sudah ada TIDAK terhapus.

### 2. Install Dependencies

```bash
npm install zustand lucide-react react-hook-form @hookform/resolvers zod
```

Hanya itu dulu. Jangan install dependencies lain.

### 3. Setup Fonts

Buat file `src/app/layout.tsx` dengan Google Fonts menggunakan `next/font/google`:
- **Syne** (weight 700, 800) — untuk heading
- **Instrument Sans** (weight 400, 500, 600, 700) — untuk body
- **Geist Mono** (weight 400, 500, 600) — untuk angka/data

Pastikan font di-apply via CSS Variables:
```css
--font-heading: var(--font-syne);
--font-body: var(--font-instrument-sans);
--font-mono: var(--font-geist-mono);
```

### 4. Design System — `src/app/globals.css`

Buat file globals.css lengkap dengan **semua** CSS Variables berikut:

**Warna:**
```css
:root {
  --color-bg: #020617;
  --color-sidebar: #060d1f;
  --color-card: #0a1628;
  --color-card2: #0d1b2e;
  --color-border: #0e2040;
  --color-border2: #132545;
  --color-cyan: #22d3ee;
  --color-cyan-dim: #0c4a58;
  --color-cyan-bg: #061520;
  --color-green: #4ade80;
  --color-yellow: #facc15;
  --color-red: #f87171;
  --color-purple: #a78bfa;
  --color-blue: #60a5fa;
  --color-orange: #fb923c;
  --color-text: #e2e8f0;
  --color-text-sub: #64748b;
  --color-text-mid: #334155;
}
```

**Status:**
```css
:root {
  --status-parsial-bg: #1a2600;
  --status-parsial-text: #4ade80;
  --status-belum-bg: #1a1040;
  --status-belum-text: #a78bfa;
  --status-selesai-bg: #001a20;
  --status-selesai-text: #22d3ee;
}
```

**Spacing, border-radius, transitions** — tambahkan juga variabel utility standar.

**Base styles:**
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  user-select: none;             /* Seluruh app tidak bisa di-select */
  -webkit-user-select: none;
  cursor: default;               /* Cursor default di mana-mana */
}

/* HANYA elemen input yang boleh punya cursor text dan seleksi */
input, textarea, [contenteditable="true"] {
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
}

/* Tombol dan link tetap pointer */
button, a, [role="button"], summary {
  cursor: pointer;
}
```

> **PENTING:** Ini membuat aplikasi terasa seperti **native app**, bukan website.
> Teks tidak bisa di-select/di-copy kecuali di dalam input field.
> Cursor hanya berubah jadi text cursor di tempat yang memang untuk mengetik.

### 5. Theme Constants — `src/lib/constants/theme.ts`

Buat object `C` yang mirror CSS Variables sebagai TypeScript constant:
```ts
export const C = {
  bg: '#020617',
  sidebar: '#060d1f',
  card: '#0a1628',
  card2: '#0d1b2e',
  border: '#0e2040',
  border2: '#132545',
  cyan: '#22d3ee',
  cyanDim: '#0c4a58',
  cyanBg: '#061520',
  green: '#4ade80',
  yellow: '#facc15',
  red: '#f87171',
  purple: '#a78bfa',
  blue: '#60a5fa',
  orange: '#fb923c',
  text: '#e2e8f0',
  textSub: '#64748b',
  textMid: '#334155',
} as const;
```

### 6. Navigation Constants — `src/lib/constants/navigation.ts`

Buat array `NAV` persis seperti yang ada di PRD V2 (seksi "STRUKTUR NAVIGASI SIDEBAR").
Pastikan setiap item punya: `label`, `icon`, `color`, `subs`, `basePath`.

### 7. Production Constants — `src/lib/constants/production.ts`

```ts
export const TAHAP_PRODUKSI = [
  { key: 'cutting', label: 'Cutting', slug: 'cutting', requireKaryawan: true },
  { key: 'jahit', label: 'Jahit', slug: 'jahit', requireKaryawan: true },
  { key: 'lkancing', label: 'Lubang Kancing', slug: 'lubang-kancing', requireKaryawan: false },
  { key: 'bbenang', label: 'Buang Benang', slug: 'buang-benang', requireKaryawan: false },
  { key: 'qc', label: 'QC', slug: 'qc', requireKaryawan: false },
  { key: 'steam', label: 'Steam', slug: 'steam', requireKaryawan: false },
  { key: 'packing', label: 'Packing', slug: 'packing', requireKaryawan: false },
] as const;

export const OWNER_AUTH_CODE = '030503';
```

### 8. Roles Constants — `src/lib/constants/roles.ts`

```ts
export const ROLES = {
  OWNER: 'owner',
  ADMIN_PRODUKSI: 'admin_produksi',
  ADMIN_KEUANGAN: 'admin_keuangan',
  SUPERVISOR: 'supervisor',
  MANDOR: 'mandor',
} as const;
```

Tambahkan permission mapping sesuai PRD V2 seksi "ROLE & PERMISSION".

### 9. Type Definitions — `src/types/`

Buat file-file type definition berikut (lihat PRD V2 untuk detail struktur):

- `src/types/master.types.ts` — Kategori, Model, Size, Warna, Karyawan, Klien, JenisReject, KategoriTrx, Satuan
- `src/types/po.types.ts` — PurchaseOrder, POItem, Artikel
- `src/types/bundle.types.ts` — Bundle, StatusTahap (copy persis dari PRD V2)
- `src/types/production.types.ts` — ScanRecord, PemakaianBahan
- `src/types/payroll.types.ts` — GajiLedgerEntry, KasbonEntry
- `src/types/inventory.types.ts` — InventoryItem, TransaksiKeluar, TransaksiMasuk
- `src/types/finance.types.ts` — JurnalEntry, DetailUpah, JenisTransaksi
- `src/types/auth.types.ts` — User, Role, Session
- `src/types/index.ts` — re-export semua

## Verifikasi

Setelah selesai, pastikan:
1. `npm run dev` — berjalan tanpa error
2. Buka `http://localhost:3000` — halaman muncul dengan background gelap (#020617)
3. Font Syne, Instrument Sans, dan Geist Mono ter-load
4. Semua file TypeScript compile tanpa error
5. Tidak ada file yang lebih dari 200 baris

## JANGAN Lakukan

- ❌ Jangan buat komponen UI apapun (itu Sprint 1.2)
- ❌ Jangan buat halaman routing (itu Sprint 1.4)
- ❌ Jangan buat Zustand stores (itu Sprint 1.4)
- ❌ Jangan install Tailwind CSS
- ❌ Jangan buat koneksi database
