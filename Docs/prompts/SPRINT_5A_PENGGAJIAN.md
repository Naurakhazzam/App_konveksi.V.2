# PROMPT — Sprint 5A: Modul Penggajian (Rekap Gaji, Kasbon, Slip Gaji)

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1-4 (foundation, master data, produksi, koreksi, pengiriman) sudah selesai.

**Status saat ini:**
- `usePayrollStore` sudah ada dengan interface dasar (ledger, kasbon, calculateUpah, prosesBayar)
- `useBundleStore` memiliki `markUpahPaid` dan field `upahDibayar` di `StatusTahap`
- Dummy data payroll sudah ada di `data/dummy-payroll.ts`
- Route pages untuk `/penggajian/rekap-gaji`, `/kasbon`, `/slip-gaji` sudah ada tapi berisi placeholder
- `useJurnalStore` sudah ada — Sprint 5A perlu integrasi REKAP ke jurnal
- Tahap Cutting & Jahit mencatat `karyawan` per bundle. Tahap lain tidak per-karyawan.

**Sprint 5A ini akan membangun:**
1. **Rekap Gaji** — Tabel rekap upah per karyawan per periode + modal BAYAR
2. **REKAP ke Jurnal** — Setelah BAYAR, otomatis tulis entri `direct_upah` ke Jurnal Umum
3. **Kasbon** — CRUD kasbon karyawan + saldo tracking
4. **Slip Gaji** — Tampilan ringkasan gaji per karyawan

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css`
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/` (contoh: `@/components/atoms/Button`)
5. **Data CRUD** = baca/tulis ke Zustand store. Tidak ada API call.
6. **Komponen reusable** yang sudah ada WAJIB digunakan
7. **Feature components** disimpan di `src/features/penggajian/`

---

## BAGIAN 1: REKAP GAJI

### 1.1 Alur Bisnis Penggajian

```
[Scan Station] → Tahap Cutting/Jahit → karyawan dicatat per bundle
                                            ↓
                    useBundleStore: statusTahap[tahap].karyawan = 'KRY-001'
                    useBundleStore: statusTahap[tahap].status = 'selesai'
                    usePayrollStore: addLedgerEntry({ tipe: 'selesai', karyawanId, total })
                                            ↓
                                [Halaman Rekap Gaji]
                                            ↓
                    ┌─────────────────────────────────────────────┐
                    │  Pilih Periode (minggu/bulan)                │
                    │  Lihat rekap per karyawan:                   │
                    │                                             │
                    │  Upah = Σ entri tipe 'selesai'              │
                    │  Potongan = Σ |entri tipe 'reject_potong'|  │
                    │  Rework = Σ entri tipe 'rework'             │
                    │  Upah Bersih = Upah - Potongan + Rework     │
                    │                                             │
                    │  [BAYAR] → Modal: upahBersih, kasbon sisa   │
                    │    → Bayar = upahBersih - potonganKasbon    │
                    │    → Setelah bayar: l.lunas = true          │
                    │                                             │
                    │  [REKAP KE JURNAL] → tulis entri Jurnal     │
                    │    → jenis: 'direct_upah'                   │
                    │    → HANYA via tombol ini, BUKAN manual     │
                    └─────────────────────────────────────────────┘
```

### 1.2 Halaman `/penggajian/rekap-gaji` — RekapGajiView

**File:** `src/features/penggajian/RekapGaji/RekapGajiView.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  PageWrapper: "Rekap Gaji Karyawan"                     │
│                                                         │
│  [Filter Periode: ▼ startDate - endDate]                │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │Total │ │Sudah │ │Belum  │ │Outstanding│              │
│  │ Upah │ │Bayar │ │ Bayar │ │  Kasbon  │              │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  DataTable: RekapGajiTable                        │   │
│  │  Kolom:                                           │   │
│  │  - Nama Karyawan                                  │   │
│  │  - Upah Kotor | Potongan | Rework | Upah Bersih   │   │
│  │  - Kasbon Sisa                                    │   │
│  │  - Status (Lunas/Belum)                           │   │
│  │  - Aksi (BAYAR / ✓ Sudah Dibayar)                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  [📋 REKAP KE JURNAL UMUM]                              │
└─────────────────────────────────────────────────────────┘
```

### 1.3 RekapGajiTable

**File:** `src/features/penggajian/RekapGaji/RekapGajiTable.tsx`

**Kolom DataTable:**
| Kolom | Deskripsi |
|---|---|
| Nama Karyawan | `useMasterStore.karyawan.nama` |
| Upah Kotor | Σ entri `selesai` |
| Potongan Reject | Σ `|reject_potong|` |
| Rework | Σ `rework` |
| Upah Bersih | Upah - Potongan + Rework |
| Sisa Kasbon | Total kasbon belum lunas |
| Status | Badge: Lunas/Belum |
| Aksi | Tombol BAYAR (jika belum lunas) |

### 1.4 ModalBayar

**File:** `src/features/penggajian/RekapGaji/ModalBayar.tsx`

