# PROMPT — Sprint 1.4: Routing + Zustand Stores + Dummy Data

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1.1 (setup), 1.2 (atoms + molecules), dan 1.3 (organisms + templates + sidebar) sudah selesai.
Sidebar navigasi sudah berfungsi dengan URL routing.

Kamu akan:
1. Membuat **semua halaman** (masih kosong/placeholder) agar routing lengkap
2. Membuat **Zustand stores** untuk state management
3. Membuat **dummy data** untuk testing

## Aturan Wajib

1. Setiap halaman = file `page.tsx` di folder yang sesuai (lihat PRD V2)
2. Halaman placeholder cukup menampilkan **PageWrapper** dengan title yang benar
3. Zustand stores: 1 store per domain bisnis, file terpisah
4. Dummy data: realistis, menggunakan types yang sudah didefinisikan
5. Maks 200 baris per file

---

## BAGIAN 1: Semua Halaman (Placeholder)

Buat file `page.tsx` untuk SEMUA route berikut. Setiap halaman cukup render:

```tsx
// Contoh: src/app/(dashboard)/produksi/input-po/page.tsx
'use client';

import PageWrapper from '@/components/templates/PageWrapper';

export default function InputPOPage() {
  return (
    <PageWrapper title="Input PO" subtitle="Buat Purchase Order baru">
      <p style={{ color: 'var(--color-text-sub)', fontSize: 13 }}>
        Halaman Input PO — akan dibangun di Sprint 2
      </p>
    </PageWrapper>
  );
}
```

### Daftar Lengkap Halaman (33 halaman total):

**Dashboard (3):**
- `src/app/(dashboard)/dashboard/produksi/page.tsx` — title: "Dashboard Produksi"
- `src/app/(dashboard)/dashboard/keuangan/page.tsx` — title: "Dashboard Keuangan"
- `src/app/(dashboard)/dashboard/penggajian/page.tsx` — title: "Dashboard Penggajian"

**Produksi (3 + 1 dynamic):**
- `src/app/(dashboard)/produksi/input-po/page.tsx` — title: "Input PO"
- `src/app/(dashboard)/produksi/scan/[tahap]/page.tsx` — title: dinamis dari param (Cutting, Jahit, dll)
- `src/app/(dashboard)/produksi/monitoring/page.tsx` — title: "Monitoring Produksi"

Untuk halaman scan dynamic, buat seperti ini:
```tsx
// src/app/(dashboard)/produksi/scan/[tahap]/page.tsx
'use client';

import { use } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import { TAHAP_PRODUKSI } from '@/lib/constants/production';

export default function ScanPage({ params }: { params: Promise<{ tahap: string }> }) {
  const { tahap } = use(params);
  const tahapInfo = TAHAP_PRODUKSI.find(t => t.slug === tahap);
  const title = tahapInfo ? `Scan ${tahapInfo.label}` : 'Scan Station';

  return (
    <PageWrapper title={title} subtitle={`Station ${tahapInfo?.label || tahap}`}>
      <p style={{ color: 'var(--color-text-sub)', fontSize: 13 }}>
        Scan Station — akan dibangun di Sprint 3
      </p>
    </PageWrapper>
  );
}
```

**Pengiriman (2):**
- `src/app/(dashboard)/pengiriman/buat-surat-jalan/page.tsx` — title: "Buat Surat Jalan"
- `src/app/(dashboard)/pengiriman/riwayat/page.tsx` — title: "Riwayat Kirim"

**Penggajian (3):**
- `src/app/(dashboard)/penggajian/rekap-gaji/page.tsx` — title: "Rekap Gaji"
- `src/app/(dashboard)/penggajian/kasbon/page.tsx` — title: "Kasbon"
- `src/app/(dashboard)/penggajian/slip-gaji/page.tsx` — title: "Slip Gaji"

**Inventory (3):**
- `src/app/(dashboard)/inventory/overview/page.tsx` — title: "Overview Stok"
- `src/app/(dashboard)/inventory/transaksi-keluar/page.tsx` — title: "Transaksi Keluar"
- `src/app/(dashboard)/inventory/alert-order/page.tsx` — title: "Alert Order"

