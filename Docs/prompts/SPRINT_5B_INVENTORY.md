# PROMPT — Sprint 5B: Modul Inventory (Overview, Transaksi Keluar, Alert Order)

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1-4 dan Sprint 5A (penggajian) sudah selesai.

**Status saat ini:**
- `useInventoryStore` sudah ada dengan state dasar (items, trxKeluar, trxMasuk) dan actions (addItem, updateStock, addTrxKeluar, addTrxMasuk, getAlertItems)
- Dummy data inventory sudah ada di `data/dummy-inventory.ts`
- Route pages untuk `/inventory/overview`, `/transaksi-keluar`, `/alert-order` sudah ada tapi berisi placeholder
- Stok bertambah OTOMATIS saat jurnal "Pembelian Bahan Baku" dicatat (jenis: `direct_bahan`)
- Stok berkurang via Transaksi Keluar (pemakaian produksi)

**Sprint 5B ini akan membangun:**
1. **Overview Stok** — Tabel semua item inventory + ringkasan stok
2. **Transaksi Keluar** — Form pencatatan pemakaian bahan untuk produksi
3. **Alert Order** — Notifikasi item yang stoknya di bawah minimum

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css`
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/` (contoh: `@/components/atoms/Button`)
5. **Data CRUD** = baca/tulis ke Zustand store. Tidak ada API call.
6. **Komponen reusable** yang sudah ada WAJIB digunakan
7. **Feature components** disimpan di `src/features/inventory/`

---

## BAGIAN 1: OVERVIEW STOK

### 1.1 Halaman `/inventory/overview` — OverviewStokView

**File:** `src/features/inventory/OverviewStok/OverviewStokView.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  PageWrapper: "Inventory — Overview Stok"               │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │Total │ │Stok  │ │Stok  │ │Under │                   │
│  │Item  │ │Aman  │ │Rendah│ │Min   │                   │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
│                                                         │
│  [+ Tambah Item]  [Search: ___________]                 │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  DataTable: InventoryTable                        │   │
│  │  Kolom:                                           │   │
│  │  - Kode Item                                      │   │
│  │  - Nama Item                                      │   │
│  │  - Kategori                                       │   │
│  │  - Satuan (UOM)                                   │   │
│  │  - Stok Aktual                                    │   │
│  │  - Stok Minimum                                   │   │
│  │  - Status (Aman / Rendah / Habis)                 │   │
│  │  - Aksi (Edit / Hapus)                            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 ModalTambahItem

**File:** `src/features/inventory/OverviewStok/ModalTambahItem.tsx`

**Fields:**
- Kode Item (auto-generate: INV-001, INV-002, ...)
- Nama Item (text)
- Kategori (dropdown: Bahan Baku, Aksesori, Packaging)
- Satuan/UOM (dropdown dari master satuan)
- Stok Awal (number)
- Stok Minimum (number, untuk Alert Order)
- Harga per Satuan (number, untuk kalkulasi HPP)

---

## BAGIAN 2: TRANSAKSI KELUAR

### 2.1 Halaman `/inventory/transaksi-keluar` — TransaksiKeluarView

**File:** `src/features/inventory/TransaksiKeluar/TransaksiKeluarView.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  PageWrapper: "Transaksi Keluar — Pemakaian Bahan"       │
│                                                          │
│  [+ Catat Pemakaian]                                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  DataTable: TransaksiKeluarTable                  │    │
│  │  Kolom:                                           │    │
│  │  - Tanggal                                        │    │
│  │  - Item                                           │    │
│  │  - QTY Keluar                                     │    │
│  │  - Satuan                                         │    │
│  │  - Untuk PO (opsional)                            │    │
│  │  - Keterangan                                     │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 2.2 ModalTransaksiKeluar

**File:** `src/features/inventory/TransaksiKeluar/ModalTransaksiKeluar.tsx`

**Fields:**
- Pilih Item (dropdown dari inventory)
- QTY (number, max = stok aktual)
- Untuk PO (opsional, dropdown dari PO aktif)
- Keterangan
- Simpan → kurangi stok aktual di `useInventoryStore`

---

## BAGIAN 3: ALERT ORDER

### 3.1 Halaman `/inventory/alert-order` — AlertOrderView

**File:** `src/features/inventory/AlertOrder/AlertOrderView.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  PageWrapper: "Alert Order — Stok Di Bawah Minimum"      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  DataTable: AlertTable                            │    │
│  │  Hanya menampilkan item dengan stokAktual <=      │    │
│  │  stokMinimum                                      │    │
│  │                                                   │    │
│  │  Kolom:                                           │    │
│  │  - Kode Item                                      │    │
│  │  - Nama Item                                      │    │
│  │  - Stok Aktual (MERAH jika = 0)                   │    │
│  │  - Stok Minimum                                   │    │
│  │  - Kekurangan (Min - Aktual)                      │    │
│  │  - Status (Badge: Rendah / Habis)                 │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Jika tidak ada item alert → EmptyState "Semua stok aman"│
└──────────────────────────────────────────────────────────┘
```

---

## BAGIAN 4: ROUTING

Ganti isi file placeholder berikut:
- `src/app/(dashboard)/inventory/overview/page.tsx`
- `src/app/(dashboard)/inventory/transaksi-keluar/page.tsx`
- `src/app/(dashboard)/inventory/alert-order/page.tsx`

---

## Deliverable Sprint 5B

- [ ] **Overview Stok** fungsional: tabel, CRUD item, search
- [ ] **Transaksi Keluar** fungsional: form pemakaian bahan, stok otomatis berkurang
- [ ] **Alert Order** fungsional: filter item di bawah minimum
- [ ] Dummy data tersedia dan konsisten
- [ ] `npx tsc --noEmit` = 0 errors

## File yang akan dibuat/dimodifikasi

### File Baru:
| File | Deskripsi |
|---|---|
| `src/features/inventory/OverviewStok/OverviewStokView.tsx` | Halaman utama |
| `src/features/inventory/OverviewStok/OverviewStokView.module.css` | Styles |
| `src/features/inventory/OverviewStok/ModalTambahItem.tsx` | Modal tambah item |
| `src/features/inventory/OverviewStok/ModalTambahItem.module.css` | Styles |
| `src/features/inventory/TransaksiKeluar/TransaksiKeluarView.tsx` | Halaman transaksi |
| `src/features/inventory/TransaksiKeluar/TransaksiKeluarView.module.css` | Styles |
| `src/features/inventory/TransaksiKeluar/ModalTransaksiKeluar.tsx` | Modal catat |
| `src/features/inventory/TransaksiKeluar/ModalTransaksiKeluar.module.css` | Styles |
| `src/features/inventory/AlertOrder/AlertOrderView.tsx` | Halaman alert |
| `src/features/inventory/AlertOrder/AlertOrderView.module.css` | Styles |

### File Dimodifikasi:
| File | Perubahan |
|---|---|
| `src/stores/useInventoryStore.ts` | Perbaiki/tambah action jika perlu |
| `src/app/(dashboard)/inventory/overview/page.tsx` | Ganti placeholder |
| `src/app/(dashboard)/inventory/transaksi-keluar/page.tsx` | Ganti placeholder |
| `src/app/(dashboard)/inventory/alert-order/page.tsx` | Ganti placeholder |
