# AUDIT REPORT PHASE 2 — MODUL PO & BUNDLE
# STITCHLYX SYNCORE V2

**Tanggal Audit**: 15 April 2026
**Auditor**: Senior Software Auditor (AI)
**Scope**: `usePOStore.ts`, `useBundleStore.ts`, `FormInputPO.tsx`, `po-import.ts`, `SQL_PHASE_2_ATOMIC_PO.sql`, tipe data terkait

---

## RINGKASAN EKSEKUTIF

Modul PO & Bundle sudah mengadopsi pola atomik (RPC via `create_po_atomic`) untuk form manual, namun **jalur CSV Import masih menggunakan insert non-atomik** yang rentan partial failure. Mekanisme `globalSequence` memiliki **celah kritis** yang memungkinkan barcode collision ketika PO dihapus atau saat dua pengguna membuat PO secara bersamaan. Fungsi `removePO` juga **tidak membersihkan** beberapa tabel anak yang penting (pemakaian_bahan, scan_history, gaji_ledger, serah_terima_jahit, surat_jalan).

---

## AUDIT A — createPOWithBundles

### A1. Mekanisme Pembuatan PO
**Temuan**: Form manual (`FormInputPO.tsx`) memanggil `createPOWithBundles` (line 167) yang mengirim data ke RPC `create_po_atomic`. RPC ini mengeksekusi INSERT ke 3 tabel (`purchase_order`, `po_item`, `bundle`) dalam satu transaksi PostgreSQL.

**Verdict**: ✅ Alur atomik sudah benar untuk form manual.

### A2. poItemId pada Bundle
🟠 **TINGGI** — Di `FormInputPO.tsx` line 145, field `poItemId: item.id` diisi dengan benar pada saat pembuatan bundle. Namun di `po-import.ts`, field `poItemId` **sama sekali tidak diset** pada bundle yang dihasilkan (line 158-176). Akibatnya bundle yang diimpor via CSV tidak terhubung ke `po_item` di database, sehingga query join `bundle ↔ po_item` akan gagal untuk bundle hasil import.

### A3. globalSequence Increment
🟡 **SEDANG** — Di `FormInputPO.tsx`, `globalSequence` dibaca langsung dari store (line 103, 116) tapi `incrementGlobalSequence` **tidak dipanggil**. Sebagai gantinya, `createPOWithBundles` di store (line 453) menambahkan `bundles.length` ke state secara manual. Ini berarti sequence di-increment di dua tempat berbeda untuk jalur form manual vs CSV import, menambah kompleksitas dan risiko desinkronisasi.

### A4. Rollback Jika Gagal
**Temuan**: Di `createPOWithBundles` (line 489-496), jika RPC gagal:
- `poList` di-rollback ✅
- `globalSequence` di-rollback ✅
- **Tapi `addBundles` (line 455) yang sudah memperbarui bundle store TIDAK di-rollback** ❌

🔴 **KRITIS** — Bundle sudah masuk ke state lokal `useBundleStore` via `addBundles()` sebelum RPC dijalankan. Jika RPC gagal, PO di-rollback tapi **bundle tetap ada di memory**. UI menampilkan bundle yang tidak ada di database.

### A5. Field Matching: Store ↔ SQL RPC
**Analisa field-by-field:**

| Field di `toPORow()` | Parameter SQL | Match? |
|---|---|---|
| `id` | `p_po->>'id'` | ✅ |
| `klien_id` | `p_po->>'klien_id'` | ✅ |
| `nomor_po` | `p_po->>'nomor_po'` | ✅ |
| `tanggal_input` | `p_po->>'tanggal_input'` → `::TIMESTAMP WITH TIME ZONE` | ⚠️ Lihat A5a |
| `status` | `p_po->>'status'` | ✅ |
| `tanggal_deadline` | `p_po->>'tanggal_deadline'` → `::TIMESTAMP WITH TIME ZONE` | ⚠️ Lihat A5b |
| `catatan` | `p_po->>'catatan'` | ✅ |

🟡 **A5a — SEDANG** — `tanggal_input` dikirim sebagai string `YYYY-MM-DD` (line 108 FormInputPO: `.split('T')[0]`), tapi SQL meng-cast ke `TIMESTAMP WITH TIME ZONE`. Cast ini berhasil di PostgreSQL, namun jam/menit/detik menjadi `00:00:00` dan timezone bergantung pada setting server — risiko inkonsistensi waktu.

