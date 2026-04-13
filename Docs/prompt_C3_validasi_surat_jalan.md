# PROMPT C3: Validasi QTY di Surat Jalan

## Konteks Proyek
Aplikasi manajemen produksi konveksi (Next.js + TypeScript + Zustand). Setelah tahap Packing selesai, bundle dikirim via **Surat Jalan**. 

**Prerequisite**: Prompt C2 (Sistem Koreksi QTY) harus sudah dikerjakan karena prompt ini menggunakan data QTY yang sudah di-koreksi.

## Tugas yang Harus Dikerjakan

### 1. Popup Konfirmasi QTY Saat Scan Barcode untuk Surat Jalan

**File**: Modifikasi/buat komponen di area pengiriman (`src/features/produksi/Pengiriman/` atau yang setara)

Ketika admin membuat Surat Jalan dan scan barcode bundle:

1. Muncul **popup konfirmasi** yang menampilkan:
   - Info bundle: No. PO, Model, Warna, Size, Barcode
   - **QTY Hasil Packing**: angka dari hasil scan terakhir di tahap Packing
   - **Input QTY Kiriman**: field input untuk admin konfirmasi berapa yang dikirim

2. **Validasi**:

#### Jika QTY Kiriman = QTY Hasil Packing → ✅ LANJUT
- Bundle masuk ke Surat Jalan, tidak ada masalah.

#### Jika QTY Kiriman > QTY Hasil Packing → ⚠️ PERLU RECORD
- Muncul dropdown alasan: 
  - "Kiriman Tambahan dari Produksi"
  - "Koreksi Packing"
  - "Lainnya" (+field teks jika dipilih)
- Data tercatat sebagai record kelebihan kiriman
- Bundle tetap masuk ke Surat Jalan

#### Jika QTY Kiriman < QTY Hasil Packing → 🚨 WARNING BESAR

Muncul **warning modal full-screen** dengan styling berikut:
- Background: **merah solid** atau **merah gelap transparan**
- Teks besar, bold, uppercase:

```
⚠️ KIRIMAN KURANG DARI HASIL PACKING,
KEMANA SISA BARANG NYA !!!?
CARI TERLEBIH DAHULU!!!
```

- Font size: minimal 24px, bisa sampai 32px
- Warna teks: putih pada background merah
- Tombol: "Saya Sudah Cari, Lanjutkan" (warna abu-abu, kecil) + "Kembali" (warna hijau, besar)
- Jika admin tetap lanjutkan:
  - WAJIB isi dropdown alasan: "Barang Belum Ditemukan", "Barang Rusak Saat Packing", "Lainnya"
  - Data tercatat sebagai record kekurangan kiriman
  - Log aktivitas: siapa yang memaksa kiriman kurang

### 2. Data Structure untuk Record Kiriman

Tambahkan type baru atau extend yang sudah ada:

```typescript
export interface KoreksiKiriman {
  id: string;
  suratJalanId: string;
  barcode: string;
  qtyPacking: number;     // QTY hasil packing
  qtyKiriman: number;     // QTY aktual yang dikirim
  selisih: number;         // qtyKiriman - qtyPacking (positif = lebih, negatif = kurang)
  alasan: string;          // Dari dropdown
  catatanTambahan?: string;
  waktu: string;
  userId: string;          // Siapa yang input
}
```

### 3. Simpan Record ke Store

Buat store baru atau tambahkan ke store yang sudah ada (misal `usePengirimanStore` atau sejenisnya):

```typescript
koreksiKiriman: KoreksiKiriman[];
addKoreksiKiriman: (data: KoreksiKiriman) => void;
getKoreksiBysuratJalan: (sjId: string) => KoreksiKiriman[];
```

## Cara Verifikasi

1. Buat Surat Jalan → scan barcode bundle yang sudah selesai packing (QTY = 10)
2. Isi QTY kiriman = 10 → harus langsung masuk tanpa masalah
3. Isi QTY kiriman = 12 → muncul dropdown alasan → isi lalu submit → data tercatat
4. Isi QTY kiriman = 8 → **WARNING BESAR MERAH CAPSLOCK** muncul → klik "Saya Sudah Cari" → wajib isi alasan → submit
5. Cek record koreksi kiriman tersimpan dengan benar
