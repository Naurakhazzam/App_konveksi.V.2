# Laporan Perbaikan Bug Phase 8 — Modul Retur Konsumen

## DAFTAR BUG YANG DIPERBAIKI

### 1. BUG #17 — Validasi Status Bundle Sebelum Retur (A-1)
- **File:** `src/features/retur/PenerimaanReturView.tsx`
- **SEBELUM:** Tidak ada pemeriksaan apakah retur berasal dari bundle yang sudah dikirim di Surat Jalan (SJ). Operator bisa memasukkan barcode apa saja.
- **SESUDAH:** Di `handleSearch`, ditambahkan 2 guard:
  1. `b.suratJalanId` wajib ada (harus pernah ikut SJ).
  2. SJ yang terkait (diambil via `usePengirimanStore`) harus berstatus `'diterima'`. Jika tidak, alert error ditampilkan.

### 2. BUG #18 — Atomic Return via RPC (A-2)
- **File:** `Docs/SQL_PHASE_8_ATOMIC_RETURN.sql` (Baru), `src/stores/useReturnStore.ts`, `src/features/retur/PenerimaanReturView.tsx`
- **SEBELUM:** Tiga operasi independen berjalan berurut (insert payroll ledger, insert return item, reset 6 tahap bundle) di sisi client. Sangat rentan terhadap masalah koneksi (partial data).
- **SESUDAH:** 
  - Membuat SQL function `process_return_atomic` yang menjalankan INSERT ke `return_items`, INSERT ke `gaji_ledger`, dan 6x UPDATE ke `bundle_status_tahap` dalam satu database transaction dengan otomatis *rollback* bila gagal.
  - Menempatkan `processReturnAtomic` pada `useReturnStore` lengkap dengan logika Optimistic Update lokal.
  - Memanggil `processReturnAtomic` pada single `await` di `PenerimaanReturView.tsx`.

### 3. BUG #19 — Validasi QTY Retur (D-1)
- **File:** `src/features/retur/PenerimaanReturView.tsx`
- **SEBELUM:** Nilai QTY bisa diisi *unlimited*, melebihi QTY aslinya.
- **SESUDAH:** Nilai `qty` dari SJ item terkait disimpan di state `maxQtyRetur`. Terdapat validasi input (atribut `max` dan math function constraints min/max) serta guard tambahan di fungsi konfirmasi `qtyRetur > maxQtyRetur` yang mencegah QTY melebihi jumlah yang sebenarnya dikirim.

### 4. BUG #20 — Double-Submit Protection (A-3)
- **File:** `src/features/retur/PenerimaanReturView.tsx`
- **SEBELUM:** Tombol konfirmasi bisa diclick dua kali, mengakibatkan eksekusi ganda dan bug data (duplikat entri pemotongan).
- **SESUDAH:** Hook state `isSubmitting` diimplementasikan dengan blok `try-finally`. Tombol disable saat `isSubmitting` dengan tampilan teks 'Memproses...'.

### 5. BUG #21 — Klien ID dari SJ Aktual (A-4)
- **File:** `src/features/retur/PenerimaanReturView.tsx`
- **SEBELUM:** Payload klienId ter-hardcode sebagai `'EXTERNAL-CONS'`.
- **SESUDAH:** Saat scan barcode, data SJ yang ditemukan digunakan untuk mapping `sj.klienId` secara real dan dimasukkan ke dalam `p_return_item`.

### 6. BUG #22 — Snapshot Nama Alasan Retur (D-2)
- **File:** `src/stores/useReturnStore.ts`, `src/features/retur/PenerimaanReturView.tsx`
- **SEBELUM:** Jika data master tipe reject dihapus, riwayat retur hanya menunjukkan ID yang abstrak.
- **SESUDAH:** `useReturnStore` menangkap kolom snapshot `alasan_reject_nama`. UI di penerimaan menyimpan string alasan aktif yang dipilih `alasanRejectNama` sebelum diserahkan ke RPC, menjaga imunitas history dari perubahan master data.

### 7. BUG #23 — Guard Hapus PO dengan Retur Aktif (E-1)
- **File:** `src/stores/usePOStore.ts`
- **SEBELUM:** Hapus PO hanya mengecek SJ. Membisa menghapus PO meski terdapat retur aktif. 
- **SESUDAH:** Menambahkan pemeriksaan *inline* dari module `useReturnStore` sebelum optimistic update `removePO`. Jika ada `status !== 'selesai'` terkait poId tersebut, proses akan mengembalikan `throw new Error()`.

### 8. BUG #24 — Status proses_perbaikan (C-2)
- **File:** `src/features/retur/StationPerbaikanView.tsx`
- **SEBELUM:** Fungsi assignment skip status `proses_perbaikan` dan menjadikannya langsung `siap_kirim`.
- **SESUDAH:** `handleAssign` meng-update bundle ke status `proses_perbaikan`. Menambahkan handler dan tombol `"✅ Selesai Perbaikan"` baru untuk mengonversi menjadi `siap_kirim` pada List Active In-Progress.

---

## VERIFIKASI FILE INTEGRITY
1. `PenerimaanReturView.tsx`: Baris 277 `}` ✅ Utuh
2. `StationPerbaikanView.tsx`: Baris 217 `}` ✅ Utuh
3. `usePOStore.ts`: Baris 552 `}));` ✅ Utuh
4. `useReturnStore.ts`: Baris 215 `}));` ✅ Utuh
5. `Docs/SQL_PHASE_8_ATOMIC_RETURN.sql`: Normal EOF ✅
