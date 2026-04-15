# LAPORAN AUDIT PHASE 8 — MODUL RETUR KONSUMEN

## RINGKASAN EKSEKUTIF
Modul Retur Konsumen memiliki arsitektur pipeline yang kreatif dan cukup komprehensif (4 station: Penerimaan → Penugasan Perbaikan → Pengiriman Balik → Monitoring). Namun, terdapat **2 celah kritis (🔴)** yang signifikan: proses `handleConfirm` di `PenerimaanReturView` menjalankan **3 operasi DB terpisah tanpa atomisitas** (payroll ledger + return_items + bundle status reset) sehingga rentan terhadap partial-write, serta **tidak ada validasi apakah bundle sudah berstatus 'diterima' oleh klien** sebelum retur diproses.

---

## HOTFIX — dibuatOleh Hardcoded (Phase 7 Carry-over)
**File:** `src/features/pengiriman/BuatSuratJalan/BuatSuratJalanView.tsx`

**Sebelum:** `dibuatOleh: 'ADMIN'`  
**Sesudah:** `dibuatOleh: currentUser?.nama ?? 'Admin'`

Perbaikan dilakukan sebelum audit Phase 8. File terakhir: L175 `}` ✅

---

## AUDIT A — Pembuatan Retur

### A-1 🔴 KRITIS — Tidak Ada Validasi Status SJ 'diterima'
**Lokasi:** `PenerimaanReturView.tsx` → `handleSearch` (baris 31–41)

Pencarian bundle menggunakan `bundles.find(x => x.barcode === search)` tanpa memeriksa apakah bundle tersebut sudah berstatus `diterima` di Surat Jalan. Sistem tidak mempunyai guard `suratJalanId` maupun `status_sj === 'diterima'`. Ini berarti **operator bisa meretur bundle yang masih dalam perjalanan pengiriman** atau bahkan bundle yang belum pernah dikirim sama sekali.

### A-2 🔴 KRITIS — Operasi Retur Tidak Atomik
**Lokasi:** `PenerimaanReturView.tsx` → `handleConfirm` (baris 74–139)

Tiga operasi database independen dijalankan berurutan tanpa satu transaksi:
1. `addLedgerEntry()` → insert ke `gaji_ledger`
2. `addReturn()` → insert ke `return_items`
3. `updateStatusTahap()` × 6 loop → update `bundle_status_tahap` berulang kali

Jika koneksi terputus setelah step 1 tapi sebelum step 2, upah karyawan sudah terpotong tetapi data retur tidak tercatat. Tidak ada rollback untuk `addLedgerEntry`.

### A-3 🟠 TINGGI — Tidak Ada Proteksi Double-Submit (isSubmitting)
**Lokasi:** `PenerimaanReturView.tsx` → tombol "Konfirmasi & Potong Gaji" (baris 223)

Tombol konfirmasi tidak memiliki state `isSubmitting`/`disabled` selama operasi async berlangsung. Klik ganda dapat mengeksekusi `handleConfirm` dua kali, menghasilkan dua entri potongan gaji untuk satu retur yang sama.

### A-4 🟡 SEDANG — klienId Hardcoded sebagai Placeholder
**Lokasi:** `PenerimaanReturView.tsx` baris 110: `klienId: 'EXTERNAL-CONS'`

Semua retur dicatat atas nama klien fiktif `'EXTERNAL-CONS'`. Tidak ada relasi ke klien aktual dari SJ induk. Laporan retur per-klien tidak akan akurat.

---

## AUDIT B — Dampak ke Stok / Inventaris

### B-1 🟠 TINGGI — Tidak Ada Update Stok Bahan saat Retur Diterima
**Lokasi:** `PenerimaanReturView.tsx` → `handleConfirm`

Saat bundle diretur dan diterima kembali, tidak ada panggilan ke `consumeFIFO` atau operasi inversi (mis. `addToInventory`). Barang fisik kembali ke gudang tapi stok sistem tidak berubah — menyebabkan under-counting stok bahan jika dipakai tracking.