**Keuangan (6):**
- `src/app/(dashboard)/keuangan/ringkasan/page.tsx` — title: "Ringkasan Keuangan"
- `src/app/(dashboard)/keuangan/jurnal-umum/page.tsx` — title: "Jurnal Umum"
- `src/app/(dashboard)/keuangan/laporan-po/page.tsx` — title: "Laporan Per PO"
- `src/app/(dashboard)/keuangan/laporan-bulan/page.tsx` — title: "Laporan Per Bulan"
- `src/app/(dashboard)/keuangan/laporan-gaji/page.tsx` — title: "Laporan Gaji"
- `src/app/(dashboard)/keuangan/laporan-reject/page.tsx` — title: "Laporan Reject"

**Master Data (8):**
- `src/app/(dashboard)/master-data/detail/page.tsx` — title: "Master Detail"
- `src/app/(dashboard)/master-data/produk-hpp/page.tsx` — title: "Produk & HPP"
- `src/app/(dashboard)/master-data/karyawan/page.tsx` — title: "Karyawan"
- `src/app/(dashboard)/master-data/klien/page.tsx` — title: "Klien"
- `src/app/(dashboard)/master-data/jenis-reject/page.tsx` — title: "Jenis Reject"
- `src/app/(dashboard)/master-data/kategori-transaksi/page.tsx` — title: "Kategori Transaksi"
- `src/app/(dashboard)/master-data/satuan/page.tsx` — title: "Satuan (UOM)"
- `src/app/(dashboard)/master-data/user-role/page.tsx` — title: "User & Role"

**Standalone (2):**
- `src/app/(dashboard)/koreksi-data/page.tsx` — title: "Koreksi Data"
- `src/app/(dashboard)/audit-log/page.tsx` — title: "Audit Log"

**Root redirects:**
- `src/app/page.tsx` — redirect ke `/dashboard/produksi`
- `src/app/(dashboard)/dashboard/page.tsx` — redirect ke `/dashboard/produksi`
- `src/app/(dashboard)/produksi/page.tsx` — redirect ke `/produksi/input-po`

Gunakan `redirect()` dari `next/navigation` untuk redirects.

---

## BAGIAN 2: Zustand Stores

Buat semua stores di `src/stores/`. Setiap store menggunakan pattern:

```ts
import { create } from 'zustand';
import type { NamaType } from '@/types';

interface NamaState {
  // Data
  items: NamaType[];
  
  // Actions
  add: (item: NamaType) => void;
  update: (id: string, data: Partial<NamaType>) => void;
  remove: (id: string) => void;
  getById: (id: string) => NamaType | undefined;
}

export const useNamaStore = create<NamaState>((set, get) => ({
  items: [],
  
  add: (item) => set((state) => ({ items: [...state.items, item] })),
  update: (id, data) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, ...data } : i),
  })),
  remove: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id),
  })),
  getById: (id) => get().items.find(i => i.id === id),
}));
```

### Store 1: `src/stores/useAuthStore.ts`
```ts
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}
```
- Untuk fase dummy: login selalu berhasil, default user = Owner
- `hasRole` dan `hasPermission` cek berdasarkan role mapping di PRD

### Store 2: `src/stores/useMasterStore.ts`
```ts
interface MasterState {
  // Data
  kategori: Kategori[];
  model: Model[];
  sizes: Size[];
  warna: Warna[];
  karyawan: Karyawan[];
  klien: Klien[];
  jenisReject: JenisReject[];
  kategoriTrx: KategoriTrx[];
  satuan: Satuan[];
  
  // Actions per entity
  addKategori: (item: Kategori) => void;
  updateKategori: (id: string, data: Partial<Kategori>) => void;
  removeKategori: (id: string) => void;
  // ... dst untuk setiap entity
}
```
- Initialize dengan dummy data (import dari `src/data/`)

### Store 3: `src/stores/usePOStore.ts`
```ts
interface POState {
  purchaseOrders: PurchaseOrder[];
  globalSequence: number;        // Nomor urut global barcode (tidak pernah reset)
  
  createPO: (po: PurchaseOrder) => void;
  getPOByKlien: (klienId: string) => PurchaseOrder[];
  getNextGlobalSequence: () => number;
}
```

