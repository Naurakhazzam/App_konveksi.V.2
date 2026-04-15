# LAPORAN PERBAIKAN BUG 8B — STITCHLYX SYNCORE V2

**Tanggal**: 15 April 2026
**Scope**: Modul PO — Perbaikan Segmen Barcode (Model/Warna/Size)

---

## FILES CHANGED
- `src/lib/utils/po-import.ts` → Mengembalikan penggunaan `generateBarcode()` dengan `globalSequence: 0` sebagai template, sehingga Model/Warna/Size nama asli masuk ke barcode sejak awal.
- `src/stores/usePOStore.ts` → Implementasi helper `replaceSequenceInBarcode` menggunakan regex untuk melakukan *swap* angka sequence 5-digit tanpa merusak segmen nama produk lainnya.

---

## FORMAT BARCODE YANG DITEMUKAN
Berdasarkan `barcode-generator.ts`, format return adalah:
`PO{nopo}-{globalSequence:5}-BDL{bundleIndex:2}`

**Contoh**: `PO001-00000-BDL01`

**Regex Pattern yang dipakai**:
`/-(\d{5})-BDL/`
Regex ini menargetkan angka tepat 5-digit yang diapit oleh tanda hubung `-` di depan dan suffix `-BDL` di belakang.

---

## PERUBAHAN usePOStore.ts

**SEBELUM (Buggy)** — Meregenerasi barcode dengan data literal "MDL", "WRN", "SZ":
```typescript
      b.barcode = generateBarcode({
        nomorPO: po.nomorPO,
        model: 'MDL', // ❌ SALAH: Literal string
        warna: 'WRN', // ❌ SALAH: Literal string
        size: 'SZ',   // ❌ SALAH: Literal string
        globalSequence: currentGlobalSeq,
        bundleIndex: indexBundle,
        tanggal: new Date()
      });
```

**SESUDAH (Fixed)** — Menggunakan strategi penggantian (replacement) yang aman:
```typescript
    function replaceSequenceInBarcode(originalBarcode: string, newSeq: number): string {
      // Ganti HANYA segmen 5-digit sequence sebelum -BDL
      return originalBarcode.replace(/-(\d{5})-BDL/, `-${String(newSeq).padStart(5, '0')}-BDL`);
    }
    
    let currentGlobalSeq = startSeq;
    bundles.forEach((b: any) => {
      b.barcode = replaceSequenceInBarcode(b.barcode, currentGlobalSeq);
      currentGlobalSeq++;
    });
```

---

## PERUBAHAN po-import.ts

**SEBELUM**:
```typescript
        // Gunakan placeholder sementara
        const barcodeString = `TEMP-${i}`;
```

**SESUDAH**:
```typescript
        // Gunakan generateBarcode() dengan sequence 0 sebagai template
        const barcodeString = generateBarcode({
          nomorPO,
          model: modelName,
          warna: warnaName,
          size: sizeName,
          globalSequence: 0,
          bundleIndex: i,
          tanggal: new Date()
        });
```

---

## BUG BARU YANG DITEMUKAN (tidak diperbaiki)
- Tidak ada bug baru yang terdeteksi di area ini.

## STATUS
- [x] Selesai
