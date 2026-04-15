# LAPORAN AUDIT PHASE 10 — Modul Inventori & Gudang

**Project:** STITCHLYX SYNCORE V2  
**Tanggal Audit:** 2026-04-15  
**Fase:** PHASE 10 — Inventori, Gudang, & FIFO

---

## RINGKASAN EKSEKUTIF

Modul Inventori memiliki fondasi yang cukup baik — FIFO sorting berurutan, stok minimum alert page, dan integrasi jurnal untuk pembelian via `record_purchase_atomic`. Namun terdapat **lima celah kritikal** yang dapat menyebabkan stok negatif tanpa peringatan, race condition pada konsumsi bersama, dan data inconsistency antara tabel `stok` di `inventory_item` vs hitungan aktual dari `inventory_batch`. Satu bug di `addBatch` menyebabkan stok bisa meningkat dua kali lipat dalam satu operasi pembelian normal.

---

## AUDIT A — Pembelian Bahan (Purchase)

### ✅ A-1 (INFO): Pembelian Bahan Sudah Atomik
`ModalTambahJurnal.tsx` menggunakan RPC `record_purchase_atomic` untuk jenis `direct_bahan`. Operasi INSERT ke `jurnal_entry` dan INSERT ke `inventory_batch` + UPDATE `inventory_item.stok` dijamin terjadi dalam satu PostgreSQL transaction. Ini sudah benar.

### 🔴 A-2 (KRITIS): Double-Stok pada Pembelian via `addBatch`
**File:** `useInventoryStore.ts` (baris 170–198) & `ModalTambahJurnal.tsx` (baris 91–102)

Di `ModalTambahJurnal.tsx`, ketika kategori `direct_bahan` dipilih, fungsi `handleSubmit` / `executeSubmit` (setelah fix Phase 9) secara **langsung memanggil `addBatch()`** SEBELUM memanggil `onConfirm(finalData)`. `onConfirm` kemudian memanggil `useJurnalStore.addEntry()`, yang juga memanggil RPC `record_purchase_atomic` — yang sudah termasuk INSERT ke `inventory_batch` dan UPDATE stok di dalamnya.

Akibatnya, untuk setiap pembelian bahan melalui Jurnal:
1. `addBatch()` dipanggil dari modal → stok +N (pertama)
2. RPC `record_purchase_atomic` dipanggil dari store → stok +N (kedua)

**Stok akan double setiap kali ada pembelian bahan baku melalui Jurnal Umum.**

### 🟡 A-3 (SEDANG): Tidak Ada Validasi qty > 0 dan harga > 0 di `addBatch`
`useInventoryStore.addBatch` (baris 170–198) tidak memvalidasi apakah `batch.qty > 0` atau `batch.hargaSatuan > 0` sebelum menyimpan ke Supabase. Jika ada pemanggil yang mengirim qty = 0, maka batch record kosong akan terpersist di database.

### 🟡 A-4 (SEDANG): Tidak Ada `isSubmitting` Guard pada `FormBahanBaku`
**File:** `FormBahanBaku.tsx` (baris 29–33)

Fungsi `handleSubmit` tidak memiliki perlindungan double-click. Jika admin me-klik "Simpan" dua kali secepat kilat, dua baris item dengan ID berbeda (karena `Date.now()` bisa sama di ms yang sama dalam test cepat) bisa ter-insert.

---

## AUDIT B — FIFO Consumption

### ✅ B-1 (INFO): Urutan FIFO Sudah Benar
Fungsi `consumeFIFO` (baris 261–314) melakukan sort berdasarkan `tanggal ascending` sebelum iterasi:
```ts
.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
```
Ini mengambil batch yang paling lama pertama — sesuai prinsip FIFO.

### 🔴 B-2 (KRITIS): Stok Negatif Tanpa Guard
**File:** `useInventoryStore.ts` (baris 261–313)

Pada akhir loop FIFO, variable `remainingToConsume` bisa tetap > 0 jika total stok tersedia tidak mencukupi. Namun kode tidak memeriksa kondisi ini — tidak ada `if (remainingToConsume > 0) throw new Error(...)` atau warning apapun. Kode tetap memanggil:
```ts
await get().updateStock(itemId, -qtyNeeded);
```
...dengan nilai `qtyNeeded` yang penuh, terlepas dari berapa yang sebenarnya tersedia. **Ini menyebabkan stok bisa menjadi negatif** tanpa ada error yang terlempar ke UI, dan tanpa ada rollback.

