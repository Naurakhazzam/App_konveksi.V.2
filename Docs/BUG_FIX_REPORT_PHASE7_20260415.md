# Laporan Perbaikan Bug Phase 7 — Modul Surat Jalan & Pengiriman

## FILES CHANGED
- `Docs/SQL_PHASE_7_ATOMIC_SJ.sql` → [BARU] PostgreSQL function `create_sj_atomic` yang menangani keempat operasi DB dalam satu transaksi atomik.
- `src/stores/usePengirimanStore.ts` → Mengganti `addSuratJalan` + `getNextNomorSJ` dengan `createSuratJalanAtomic` yang memanggil RPC.
- `src/features/pengiriman/BuatSuratJalan/BuatSuratJalanView.tsx` → Menggunakan `createSuratJalanAtomic`, menghapus alur multi-step lama.
- `src/stores/usePOStore.ts` → Menambahkan guard penolakan `removePO` apabila ada bundle dalam SJ.

---

## BUG #15 — Atomic SJ Creation

**Field tabel `surat_jalan` yang ditemukan:**
`id`, `nomor_sj`, `klien_id`, `tanggal`, `total_qty`, `total_bundle`, `catatan`, `status`, `dibuat_oleh`, `pengirim`

**Field tabel `surat_jalan_items` yang ditemukan:**
`id`, `surat_jalan_id`, `bundle_barcode`, `po_id`, `model_id`, `warna_id`, `size_id`, `sku_klien`, `qty`, `qty_packing`, `alasan_selisih`

**Isi `SQL_PHASE_7_ATOMIC_SJ.sql`:**
```sql
CREATE OR REPLACE FUNCTION create_sj_atomic(
  p_sj              JSONB,
  p_items           JSONB,
  p_bundle_barcodes TEXT[]
) RETURNS TEXT AS $$
DECLARE
  v_sj_id    TEXT;
  v_nomor_sj TEXT;
BEGIN
  v_sj_id    := p_sj->>'id';
  v_nomor_sj := get_next_sj_number();   -- Server-side SEQUENCE (atomic)

  -- STEP 2: INSERT header surat_jalan
  INSERT INTO surat_jalan (...) VALUES (...);

  -- STEP 3: INSERT loop surat_jalan_items
  INSERT INTO surat_jalan_items (...)
  SELECT ... FROM jsonb_array_elements(p_items) AS item;

  -- STEP 4: UPDATE bundle.surat_jalan_id
  UPDATE bundle SET surat_jalan_id = v_sj_id
  WHERE barcode = ANY(p_bundle_barcodes);

  RETURN v_nomor_sj;
END;
$$ LANGUAGE plpgsql;
```

**SEBELUM (`usePengirimanStore.ts`):**
```typescript
// Interface
addSuratJalan: (sj: SuratJalan) => Promise<void>;
getNextNomorSJ: () => Promise<string>;

// Implementasi: 3 insert terpisah tanpa atomisitas
addSuratJalan: async (sj) => {
  set(...optimistic...);
  await supabase.from('surat_jalan').insert({...});      // bisa gagal
  await supabase.from('surat_jalan_items').insert({...}); // bisa gagal setelah step 1 sukses
  // bundle update dijalankan dari BuatSuratJalanView secara terpisah!
}
```

**SESUDAH (`usePengirimanStore.ts`):**
```typescript
// Interface
createSuratJalanAtomic: (sj: Omit<SuratJalan, 'nomorSJ'>, bundleBarcodes: string[]) => Promise<string>;

// Implementasi: 1 RPC atomik
createSuratJalanAtomic: async (sj, bundleBarcodes) => {
  set(...optimistic dengan nomorSJ: '...'...);
  const { data: nomorSJ, error } = await supabase.rpc('create_sj_atomic', {...});
  if (error) throw error;
  // Update state lokal dengan nomor SJ yang valid dari server
  set(...nomorSJ: finalNomorSJ...);
  return finalNomorSJ;
  // catch: rollback optimistic + re-throw untuk UI handler
}
```

**SEBELUM (`BuatSuratJalanView.tsx`):**
```typescript
const nomorSJ = await getNextNomorSJ(); // client-side — race condition!
addSuratJalan({...});                    // tidak di-await! fire-and-forget
await updateBundleSuratJalan(barcodes, sjId); // step terpisah, bisa tak sinkron
router.push('/pengiriman/riwayat');
```

**SESUDAH (`BuatSuratJalanView.tsx`):**
```typescript
try {
  await createSuratJalanAtomic({...}, bundleBarcodes); // 1 await, semua atomik
  router.push('/pengiriman/riwayat');
} catch (err) {
  alert('Gagal membuat Surat Jalan...');
}
```

---

## BUG #16 — PO Deletion Guard

**SEBELUM (`usePOStore.ts` — awal `removePO`):**
```typescript
removePO: async (id: string) => {
  const po = get().getPOById(id);
  // Optimistic update — langsung hapus tanpa cek SJ
  set((state) => ({ poList: state.poList.filter((p) => p.id !== id) }));
  ...
```

**SESUDAH:**
```typescript
removePO: async (id: string) => {
  const po = get().getPOById(id);

  // Guard: Tolak hapus PO jika ada bundle yang sudah masuk Surat Jalan
  const bundleStore = useBundleStore.getState();
  const poBundle = bundleStore.bundles.filter(
    b => b.po === id && b.suratJalanId
  );
  if (poBundle.length > 0) {
    throw new Error(
      `PO tidak bisa dihapus. ${poBundle.length} bundle ` +
      `sudah masuk Surat Jalan. Batalkan SJ terlebih dahulu.`
    );
  }

  // Optimistic update
  set((state) => ({ poList: state.poList.filter((p) => p.id !== id) }));
  ...
```

> **Catatan pemanggil:** `removePO` sudah di-_throw_; UI yang memanggil fungsi ini (mis. `InputPO`) diharapkan sudah memiliki `try-catch` untuk menampilkan error sebagai toast/alert.

---

## VERIFIKASI FILE INTEGRITY

| File | Baris Terakhir |
|---|---|
| `usePengirimanStore.ts` | L168: `}));` |
| `BuatSuratJalanView.tsx` | L173: `}` |
| `usePOStore.ts` | L540: _(trailing whitespace)_ |
| `SQL_PHASE_7_ATOMIC_SJ.sql` | Normal EOF |

---

## ASUMSI YANG DIBUAT
1. Fungsi `get_next_sj_number()` dan sekuens `sj_global_seq` dianggap sudah ada di database Supabase (sesuai [K1]).
2. `nomorSJ` diisi `''` (string kosong) di sisi TypeScript pada *payload* optimistic karena nilai final sepenuhnya ditentukan oleh server (dikembalikan dari RPC sebagai `RETURNS TEXT`).
3. Karena `create_sj_atomic` menjalankan `UPDATE bundle` secara internal, fungsi `updateBundleSuratJalan` tidak perlu dipanggil lagi dari `BuatSuratJalanView` dan import-nya telah dihapus.

## BUG BARU YANG DITEMUKAN (tidak diperbaiki)
- **`dibuatOleh` hardcoded `'ADMIN'`** di `BuatSuratJalanView.tsx` (baris 79). Seharusnya menggunakan `currentUser?.nama` dari `useAuthStore`. Ini mengakibatkan semua Surat Jalan tercatat atas nama "ADMIN" bukan nama operator asli.

---

## STATUS
- [x] Semua 2 bug selesai (Bug #15 + Bug #16)
