# Laporan Perbaikan Bug Phase 10 — Modul Inventori & Gudang

**Project:** STITCHLYX SYNCORE V2  
**Tanggal Fix:** 2026-04-15  
**Bug yang Diperbaiki:** #29 s/d #33

---

## BUG #29 — Double Stok Pembelian (KRITIS)

**File:** `src/features/keuangan/JurnalUmum/ModalTambahJurnal.tsx`

**SEBELUM:**
Fungsi `executeSubmit` memanggil `addBatch()` secara langsung untuk kategori `direct_bahan`, kemudian memanggil `onConfirm(pendingData)` yang pada akhirnya memanggil `useJurnalStore.addEntry()` → RPC `record_purchase_atomic`. RPC tersebut **sudah termasuk** INSERT ke `inventory_batch` dan UPDATE stok. Akibatnya stok bertambah dua kali setiap pembelian.

**SESUDAH:**
Blok `addBatch()` di dalam `executeSubmit` dihapus sepenuhnya. Ditambahkan komentar eksplanasi agar tidak ada programmer selanjutnya yang menambahkan `addBatch()` kembali secara naif. Hanya `await onConfirm(pendingData)` yang tersisa.

---

## BUG #30 — consumeFIFO Tidak Atomik → Race Condition & Stok Negatif (KRITIS)

**File:** `Docs/SQL_PHASE_10_ATOMIC_FIFO.sql` (Baru), `src/stores/useInventoryStore.ts`, `src/features/produksi/ScanStation/ScanResult.tsx`

**SEBELUM:**
- Implementasi memanggil multi-UPDATE terpisah via `Promise.all()` dari client — tidak atomik, rentan partial failure.
- Tidak ada guard stok negatif: jika stok habis, `updateStock(itemId, -qtyNeeded)` tetap mengurangi stok penuh tanpa peduli berapa yang tersedia.
- Race condition: dua operator bersamaan membaca snapshot batch yang sama, lalu UPDATE saling menimpa (lost update).

**SESUDAH:**
- Dibuat PostgreSQL function `consume_fifo_atomic` menggunakan `SELECT FOR UPDATE` (row-level locking) untuk mencegah race condition.
- Seluruh operasi (UPDATE `qty_terpakai` semua batch + UPDATE `inventory_item.stok`) terjadi dalam satu DB transaction.
- Stok tidak bisa negatif karena menggunakan `GREATEST(0, stok - qty_actually_consumed)`.
- Mengembalikan JSONB `{ insufficient, qtyShortfall }` jika stok tidak cukup — produksi tidak dihentikan.
- `useInventoryStore.consumeFIFO` diganti untuk memanggil RPC, lalu refresh state Zustand dari DB.
- `ScanResult.tsx`: menampilkan toast `warning('Stok Tidak Cukup', ...)` jika `fifoResult.insufficient === true`, tanpa throw error.

---

## BUG #31 — invoiceCounter Tidak Persisten Lintas Sesi (SEDANG)

**File:** `src/stores/useInventoryStore.ts`

**SEBELUM:**
`generateInvoiceNo()` menggunakan Zustand state `invoiceCounter` yang reset ke `1` setiap kali halaman di-refresh. Menyebabkan nomor invoice duplikat antara sesi berbeda.

**SESUDAH:**
`generateInvoiceNo()` sekarang `async` dan memanggil RPC `get_next_invoice_number()` yang menggunakan PostgreSQL `SEQUENCE` persisten. Setiap pemanggilan menghasilkan ID nomor yang selalu unik global. Dilengkapi fallback ke timestamp jika RPC gagal.

Interface di `InventoryState` diperbarui: `generateInvoiceNo: () => Promise<string>`.

---

## BUG #32 — Tidak Ada Validasi qty dan harga di addBatch (SEDANG)

**File:** `src/stores/useInventoryStore.ts`

**SEBELUM:**
`addBatch()` menerima batch dengan qty = 0 atau hargaSatuan = 0 tanpa validasi, menyebabkan batch record kosong/tidak valid tersimpan ke database.

**SESUDAH:**
Ditambahkan guard di awal `addBatch()` sebelum operasi apapun:
```typescript
if (!batch.qty || batch.qty <= 0)         throw new Error('Qty batch harus lebih dari 0.');
if (!batch.hargaSatuan || batch.hargaSatuan <= 0) throw new Error('Harga satuan harus lebih dari 0.');
```

---

## BUG #33 — Tidak Ada isSubmitting Guard pada FormBahanBaku (SEDANG)

**File:** `src/features/inventory/OverviewStok/FormBahanBaku.tsx`

**SEBELUM:**
`handleSubmit` tidak memiliki state `isSubmitting`, sehingga double-click bisa membuat dua item dengan ID berbeda ter-insert secara berurutan.

**SESUDAH:**
Ditambahkan state `const [isSubmitting, setIsSubmitting] = useState(false)` dan logika `try/finally` di dalam `handleSubmit`. Tombol submit memiliki `disabled={isSubmitting}` dan teks berubah menjadi 'Menyimpan...' selama proses berlangsung.

---

## VERIFIKASI FILE INTEGRITY

| File | Baris Terakhir | Status |
|------|---------------|--------|
| `SQL_PHASE_10_ATOMIC_FIFO.sql` | `$$ LANGUAGE plpgsql;` | ✅ Utuh |
| `useInventoryStore.ts` | Baris 352: `}));` | ✅ Utuh |
| `ModalTambahJurnal.tsx` | Baris 314: `}` | ✅ Utuh |
| `ScanResult.tsx` | Perubahan parsial (baris 189–203) | ✅ Tidak terpotong |
| `FormBahanBaku.tsx` | Perubahan parsial (baris 28–40 + 108–116) | ✅ Tidak terpotong |
