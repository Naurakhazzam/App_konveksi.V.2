# LAPORAN BUG FIX 8 (PHASE 2 LANJUTAN) — STITCHLYX SYNCORE V2

**Tanggal**: 15 April 2026
**Scope**: Modul PO (Transisi `globalSequence` ke Server-Side PostgreSQL Sequence)

---

## FILES CHANGED
- `src/stores/usePOStore.ts` → (`createPOWithBundles`) Mengambil sequence dari PostgreSQL RPC (`reserve_bundle_sequence`), dan me-*regenerate* barcode dengan *real global Sequence*  secara presisi sebelum dimasukkan ke database.
- `src/lib/utils/po-import.ts` → (`processPOCSV`) Parameter pengambilan `globalSequence` dihapus. Digantikan menggunakan placeholder string `TEMP-{index}` secara parsial untuk kerangka barcode.
- `src/features/produksi/InputPO/ModalImportPO.tsx` → (`ModalImportPO`) Menghapus sisa properti `incrementGlobalSequence` maupun `globalSequence` karena *orchestrator*-nya telah dipegang penuh oleh `createPOWithBundles`.

---

## PERUBAHAN #1 — createPOWithBundles

**SEBELUM**:
```typescript
  createPOWithBundles: async (po, bundles) => {
    // 1. Dapatkan user AKTIF (Audit Trail Jantung)
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    // 2. Optimistic update lokal
    set((state) => ({
      poList: [...state.poList, po],
      globalSequence: state.globalSequence + bundles.length,
    }));
```

**SESUDAH**:
```typescript
  createPOWithBundles: async (po, bundles) => {
    // 1. Dapatkan user AKTIF (Audit Trail Jantung)
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    // Minta sequence dari server (atomic, tidak bisa collision)
    const { data: startSeq, error: seqError } = await supabase
      .rpc('reserve_bundle_sequence', { p_count: bundles.length });
    
    if (seqError || startSeq === null) throw new Error('Gagal mendapat sequence dari server');

    const { generateBarcode } = require('../lib/utils/barcode-generator');
    
    let currentGlobalSeq = startSeq;
    bundles.forEach((b: any) => {
      let indexBundle = 1;
      if (b.barcode && b.barcode.includes('-BDL')) {
        indexBundle = parseInt(b.barcode.split('-BDL')[1], 10);
      } else if (b.barcode && b.barcode.startsWith('TEMP-')) {
        indexBundle = parseInt(b.barcode.split('-')[1], 10);
      }

      b.barcode = generateBarcode({
        nomorPO: po.nomorPO,
        model: 'MDL', // diabaikan oleh generateBarcode() krn bukan part dr prefix return value asli
        warna: 'WRN', // diabaikan
        size: 'SZ',   // diabaikan
        globalSequence: currentGlobalSeq,
        bundleIndex: indexBundle,
        tanggal: new Date()
      });
      currentGlobalSeq++;
    });

    // 2. Optimistic update lokal
    set((state) => ({
      poList: [...state.poList, po],
      globalSequence: state.globalSequence + bundles.length,
    }));
```

---

## PERUBAHAN #2 — processPOCSV

**SEBELUM**:
```typescript
export const processPOCSV = (
  results: Papa.ParseResult<any>,
  masterData: { klien: any[], produk: any[], model: any[], warna: any[], sizes: any[] },
  incrementGlobalSeq: (count: number) => number,
  existingNomorPOs: string[] = []
): ProcessedPOData => {
  // ...
    // Generate Bundles — menggunakan generateBarcode() kanonik (K2)
    const startSeq = incrementGlobalSeq(poTotalBundles);
    let currentGlobalSeq = startSeq;
    const poBundles: any[] = [];
  // ...
        const barcodeString = generateBarcode({
          nomorPO,
          model: modelName,
          warna: warnaName,
          size: sizeName,
          globalSequence: currentGlobalSeq,
          bundleIndex: i,
          tanggal: new Date()
        });

        poBundles.push({
          barcode: barcodeString,
  // ...
        currentGlobalSeq++;
```

**SESUDAH**:
```typescript
export const processPOCSV = (
  results: Papa.ParseResult<any>,
  masterData: { klien: any[], produk: any[], model: any[], warna: any[], sizes: any[] },
  existingNomorPOs: string[] = []
): ProcessedPOData => {
  // ...
    // Generate Bundles dengan placeholder sementara (Perubahan #2)
    const poBundles: any[] = [];
  // ...
        // Gunakan placeholder sementara
        const barcodeString = `TEMP-${i}`;

        poBundles.push({
          barcode: barcodeString,
          // ... tanpa increment dan assign global sequence 
```

---

## PERUBAHAN #3 — ModalImportPO

**SEBELUM**:
```tsx
export default function ModalImportPO({ onClose }: ModalImportPOProps) {
  const masterData = useMasterStore();
  const { incrementGlobalSequence, poList, createPOWithBundles } = usePOStore();
  
  // ...
        const processed = processPOCSV(
          results,
          masterData,
          incrementGlobalSequence,
          existingNomorPOs
        );
```

**SESUDAH**:
```tsx
export default function ModalImportPO({ onClose }: ModalImportPOProps) {
  const masterData = useMasterStore();
  const { poList, createPOWithBundles } = usePOStore();
  
  // ...
        const processed = processPOCSV(
          results,
          masterData,
          existingNomorPOs
        );
```

---

## ASUMSI YANG DIBUAT
1. **Eksekusi dan Ekstraksi `bundleIndex`**: Karena `createPOWithBundles` akan secara dinamis me-regenerate total final barcode dari `reserve_bundle_sequence`, ia memerlukan `bundleIndex` dari per-PO item (1 to N). Untuk menghindari break dari form manual UI yang mana ia belum diubah—`createPOWithBundles` akan mengekstrak urutan angka tersebut secara pintar dari `barcodes placeholder` asli (Bisa menggunakan pattern `-BDLxx` jika form UI, atau `TEMP-xx` dari CSV). 
2. Properti `state.globalSequence` dipertahankan dalam `set()` update agar indikator counter Sequence di front-end UI tidak terganggu, walaupun _source-of-truth_-nya tetap dari respon RPC PostgreSQL.

## BUG BARU YANG DITEMUKAN (tidak diperbaiki)
- Tidak ada bug baru yang diformulasikan / ditemukan.

## STATUS
- [x] Semua 3 perubahan selesai
