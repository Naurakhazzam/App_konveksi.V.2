# STITCHLYX SYNCORE V2 — Laporan Reconnaissance Audit

**Auditor**: Senior Software Auditor (AI)  
**Tanggal Audit**: 15 April 2026  
**Scope**: Full codebase reconnaissance — `src/types/`, `src/stores/`, `Docs/SQL_*.sql`

---

## STORE MAP

| # | Store | File | Tabel Supabase | Dependency ke Store Lain |
|---|-------|------|----------------|--------------------------|
| 1 | `usePOStore` | `src/stores/usePOStore.ts` | `purchase_order`, `po_item`, `pemakaian_bahan` | → `useBundleStore` (addBundles, removeBundlesByPO), `useKoreksiStore` (removeKoreksiByPO), `useInventoryStore` (consumeFIFO), `useLogStore`, `useAuthStore` |
| 2 | `useBundleStore` | `src/stores/useBundleStore.ts` | `bundle`, `bundle_status_tahap` | Standalone (dipanggil oleh usePOStore) |
| 3 | `useKoreksiStore` | `src/stores/useKoreksiStore.ts` | `koreksi`, `action_approval` | → `useBundleStore` (updateStatusTahap), `usePOStore` (removePO), `usePayrollStore` (prosesBayar), `useTrashStore`, `useAuthStore` |
| 4 | `useInventoryStore` | `src/stores/useInventoryStore.ts` | `inventory_item`, `inventory_batch`, `transaksi_keluar`, `transaksi_masuk` | → `useAuthStore` |
| 5 | `useJurnalStore` | `src/stores/useJurnalStore.ts` | `jurnal_entry`, `jurnal_detail_upah` | → `useInventoryStore` (loadInventory), `useAuthStore`, `useLogStore` |
| 6 | `usePayrollStore` | `src/stores/usePayrollStore.ts` | `gaji_ledger`, `kasbon` | → `useJurnalStore`, `useMasterStore` (karyawan, gajiPokok), `useLogStore`, `useAuthStore` |
| 7 | `useMasterStore` | `src/stores/useMasterStore.ts` | `kategori`, `model`, `size`, `warna`, `karyawan`, `klien`, `jenis_reject`, `alasan_reject`, `kategori_trx`, `satuan`, `produk`, `hpp_komponen`, `produk_hpp_item`, `jabatan` | Standalone |
| 8 | `useAuthStore` | `src/stores/useAuthStore.ts` | `users` | Standalone (persisted localStorage) |
| 9 | `usePengirimanStore` | `src/stores/usePengirimanStore.ts` | `surat_jalan`, `surat_jalan_items` | Standalone |
| 10 | `useReturnStore` | `src/stores/useReturnStore.ts` | `return_items` | Standalone |
| 11 | `useScanStore` | `src/stores/useScanStore.ts` | `scan_history` | Standalone |
| 12 | `useLogStore` | `src/stores/useLogStore.ts` | `audit_log` | → `useAuthStore` |
| 13 | `useSerahTerimaStore` | `src/stores/useSerahTerimaStore.ts` | `serah_terima_jahit`, `serah_terima_items` | Standalone |
| 14 | `useSettingsStore` | `src/stores/useSettingsStore.ts` | *Tidak ada* (localStorage) | Standalone |
| 15 | `useTrashStore` | `src/stores/useTrashStore.ts` | `trash_bin` | Standalone |

**Total Tabel Supabase yang Diakses**: ~30 tabel unik  
**Total Stores**: 15

---

## TYPE CONSISTENCY CHECK

### Perbedaan TypeScript Types vs. DB Schema (berdasarkan kode mapping)

