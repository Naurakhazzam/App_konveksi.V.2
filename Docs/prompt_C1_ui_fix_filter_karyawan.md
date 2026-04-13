# PROMPT C1: Perbaikan UI + Filter Karyawan per Tahap

## Konteks Proyek
Ini adalah aplikasi manajemen produksi konveksi (Next.js + TypeScript + Zustand). Alur produksi: **Cutting → Jahit → Lubang Kancing → Buang Benang → QC → Steam → Packing**.

Setiap tahap memiliki halaman Scan Station (`/produksi/scan/[tahap]`) di mana karyawan scan barcode bundle, terima barang, lalu laporkan selesai.

## Tugas yang Harus Dikerjakan

### 1. PERBAIKAN UI: Autocomplete Barcode Dropdown

**File**: `src/features/produksi/ScanStation/ScanInput.tsx` (dan CSS-nya)

**Masalah**: Dropdown autocomplete suggestions saat mengetik barcode tampilannya kurang solid — background transparan, tumpang tindih dengan elemen lain.

**Solusi yang diinginkan**:
- Background dropdown **solid** (gunakan warna `var(--surface-card)` atau `var(--bg-secondary)`)
- Border yang jelas dan kontras
- `z-index` tinggi (minimal 100) agar tidak tertutup elemen lain
- `max-height: 200px` dengan `overflow-y: auto` (scrollbar) jika list panjang
- Setiap item di-hover berubah warna (feedback visual)
- Border-radius sesuai design system yang ada
- Pastikan tampil di atas elemen tabel yang ada di bawahnya

### 2. PERBAIKAN UI: Modal Serah Terima Terpotong

**File**: `src/features/produksi/ScanStation/ModalSerahTerimaJahit.tsx` (dan CSS-nya)

**Masalah**: Ketika browser di zoom 100%, bagian bawah modal terpotong dan tidak bisa di-scroll.

**Solusi yang diinginkan**:
- Wrapper modal (overlay): `position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1000;`
- Inner modal: `max-height: 90vh; overflow-y: auto;`
- Padding bottom yang cukup agar tombol di bawah tidak terpotong
- Scrollbar styling yang halus (thin scrollbar, warna gelap sesuai theme)

### 3. FITUR: Tambah Field `tahapList` di Master Karyawan

**Tujuan**: Setiap karyawan hanya boleh muncul di dropdown Scan Station yang sesuai dengan tahap yang dia tangani.

#### 3a. Update Type

**File**: `src/types/master.types.ts`

Tambahkan field baru di interface `Karyawan`:
```typescript
export interface Karyawan {
  id: string;
  nama: string;
  jabatan: string;
  aktif: boolean;
  tahapList: string[]; // BARU: ['cutting', 'jahit', 'lkancing', 'bbenang', 'qc', 'steam', 'packing']
}
```

#### 3b. Update Data Default

**File**: `src/data/fixed-testing-data.ts`

Update data karyawan default:
```typescript
export const fixedEmployees: Karyawan[] = [
  { id: 'emp-abqi', nama: 'Abqi', jabatan: 'Cutting', aktif: true, tahapList: ['cutting'] },
  { id: 'emp-aldi', nama: 'Aldi', jabatan: 'Jahit', aktif: true, tahapList: ['jahit'] },
  { id: 'emp-hengky', nama: 'Hengky', jabatan: 'Finishing', aktif: true, tahapList: ['lkancing', 'bbenang', 'qc', 'steam', 'packing'] },
];
```

#### 3c. Update Halaman Master Karyawan

**File**: Cari halaman Master Karyawan (mungkin di `src/features/master-data/`)

- Di form tambah/edit karyawan, tambahkan **multi-select checkbox** untuk memilih tahap:
  ```
  ☑ Cutting
  ☐ Jahit
  ☑ Lubang Kancing
  ☑ Buang Benang
  ☑ QC
  ☑ Steam
  ☑ Packing
  ```
- Gunakan konstanta `TAHAP_ORDER` dan `TAHAP_LABEL` dari `src/lib/utils/production-helpers.ts` untuk render label tahap
- Simpan hasil pilihan ke field `tahapList`

#### 3d. Filter Dropdown Karyawan di Scan Station

**File**: `src/features/produksi/ScanStation/ScanResult.tsx`

Di bagian dropdown "Operator / Karyawan":
- Ambil data karyawan dari `useMasterStore`
- **Filter**: hanya tampilkan karyawan yang `tahapList`-nya mengandung tahap aktif saat ini
- Contoh: di halaman Scan Cutting, hanya muncul "Abqi" di dropdown

```typescript
const filteredKaryawan = karyawan.filter(k => k.aktif && k.tahapList.includes(tahap));
```

## Cara Verifikasi
1. Buka `/produksi/scan/cutting` → ketik "PO001" → dropdown autocomplete harus tampil solid, rapi, tidak tembus
2. Buka `/produksi/scan/jahit` → scan barcode yang sudah selesai cutting → di dropdown karyawan hanya muncul "Aldi" (bukan Abqi atau Hengky)
3. Buka `/produksi/scan/qc` → di dropdown karyawan hanya muncul "Hengky"
4. Klik Terima di tahap Jahit → modal Serah Terima muncul → scroll ke bawah harus bisa sampai tombol "Approve & Serahkan"
5. Buka Master Karyawan → edit karyawan → harus ada checkbox pilihan tahap
