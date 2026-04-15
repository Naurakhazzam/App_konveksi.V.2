# LAPORAN AUDIT PHASE 5 — MODUL PENGGAJIAN STITCHLYX

## RINGKASAN EKSEKUTIF
Modul penggajian berhasil mengimplementasikan pola desentralisasi transaksi (terdistribusi melalui event `ScanStation`) dan pemrosesan terpusat secara Atomik via Supabase RPC. Namun, terdapat **2 Celah Kritis (🔴)** serius terkait logika pembayaran hutang Kasbon yang menyebabkan cicilan utang tidak dikenali oleh sistem, serta anomali UI yang mengunci Karyawan Gaji Pokok untuk tidak bisa menerima pelunasan bulanan jika mereka tidak mengerjakan borongan produksi.

---

## AUDIT A — Kalkulasi Upah
1. **Dasar Penetapan Tarif**: Terintegrasi sangat dinamis dengan `useMasterStore`. Upah dinominalkan melalui kalkulasi `calcNominalPotongan` yang secara _smart_ mencocokkan `tahapLabel` dengan nama komponen di *HPP master data*.
2. **Kalkulasi Akumulatif**: Penjumlahan menggunakan rumusan `qty × upah_tahap`, sudah presisi dan linier. Masing-masing tahap memiliki tarif spesifiknya sendiri.
3. **Validasi Eksistensi Karyawan**: Saat `addLedgerEntry` mencatat log scan, `usePayrollStore` memeriksa silang variabel array `karyawan` untuk mendepak injeksi _ghost driver_/ID palsu.
4. **Severity**: 🔵 INFO

---

## AUDIT B — addLedgerEntry
1. **Arsitektur Pembaruan**: Menerapkan arsitektur _Optimistic Update_ yang handal (+ _State Backups_) yang di-_undo_ ketika `.insert()` melempar eksepsi.
2. **Duplikasi Ledger**: Sistem mendelegasikan ID kepada format *pseudo-random* (`PAY-timestamp-barcode-tahap`). Jika instruksi dikurung oleh _double click protection_ front-end, ini aman, tetapi absennya `UNIQUE CONSTRAINT(sumber_id, tipe)` di database SQL berpotensi menjadi celah *Race Condition*.
3. **Karyawan Tanpa ID**: Dilindungi oleh *guard* garing (`!entry.karyawanId ||.trim() === ''`). Secara logis aman.
4. **Severity**: 🟡 SEDANG *(Celah Duplikasi API Level)*

---

## AUDIT C — Kasbon
1. **Limitasi Peminjaman**: Kasbon diamankan secara rasio dari `ModalTambahKasbon.tsx` (`availableUpah = upahBersih - kasbonSisa`), mencegah minus gaji mutlak dan gagal bayar.
2. **Pemotongan Kasbon Mengambang (BUG KRITIS)**: Ketika admin membayarkan pinjaman memotong ke _Total Bersih_, store `usePayrollStore` mensuntikan record "Potongan Kasbon" dalam status ber-ID `KSB-PYMT-..` dengan instruksi mutlak **`status: 'lunas'`**. Sementara, instruksi `getSisaKasbon` **HANYA menjumlahkan status `belum_lunas`**. Alhasil, cicilan pemotongan dituduh sistem tidak mengurangi *amount* status hutang utama. Outstanding kasbon karyawan akan abadi/permanen, memicu konflik finansial nyata!
3. **Severity**: 🔴 KRITIS

---

## AUDIT D — pay_salary_atomic RPC
1. **Ketahanan Atomik**: Prosedur fungsi PL/pgSQL Postgres terlisensi penuh secara blok _Transaction_. Apabila fase 4 (Catat Jurnal) tertahan integrasi, maka Fase 1 (Sapu Status Ledger -> Lunas) akan digagalkan otomatis (ter-Rollback). Super aman.
2. **Validasi Parameter**: Mapping model Tipe (mis. `.id`, `.total`, `.kategori`) dari TypeScript di-_destructure_ JSONB mulus terhadap kolom-kolom persisten SQL (mencakup _casting_ `::NUMERIC` & `::TIMESTAMPTZ` akurat).
3. **Double Payment Phase Prevention**: Karena sifat array SQL Array `UPDATE gaji_ledger SET status = 'lunas' WHERE id = ANY(p_ledger_ids)`, proses ganda pada entry lama tak berarti ganda.
4. **Severity**: 🔵 INFO *(Excellent Transaction Boundary)*

---