### Store 4: `src/stores/useBundleStore.ts`
```ts
interface BundleState {
  bundles: Bundle[];
  
  addBundles: (newBundles: Bundle[]) => void;
  getBundle: (barcode: string) => Bundle | undefined;
  updateBundleStatus: (barcode: string, tahap: string, data: Partial<StatusTahap>) => void;
  getBundlesByPO: (po: string) => Bundle[];
  isBundleBlocked: (barcode: string, tahap: string) => boolean;
}
```

### Store 5: `src/stores/useKoreksiStore.ts`
```ts
interface KoreksiItem {
  id: string;
  barcode: string;
  tahap: string;
  qtyTarget: number;
  qtyAktual: number;
  tipe: 'lebih' | 'kurang';
  alasan: string;
  status: 'pending' | 'approved' | 'rejected';
  diajukanOleh: string;
  waktuAjukan: string;
  diReviewOleh?: string;
  waktuReview?: string;
}

interface KoreksiState {
  queue: KoreksiItem[];
  
  addToQueue: (item: KoreksiItem) => void;
  approve: (id: string, reviewer: string) => void;
  reject: (id: string, reviewer: string) => void;
  getByStatus: (status: string) => KoreksiItem[];
  getPendingCount: () => number;
}
```

### Store 6: `src/stores/useInventoryStore.ts`
```ts
interface InventoryState {
  items: InventoryItem[];
  trxKeluar: TransaksiKeluar[];
  trxMasuk: TransaksiMasuk[];
  
  addItem: (item: InventoryItem) => void;
  updateStock: (id: string, qty: number) => void;  // tambah/kurang
  addTrxKeluar: (trx: TransaksiKeluar) => void;
  addTrxMasuk: (trx: TransaksiMasuk) => void;       // dari jurnal pembelian
  getAlertItems: () => InventoryItem[];              // stok <= minimum
}
```

### Store 7: `src/stores/useJurnalStore.ts`
```ts
interface JurnalState {
  entries: JurnalEntry[];
  
  addEntry: (entry: JurnalEntry) => void;
  getByPeriode: (startDate: string, endDate: string) => JurnalEntry[];
  getByJenis: (jenis: JenisTransaksi) => JurnalEntry[];
  getTotalByTipe: (tipe: 'masuk' | 'keluar') => number;
}
```

### Store 8: `src/stores/usePayrollStore.ts`
```ts
interface PayrollState {
  ledger: GajiLedgerEntry[];
  kasbon: KasbonEntry[];
  
  addLedgerEntry: (entry: GajiLedgerEntry) => void;
  calculateUpah: (karyawanId: string, periode: string) => {
    upah: number;
    potongan: number;
    rework: number;
    upahBersih: number;
  };
  prosesBayar: (karyawanId: string, periode: string, inputKasbon: number) => void;
  addKasbon: (kasbon: KasbonEntry) => void;
}
```

---

## BAGIAN 3: Dummy Data

Buat dummy data yang **realistis** di `src/data/`. Data harus sesuai TypeScript types yang sudah didefinisikan.

### `src/data/dummy-master.ts`

