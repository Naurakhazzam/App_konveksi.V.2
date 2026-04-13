# PROMPT C2: Sistem Koreksi QTY (Kurang, Lebih, Reject)

## Konteks Proyek
Aplikasi manajemen produksi konveksi (Next.js + TypeScript + Zustand). Alur produksi: **Cutting → Jahit → Lubang Kancing → Buang Benang → QC → Steam → Packing**.

Saat ini ketika karyawan scan barcode dan terima bundle, dia langsung terima sesuai QTY. **Belum ada mekanisme** jika QTY yang diterima berbeda (kurang/lebih) dari yang seharusnya.

## PENTING: Pahami Alur Bisnis Ini Sebelum Coding

### Skenario QTY KURANG

Contoh: Bundle 10 pcs dari Cutting masuk ke Jahit. Tukang jahit terima dan selesaikan 10. Bundle lalu masuk ke QC. Di QC, petugas cek dan temukan **2 pcs rusak jahitan**.

**Alur yang terjadi:**
1. Petugas QC scan barcode → konfirmasi QTY → isi QTY terima = **8**
2. Sistem deteksi QTY kurang 2 dari seharusnya → muncul form "Koreksi QTY"
3. Petugas pilih alasan dari dropdown:
   - **"Reject"** → muncul sub-dropdown jenis reject dari Master Data (misal: "Rusak Jahitan", "Bolong", "Kain Sobek")
   - **"Hilang"** → tidak ada sub-dropdown
   - **"Salah Hitung di Proses Sebelumnya"** → tidak ada sub-dropdown
4. Petugas submit → 8 pcs lanjut ke Steam, 2 pcs masuk ke **Daftar Reject QC**

**Dampak ke gaji:**
- Petugas QC **hanya dibayar 8 pcs** (sesuai yang diterima/dikerjakan)
- Untuk reject "Rusak Jahitan": **tukang jahit yang mengerjakan bundle ini** kena potongan upah jahit × 2 pcs
- Untuk "Hilang": **tahap sebelumnya** (yang terakhir pegang barang) kena potongan
- Untuk "Salah Hitung": **tahap sebelumnya** kena potongan
- Untuk "Salah Potong Kain" (reject dari cutting): potongan = HPP per pcs dari PO × jumlah pcs salah potong

**Dampak ke QTY cascading:**
- Tahap selanjutnya (Steam) otomatis **expect 8 pcs** untuk bundle ini (bukan 10)
- Karyawan di Steam hanya bisa lapor selesai **maksimal 8 pcs**

### Skenario REJECT - Barang Bisa Diperbaiki

2 pcs yang reject tadi **naik kembali ke tahap yang bertanggung jawab**:
- Jika reject "Rusak Jahitan" → barang kembali muncul di antrian Scan Jahit
- Barcode bundle tersebut **bisa di-scan ulang** di Scan Jahit
- Ketika tukang jahit scan ulang dan selesaikan perbaikan:
  - Potongan gaji tukang jahit **dibatalkan** (cancelled)
  - Barang lanjut proses naik lagi ke QC
  - QC bisa scan ulang untuk menerima 2 pcs yang sudah diperbaiki

**Selama barang reject BELUM di-scan ulang** di tahap yang bertanggung jawab → **potongan gaji tetap berlaku**.

### Skenario QTY LEBIH

Contoh: Bundle seharusnya 10 pcs, tapi di Jahit terima 12 pcs (cutting memotong lebih banyak).

**Alur yang terjadi:**
1. Karyawan scan barcode → isi QTY terima = **12**
2. Sistem deteksi lebih 2 → muncul form "Koreksi QTY Lebih"
3. Dropdown alasan: "Lebih Cutting", "Koreksi dari Tahap Sebelumnya", "Lainnya" (+field catatan jika pilih Lainnya)
4. Data tersimpan dengan status **"Menunggu Approval"**
5. **Selama belum di-approve**: QTY di seluruh sistem tetap 10 (sesuai PO asli)
6. Owner/admin membuka halaman approval → approve permintaan
7. **Setelah di-approve**: QTY berubah menjadi 12 dan **cascading ke semua tahap selanjutnya**
8. Kelebihan 2 pcs dibayarkan di gajian berikutnya

