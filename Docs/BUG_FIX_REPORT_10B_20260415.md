# Laporan Koreksi Formula Phase 3 — Scan Produksi

## FILES CHANGED
- `src/features/produksi/ScanStation/ScanResult.tsx` → Memperbaiki rumus perhitungan pengurangan stok bahan pada fungsi `handleBahanConfirm`.

## KOREKSI FORMULA
Nama variabel yang ditemukan di scope:
- `meter` (sebagai input pemakaian per pcs dari modal)
- `bundle.qtyBundle` (jumlah pcs dalam satu bundle)

**SEBELUM:**
```typescript
const qtyToConsume = meter > 0 ? meter : gram;
```

**SESUDAH:**
```typescript
if (!meter || meter <= 0) {
  warning('Data Bahan', 'Pemakaian kain tidak valid, stok tidak dipotong.');
} else {
  // meter per pcs × jumlah pcs bundle = total meter terpakai
  const qtyToConsume = meter * bundle.qtyBundle;
  // ... proses consumeFIFO ...
}
```

## VERIFIKASI FILE INTEGRITY
```typescript
753:         tahapSaatIni={TAHAP_LABEL[tahap]}
754:       />
755:     </div>
756:   );
757: }
```
(File utuh dan tidak terpotong di baris akhir).

## STATUS
- [x] Selesai