**Alur:**
1. Tampilkan ringkasan: Upah Bersih, Sisa Kasbon
2. Input potongan kasbon (default = sisa kasbon, bisa diubah max = sisa kasbon)
3. Hitung: **Yang Dibayarkan = Upah Bersih - Potongan Kasbon**
4. Konfirmasi → Update store:
   - `usePayrollStore.prosesBayar()` → mark ledger entries sebagai lunas
   - Jika ada kasbon → kurangi kasbon sisa
   - `useBundleStore.markUpahPaid()` → tandai upahDibayar pada bundle terkait

### 1.5 Tombol REKAP KE JURNAL

**Logika:**
- Muncul di bawah tabel setelah semua karyawan di periode tersebut sudah dibayar
- Klik → tulis entri ke `useJurnalStore.addEntry()`:
  ```typescript
  {
    id: 'JRN-UPAH-{timestamp}',
    kategori: 'KTR-002',
    namaKategori: 'Upah Karyawan',
    jenis: 'direct_upah',
    tipe: 'keluar',
    nominal: totalUpahBersihSemuaKaryawan,
    keterangan: 'Upah periode {startDate} - {endDate}',
    tanggal: new Date().toISOString(),
    waktu: new Date().toISOString(),
  }
  ```
- Setelah klik → tombol disabled: "✓ Sudah Direkap"
- `direct_upah` **HANYA boleh ditulis via tombol ini**, bukan input manual di Jurnal Umum

---

## BAGIAN 2: KASBON

### 2.1 Halaman `/penggajian/kasbon` — KasbonView

**File:** `src/features/penggajian/Kasbon/KasbonView.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  PageWrapper: "Manajemen Kasbon"                  │
│                                                  │
│  [+ Tambah Kasbon]                               │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  DataTable: KasbonTable                   │    │
│  │  Kolom:                                   │    │
│  │  - Tanggal                                │    │
│  │  - Karyawan                               │    │
│  │  - Jumlah                                 │    │
│  │  - Keterangan                             │    │
│  │  - Status (Aktif / Lunas)                 │    │
│  │  - Sisa                                   │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [Klik + Tambah → ModalTambahKasbon]             │
└──────────────────────────────────────────────────┘
```

### 2.2 ModalTambahKasbon

**File:** `src/features/penggajian/Kasbon/ModalTambahKasbon.tsx`

**Fields:**
- Pilih Karyawan (dropdown dari master)
- Jumlah (number input)
- Keterangan (text)
- Tanggal

---

## BAGIAN 3: SLIP GAJI

### 3.1 Halaman `/penggajian/slip-gaji` — SlipGajiView

**File:** `src/features/penggajian/SlipGaji/SlipGajiView.tsx`

**Layout:**
- Pilih karyawan + periode
- Tampilkan kartu slip gaji (print-ready):
  - Header: Nama perusahaan, periode
  - Detail upah per tahap/PO
  - Potongan (reject + kasbon)
  - Total dibayarkan

---

## BAGIAN 4: ROUTING

Halaman sudah ada tapi berisi placeholder. **Ganti isi** file berikut:
- `src/app/(dashboard)/penggajian/rekap-gaji/page.tsx`
- `src/app/(dashboard)/penggajian/kasbon/page.tsx`
- `src/app/(dashboard)/penggajian/slip-gaji/page.tsx`

---

## Deliverable Sprint 5A

- [ ] **Rekap Gaji** fungsional: tabel, modal BAYAR, integrasi payroll store
- [ ] **REKAP ke Jurnal** fungsional: auto-write `direct_upah` ke jurnal
- [ ] **Kasbon** fungsional: tambah kasbon, tracking saldo
- [ ] **Slip Gaji** fungsional: tampilan per karyawan per periode
- [ ] Dummy data tersedia dan konsisten untuk testing
- [ ] `npx tsc --noEmit` = 0 errors

## File yang akan dibuat/dimodifikasi

### File Baru:
| File | Deskripsi |
|---|---|
| `src/features/penggajian/RekapGaji/RekapGajiView.tsx` | Halaman utama rekap |
| `src/features/penggajian/RekapGaji/RekapGajiView.module.css` | Styles |
| `src/features/penggajian/RekapGaji/RekapGajiTable.tsx` | Tabel rekap |
| `src/features/penggajian/RekapGaji/ModalBayar.tsx` | Modal pembayaran |
| `src/features/penggajian/RekapGaji/ModalBayar.module.css` | Styles |
| `src/features/penggajian/Kasbon/KasbonView.tsx` | Halaman kasbon |
| `src/features/penggajian/Kasbon/KasbonView.module.css` | Styles |
| `src/features/penggajian/Kasbon/ModalTambahKasbon.tsx` | Modal tambah kasbon |
| `src/features/penggajian/Kasbon/ModalTambahKasbon.module.css` | Styles |
| `src/features/penggajian/SlipGaji/SlipGajiView.tsx` | Halaman slip gaji |
| `src/features/penggajian/SlipGaji/SlipGajiView.module.css` | Styles |

### File Dimodifikasi:
| File | Perubahan |
|---|---|
| `src/stores/usePayrollStore.ts` | Perbaiki logika calculateUpah + prosesBayar |
| `src/app/(dashboard)/penggajian/rekap-gaji/page.tsx` | Ganti placeholder |
| `src/app/(dashboard)/penggajian/kasbon/page.tsx` | Ganti placeholder |
| `src/app/(dashboard)/penggajian/slip-gaji/page.tsx` | Ganti placeholder |