| # | Temuan | Lokasi | Severity |
|---|--------|--------|----------|
| 1 | **`JurnalEntry.nominal` ↔ DB `jumlah`**: TS field `nominal`, DB kolom `jumlah`. Mapping di `useJurnalStore.ts:33` → `row.jumlah → nominal` dan insert (L141) → `nominal → jumlah`. Konsisten secara fungsional tapi **nama field menyesatkan**. | `finance.types.ts`, `useJurnalStore.ts` | ⚠️ Medium |
| 2 | **`GajiLedgerEntry.total` ↔ DB punya `total` DAN `jumlah`**: Store menulis ke **kedua** kolom dengan nilai sama (`usePayrollStore.ts:119-120`). Duplikasi data rawan inkonsistensi. | `payroll.types.ts`, `usePayrollStore.ts` | ⚠️ Medium |
| 3 | **`InventoryItem.stokAktual` ↔ DB `stok`**: TS `stokAktual`, DB `stok` (`useInventoryStore.ts:40`). Fungsional tapi inkonsisten naming. | `inventory.types.ts`, `useInventoryStore.ts` | 🔵 Low |
| 4 | **`TransaksiKeluar.qty` ↔ DB `jumlah`**: TS field `qty`, DB kolom `jumlah` (`useInventoryStore.ts:62`, insert L208). | `inventory.types.ts`, `useInventoryStore.ts` | 🔵 Low |
| 5 | **`KoreksiQTY.qtyKoreksi` ↔ DB `qty_selisih`**: TS `qtyKoreksi`, DB `qty_selisih` (`useKoreksiStore.ts:66`). Semantik berbeda. | `production.types.ts`, `useKoreksiStore.ts` | 🔵 Low |
| 6 | **`KoreksiQTY.karyawanBertanggungJawab` ↔ DB `karyawan_id`**: TS deskriptif, DB generik. Hanya 1 field karyawan di DB (`useKoreksiStore.ts:61`). | `production.types.ts`, `useKoreksiStore.ts` | 🔵 Low |
| 7 | **`GajiLedgerEntry.sumberId` ↔ DB `sumber_id` DAN `bundle_id`**: Store menulis ke kedua kolom (`usePayrollStore.ts:122-123`). Duplikasi. | `payroll.types.ts`, `usePayrollStore.ts` | ⚠️ Medium |
| 8 | **`KasbonEntry.status` vs DB `lunas` boolean**: TS menggunakan string status, DB punya `lunas` boolean DAN `status` text. Store menulis ke kedua kolom (`usePayrollStore.ts:299`). | `payroll.types.ts`, `usePayrollStore.ts` | ⚠️ Medium |
| 9 | **TS `KoreksiQTY.statusApproval = 'ditolak'` ↔ DB `status_approval = 'rejected'`**: Mapping via helper `toDbApproval`/`fromDbApproval`. Rawan error jika ada tempat yang menulis langsung. | `production.types.ts`, `useKoreksiStore.ts:42-49` | 🔵 Low |
| 10 | **`ProdukHPPItem.harga` ↔ DB `harga` DAN `nilai`**: Store menulis ke kedua kolom (`useMasterStore.ts:559`). Duplikasi data. | `master.types.ts`, `useMasterStore.ts` | ⚠️ Medium |
| 11 | **Tipe `ScanRecord` DUPLIKAT**: Dua definisi berbeda — `production.types.ts` (punya `tipe: 'terima' \| 'selesai'`), dan `useScanStore.ts:9-17` (punya `aksi: 'terima' \| 'selesai' \| 'reject'`). | `production.types.ts`, `useScanStore.ts` | 🔴 High |
| 12 | **`StatusTahap.karyawan` komentar menyesatkan**: Komentar di `bundle.types.ts:7` bilang `// Hanya untuk cutting & jahit` tapi project context menyatakan SEMUA 7 tahap wajib karyawan. | `bundle.types.ts` | ⚠️ Medium |
| 13 | **`audit.types.ts` metadata typed as `any`**: Field `metadata` di AuditEntry bertipe `any`. | `audit.types.ts:12` | 🔵 Low |

---

## NAMING CONVENTION ISSUES

| # | TS Field (camelCase) | DB Column (snake_case) | Status | Notes |
|---|---------------------|----------------------|--------|-------|
| 1 | `nominal` | `jumlah` | ❌ **Mismatch** | `JurnalEntry` — semantic mismatch |
| 2 | `stokAktual` | `stok` | ❌ **Mismatch** | `InventoryItem` — semantic mismatch |
| 3 | `qty` | `jumlah` | ❌ **Mismatch** | `TransaksiKeluar` — semantic mismatch |
| 4 | `qtyKoreksi` | `qty_selisih` | ❌ **Mismatch** | `KoreksiQTY` — semantic mismatch |
| 5 | `sumberId` | `sumber_id` + `bundle_id` | ⚠️ Duplikat | `GajiLedgerEntry` — 1 field → 2 kolom |
| 6 | `total` | `total` + `jumlah` | ⚠️ Duplikat | `GajiLedgerEntry` — 1 field → 2 kolom |
| 7 | `harga` | `harga` + `nilai` | ⚠️ Duplikat | `ProdukHPPItem` — 1 field → 2 kolom |
| 8 | `statusApproval: 'ditolak'` | `status_approval: 'rejected'` | ⚠️ Value mismatch | Handled oleh helper |
| 9 | `karyawanBertanggungJawab` | `karyawan_id` | ⚠️ Truncated | ID generik vs nama deskriptif |
| 10 | `klienId`, `modelId`, etc | `klien_id`, `model_id`, etc | ✅ OK | Konsisten |

---

## RPC INVENTORY

