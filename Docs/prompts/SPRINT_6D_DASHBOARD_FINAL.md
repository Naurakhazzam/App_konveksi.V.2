# PROMPT — Sprint 6D: Dashboard Keuangan & Optimasi Akhir

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` terlebih dahulu.
Sprint 6A, 6B, dan 6C telah menyelesaikan hampir seluruh elemen finansial Stitchlyx (Jurnal Umum, HPP, Laba Rugi, Gaji, Reject).

Sprint 6D ini berfokus pada **Penyajian Data Keuangan Level Eksekutif** di Dashboard Utama (`MainDashboardView`) dan optimasi performa serta keamanan terakhir untuk modul keuangan secara keseluruhan sebelum kita masuk ke Phase Migrasi Database.

**Masalah yang ditemukan di Sprint 5D:**
1. Dashboard utama menampilkan Saldo Kas, namun belum menampilkan metrik rentabilitas (misal: Laba Berjalan Bulan Ini).
2. Tampilan log aktivitas keuangan kurang terfokus.
3. Struktur komponen Dashboard belum memanfaatkan penuh data HPP Realisasi yang dibangun di Sprint 6B.

**Sprint 6D ini akan membangun:**
1. Penambahan "Finance Widget" di Dashboard Utama.
2. Finalisasi Audit Log khusus filter Keuangan.
3. Code cleanup dan final testing TypeScript untuk semua modul Keuangan (Sprint 6).

## Aturan Wajib
(Sama dengan aturan standar Sprint 6)

---

## BAGIAN 1: FINANCE WIDGET DI DASHBOARD

### 1.1 `MainDashboardView.tsx` (UPDATE)

**File:** `src/features/dashboard/MainDashboard/MainDashboardView.tsx`

**Perbaikan & Kalkulasi:**
- Tambahkan KPI / Widget baru khusus untuk **Profitabilitas**.
- Widget ini mengambil data omzet bulan berjalan dikurangi pengeluaran bulan berjalan dari `useJurnalStore`.

**Struktur Layout Baru:**
- Ganti salah satu KPI Card atau tambahkan deretan baru untuk menampilkan "Laba/Rugi Bulan Ini".
- Berikan indikator visual (Panah Hijau naik / Panah Merah turun) yang membandingkan dengan bulan sebelumnya (sekadar dummy comparison untuk saat ini jika data bulan lalu tidak lengkap).

---

## BAGIAN 2: AUDIT LOG (FINANCIAL FOCUS)

### 2.1 `AuditLogView.tsx` (UPDATE)

**File:** `src/features/dashboard/AuditLog/AuditLogView.tsx`

**Perbaikan:**
- Pastikan filter `keuangan` dapat membedakan mana yang merupakan aksi Jurnal Manual vs Otomatis (misal: dari Pembelian Bahan P0-XXX).
- Tambahkan icon uang (Dollar/Rupiah) pada list jika itu terkait dengan modul Keuangan.
- Pastikan `nominal` (meskipun hanya meta data) dapat ditampilkan singkat di baris log jika relevan. (Contoh: "Tambah Transaksi - Pembelian Kain [Rp 2.500.000]").

---

## BAGIAN 3: FINALISASI & CLEANUP

### 3.1 Resolusi Error Type & Build
- Karena kompleksnya kalkulasi HPP (`finance-calculations.ts`), pastikan semua interface memiliki fallback yang tepat (hindari error `undefined`).
- Jalankan `npx tsc --noEmit` dan selesaikan DENGAN TUNTAS jika ada sisa error typing di seluruh `src/features/keuangan/`.
- Hapus semua code berstatus `// TODO:` atau `console.log` di lingkup keuangan.

---

## Deliverable Sprint 6D (Final Sprint 6)

- [ ] MainDashboardView: Diperbarui dengan informasi Laba/Rugi bulan berjalan.
- [ ] AuditLogView: Tampilan khusus untuk log Keuangan diperkaya.
- [ ] Code Cleanup selesai tanpa sisa.
- [ ] `npx tsc --noEmit` = 0 errors (ZERO ERRORS untuk satu sistem penuh).