---

## Data Structures yang Harus Dibuat

### 1. Type `KoreksiQTY`

**File**: `src/types/production.types.ts` (tambahkan)

```typescript
export interface KoreksiQTY {
  id: string;
  barcode: string;           // Barcode bundle
  poId: string;              // ID PO
  tahapDitemukan: string;    // Tahap yang menemukan masalah (e.g., 'qc')
  tahapBertanggungJawab: string; // Tahap yang bertanggung jawab (e.g., 'jahit')
  karyawanPelapor: string;  // ID karyawan yang melaporkan
  karyawanBertanggungJawab: string; // ID karyawan di tahap yang bertanggung jawab
  
  jenisKoreksi: 'reject' | 'hilang' | 'salah_hitung' | 'lebih';
  alasanRejectId?: string;   // ID dari Master Alasan Reject (jika jenis = 'reject')
  alasanLebihText?: string;  // Catatan manual (jika jenis = 'lebih' dan alasan = 'Lainnya')
  
  qtyKoreksi: number;        // Jumlah pcs yang bermasalah
  nominalPotongan: number;    // Nominal potongan gaji (auto-calculate)
  
  statusPotongan: 'pending' | 'applied' | 'cancelled'; // cancelled = sudah diperbaiki
  statusApproval?: 'menunggu' | 'approved' | 'ditolak'; // khusus QTY lebih
  approvedBy?: string;
  approvedAt?: string;
  
  waktuLapor: string;         // ISO datetime
  waktuSelesai?: string;      // ISO datetime ketika reject sudah diperbaiki
}
```

### 2. Type `AlasanReject` (Master Data)

**File**: `src/types/master.types.ts` (tambahkan)

```typescript
export interface AlasanReject {
  id: string;
  nama: string;                    // e.g., "Rusak Jahitan", "Bolong", "Kain Sobek", "Salah Potong"
  tahapBertanggungJawab: string;   // Tahap mana yang kena (e.g., 'jahit', 'cutting')
  bisaDiperbaiki: boolean;         // true = bisa di-scan ulang, false = masuk kerugian permanen
  dampakPotongan: 'upah_tahap' | 'hpp_po'; 
  // 'upah_tahap' = potong upah karyawan di tahap tsb
  // 'hpp_po' = potong sesuai HPP PO (untuk salah potong kain)
}
```

### 3. Store: `useKoreksiStore`

**File**: `src/stores/useKoreksiStore.ts` (BARU)

```typescript
interface KoreksiState {
  koreksiList: KoreksiQTY[];
  addKoreksi: (data: KoreksiQTY) => void;
  cancelKoreksi: (id: string) => void;          // Ketika reject sudah diperbaiki
  approveKoreksiLebih: (id: string, approvedBy: string) => void;
  rejectKoreksiLebih: (id: string) => void;
  getKoreksiByTahap: (tahap: string) => KoreksiQTY[];
  getKoreksiByKaryawan: (karyawanId: string) => KoreksiQTY[];
  getPendingApproval: () => KoreksiQTY[];        // QTY lebih yang menunggu approval
  getActiveRejectByTahap: (tahap: string) => KoreksiQTY[]; // Reject yang belum diperbaiki
}
```

### 4. Master Alasan Reject di Master Store

**File**: `src/stores/useMasterStore.ts`

Tambahkan state dan CRUD untuk `alasanReject: AlasanReject[]` sama seperti pattern master data lain yang sudah ada.