🟡 **A5b — SEDANG** — `tanggal_deadline` bisa `null` (dari `toPORow` line 68). SQL melakukan cast `(p_po->>'tanggal_deadline')::TIMESTAMP WITH TIME ZONE`. Jika value JSONB adalah `null`, `->>'tanggal_deadline'` menghasilkan SQL `NULL`, dan `NULL::TIMESTAMP` tetap valid. **Aman, tapi hanya karena perilaku implisit PostgreSQL.**

**Bundle fields:**

| Field di `bundleRows` (line 459-470) | Parameter SQL | Match? |
|---|---|---|
| `id` | `bundle->>'id'` | ⚠️ Lihat A5c |
| `barcode` | `bundle->>'barcode'` | ✅ |
| `po_id` | **hardcoded `v_po_id`** di SQL | ✅ |
| `po_item_id` | `bundle->>'po_item_id'` | ✅ |
| `model_id` | `bundle->>'model_id'` | ✅ |
| `warna_id` | `bundle->>'warna_id'` | ✅ |
| `size_id` | `bundle->>'size_id'` | ✅ |
| `qty_bundle` | `bundle->>'qty_bundle'` → `::NUMERIC` | ✅ |
| `sku_klien` | `bundle->>'sku_klien'` | ✅ |
| `sku_internal` | `bundle->>'sku_internal'` | ✅ |

🟠 **A5c — TINGGI** — Bundle `id` dikirim dari client JS (line 460: `id: b.id`), tapi pada objek `Bundle` di TypeScript (`bundle.types.ts`), field `id` **tidak ada** di interface `Bundle`. Field-nya adalah `barcode`. Maka `b.id` selalu `undefined`, dan SQL menerima `NULL::TEXT` sebagai primary key. Jika tabel `bundle` memiliki constraint `NOT NULL` pada kolom `id`, insert **akan gagal**. Jika tabel menggunakan `DEFAULT gen_random_uuid()`, maka ID di-generate oleh database dan berbeda dari client-side expectation.

---

## AUDIT B — Barcode Uniqueness & GlobalSequence

### B1. Sumber globalSequence Saat App Pertama Dibuka
**Temuan**: Di `loadPOs()` line 156-158:
```typescript
const maxSeq = poList.reduce((acc, po) =>
  acc + po.items.reduce((sum, item) => sum + item.jumlahBundle, 0), 0
);
set({ globalSequence: maxSeq + 1 });
```

🔴 **KRITIS** — `globalSequence` dihitung dari **jumlah total `jumlahBundle` semua PO yang MASIH ADA**. Jika PO lama dihapus, `jumlahBundle`-nya ikut hilang dari kalkulasi. Akibatnya:
- PO-A dibuat dengan 10 bundle → globalSequence menjadi 11
- PO-A dihapus → globalSequence reset ke 1
- PO-B dibuat → menghasilkan barcode dengan sequence 1-10 lagi
- **BARCODE COLLISION** dengan bundle PO-A yang mungkin masih ada di `scan_history`, `gaji_ledger`, dll.

### B2. Apakah globalSequence Mundur Saat PO Dihapus?
🔴 **KRITIS** — Ya. Karena `loadPOs()` menghitung ulang dari data yang ada. Bahkan tanpa restart app, `removePO` (line 264-303) **tidak mengubah `globalSequence`** secara eksplisit, tapi saat app di-reload / `loadPOs()` dipanggil ulang, sequence akan mundur.

### B3. Concurrency — Dua User Bersamaan
🔴 **KRITIS** — `incrementGlobalSequence` (line 317-321) hanya increment di **Zustand state lokal per browser**. Tidak ada mekanisme server-side sequence (seperti PostgreSQL `SEQUENCE` atau `SERIAL`). Jika dua user membuka app dan membuat PO bersamaan, keduanya bisa mendapat `globalSequence` yang sama → **barcode collision**.

### B4. Perbedaan Format Barcode Antara Form dan CSV Import
🟠 **TINGGI** — Form manual menggunakan `generateBarcode()` dari `barcode-generator.ts` yang menghasilkan format:
```
PO{nopo}-{globalSeq:5}-BDL{bundleIndex:2}
```
Sedangkan CSV import (`po-import.ts` line 156) menggunakan inline string:
```
PO${nomorPO.replace(...)}-${currentGlobalSeq:5}-BDL${i:2}
```
Kedua implementasi **tidak identik** — `generateBarcode()` melakukan `extractPO` yang menghapus prefix `PO-`, sementara CSV import menghapus semua karakter non-alfanumerik. Untuk PO bernomor `PO-001`:
- Form: `PO001-00001-BDL01`
- CSV: `POPO001-00001-BDL01` (karena `PO-001` → hapus `-` → `PO001` → prefix `PO` ditambah → `POPO001`)

