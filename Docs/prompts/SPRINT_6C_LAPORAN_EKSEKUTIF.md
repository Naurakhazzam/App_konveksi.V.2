# PROMPT — Sprint 6C: Pelaporan Eksekutif (Bulan, Gaji, Reject)

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` terlebih dahulu.
Sprint 6B sudah menyelesaikan Laporan Per PO dengan kalkulasi HPP yang mendalam.

Pada Sprint 5C, komponen pelaporan lainnya (Bulanan, Gaji, Reject) dibuat dengan sangat minimalis dan belum merepresentasikan data yang sesungguhnya secara akurat.

**Masalah yang ditemukan di Sprint 5C:**
1. Laporan Per Bulan: Hanya total nominal tanpa rincian arus kas (Cashflow Statement).
2. Laporan Gaji: Kurang rincian pemotongan kasbon dan integrasi dengan tabel riwayat karyawan.
3. Laporan Reject: Belum diklasifikasikan per tahap produksi (Cutting, Jahit, dll.) maupun per PO.
4. Laporan Reject: Kalkulasi kerugian masih statis dan tidak menggunakan `pemakaianBahan` atau ongkos spesifik.

**Sprint 6C ini akan membangun:**
1. Laporan Bulanan yang komprehensif, mirip dengan standar akuntansi Laba Rugi (Income Statement).
2. Laporan Gaji yang transparan dan terintegrasi dengan modul Master Karyawan.
3. Laporan Reject yang detal untuk analisis Quality Control dan kerugian.

## Aturan Wajib
1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css`
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/`
5. **Data CRUD** = baca/tulis ke Zustand store
6. **'use client'** wajib di setiap komponen yang menggunakan hooks
7. **Store Access** pastikan aman, hindari destructuring di master store yang terlalu dalam jika rawan `undefined`.

---

## BAGIAN 1: LAPORAN PER BULAN (LABA RUGI)

### 1.1 `LaporanBulanView.tsx` (REBUILD)

**File:** `src/features/keuangan/LaporanBulan/LaporanBulanView.tsx`

**Perbaikan & Kalkulasi:**
- Laporan harus menampilkan format **Pemasukan vs Beban Pokok vs Beban Operasional**.

**Struktur Layout & Tabel (Ringkasan P&L):**
1. **Pendapatan (Pemasukan):** Total dari semua transaksi 'masuk'.
2. **HPP / Beban Produksi (Direct):** Total 'direct_bahan' dan 'direct_upah' di bulan tersebut.
3. **Laba Kotor (Gross Profit):** Pendapatan - HPP.
4. **Beban Operasional:** Total 'overhead' di bulan tersebut.
5. **Laba Bersih (Net Profit):** Laba Kotor - Beban Operasional.

**Visual & UX:**
- Gunakan `Panel` terpisah untuk menampilkan "Income Statement" (struktur berjenjang).
- Tampilkan DataTable untuk rincian arus kas (semua entri di bulan tersebut), pisahkan dalam tab atau section berbeda jika terlalu padat.
- Berikan Badge presentase (Contoh: "Net Profit Margin: 15%").

---

## BAGIAN 2: LAPORAN GAJI & KOMPENSASI

### 2.1 `LaporanGajiView.tsx` (REBUILD)

**File:** `src/features/keuangan/LaporanGaji/LaporanGajiView.tsx`

**Perbaikan:**
- Sumber data utama adalah riwayat pembayaran dari `usePayrollStore` (data ledger).
- Selain total "Dibayarkan", tunjukkan juga "Total Upah Kotor", "Total Kasbon Terpotong", dan "Rework".

**Struktur DataTable:**
- Karyawan (Nama + Jabatan)
- Periode/Tanggal
- Upah Kotor (Sebelum potongan)
- Potong Kasbon
- Total Dibayar
- Status (Lunas / Sebagian)
- Aksi: Expand untuk detail job (tahap apa saja yang dikerjakan). *Bisa diringkas menjadi detail teks jika data job terlalu rumit.*

---

## BAGIAN 3: LAPORAN KUALITAS & REJECT

### 3.1 `LaporanRejectView.tsx` (REBUILD)

**File:** `src/features/keuangan/LaporanReject/LaporanRejectView.tsx`

**Perbaikan:**
- Laporan ini diakses oleh QC dan Owner, fokus ke frekuensi reject per Karyawan dan per Jenis Reject.
- Tampilkan total biaya kerugian. Jika sulit dihitung dari HPP item per item, gunakan akumulasi nominal denda (`ledger.tipe === 'reject_potong'`). Namun, sediakan juga estimasi "Biaya Bahan Hilang" jika memadai.

**Layout & KPI:**
- KPI 1: Total PCS Reject (bulan ini).
- KPI 2: Total Nilai Denda (Pemotongan).
- KPI 3: Estimasi Kerugian Kain/Bahan (jika dapat diasumsikan).
- Tampilkan Chart/Bar sederhana HTML untuk Top 3 Jenis Reject yang paling sering muncul (misal: "Jahitan Melenceng", "Kain Lubang").

**Tabel Detail:**
- Tanggal
- PO / Model
- Karyawan Penanggung Jawab
- Jenis Reject
- QTY Reject
- Nominal Denda

---

## Deliverable Sprint 6C

- [ ] LaporanBulanView: Menampilkan struktur Income Statement berjenjang.
- [ ] LaporanGajiView: Tabel diperbarui menampilkan gross vs net (kasbon).
- [ ] LaporanRejectView: Tabel diperkaya dengan filtering dan bar chart frekuensi reject.
- [ ] Dummy data di-update (bila perlu) agar laporan Gaji dan Reject terisi. 
- [ ] `npx tsc --noEmit` = 0 errors.

## Catatan Penting
Integrasi dan pemisahan logika sebaiknya dibuat di helper function (misal: di `finance-calculations.ts` atau utils terpisah) agar View tetap ringkas di bawah 200 baris.