| # | RPC Function | Dipanggil di File | SQL Definition | Status |
|---|-------------|-------------------|----------------|--------|
| 1 | `create_po_atomic` | `usePOStore.ts:473` | `Docs/SQL_PHASE_2_ATOMIC_PO.sql` | ✅ ADA di SQL |
| 2 | `pay_salary_atomic` | `usePayrollStore.ts:241` | `Docs/SQL_PHASE_5_ATOMIC_PAYROLL.sql` | ✅ ADA di SQL |
| 3 | `record_purchase_atomic` | `useJurnalStore.ts:104` | `Docs/SQL_PHASE_6_ATOMIC_FINANCE.sql` | ✅ ADA di SQL |

> **CATATAN**: Semua 3 RPC memiliki definisi SQL. Namun SQL files ada di `Docs/`, **bukan** di `supabase/migrations/`. Folder `supabase/migrations/` tidak ditemukan. Status eksekusi aktual di database tidak bisa diverifikasi dari kode saja.

---

## CRITICAL FINDINGS

### 🔴 C1 — Truncated / Orphaned Code di `useMasterStore.ts` dan `useJurnalStore.ts`

**File**: `src/stores/useMasterStore.ts:694`  
Baris terakhir file:
```
      .reduc
```
**Potongan kode terpotong**. Closure store sudah ditutup di baris 693, jadi baris 694 adalah **garbage code** sisa edit gagal.

**File**: `src/stores/useJurnalStore.ts:203`  
Baris terakhir:
```
          const detailRows = 
```
**Orphaned code snippet** di luar closure store.

> ⚠️ **BAHAYA**: Kedua file berakhir dengan code fragment di luar scope. Saat ini TIDAK menyebabkan error, tapi menjadi **bom waktu** jika ada edit lanjutan.

---

### 🔴 C2 — `record_purchase_atomic` SQL Mengupdate Tabel `items` (Seharusnya `inventory_item`)

**File**: `Docs/SQL_PHASE_6_ATOMIC_FINANCE.sql:51`
```sql
UPDATE items 
SET stok = COALESCE(stok, 0) + v_qty_new 
WHERE id = v_item_id;
```

Kode TypeScript menggunakan tabel `inventory_item` (lihat `useInventoryStore.ts` → `supabase.from('inventory_item')`), tetapi RPC SQL mengupdate tabel **`items`** — bukan `inventory_item`.

> ⚠️ **DAMPAK**: Stok TIDAK terupdate saat pembelian bahan via Jurnal Umum. RPC insert ke `jurnal_entry` dan `inventory_batch` berhasil, tapi UPDATE stok gagal silently. **Potensi data integrity breach serius.**

---

### 🔴 C3 — `removePO` Non-Atomik, Berisiko Orphan Data

**File**: `src/stores/usePOStore.ts:271-284`

```typescript
// Urutan eksekusi:
await supabase.from('po_item').delete().eq('po_id', id);       // 1. Hapus items
const { error } = await supabase.from('purchase_order').delete()  // 2. Hapus PO
  .eq('id', id);
useBundleStore.getState().removeBundlesByPO(id);                // 3. Hapus bundles
useKoreksiStore.getState().removeKoreksiByPO(id);               // 4. Hapus koreksi
```

Jika step 3/4 gagal, bundles dan koreksi jadi **orphan records**.

> ⚠️ **TIDAK DIBERSIHKAN**: `pemakaian_bahan`, `scan_history`, `gaji_ledger`, `return_items`, `surat_jalan`, `serah_terima_jahit` yang terkait PO yang dihapus.

---

### 🔴 C4 — `addBundles` Tidak Menyimpan `_bundleIdMap`

**File**: `src/stores/useBundleStore.ts:189-191`

```typescript
addBundles: (newBundles: Bundle[]) => {
    set((state) => ({ bundles: [...state.bundles, ...newBundles] }));
},
```

`_bundleIdMap` (mapping barcode → DB id) **tidak diisi**. Setelah `createPOWithBundles`, semua `updateStatusTahap` harus fallback query ke DB untuk ID. Ada fallback (L216-227), tapi ini **N+1 query problem** untuk setiap bundle baru.

---

### 🔴 C5 — `useKoreksiStore.addKoreksi` Mengirim Field Duplikat/Legacy

**File**: `src/stores/useKoreksiStore.ts:136-156`

```typescript
barcode: finalData.barcode,
bundle_id: finalData.barcode,           // Duplikat!
tahap: finalData.tahapDitemukan,
tahap_ditemukan: finalData.tahapDitemukan,  // Duplikat!
alasan: finalData.alasanLebihText,
alasan_lebih_text: finalData.alasanLebihText,  // Duplikat!
```