Data default:
```typescript
const initialAlasanReject: AlasanReject[] = [
  { id: 'RJ-001', nama: 'Rusak Jahitan', tahapBertanggungJawab: 'jahit', bisaDiperbaiki: true, dampakPotongan: 'upah_tahap' },
  { id: 'RJ-002', nama: 'Bolong', tahapBertanggungJawab: 'jahit', bisaDiperbaiki: true, dampakPotongan: 'upah_tahap' },
  { id: 'RJ-003', nama: 'Kain Sobek', tahapBertanggungJawab: 'cutting', bisaDiperbaiki: false, dampakPotongan: 'hpp_po' },
  { id: 'RJ-004', nama: 'Salah Potong Kain', tahapBertanggungJawab: 'cutting', bisaDiperbaiki: false, dampakPotongan: 'hpp_po' },
];
```

---

## UI yang Harus Dibuat/Dimodifikasi

### 1. Halaman Master Alasan Reject

**File**: Buat di `src/features/master-data/` (ikuti pattern yang sudah ada)

Tabel CRUD standar:
| Nama | Tahap Bertanggung Jawab | Bisa Diperbaiki | Dampak Potongan |
|------|------------------------|-----------------|-----------------|
| Rusak Jahitan | Jahit | ✅ | Upah Tahap |
| Salah Potong Kain | Cutting | ❌ | HPP PO |

Tambahkan ke sidebar/navigasi di area Master Data.

### 2. Dialog Koreksi QTY di ScanResult

**File**: `src/features/produksi/ScanStation/ScanResult.tsx` (modifikasi)

Ketika karyawan klik "Selesai" atau "Terima" dan mengisi QTY:

**Jika QTY < expected:**
1. Muncul panel/dialog "Koreksi QTY"
2. Field: "QTY yang bermasalah" (auto-calculate: expected - actual)
3. Dropdown "Alasan":
   - **Reject** → muncul sub-dropdown "Jenis Reject" (dari Master Alasan Reject)
   - **Hilang**
   - **Salah Hitung di Proses Sebelumnya**
4. Tombol "Konfirmasi Koreksi"

**Jika QTY > expected:**
1. Muncul panel "QTY Lebih dari Expected"
2. Dropdown "Alasan": "Lebih Cutting" / "Lebih [Tahap Sebelumnya]" / "Lainnya"
3. Field catatan (opsional, wajib jika pilih "Lainnya")
4. Tombol "Ajukan Approval"
5. Data tersimpan, QTY tetap sesuai PO sampai di-approve

### 3. Tabel "Daftar Reject" per Tahap

**File**: Buat komponen baru `src/features/produksi/ScanStation/RejectListTahap.tsx`

Letakkan di setiap Scan Station (sama seperti `ListAntrianTahap`), di bawah tabel list proses.

Tabel berisi:
| No. PO | Barcode | Artikel | QTY Reject | Alasan | Tahap Asal | Status |
|--------|---------|---------|-----------|--------|------------|--------|
| PO-001 | PO001-ABU... | Abudzar - Grey x Black - S | 2 | Rusak Jahitan | QC | ⏳ Belum Diperbaiki |

- Kolom "Status": 
  - ⏳ "Belum Diperbaiki" (warna kuning/warning)
  - ✅ "Sudah Diperbaiki" (warna hijau/success)
- Tabel ini berfungsi sebagai **reminder** agar team tahu barang mana yang perlu diperbaiki
- Hanya tampilkan reject yang `tahapBertanggungJawab`-nya = tahap saat ini

### 4. Halaman Approval QTY Lebih

**File**: Buat di `src/features/produksi/ApprovalQTY/` (BARU)

Halaman ini diakses oleh owner/admin. Berisi:
- Daftar permintaan QTY lebih yang `statusApproval = 'menunggu'`
- Detail: No. PO, Barcode, tahap, karyawan pelapor, alasan, jumlah lebih
- Tombol: ✅ Approve | ❌ Tolak
- Ketika approve → trigger perubahan QTY cascading

Tambahkan route dan navigasi ke halaman ini.

---

## Logika Cascading QTY

### QTY Expected di Setiap Tahap

