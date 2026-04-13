# PROMPT C4: Laporan Kehilangan & Surplus per Tahap

## Konteks Proyek
Aplikasi manajemen produksi konveksi (Next.js + TypeScript + Zustand). 

**Prerequisite**: Prompt C2 (Sistem Koreksi QTY) harus sudah dikerjakan karena laporan ini membaca data dari `useKoreksiStore`.

## Tugas yang Harus Dikerjakan

### 1. Halaman Laporan Koreksi QTY per Tahap

**File**: Buat di `src/features/produksi/LaporanKoreksi/` (BARU)

Buat halaman laporan yang bisa diakses dari sidebar/navigasi, dengan **filter tahap** di atas:

```
[Dropdown Tahap: Semua | Cutting | Jahit | Lubang Kancing | Buang Benang | QC | Steam | Packing]
[Date Range: Dari ___  Sampai ___ ]
[Tombol: 🖨️ Print Laporan]
```

### 2. Isi Laporan per Tahap

Setiap tahap menampilkan tabel detail:

| No | No. PO | Barcode | Artikel | Jenis | Alasan | QTY | Karyawan Bertanggung Jawab | Nominal Potongan | Status Potongan | Tanggal |
|----|--------|---------|---------|-------|--------|-----|---------------------------|-----------------|----------------|---------|
| 1 | PO-001 | PO001-ABU... | Abudzar Grey x Black S | Reject | Rusak Jahitan | 2 | Aldi | Rp 6.000 | ⏳ Pending | 13 Apr 2026 |
| 2 | PO-001 | PO001-ABU... | Abudzar Grey x Black S | Hilang | - | 1 | Abqi | Rp 3.000 | ✅ Applied | 13 Apr 2026 |
| 3 | PO-002 | PO002-AIR... | Airflow Black S | Lebih | Lebih Cutting | 2 | - | +Rp 6.000 | ✅ Approved | 14 Apr 2026 |

**Kolom penjelasan:**
- **Jenis**: Reject / Hilang / Salah Hitung / Lebih
- **Alasan**: Sub-detail dari jenis (nama reject, atau "Lebih Cutting", dll)
- **QTY**: Jumlah pcs yang terkena koreksi
- **Karyawan Bertanggung Jawab**: Nama karyawan di tahap yang bertanggung jawab
- **Nominal Potongan**: 
  - Untuk kurang: angka negatif (potongan)
  - Untuk lebih: angka positif (tambahan bayar)
- **Status Potongan**: Pending / Applied / Cancelled (reject sudah diperbaiki)

### 3. Ringkasan di Atas Tabel (Summary Cards)

Tampilkan 4 KPI card di atas tabel:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Total Koreksi   │ │ Total Reject    │ │ Total Hilang    │ │ Total Lebih     │
│ 15 pcs          │ │ 8 pcs           │ │ 4 pcs           │ │ 3 pcs           │
│                 │ │ 5 diperbaiki    │ │                 │ │ 2 approved      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

Dan di bawah KPI, ringkasan finansial:
```
Total Potongan Gaji: Rp 150.000  |  Total Tambahan Bayar: Rp 36.000  |  Nett Loss: Rp 114.000
```

### 4. Print Friendly

Ketika tombol "Print Laporan" diklik:
- Halaman bisa di-print dengan layout yang bersih
- Header: "Laporan Koreksi QTY - [Nama Tahap] | Periode: [tanggal mulai] s/d [tanggal akhir]"
- Tabel terformat rapi untuk kertas A4
- Summary cards di-print sebagai tabel ringkasan
- Sembunyikan sidebar, navbar, dan elemen UI yang tidak perlu saat print

### 5. Navigasi

Tambahkan navigasi ke halaman ini:
- Di sidebar bisa ditambahkan di bawah section "Produksi" atau "Laporan"
- Beri nama menu: "Laporan Koreksi QTY" atau "Rekap Kehilangan"

---

## Cara Verifikasi

1. Lakukan beberapa koreksi QTY lewat Scan Station (reject, hilang, lebih)
2. Buka halaman Laporan Koreksi QTY
3. Filter per tahap → data muncul sesuai tahap yang dipilih
4. Filter per tanggal → data muncul sesuai range
5. Summary cards menampilkan angka yang benar
6. Klik Print → layout bersih, data lengkap
7. Cek bahwa reject yang sudah diperbaiki statusnya "Cancelled" (bukan "Applied")