Ini bisa menghasilkan barcode yang inkonsisten antara kedua jalur input.

---

## AUDIT C — removePO

### C1. Data yang DIHAPUS:
| Tabel | Mekanisme | Urutan |
|---|---|---|
| `po_item` | Direct delete, line 272 | 1 |
| `purchase_order` | Direct delete, line 275-278 | 2 |
| `bundle_status_tahap` | Via `removeBundlesByPO`, line 350 | 3 |
| `bundle` | Via `removeBundlesByPO`, line 354 | 4 |
| `koreksi` | Via `removeKoreksiByPO`, line 275 (useKoreksiStore) | 5 |

### C2. Data yang TIDAK DIHAPUS:
🔴 **KRITIS** — Tabel-tabel berikut TIDAK dibersihkan saat PO dihapus:

| Tabel | Dampak |
|---|---|
| `pemakaian_bahan` | Record pemakaian bahan cutting menjadi orphan. Query `getPemakaianBahan` masih bisa mengembalikan data untuk PO yang sudah tidak ada. |
| `scan_history` | Histori scan tetap ada, referensi PO menjadi dangling. |
| `gaji_ledger` | Entry upah karyawan yang terkait bundle PO ini tetap tercatat. Jika PO dihapus lalu karyawan mau dibayar, entry ini masih muncul. |
| `serah_terima_jahit` | Record serah terima menjadi orphan. |
| `surat_jalan` | Jika bundle sudah di-assign ke surat jalan, data surat jalan menjadi inkonsisten (referensi ke bundle yang tidak ada). |

### C3. Urutan Hapus dan FK Constraint
🟠 **TINGGI** — `removeBundlesByPO` (line 283) dipanggil **SETELAH** `purchase_order` dihapus (line 275-278). Jika tabel `bundle` memiliki FK ke `purchase_order`, maka delete PO akan **gagal** karena bundle masih mereferensi PO tersebut. Urutan yang benar seharusnya: hapus bundle dulu, baru hapus PO.

Selain itu, `removeBundlesByPO` dan `removeKoreksiByPO` dipanggil **tanpa `await`** (line 283-284), artinya eksekusi bersifat fire-and-forget dan error-nya tidak ditangkap oleh blok `try-catch` di `removePO`.

---

## AUDIT D — CSV Import

### D1. Pengecekan Nomor PO Duplikat
**Temuan**: ✅ Ada pengecekan di `processPOCSV` line 74-78. `existingNomorPOs` dikirim dari `ModalImportPO.tsx` line 40 (`poList.map(p => p.nomorPO)`). PO duplikat akan dilewati dengan pesan error.

### D2. Penanganan Error Per Baris
🟠 **TINGGI** — Jika satu baris CSV memiliki SKU yang tidak ditemukan, **hanya baris itu yang dilewati** (line 102-103, `return` di dalam forEach). Baris lain di PO yang sama **tetap diproses**. Ini berarti satu PO bisa terimpor dengan item yang tidak lengkap — misalnya PO punya 5 item tapi hanya 3 yang valid. Tidak ada warning bahwa PO tersebut parsial.

### D3. CSV Import TIDAK Menggunakan Atomic RPC
🔴 **KRITIS** — `ModalImportPO.tsx` line 67-68:
```typescript
summary.pos.forEach(po => addPO(po));
addBundles(summary.bundles);
```
Import CSV menggunakan `addPO()` (non-atomic, insert PO + items terpisah) dan `addBundles()` (hanya update state lokal, **TIDAK insert ke Supabase**). Artinya:
- PO dan items diinsert ke DB via `addPO`
- Bundle **HANYA masuk ke Zustand state**, TIDAK masuk ke database
- Setelah app di-reload, semua bundle hasil import **hilang total**

### D4. Validasi Format Barcode
🟡 **SEDANG** — Tidak ada validasi format barcode yang dihasilkan. Barcode dibuat secara inline tanpa pengecekan apakah sudah ada barcode dengan kode yang sama di database.

---

## AUDIT E — _bundleIdMap