Saat ini, QTY expected di setiap tahap = `bundle.qtyBundle` (dari PO). 

**Setelah ada koreksi**, QTY expected harus dihitung ulang:

```typescript
function getExpectedQTY(bundle: Bundle, tahap: TahapKey): number {
  let qty = bundle.qtyBundle; // QTY asal dari PO
  
  // Cari semua koreksi yang terjadi SEBELUM tahap ini
  const tahapIndex = TAHAP_ORDER.indexOf(tahap);
  
  for (let i = 0; i < tahapIndex; i++) {
    const prevTahap = TAHAP_ORDER[i];
    const koreksiKurang = koreksiList.filter(k => 
      k.barcode === bundle.barcode && 
      k.tahapDitemukan === prevTahap && 
      k.jenisKoreksi !== 'lebih' &&
      k.statusPotongan !== 'cancelled' // Reject yang sudah diperbaiki tidak mengurangi
    );
    koreksiKurang.forEach(k => qty -= k.qtyKoreksi);
    
    const koreksiLebih = koreksiList.filter(k =>
      k.barcode === bundle.barcode && 
      k.tahapDitemukan === prevTahap && 
      k.jenisKoreksi === 'lebih' &&
      k.statusApproval === 'approved' // Hanya yang sudah di-approve
    );
    koreksiLebih.forEach(k => qty += k.qtyKoreksi);
  }
  
  return qty;
}
```

### Logika Re-Scan Reject

Ketika barcode di-scan ulang di tahap yang bertanggung jawab:
1. Cek apakah ada `KoreksiQTY` dengan `barcode` ini yang `statusPotongan = 'pending'` dan `tahapBertanggungJawab` = tahap saat ini
2. Jika ada → tampilkan info: "Bundle ini memiliki X pcs reject yang perlu diperbaiki"
3. Karyawan proses perbaikan → lapor selesai
4. Sistem otomatis `cancelKoreksi(id)` → `statusPotongan = 'cancelled'`
5. Bundle naik kembali ke tahap yang menemukan reject → muncul di antrian tahap tersebut

---

## Kalkulasi Nominal Potongan

### Untuk Reject/Hilang/Salah Hitung (tipe `upah_tahap`):
```
nominalPotongan = upah per pcs di tahap tersebut × qtyKoreksi
```
Ambil dari HPP Komponen yang sesuai (e.g., "Upah Jahit" dari Master HPP Komponen).

### Untuk Salah Potong Kain (tipe `hpp_po`):
```
nominalPotongan = HPP per pcs dari PO (total HPP bahan) × qtyKoreksi
```
Ini agar kerugian bahan baku ditanggung oleh yang salah potong.

---

## Cara Verifikasi

1. **QTY Kurang (Reject)**:
   - Scan barcode di QC → isi QTY terima = 8 (dari 10) → pilih "Reject" → "Rusak Jahitan" → submit
   - Cek: 8 pcs lanjut ke Steam, 2 pcs muncul di tabel Reject di Scan Jahit
   - Cek: tahap Steam expect 8 pcs (bukan 10)
   - Scan ulang barcode di Jahit → perbaiki → submit selesai
   - Cek: potongan gaji tukang jahit berubah dari 'pending' ke 'cancelled'
   - Cek: barcode muncul kembali di antrian QC dengan 2 pcs

2. **QTY Kurang (Hilang)**:
   - Scan barcode → QTY terima = 9 (dari 10) → pilih "Hilang" → submit
   - Cek: QTY cascading berkurang ke tahap selanjutnya
   - Cek: potongan gaji tahap sebelumnya tercatat

3. **QTY Lebih**:
   - Scan barcode → QTY terima = 12 (dari 10) → pilih "Lebih Cutting" → submit
   - Cek: QTY di sistem tetap 10 (belum di-approve)
   - Buka halaman Approval → approve permintaan
   - Cek: QTY berubah jadi 12 dan cascading ke tahap selanjutnya
