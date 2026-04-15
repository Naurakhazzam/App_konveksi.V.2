# LAPORAN PERBAIKAN BUG PHASE 2 — STITCHLYX SYNCORE V2

**Tanggal**: 15 April 2026
**Scope**: Modul PO & Bundle — CSV Import, Bundle Rollback, removePO

---

## FILES CHANGED
- `src/lib/utils/po-import.ts` → Refaktor struktur output `ProcessedPOData` agar tiap PO dibundel dengan bundle-nya sendiri (`entries[]`). Mengganti inline barcode string dengan `generateBarcode()` kanonik. Menambahkan `poItemId` ke setiap bundle.
- `src/features/produksi/InputPO/ModalImportPO.tsx` → Mengganti jalur import dari `addPO()` + `addBundles()` menjadi `createPOWithBundles()` per PO (atomic via RPC). Menghapus import `useBundleStore` yang tidak lagi dibutuhkan. Menambahkan handling gagal parsial.
- `src/stores/usePOStore.ts` → (Bug #7) Menambahkan rollback `useBundleStore` di blok catch `createPOWithBundles`. (Bug #8) Mengubah urutan delete di `removePO` menjadi child→parent dan menambahkan `await`.

---

## BUG #6 — CSV Import Bundle ke DB

### Perubahan di `po-import.ts`

**SEBELUM** — Struktur data output flat, barcode inline, `poItemId` tidak diisi:
```typescript
export interface ProcessedPOData {
  pos: any[];
  bundles: any[];
  errors: string[];
}

// Barcode inline (format inkonsisten dengan form manual):
const barcodeString = `PO${nomorPO.replace(/[^a-zA-Z0-9]/g, '')}-${currentGlobalSeq...}-BDL${i...}`;

bundles.push({
  barcode: barcodeString,
  po: poId,
  // poItemId TIDAK ADA
  model: item.modelId,
  ...
});

return { pos, bundles, errors };
```

**SESUDAH** — Struktur per-PO entry, barcode via `generateBarcode()`, `poItemId` terisi:
```typescript
export interface ProcessedPOEntry {
  po: any;
  bundles: any[];
}

export interface ProcessedPOData {
  entries: ProcessedPOEntry[];
  errors: string[];
  totalBundles: number;
}

// Barcode via generateBarcode() kanonik (K2):
const barcodeString = generateBarcode({
  nomorPO, model: modelName, warna: warnaName, size: sizeName,
  globalSequence: currentGlobalSeq, bundleIndex: i, tanggal: new Date()
});

poBundles.push({
  barcode: barcodeString,
  po: poId,
  poItemId: item.id, // K3: Wajib isi poItemId
  model: item.modelId,
  ...
});

entries.push({ po, bundles: poBundles });
return { entries, errors, totalBundles };
```

### Perubahan di `ModalImportPO.tsx`

**SEBELUM** — Non-atomic, bundle hanya masuk Zustand:
```typescript
const { addPO, incrementGlobalSequence, poList } = usePOStore();
const { addBundles } = useBundleStore();

const handleImport = () => {
  summary.pos.forEach(po => addPO(po));
  addBundles(summary.bundles);
  success("Impor Berhasil", `${summary.pos.length} PO...`);
};
```

**SESUDAH** — Setiap PO diproses via `createPOWithBundles` (atomic RPC):
```typescript
const { incrementGlobalSequence, poList, createPOWithBundles } = usePOStore();
// useBundleStore tidak lagi diimport

const handleImport = async () => {
  let successCount = 0;
  let failCount = 0;

  for (const entry of summary.entries) {
    try {
      await createPOWithBundles(entry.po, entry.bundles);
      successCount++;
    } catch (err) {
      failCount++;
    }
  }

  // Feedback: berhasil semua / sebagian / gagal semua
  if (failCount === 0) success(...)
  else if (successCount > 0) warning(...)
  else error(...)
};
```

---

## BUG #7 — Bundle Rollback

### Perubahan di `usePOStore.ts` — `createPOWithBundles`

**SEBELUM** — Bundle tidak di-rollback:
```typescript
    } catch (err) {
      console.error('[usePOStore] createPOWithBundles error:', err);
      // Rollback lokal
      set((state) => ({
        poList: state.poList.filter((p) => p.id !== po.id),
        globalSequence: state.globalSequence - bundles.length,
      }));
    }
```

**SESUDAH** — Bundle di-rollback + error dilempar ke pemanggil:
```typescript
    } catch (err) {
      console.error('[usePOStore] createPOWithBundles error:', err);
      // Rollback lokal — PO + globalSequence
      set((state) => ({
        poList: state.poList.filter((p) => p.id !== po.id),
        globalSequence: state.globalSequence - bundles.length,
      }));
      // Rollback bundle store
      const bundleBarcodes = bundles.map((b: any) => b.barcode);
      useBundleStore.setState((state) => ({
        bundles: state.bundles.filter(
          (b) => !bundleBarcodes.includes(b.barcode)
        ),
      }));
      throw err; // Lempar ke pemanggil (ModalImportPO)
    }
```

---

## BUG #8 — removePO Order & Await

### Perubahan di `usePOStore.ts` — `removePO`

**SEBELUM** — PO dihapus sebelum bundle, cleanup tidak di-await:
```typescript
    try {
      // Delete PO items terlebih dahulu
      await supabase.from('po_item').delete().eq('po_id', id);

      // Delete PO
      const { error } = await supabase
        .from('purchase_order').delete().eq('id', id);
      if (error) throw error;

      // Cleanup associated bundles and corrections
      const { useKoreksiStore } = require('./useKoreksiStore');
      useBundleStore.getState().removeBundlesByPO(id);      // ❌ Tidak di-await
      useKoreksiStore.getState().removeKoreksiByPO(id);     // ❌ Tidak di-await
```

**SESUDAH** — Urutan child→parent, semua di-await:
```typescript
    try {
      // Urutan hapus: child → parent (menghindari FK constraint error)

      // 1. Hapus bundle_status_tahap + bundle (via removeBundlesByPO)
      await useBundleStore.getState().removeBundlesByPO(id);

      // 2. Hapus koreksi terkait PO ini
      const { useKoreksiStore } = require('./useKoreksiStore');
      await useKoreksiStore.getState().removeKoreksiByPO(id);

      // 3. Hapus PO items
      await supabase.from('po_item').delete().eq('po_id', id);

      // 4. Hapus purchase_order (parent — terakhir)
      const { error } = await supabase
        .from('purchase_order').delete().eq('id', id);
      if (error) throw error;
```

---

## ASUMSI YANG DIBUAT
1. `createPOWithBundles` sekarang melempar error (`throw err`) agar `ModalImportPO` bisa menangkap kegagalan per-PO. Jalur form manual (`FormInputPO.tsx`) **tidak memanggil `createPOWithBundles` dengan `await` dan tidak menangkap error** (line 167: `createPOWithBundles(po, newBundles)` tanpa `try-catch`). Ini berarti error dari form manual akan menjadi unhandled promise rejection — tetapi saya tidak mengubah file itu sesuai aturan K1.
2. Field `totalBundles` ditambahkan ke `ProcessedPOData` untuk menjaga kompatibilitas UI summary di `ModalImportPO.tsx`.
3. `pemakaian_bahan` tidak dihapus di `removePO` sesuai keputusan owner yang menyatakan histori keuangan/operasional harus dipertahankan.

## BUG BARU YANG DITEMUKAN (tidak diperbaiki)
- **FormInputPO.tsx L167**: Panggilan `createPOWithBundles(po, newBundles)` tidak menggunakan `await` dan tidak dibungkus `try-catch`. Setelah fix Bug #7, fungsi ini sekarang melempar error jika RPC gagal — yang akan menjadi unhandled promise rejection di form manual. Perlu ditambahkan `await` + `try-catch` agar toast error muncul ke operator.
- **globalSequence (Audit B1-B3)**: Celah barcode collision akibat globalSequence client-side belum diperbaiki di fase ini — memerlukan migrasi ke PostgreSQL `SEQUENCE` di database.

## STATUS
- [x] Semua 3 bug selesai