### 🔴 B-3 (KRITIS): consumeFIFO Tidak Atomik di Database
**File:** `useInventoryStore.ts` (baris 296–313)

Proses update `qty_terpakai` di Supabase menggunakan `Promise.all()` dari beberapa UPDATE terpisah — bukan satu RPC transaction. Jika satu UPDATE berhasil tapi yang lain gagal (network flap, timeout), data `qty_terpakai` di berbagai batch akan tidak konsisten satu sama lain. Tidak ada rollback karena ke-5 operasi dijalankan dari client. **State lokal sudah berubah sebelum Supabase update, dan tidak ada cara untuk mengembalikannya.**

### 🟡 B-4 (SEDANG): Race Condition Antar Operator
**File:** `useInventoryStore.ts` (baris 261–314)

Jika dua operator scan produksi bersamaan (mis. cutting dua bundle berbeda yang pakai kain yang sama), keduanya membaca `batches` state yang sama dari memori Zustand, menghitung FIFO dari snapshot yang identik, lalu keduanya UPDATE `qty_terpakai` ke Supabase. Operasi yang kedua menimpa nilai dari yang pertama, **mengakibatkan under-deduction** (konsumsi yang seharusnya dua kali hanya dicatat sekali).

Ini adalah masalah *lost update* klasik yang hanya bisa diselesaikan dengan database-level locking (SELECT FOR UPDATE atau atomic RPC).

---

## AUDIT C — Akurasi Stok

### 🔴 C-1 (KRITIS): Dua Sumber Kebenaran Stok yang Tidak Disinkronkan
**File:** `useInventoryStore.ts` (baris 147–166 `updateStock`, baris 294–295)

Terdapat dua sumber kebenaran untuk nilai stok:
1. `inventory_item.stok` — kolom numerik tunggal yang di-increment/decrement
2. Total `SUM(inventory_batch.qty - qty_terpakai)` — nilai yang bisa dihitung dari semua batch

Keduanya harusnya identik, tapi `updateStock` menggunakan nilai dari Zustand state yang sudah di-update optimistically (baris 155–161), bukan `SUM` dari database. Jika ada operasi yang gagal di tengah jalan (partial failure), kedua nilai ini akan diverge permanen tanpa ada mekanisme rekonsiliasi.

### ✅ C-2 (INFO): Alert Stok Minimum Sudah Ada
`OverviewStokView.tsx` dan `AlertOrderView.tsx` sudah menampilkan badge RENDAH/HABIS berdasarkan `stokAktual <= stokMinimum`. Juga ada halaman khusus `Alert Order` yang mem-filter item bermasalah.

### 🟡 C-3 (SEDANG): Tidak Ada Fitur Stock Adjustment Manual
Tidak ditemukan UI atau store method untuk *stock adjustment* (koreksi perbedaan fisik vs sistem). Jika stok fisik berbeda dari sistem (misalnya karena barang hilang, rusak, atau kesalahan perhitungan), tidak ada cara untuk memperbaikinya kecuali menambah batch pembelian fiktif — yang akan merusak laporan keuangan.

### 🔵 C-4 (INFO): Histori Pemakaian Tidak Menyimpan Snapshot Harga
**File:** `inventory.types.ts` (baris 30–41 `TransaksiKeluar`)

`TransaksiKeluar` memiliki field `fifoData` yang menyimpan detail konsumsi termasuk `harga` per batch. Ini sudah cukup untuk audit histori HPP.

---

## AUDIT D — Konsistensi Data

### 🟠 D-1 (TINGGI): Tidak Ada Guard Hapus Item Master
Tidak ditemukan method `removeItem` atau `deleteInventoryItem` di `useInventoryStore.ts`. Namun jika dilakukan langsung via Supabase dashboard (atau jika ditambahkan nanti), menghapus `inventory_item` tanpa menghapus `inventory_batch` yang terkait akan meninggalkan orphan batch records — atau sebaliknya terhapus cascade dan merusak histori pemakaian jika ada FK constraint dengan ON CASCADE DELETE.