```ts
// Kategori produk
export const dummyKategori = [
  { id: 'KAT-001', nama: 'Kaos', kode: 'KOU' },
  { id: 'KAT-002', nama: 'Kemeja', kode: 'KMJ' },
  { id: 'KAT-003', nama: 'Jaket', kode: 'JKT' },
];

// Model
export const dummyModel = [
  { id: 'MDL-001', nama: 'Airflow', kategoriId: 'KAT-001', targetPoin: 8 },
  { id: 'MDL-002', nama: 'Nectar', kategoriId: 'KAT-001', targetPoin: 10 },
  { id: 'MDL-003', nama: 'Breeze', kategoriId: 'KAT-002', targetPoin: 12 },
];

// Size
export const dummySize = [
  { id: 'SZ-001', nama: 'S' },
  { id: 'SZ-002', nama: 'M' },
  { id: 'SZ-003', nama: 'L' },
  { id: 'SZ-004', nama: 'XL' },
  { id: 'SZ-005', nama: 'XXL' },
];

// Warna
export const dummyWarna = [
  { id: 'WRN-001', nama: 'Black', kode: 'blck' },
  { id: 'WRN-002', nama: 'White', kode: 'whte' },
  { id: 'WRN-003', nama: 'Navy', kode: 'navy' },
  { id: 'WRN-004', nama: 'Maroon', kode: 'mron' },
];

// Karyawan (minimal 8 orang)
export const dummyKaryawan = [
  { id: 'KRY-001', nama: 'Ahmad Fauzi', posisi: 'Cutting', tipeUpah: 'borongan', noHp: '081234567890', aktif: true },
  { id: 'KRY-002', nama: 'Budi Santoso', posisi: 'Jahit', tipeUpah: 'borongan', noHp: '081234567891', aktif: true },
  { id: 'KRY-003', nama: 'Dewi Lestari', posisi: 'Jahit', tipeUpah: 'borongan', noHp: '081234567892', aktif: true },
  { id: 'KRY-004', nama: 'Eko Prasetyo', posisi: 'Cutting', tipeUpah: 'borongan', noHp: '081234567893', aktif: true },
  { id: 'KRY-005', nama: 'Fitri Handayani', posisi: 'QC', tipeUpah: 'tetap', noHp: '081234567894', aktif: true },
  { id: 'KRY-006', nama: 'Gunawan', posisi: 'Packing', tipeUpah: 'tetap', noHp: '081234567895', aktif: true },
  { id: 'KRY-007', nama: 'Hendra Wijaya', posisi: 'Steam', tipeUpah: 'tetap', noHp: '081234567896', aktif: true },
  { id: 'KRY-008', nama: 'Indah Permata', posisi: 'Jahit', tipeUpah: 'borongan', noHp: '081234567897', aktif: true },
];

// Klien (minimal 3)
export const dummyKlien = [
  { id: 'KLN-001', nama: 'PT Elysian Fashion', kontak: 'Diana', noHp: '082111222333', alamat: 'Jl. Gatot Subroto 45, Jakarta' },
  { id: 'KLN-002', nama: 'CV Garuda Textile', kontak: 'Rudi', noHp: '082111222444', alamat: 'Jl. Asia Afrika 78, Bandung' },
  { id: 'KLN-003', nama: 'Toko Maju Jaya', kontak: 'Sinta', noHp: '082111222555', alamat: 'Jl. Pemuda 12, Semarang' },
];

// Kategori Transaksi (dengan field jenis — Phase 2B ready)
export const dummyKategoriTrx = [
  { id: 'KTR-001', nama: 'Pembelian Bahan Baku', jenis: 'direct_bahan' as const },
  { id: 'KTR-002', nama: 'Upah Karyawan', jenis: 'direct_upah' as const },
  { id: 'KTR-003', nama: 'Operasional Listrik', jenis: 'overhead' as const },
  { id: 'KTR-004', nama: 'Operasional Rumah', jenis: 'overhead' as const },
  { id: 'KTR-005', nama: 'Penerimaan PO', jenis: 'masuk' as const },
  { id: 'KTR-006', nama: 'Uang Makan', jenis: 'overhead' as const },
  { id: 'KTR-007', nama: 'Pembelian Aksesori', jenis: 'direct_bahan' as const },
  { id: 'KTR-008', nama: 'Pinjaman', jenis: 'masuk' as const },
];

// Jenis Reject (minimal 5)
export const dummyJenisReject = [
  { id: 'RJT-001', nama: 'Jahitan Loncat', severity: 'high' },
  { id: 'RJT-002', nama: 'Noda Kain', severity: 'medium' },
  { id: 'RJT-003', nama: 'Ukuran Tidak Sesuai', severity: 'high' },
  { id: 'RJT-004', nama: 'Benang Putus', severity: 'low' },
  { id: 'RJT-005', nama: 'Kancing Lepas', severity: 'medium' },
];

// Satuan/UOM
export const dummySatuan = [
  { id: 'UOM-001', nama: 'Meter', simbol: 'm' },
  { id: 'UOM-002', nama: 'Kilogram', simbol: 'kg' },
  { id: 'UOM-003', nama: 'Gram', simbol: 'g' },
  { id: 'UOM-004', nama: 'Pcs', simbol: 'pcs' },
  { id: 'UOM-005', nama: 'Roll', simbol: 'roll' },
  { id: 'UOM-006', nama: 'Lusin', simbol: 'lsn' },
];
```

