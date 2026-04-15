# LAPORAN AUDIT PHASE 7 — MODUL SURAT JALAN & PENGIRIMAN

## RINGKASAN EKSEKUTIF
Modul Surat Jalan secara fungsional telah memiliki serangkaian _guard_ (satpam klien, validasi Packing) dan fleksibilitas _snapshot historical_ yang sangat baik. Meskipun secara UI sangat intuitif, modul ini rapuh terhadap kegagalan database di latar belakang; fungsi *Push* pengiriman dilakukan secara memisah per-tabel (*non-atomic transactions*) tanpa penahanan janji (_await_), membiarkan probabilitas kebocoran data sangat lebar jika koneksi internet terputus di tengah operasi.

---

## AUDIT A — Pembuatan Surat Jalan
1. **Validasi Bundle Selesai 7 Tahap**: Sudah tervalidasi secara tidak langsung. `ScanBarcodeSJ` akan melempar pesan *Error* apabila bundle belum memiliki status `selesai` pada tahap `Packing` (tahap pamungkas ke-7).
2. **Validasi Kunci Ganda**: Aman. Saat di-_scan_, terdapat _guard_ `if (bundle.suratJalanId) { setError(...) }` yang mana menghindari Bundle masuk ke dua bagasi SJ berbeda.
3. **SuratJalanId pada Bundle**: Tersimpan secara berhasil menggunakan metode iterasi `updateBundleSuratJalan` di akhir antrian aksi konfirmasi.
4. **Isolasi Transaksi (Atomic)**: **GAGAL**. Eksekusi pembuatan tabel di `BuatSuratJalanView` bersifat _Client-side cascade_. Operasi `.insert_surat_jalan`, `.insert_surat_jalan_items`, dan `.update_bundle` dipanggil mandiri oleh *client* (bahkan `addSuratJalan()` tidak di `await`). Apabila API putus internetnya di tengah *chain* eksekusi, sistem akan melahirkan data yatim-piatu tanpa *Rollback*.
   - **Severity**: 🔴 KRITIS

---

## AUDIT B — Status & Transisi
1. **Koleksi Status SJ**: `draft`, `dikirim`, dan `diterima` (dari referensi Object Type).
2. **Siklus Status**: SJ langsung dideklarasikan sebagai `dikirim` paska *submit*. Dari antarmuka **Riwayat Kirim**, terdapat tombol *Action* "Konfirmasi Diterima" yang mengubah status tunggal `dikirim` → `diterima`.
3. **Fleksibilitas Revisi**: Transaksi bersifat _Immutable_ mentah. Ketika admin menekan Buat, tidak ada fitur antarmuka untuk me-*Release/Remove* Bundle dari dalam box *Surat Jalan* jika rupanya ia mem-_scan_ secara kalap di meja. 
   - **Severity**: 🟡 SEDANG
4. **Proteksi Pasca Terkirim/Diterima**: Kuat secara mutlak. UI hanya akan merender tombol persetujuan apabila `sj.status === 'dikirim'`.

---

## AUDIT C — Konsistensi Data
1. **Akurasi QTY Pengiriman vs Pabrik**: Berjalan secara istimewa. Nilai asli dipasang di `qtyPacking`, sementara field iterasi `qtySJ` dilepas bebas namun menagih `alasan` tulisan (_Reason Request_) ketika `qtySJ !== qtyPacking` (baik _Surplus_ maupun _Shortage_ / Hilang).
   - **Severity**: 🔵 INFO *(Sangat canggih & adaptif)*
2. **Implikasi Penghapusan PO di-belakang**: Secara historis SJ akan selamat karena menyimpan salinan di `surat_jalan_items`. Namun di database *Supabase*, pemicu penghapusan PO via `removeBundlesByPO` (di _useBundleStore_) akan mendelete relasional `bundles`. Tanpa relasi valid di *Back-End*, bundle hilang tanpa peringatan blok SJ di sisi operasional PO awal.
   - **Severity**: 🟠 TINGGI
3. **Sinkronisasi Data SJ**: Aman. Identitas *Snapshot* (warna, model, SKU) diabadikan statis ke dalam SJ Items saat digenerasi.

---

## AUDIT D — Edge Cases
1. **Surat Jalan Hantu (Kosong)**: Dicegah oleh deklarator `if (!selectedKlien || localItems.length === 0) return;` dan *disable* tombol Konfirmasi.
2. **Kecurangan Perlintasan Klien**: Disegal kuat. Pemanggilan `handleBundleFound` di *BuatSurtJalanView* menguji `po.klienId !== selectedKlien`. Lintas pengiriman mustahil terjadi.
3. **Duplikasi Nomor Indeks SJ**: *Fungsi Pembangkit Nomor* `getNextNomorSJ` mencetak seri *sequence* nomor berbekal `LIKE 'SJ/%'` dari database secara pasif. Apabila 2 staf pengiriman mengeklik layar secara konvergen (dalam milidetik bersamaan), Keduanya sangat dimungkinkan terunduh skor indeks nomor pelanjut yang persis identik sebelum merangsek menulis Tabel Supabase.
   - **Severity**: 🟠 TINGGI

---

## DAFTAR SEMUA TEMUAN (diurutkan severity)
| Kode | Severity | Lokasi | Deskripsi Singkat |
|---|---|---|---|
| A-1 | 🔴 KRITIS | `BuatSuratJalanView.tsx` & `usePengirimanStore.ts` | Skrip tidak bekerja terpadu secara 1x RPC Atomik melainkan dipilah-pilah. Pemanggilan *Store* via UI berjalan _Asynchronous_ tanpa komando `await` mutlak, mendatangkan malapetaka Partial-Write bilamana koneksi drop/putus di stasiun eksekusi. |
| C-1 | 🟠 TINGGI | Menu PO (Global) | Ketiadaan larangan penghapusan arsip _PO Induk_ yang item turunan *Bundle*-nya telah selesai meluncur ke *Surat Jalan*. |
| D-1 | 🟠 TINGGI | `usePengirimanStore.ts` | Pembangkit Nomor Seri Surat (Sequence Fetcher) *client-side* bisa membangkitkan entri ganda (_Duplicate ID Key_) pada skenario operasi di komputer multipel yang klik bebarengan. |
| B-1 | 🟡 SEDANG | Ruang Operasi Surat Jalan | Minus skema/metode pembatalan mutlak (Hapus) ke entitas Surat Jalan berjalan (Khusus buat staf gudang yang men-submit keliru *Bundle* orang). |
| C-2 | 🔵 INFO | `ModalKonfirmasiSJ.tsx` | Fitur intervensi perbedaan perhitungan Qty yang cerdas (Fleksibilitas Surplus/Kekurangan). |

---

## VERIFIKASI FILE INTEGRITY
*Seluruh komponen ditutup sempurna pada EOF (End of File) mereka masing-masing:*

- `src/stores/usePengirimanStore.ts` -> Baris 189 (`}));`)
- `src/stores/useBundleStore.ts` -> Baris 370 (`}));`)
- `src/features/pengiriman/BuatSuratJalan/ScanBarcodeSJ.tsx` -> Baris 111 (`}`)
- `src/features/pengiriman/BuatSuratJalan/BuatSuratJalanView.tsx` -> Baris 173 (`}`)
- `src/features/pengiriman/RiwayatKirim/DetailSuratJalan.tsx` -> Baris 150 (`}`)
- `src/features/pengiriman/RiwayatKirim/RiwayatKirimView.tsx` -> Baris 113 (`}`)

## STATUS
- [x] Audit selesai penuh