### E1. Pengisian _bundleIdMap Setelah createPOWithBundles
🔴 **KRITIS** — Setelah `createPOWithBundles` berhasil, fungsinya memanggil `addBundles()` (line 455) yang hanya melakukan:
```typescript
set((state) => ({ bundles: [...state.bundles, ...newBundles] }));
```
**`_bundleIdMap` TIDAK diisi.** Mapping `barcode → DB id` tidak tercipta.

### E2. Dampak ke updateStatusTahap
🟠 **TINGGI** — Karena `_bundleIdMap` kosong untuk bundle yang baru dibuat, `updateStatusTahap` (line 214-227) harus melakukan **fallback query ke database** setiap kali operator melakukan scan pada bundle baru:
```typescript
let bundleDbId = get()._bundleIdMap[barcode];
if (!bundleDbId) {
  const { data } = await supabase.from('bundle').select('id').eq('barcode', barcode).single();
  ...
}
```
Ini menambah **latency ekstra** per-scan dan **N+1 query** jika banyak bundle baru discan berturut-turut. Secara fungsional tidak error, tapi merupakan bottleneck performa.

### E3. _bundleIdMap Setelah CSV Import
🔴 **KRITIS** — Karena CSV import tidak memasukkan bundle ke database sama sekali (lihat D3), `_bundleIdMap` jelas kosong, dan fallback query pun akan gagal (bundle tidak ada di DB). **Scan pada bundle hasil import akan error total.**

---

## DAFTAR SEMUA TEMUAN (diurutkan severity)

| Kode | Severity | Lokasi | Deskripsi Singkat |
|------|----------|--------|-------------------|
| D3 | 🔴 KRITIS | `ModalImportPO.tsx` L67-68 | CSV Import tidak menyimpan bundle ke database — data hilang saat reload |
| B1 | 🔴 KRITIS | `usePOStore.ts` L156-158 | globalSequence dihitung dari PO yang ada — mundur saat PO dihapus → barcode collision |
| B2 | 🔴 KRITIS | `usePOStore.ts` L156-160 | globalSequence reset saat app reload setelah PO dihapus |
| B3 | 🔴 KRITIS | `usePOStore.ts` L317-321 | Tidak ada server-side sequence — dua user bisa generate barcode sama |
| A4 | 🔴 KRITIS | `usePOStore.ts` L455, L489-496 | Bundle tidak di-rollback dari useBundleStore saat RPC gagal |
| C2 | 🔴 KRITIS | `usePOStore.ts` L264-303 | removePO tidak membersihkan pemakaian_bahan, scan_history, gaji_ledger, serah_terima, surat_jalan |
| E1 | 🔴 KRITIS | `usePOStore.ts` L455 | _bundleIdMap tidak diisi setelah createPOWithBundles |
| E3 | 🔴 KRITIS | `ModalImportPO.tsx` L67-68 | Bundle CSV tidak ada di DB → scan akan gagal total |
| A2 | 🟠 TINGGI | `po-import.ts` L158-176 | poItemId tidak diset pada bundle saat CSV import |
| A5c | 🟠 TINGGI | `usePOStore.ts` L460 | Bundle `id` dari TypeScript selalu `undefined` → bergantung pada DB default |
| B4 | 🟠 TINGGI | `barcode-generator.ts` vs `po-import.ts` L156 | Format barcode tidak konsisten antara form manual dan CSV import |
| C3 | 🟠 TINGGI | `usePOStore.ts` L275-284 | Urutan delete salah (PO dihapus sebelum bundle) + operasi cleanup tidak di-await |
| D2 | 🟠 TINGGI | `po-import.ts` L93-104 | PO bisa terimpor parsial tanpa warning jika sebagian SKU tidak valid |
| A3 | 🟡 SEDANG | `FormInputPO.tsx` L103,116 vs `usePOStore.ts` L453 | Sequence increment terjadi di dua tempat berbeda |
| A5a | 🟡 SEDANG | `FormInputPO.tsx` L108 | tanggal_input format string di-cast ke TIMESTAMPTZ → timezone ambiguity |
| A5b | 🟡 SEDANG | `toPORow` L68 | tanggal_deadline null bergantung pada implicit PostgreSQL cast behavior |
| D4 | 🟡 SEDANG | `po-import.ts` L156 | Tidak ada validasi barcode duplikat terhadap database |
| E2 | 🔵 INFO | `useBundleStore.ts` L214-227 | Fallback query per-scan menambah latency — performance concern |

---

## STATUS
- [x] Audit selesai penuh