### `src/data/dummy-po.ts`

Buat minimal 3 PO realistis dengan beberapa artikel per PO.
Setiap PO harus punya:
- Nomor PO (PO-0001, PO-0002, PO-0003)
- Klien terkait
- Tanggal PO
- Status (processing, sebagian kirim, selesai)
- Daftar item/artikel: model, warna, size, SKU klien, SKU internal, qty order, isi per bundle, jumlah bundle

### `src/data/dummy-bundles.ts`

Generate bundle barcode dari PO di atas. Minimal 20 bundle.
Setiap bundle harus punya statusTahap yang bervariasi:
- Beberapa bundle sudah selesai semua tahap
- Beberapa bundle masih di tengah proses (misal: cutting selesai, jahit selesai, lubang kancing belum)
- Beberapa bundle belum dimulai
- 1-2 bundle punya koreksiStatus = "pending" (untuk test koreksi)

### `src/data/dummy-inventory.ts`

Buat minimal 8 item inventory:
- Bahan kain (beberapa jenis): warna, harga per meter, stok, stok minimum
- Aksesori (kancing, resleting, label)
- Beberapa item dengan stok di bawah minimum (untuk test alert)

### `src/data/dummy-journal.ts`

Buat minimal 10 entri jurnal:
- Beberapa pembelian bahan baku (direct_bahan)
- 1 entri upah karyawan (direct_upah) — dengan detailUpah
- Beberapa overhead (listrik, uang makan)
- Beberapa pemasukan (Penerimaan PO)

### `src/data/dummy-payroll.ts`

Buat data gaji untuk 1 periode:
- Minimal 5 karyawan dengan data upah
- Beberapa sudah lunas, beberapa belum
- Include data kasbon (2-3 karyawan)

---

## BAGIAN 4: Initialize Stores dengan Dummy Data

Setiap store harus **ter-initialize** dengan dummy data. Ada 2 pendekatan yang diterima:

**Opsi A** (preferred): Initialize langsung di store definition:
```ts
import { dummyKategori, dummyModel, ... } from '@/data/dummy-master';

export const useMasterStore = create<MasterState>((set, get) => ({
  kategori: dummyKategori,
  model: dummyModel,
  // ...
}));
```

**Opsi B**: Buat initializer function yang dipanggil di layout.

Pilih Opsi A agar lebih sederhana.

---

## Verifikasi

Setelah selesai, pastikan:
1. `npm run dev` — berjalan tanpa error
2. **SEMUA** link di sidebar mengarah ke halaman yang benar (33 halaman)
3. Klik setiap sub-menu → halaman muncul dengan judul yang benar
4. Dynamic route scan station bekerja: `/produksi/scan/cutting`, `/produksi/scan/jahit`, dll
5. Redirect bekerja: `/` → `/dashboard/produksi`, `/dashboard` → `/dashboard/produksi`
6. Active state sidebar berubah sesuai halaman yang dikunjungi
7. Semua TypeScript compile tanpa error
8. Console browser tidak ada error/warning

## Milestone Check — Sprint 1 Selesai ✅

Setelah Sprint 1.4 ini selesai, aplikasi harus bisa:
- [x] Sidebar navigasi 9 menu + semua sub-menu berfungsi
- [x] 33 halaman bisa diakses via URL
- [x] Design system (warna, font) konsisten
- [x] Semua komponen atom + molekul + organism tersedia
- [x] State management siap dipakai
- [x] Dummy data tersedia di stores

**Selanjutnya:** Sprint 2 akan mulai membangun halaman-halaman fitur (Master Data + Auth).

## JANGAN Lakukan

- ❌ Jangan bangun UI fitur (form, tabel data) — itu Sprint 2+
- ❌ Jangan buat koneksi database
- ❌ Jangan ubah komponen yang sudah ada (kecuali ada bug)
- ❌ Jangan skip halaman — SEMUA 33 halaman harus dibuat