Schema tabel `koreksi` belum dinormalisasi — field lama tidak dihapus setelah migrasi.

---

## MINOR FINDINGS

| # | Temuan | File | Notes |
|---|--------|------|-------|
| M1 | `getTotalByTipe` logika `e.jenis === 'masuk'` untuk 4 jenis transaksi — benar tapi menyesatkan | `useJurnalStore.ts:198-201` | |
| M2 | `require('./useAuthStore')` di `addEntry` padahal bisa top-level import | `useJurnalStore.ts:85` | Kemungkinan circular dep avoidance |
| M3 | Login validasi via `data.password` DAN `data.pin` — user bisa login dengan PIN sebagai password | `useAuthStore.ts:215-217` | By design tapi lemah security |
| M4 | Emergency backdoor hardcoded: `Demonsong44`, `030503`. Visitor passwords: `visitor123`, `tamu`, `guest` | `useAuthStore.ts:211,389` | 🔴 Security concern |
| M5 | `useScanStore.addRecord` fire-and-forget — error insert di-log saja, tidak rollback | `useScanStore.ts:71-88` | Data bisa hilang |
| M6 | `useLogStore.addLog` fire-and-forget — audit trail bisa hilang jika DB down | `useLogStore.ts:54-86` | Performance trade-off |
| M7 | Beberapa action di `useMasterStore` (Jabatan, Klien, KategoriTrx, Satuan) **tidak punya rollback** | `useMasterStore.ts:408-419` | Inkonsisten dengan Kategori/Model/Warna |
| M8 | `globalSequence` dihitung dari total bundle — jika PO dihapus, sequence mundur, potensi collision barcode | `usePOStore.ts:156-160` | |
| M9 | Hanya `useSettingsStore` dan `useAuthStore` yang pakai `persist` middleware (localStorage) | Semua store | By design |
| M10 | Supabase client pakai placeholder jika env vars missing — silent failure di production | `src/lib/supabase.ts:3-4` | |
| M11 | File `sprint_planing.md` **TIDAK DITEMUKAN** di root. Ada `sprint_6_9_final_polish.md` di `Docs/` | Root folder | |
| M12 | Folder `supabase/migrations/` **TIDAK ADA**. SQL hanya di `Docs/`. Tidak ada migrasi formal | Root folder | |
| M13 | Context bilang "Next.js 15" tapi task desc bilang "Next.js 16". Inkonsistensi versi | `STITCHLYX_V2_PROJECT_CONTEXT.md:43` | |
| M14 | `JurnalEntry` di context punya `tipe: 'masuk' \| 'keluar'` tapi di `finance.types.ts` field `tipe` **TIDAK ADA** | `finance.types.ts` vs context doc | |
| M15 | `clearTrash` pakai `.delete().neq('id', '')` — pattern kurang ideal untuk hapus semua rows | `useTrashStore.ts:129` | |

---

## PERTANYAAN UNTUK OWNER

1. **Tabel DB `items` vs `inventory_item`**: RPC `record_purchase_atomic` mengupdate tabel `items`, tapi semua kode TS menggunakan `inventory_item`. **Mana yang benar?** Jika tidak ada tabel alias, fitur pembelian bahan mungkin tidak mengupdate stok.

2. **Kolom duplikat di DB** (`total`/`jumlah`, `sumber_id`/`bundle_id`, `harga`/`nilai`, `barcode`/`bundle_id` di koreksi): Apakah kolom lama belum dihapus dari migrasi bertahap? Atau keduanya dipakai oleh query/view lain?

3. **Lifecycle data saat PO dihapus**: Saat ini hanya `bundle` dan `koreksi` yang dihapus. Bagaimana dengan `pemakaian_bahan`, `gaji_ledger`, `scan_history`, `return_items`, `surat_jalan` terkait? Harus cascade delete?

4. **GlobalSequence barcode**: Jika PO dihapus, sequence bisa mundur. Acceptable atau harus monotonically increasing?

5. **Security hardcoded credentials**: Override codes dan visitor passwords di-hardcode di source code. Permanent atau dipindah ke env vars/DB sebelum production?

6. **SQL migration management**: Tidak ada folder `supabase/migrations/`. Bagaimana RPC dan schema changes dikelola? Sudah dijalankan manual di Supabase Dashboard?

7. **Next.js version**: Context document bilang Next.js 15, task desc bilang Next.js 16. Mana yang aktif?

---

## STATUS

- [x] Reconnaissance selesai penuh
- File yang tidak bisa dibaca: **Tidak ada** — semua file berhasil dibaca
- File yang diminta tapi tidak ditemukan: `sprint_planing.md` (root), `supabase/migrations/` folder