### B-2 🔵 INFO — Reset Status Bundle ke Jalur Perbaikan Sudah Ada
**Lokasi:** `PenerimaanReturView.tsx` baris 127–135

Sistem me-reset status tahap `jahit`, `lkancing`, `bbenang`, `qc`, `steam`, `packing` kembali ke `null` agar bundle bisa masuk antrian ulang. Ini desain yang baik, namun bergantung pada 6 pemanggilan `updateStatusTahap` yang tidak atomik seperti disebut di A-2.

---

## AUDIT C — Status & Alur

### C-1 🔵 INFO — Status Pipeline Lengkap
Status yang ditemukan di kode:
- `diterima` → retur diterima pabrik
- `proses_perbaikan` → tidak terlihat diset secara eksplisit di kode manapun (lihat C-2)
- `siap_kirim` → perbaikan selesai, siap kirim balik
- `selesai` → retur selesai, upah/restitusi dicairkan

### C-2 🟡 SEDANG — Status `proses_perbaikan` Tidak Pernah Diset
**Lokasi:** `StationPerbaikanView.tsx` → `handleAssign` (baris 42–73)

Ketika operator mengonfirmasi penugasan, `updateReturnStatus` langsung mengubah status menjadi `siap_kirim` (baris 64), melewati status `proses_perbaikan`. Status tersebut hanya dirender di tabel monitoring (`queueList` filter `status === 'diterima'`, `activeList` filter `proses_perbaikan` || `siap_kirim`) namun tidak pernah benar-benar dijangkau via proses normal.

### C-3 🟢 BAIK — Proteksi Double-Retur Sudah Ada
**Lokasi:** `PenerimaanReturView.tsx` baris 78–81

Guard `isBarcodeInReturn(foundBundle.barcode)` mencegah memasukkan bundle yang sudah memiliki retur aktif (`status !== 'selesai'`). Proteksi ini berfungsi.

### C-4 🟡 SEDANG — Tidak Ada Fitur Pembatalan Retur
Tidak ditemukan UI atau fungsi untuk membatalkan retur yang sudah dicatat. Jika data retur salah input (barcode keliru, alasan salah), tidak ada mekanisme koreksi selain manipulasi database langsung.

---

## AUDIT D — Konsistensi Data

### D-1 🔴 KRITIS — QTY Retur Tidak Divalidasi terhadap QTY SJ
**Lokasi:** `PenerimaanReturView.tsx` → input `qtyRetur` (baris 172–177)

Input `qtyRetur` hanya dibatasi minimum `min={1}` tanpa batas atas. Tidak ada pengecekan bahwa `qtyRetur <= item.qty` dari Surat Jalan terkait. Operator bisa memasukkan angka retur yang melebihi jumlah yang pernah dikirim, menyebabkan data keuangan dan stok tidak konsisten.

### D-2 🟠 TINGGI — Snapshot Artikel Hanya Sebagian
**Lokasi:** `useReturnStore.ts` / `PenerimaanReturView.tsx`

`artikelNama` disimpan sebagai string (snapshot), namun `alasanRejectId` disimpan sebagai ID referensi. Jika `alasanReject` diubah atau dihapus di master data, laporan retur lama akan menampilkan ID yang tidak terbaca alih-alih nama lengkap alasannya. Lihat `MonitoringReturView.tsx` baris 37: `<Badge>{v}</Badge>` — hanya menampilkan ID.

### D-3 🔵 INFO — Data Snapshot sebagian sudah disimpan
Field `originalSize`, `currentSize`, `karyawanOriginal`, `nominalPotongan`, `qtyBundle` disimpan sebagai data langsung (tidak hanya ID), yang merupakan praktik baik untuk historis.

---

## AUDIT E — Edge Cases

### E-1 🟠 TINGGI — Penghapusan SJ/PO Induk Tidak Memblokir Retur Aktif
**Lokasi:** `usePOStore.ts` → `removePO`