### 🟡 D-2 (SEDANG): `invoiceCounter` Tidak Persisten
**File:** `useInventoryStore.ts` (baris 246–255 `generateInvoiceNo`)

`invoiceCounter` hanya disimpan di Zustand state (in-memory). Setiap kali halaman di-refresh atau user baru login, counter kembali ke `1`. Ini menyebabkan nomor invoice yang duplikat lintas sesi — mis. invoice pertama hari ini tertulis `0001/INV/15/04/26`, besok setelah refresh nomor yang sama muncul lagi.

### 🔵 D-3 (INFO): Tidak Ada `updated_at` di `InventoryBatch`
Type `InventoryBatch` tidak memiliki field `updated_at`. Perubahan `qty_terpakai` tidak meninggalkan audit trail kapan terjadinya. Berguna untuk debugging reconciliation issues.

---

## AUDIT E — Edge Cases

### 🔴 E-1 (Konfirmasi B-2 + B-4): Stok Negatif & Lost Update
Sudah didokumentasikan di B-2 (insufficient stock tidak ditolak) dan B-4 (race condition dua operator bersamaan). Dalam skenario kasus terburuk: stok kain = 5m, dua bundle bersamaan minta masing-masing 4m → keduanya lolos validasi → stok akhir = 5 - 4 - 4 = **-3m** tanpa pesan error ke operator.

### 🟠 E-2 (TINGGI): Tidak Ada Batas Minimum Restock Trigger
`stokMinimum` sudah ada sebagai field di database, tapi sistem hanya menampilkan alert pasif di UI. Tidak ada notifikasi proaktif (mis. toast, badge di navbar, atau email trigger) saat stok item melewati batas minimum. Operator hanya tahu jika secara aktif membuka halaman "Alert Order".

---

## TABEL SEVERITY TEMUAN

| Kode | Severity | Deskripsi | File Terdampak |
|------|----------|-----------|----------------|
| A-2 | 🔴 KRITIS | Double-stok: `addBatch` dipanggil dua kali per pembelian (dari modal DAN dari RPC) | `ModalTambahJurnal.tsx`, `useInventoryStore.ts` |
| B-2 | 🔴 KRITIS | `consumeFIFO` tidak menolak saat stok tidak cukup → stok negatif tanpa error | `useInventoryStore.ts` |
| B-3 | 🔴 KRITIS | `consumeFIFO` tidak atomik — multi-UPDATE terpisah tanpa rollback | `useInventoryStore.ts` |
| C-1 | 🔴 KRITIS | Dua sumber kebenaran stok (`stok` kolom vs SUM batch) bisa diverge | `useInventoryStore.ts` |
| D-1 | 🟠 TINGGI | Tidak ada guard hapus item master dari sisi aplikasi | `useInventoryStore.ts` |
| E-2 | 🟠 TINGGI | Alert stok minimum hanya pasif — tidak ada notifikasi proaktif | `AlertOrderView.tsx` |
| A-3 | 🟡 SEDANG | `addBatch` tidak memvalidasi qty > 0 dan harga > 0 | `useInventoryStore.ts` |
| A-4 | 🟡 SEDANG | `FormBahanBaku` tidak ada isSubmitting guard | `FormBahanBaku.tsx` |
| B-4 | 🟡 SEDANG | Race condition dua operator bersamaan untuk batch yang sama | `useInventoryStore.ts` |
| C-3 | 🟡 SEDANG | Tidak ada fitur Stock Adjustment Manual | — (missing feature) |
| D-2 | 🟡 SEDANG | `invoiceCounter` tidak persisten lintas sesi | `useInventoryStore.ts` |
| D-3 | 🔵 INFO | Tidak ada field `updated_at` di `InventoryBatch` | `inventory.types.ts` |

---

## VERIFIKASI FILE INTEGRITY

| File | Baris Terakhir | Status |
|------|---------------|--------|
| `useInventoryStore.ts` | Baris 338: `});` | ✅ Utuh |
| `inventory.types.ts` | Baris 42: `}` | ✅ Utuh |
| `OverviewStokView.tsx` | Baris 147: (blank) | ✅ Utuh |
| `FormBahanBaku.tsx` | Baris 118: (blank) | ✅ Utuh |
| `AlertOrderView.tsx` | Baris 83: (blank) | ✅ Utuh |