## AUDIT E — Tampilan & Rekap
1. **Formulasi Laba/Gaji**: Gaji total dikomputasi dari `borongan + (gajiPokok/6 * hariKerja) - kasbon`. Formula presisi untuk pekerja mingguan manufaktur.
2. **Filter Rekap**: Operasional filterisasi `dateRange` dalam `calculateUpah.tsx` berhasil mengayak entri _ledger_ berdasar _timestamp_ secara temporal-relevan.
3. **Anomali Kalkulasi KPI**: Komponen Visual *(KPI Card Stat)* di antarmuka `RekapGajiView` tidak mengakui `Gaji Pokok` ke dalam indikator arus uang "Total Upah Periode". Hanya menjumlah `upahBersih`. Konsekuensinya, *Owner* akan melihat kebutuhan _outbound cash_ yang jauh **lebih rendah** dari riil ketika saat pengotorisasian pembayaran *(false misestimation)*.
4. **Severity**: 🟠 TINGGI 

---

## AUDIT F — Edge Cases
1. **Karyawan Tanpa Borongan (BUG KRITIS)**: Karyawan spesifik yang berdedikasi hanya Gaji Pokok (tanpa ada catatan Scan Produksi) mendapati `row.upahBersih = 0`. Dalam `RekapGajiTable.tsx`, terdapat conditional render `{!row.isLunas && row.upahBersih > 0 && <Button>Bayar</Button>}`. Ini meniadakan mutlak eksistensi Tombol "Bayar" dari jangkauan UI Admin, sehingga Karyawan Ber-Gapok Murni tidak bakal pernah bisa digaji dalam sistem!
2. **Kasbon Melebihi Gaji**: Kondisi tereduksi aman, parameter pelindung mem-_filter_ batas mutlak `max={Math.min(rekap.sisaKasbon, upahTotal)}`.
3. **Mantan Karyawan (Non-Aktif)**: Memungkinkan penarikan sisa gaji/tunggakan terkahir karena tidak ada parameter eliminasi `.aktif` di *map loop* utama *RekapGaji*. Cerdas secara praktek SDM.
4. **Severity**: 🔴 KRITIS

---

## DAFTAR SEMUA TEMUAN (diurutkan severity)
| Kode | Severity | Lokasi | Deskripsi Singkat |
|---|---|---|---|
| C-1 | 🔴 KRITIS | `usePayrollStore.ts` & `getSisaKasbon` | Pembayaran potong gajian terekam berstatus 'lunas', sedangkan sistem baca hutang HANYA mencari status 'belum_lunas'. Cicilan hutang tak pernah menipiskan hutang asal karyawan di sistem. |
| F-1 | 🔴 KRITIS | `RekapGajiTable.tsx` | Eksistensi limitir `upahBersih > 0` menghilangkan Tombol "Bayar" bagi buruh harian yang khusus menikmati Gaji Pokok (tanpa riwayat Upah Borongan/Scan). |
| E-1 | 🟠 TINGGI | `RekapGajiView.tsx` | Card Evaluasi (KPI Score) tidak ikut mem-_blending_ Gaji Pokok bulanan/harian ke dalam _"Total Upah"_. Mengorbankan akurasi Estimasi Cashflow sang Bos. |
| B-1 | 🟡 SEDANG | `usePayrollStore` | Tanpa constraint unik di _Database Tables_, _Double submission_ dari injektor backend masih mencatat angka duplikat (Meski aman di front-end). |
| D-1 | 🔵 INFO | Papan RPC SQL | Perlindungan _ACID Transaction_ `pay_salary_atomic` memproteksi pengeluaran arus kas Jurnal jika tahap payroll lainnya dibatalkan. Luar biasa tangguh. |

---

## VERIFIKASI FILE INTEGRITY
*Baris ujung dari seluruh arsip yang diaudit berikut sukses merepresentasikan penutup komponen (EOF) tanpa indikasi terpotong, cacat skrip, maupun block error:*
- `usePayrollStore.ts` -> Baris 332 (`}));`)
- `SQL_PHASE_5_ATOMIC_PAYROLL.sql` -> Baris 80 (`$$ LANGUAGE plpgsql;`)
- `payroll.types.ts` -> Baris 22 (`}`)
- `RekapGajiView.tsx` -> Baris 192 (`}`)
- `RekapGajiTable.tsx` -> Baris 90 (`}`)
- `ModalTambahKasbon.tsx` -> Baris 113 (`}`)
- `ModalBayar.tsx` -> Baris 131 (`}`)

## STATUS
- [x] Audit selesai penuh
