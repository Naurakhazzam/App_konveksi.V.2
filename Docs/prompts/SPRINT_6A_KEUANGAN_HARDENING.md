# PROMPT — Sprint 6A: Keuangan Hardening — Jurnal Umum & Integrasi Inventory

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` terlebih dahulu.
Sprint 5C sudah membangun kerangka dasar modul Keuangan, namun implementasinya masih **skeleton** —
banyak logika bisnis yang belum terpenuhi dan komponen yang terlalu sederhana.

**Masalah yang ditemukan di Sprint 5C:**
1. ModalTambahJurnal: belum ada integrasi otomatis ke `useInventoryStore` saat input pembelian bahan
2. ModalTambahJurnal: `direct_upah` memang disabled, tapi belum ada pesan UX yang jelas
3. JurnalUmumView: belum ada filter periode (date range picker)
4. JurnalUmumView: belum menampilkan kolom No. Faktur dan Tag PO di tabel
5. JurnalUmumView: belum ada total row di footer tabel
6. RingkasanView: tidak ada chart/visualisasi, hanya text & list
7. Data dummy jurnal terlalu sedikit untuk menguji skenario keuangan yang realistis

**Sprint 6A ini akan memperbaiki:**
1. Jurnal Umum yang lengkap — semua kolom, filter canggih, total footer
2. Integrasi Jurnal ↔ Inventory (beli bahan = otomatis tambah stok)
3. Ringkasan Keuangan yang informatif — dengan bar chart HTML dan breakdown lengkap
4. Dummy data yang lebih realistis untuk testing

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css`
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/`
5. **Data CRUD** = baca/tulis ke Zustand store
6. **Komponen reusable** yang sudah ada WAJIB digunakan
7. **Feature components** disimpan di `src/features/keuangan/`
8. **'use client'** wajib di setiap komponen yang menggunakan hooks
9. **Badge** hanya menerima variant: `'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'`
10. **PO Store** menggunakan `poList` (BUKAN `pos`)

---

## BAGIAN 1: UPGRADE MODAL TAMBAH JURNAL

### 1.1 Integrasi Inventory Otomatis

**File:** `src/features/keuangan/JurnalUmum/ModalTambahJurnal.tsx` (MODIFY)

**Perubahan:**
- Saat kategori = `direct_bahan` DAN user klik simpan:
  1. Simpan ke `useJurnalStore.addEntry(...)` ✅ (sudah ada)
  2. **BARU**: Tampilkan sub-form "Pilih Item Inventory" + QTY yang dibeli
  3. Otomatis panggil `useInventoryStore.addTrxMasuk(...)` untuk menambah stok
  4. Jika item belum ada di inventory, tampilkan opsi "Tambah Item Baru"

- Saat kategori = `direct_upah`:
  1. Tampilkan alert box berwarna kuning dengan ikon ⚠️
  2. Text: "Biaya upah tidak bisa diinput manual. Gunakan tombol REKAP di halaman Penggajian → Rekap Gaji."
  3. Tombol "Simpan" = disabled + cursor not-allowed

### 1.2 Field Tambahan di Form

| Field | Kondisi Tampil | Tipe |
|---|---|---|
| No. Faktur | Jika `direct_bahan` | Text input |
| Tag PO (Multi) | Jika `direct_bahan` | Checkbox group |
| Link PO | Jika `masuk` (penerimaan) | Single select |
| Item Inventory | Jika `direct_bahan` | Select + QTY |

---

## BAGIAN 2: UPGRADE JURNAL UMUM VIEW

### 2.1 Filter Canggih

**File:** `src/features/keuangan/JurnalUmum/JurnalUmumView.tsx` (MODIFY)

**Tambahkan:**
- Date range picker (input date start & end)
- Filter jenis transaksi (dropdown: Semua / Bahan / Upah / Overhead / Masuk)
- Search keterangan (text input)
- Tombol reset filter

### 2.2 Kolom Tabel Lengkap

| Kolom | Render |
|---|---|
| Tanggal | formatDate |
| No. Faktur | Teks atau "—" |
| Kategori | Nama dari master KategoriTrx |
| Jenis | Badge warna berbeda per jenis |
| Keterangan | Teks |
| Tag PO | Multi-badge atau "Umum" |
| Nominal | Warna hijau (masuk) / merah (keluar) |

### 2.3 Total Footer

Di bawah tabel, tampilkan:
```
Total Masuk:      Rp XX.XXX.XXX
Total Keluar:     Rp XX.XXX.XXX
Saldo Periode:    Rp XX.XXX.XXX (hijau/merah)
```

---

## BAGIAN 3: UPGRADE RINGKASAN KEUANGAN

### 3.1 Bar Chart HTML (Tanpa Library)

**File:** `src/features/keuangan/Ringkasan/RingkasanView.tsx` (MODIFY)

**Tambahkan komponen:**
`src/features/keuangan/Ringkasan/ExpenseBarChart.tsx`

Bar chart horizontal sederhana menggunakan div + width percentage:
```
Bahan Baku    ████████████████████  Rp 4.650.000 (57%)
Upah          ██████████            Rp 1.450.000 (18%)
Overhead      ████████              Rp 1.550.000 (19%)
Operasional   ███                   Rp   500.000  (6%)
```

### 3.2 Ringkasan Per Kategori Transaksi

Tabel yang menampilkan:
| Kategori | Jml Transaksi | Total Nominal | % dari Total |
|---|---|---|---|

---

## BAGIAN 4: DUMMY DATA REALISTIS

### 4.1 Update `src/data/dummy-journal.ts`

Tambahkan entri jurnal yang lebih realistis agar semua laporan terisi:
- Minimal 3 entri `direct_bahan` dengan `tagPOs` dan `noFaktur`
- Minimal 2 entri `direct_upah` (dari REKAP)
- Minimal 4 entri `overhead` (listrik, makan, transport, maintenance)
- Minimal 3 entri `masuk` (DP PO, pelunasan, dll)

---

## Deliverable Sprint 6A

- [ ] ModalTambahJurnal: integrasi inventory otomatis saat beli bahan
- [ ] ModalTambahJurnal: UX jelas untuk blokir direct_upah
- [ ] JurnalUmumView: filter periode + jenis + search
- [ ] JurnalUmumView: kolom lengkap (No. Faktur, Tag PO, Jenis Badge)
- [ ] JurnalUmumView: total footer (masuk/keluar/saldo)
- [ ] RingkasanView: bar chart pengeluaran (HTML, tanpa library)
- [ ] RingkasanView: tabel breakdown per kategori
- [ ] Dummy journal data diperkaya
- [ ] `npx tsc --noEmit` = 0 errors