Meskipun `removePO` kini memeriksa `suratJalanId` pada bundle, tidak ada pengecekan apakah ada `ReturnItem` aktif yang berkaitan (`status !== 'selesai'`) sebelum PO/bundle dihapus. Jika PO dihapus, `removeReturnsByPO` akan menghapus semua retur aktif beserta potongan gaji yang sudah tercatat di ledger — menyisakan orphaned ledger entries tanpa konteks.

### E-2 🔵 INFO — Escrow Payroll Tidak Di-rollback Jika Retur Dibatalkan
**Lokasi:** `StationPerbaikanView.tsx` → `handleAssign`

Saat penugasan dibuat, escrow ledger entry langsung dicatat (`status: 'escrow'`). Jika di kemudian hari retur perlu dibatalkan (E-1 atau kesalahan input), tidak ada mekanisme rollback untuk escrow ini yang berkaitan dengan potongan gaji awal.

---

## DAFTAR SEMUA TEMUAN (diurutkan severity)
| Kode | Severity | Lokasi | Deskripsi Singkat |
|---|---|---|---|
| A-2 | 🔴 KRITIS | `PenerimaanReturView.tsx` | 3 operasi DB retur tidak atomik — potongan gaji bisa terjadi tanpa catatan retur berhasil tersimpan. |
| D-1 | 🔴 KRITIS | `PenerimaanReturView.tsx` | QTY retur tidak divalidasi terhadap QTY SJ asli — bisa memasukkan jumlah melebihi yang dikirim. |
| A-1 | 🔴 KRITIS | `PenerimaanReturView.tsx` | Tidak ada validasi bahwa bundle sudah berstatus 'diterima' di Surat Jalan sebelum diproses retur. |
| A-3 | 🟠 TINGGI | `PenerimaanReturView.tsx` | Tidak ada proteksi double-submit pada tombol konfirmasi retur. |
| B-1 | 🟠 TINGGI | `PenerimaanReturView.tsx` | Tidak ada update stok bahan saat bundle retur diterima kembali ke gudang. |
| D-2 | 🟠 TINGGI | `MonitoringReturView.tsx` | `alasanRejectId` ditampilkan sebagai ID mentah — tidak disimpan sebagai snapshot nama. |
| E-1 | 🟠 TINGGI | `usePOStore.ts` | Tidak ada guard yang mencegah penghapusan PO/bundle jika ada retur aktif. |
| A-4 | 🟡 SEDANG | `PenerimaanReturView.tsx` | `klienId` hardcoded sebagai `'EXTERNAL-CONS'` — retur tidak terhubung ke klien asli. |
| C-2 | 🟡 SEDANG | `StationPerbaikanView.tsx` | Status `proses_perbaikan` tidak pernah diset — langsung lompat ke `siap_kirim`. |
| C-4 | 🟡 SEDANG | Seluruh modul retur | Tidak ada fitur pembatalan retur yang salah input. |
| E-2 | 🔵 INFO | `StationPerbaikanView.tsx` | Escrow payroll entry tidak di-rollback jika retur dibatalkan. |
| B-2 | 🔵 INFO | `PenerimaanReturView.tsx` | Reset 6 tahap bundle sudah ada namun tidak atomik. |
| C-3 | 🟢 | `PenerimaanReturView.tsx` | Guard double-retur per barcode sudah ada dan berfungsi. |

---

## VERIFIKASI FILE INTEGRITY
| File | Total Baris | Baris Terakhir | Status |
|---|---|---|---|
| `BuatSuratJalanView.tsx` (hotfix) | 175 | `}` | ✅ Utuh |
| `PenerimaanReturView.tsx` | 234 | `}` | ✅ Utuh |
| `PengirimanReturView.tsx` | 94 | `}` | ✅ Utuh |
| `StationPerbaikanView.tsx` | 202 | `}` | ✅ Utuh |
| `MonitoringReturView.tsx` | 72 | `}` | ✅ Utuh |
| `useReturnStore.ts` | 173 | `}));` | ✅ Utuh |

## STATUS
- [x] HOTFIX `dibuatOleh` — selesai
- [x] Audit Phase 8 — selesai penuh
