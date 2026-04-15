# DIRECTOR PROMPT — Phase 10 Bug Fix: Modul Inventori & Gudang

## KONTEKS PROJECT
Kamu sedang bekerja di project `STITCHLYX SYNCORE V2` — aplikasi manajemen produksi konveksi berbasis Next.js + TypeScript + Zustand + Supabase.

Perbaiki 6 bug di modul Inventori berdasarkan hasil audit. **Baca setiap file secara penuh sebelum mengeditnya.**

File yang akan diubah:
- `src/stores/useInventoryStore.ts`
- `src/features/keuangan/JurnalUmum/ModalTambahJurnal.tsx`
- `src/features/gudang/FormBahanBaku.tsx` (atau path serupa)
- `Docs/SQL_PHASE_10_ATOMIC_FIFO.sql` ← file BARU

---

## BUG #29 — Double Stok Pembelian (KRITIS)
**File:** `ModalTambahJurnal.tsx`

Saat kategori `direct_bahan` dipilih dan form disubmit, kode memanggil `addBatch()` secara langsung SEBELUM `onConfirm()`. Padahal `onConfirm()` sudah memanggil RPC `record_purchase_atomic` yang sudah termasuk INSERT batch dan UPDATE stok di dalamnya. Akibatnya stok double setiap pembelian.

**Perbaikan:** Baca `ModalTambahJurnal.tsx` secara penuh. Cari baris yang memanggil `addBatch()` secara langsung (bukan via RPC). Hapus pemanggilan `addBatch()` tersebut. RPC `record_purchase_atomic` sudah cukup dan sudah menangani semua operasi inventory secara atomik.

Setelah edit, baca 10 baris terakhir file untuk konfirmasi tidak terpotong.

---

## BUG #30 — consumeFIFO Tidak Atomik → Buat RPC (KRITIS)
**File:** `Docs/SQL_PHASE_10_ATOMIC_FIFO.sql` (BARU) + `src/stores/useInventoryStore.ts`

**Langkah 1:** Buat file SQL baru `Docs/SQL_PHASE_10_ATOMIC_FIFO.sql`:

```sql
-- Sequence untuk invoice number yang persisten
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_num  INT;
  v_date TEXT;
BEGIN
  v_num  := nextval('invoice_number_seq');
  v_date := TO_CHAR(NOW(), 'DD/MM/YY');
  RETURN LPAD(v_num::TEXT, 4, '0') || '/INV/' || v_date;
END;
$$ LANGUAGE plpgsql;

-- Fungsi atomic FIFO consumption dengan SELECT FOR UPDATE (mencegah race condition)
CREATE OR REPLACE FUNCTION consume_fifo_atomic(
  p_item_id  TEXT,
  p_qty_needed NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_batch         RECORD;
  v_remaining     NUMERIC := p_qty_needed;
  v_total_cost    NUMERIC := 0;
  v_consumed      JSONB   := '[]'::JSONB;
  v_take          NUMERIC;
  v_available     NUMERIC;
  v_insufficient  BOOLEAN := FALSE;
BEGIN
  -- Loop batch dari yang terlama, lock untuk mencegah race condition
  FOR v_batch IN
    SELECT id, qty, qty_terpakai, harga_satuan
    FROM inventory_batch
    WHERE item_id = p_item_id
      AND (qty - COALESCE(qty_terpakai, 0)) > 0
    ORDER BY tanggal ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_available := v_batch.qty - COALESCE(v_batch.qty_terpakai, 0);
    v_take      := LEAST(v_remaining, v_available);

    UPDATE inventory_batch
    SET qty_terpakai = COALESCE(qty_terpakai, 0) + v_take
    WHERE id = v_batch.id;

    v_total_cost := v_total_cost + (v_take * v_batch.harga_satuan);
    v_consumed   := v_consumed || jsonb_build_object(
      'batchId', v_batch.id,
      'qty', v_take,
      'harga', v_batch.harga_satuan
    );
    v_remaining := v_remaining - v_take;
  END LOOP;

  -- Jika stok tidak cukup, catat sisa sebagai hutang stok (warning, tidak error)
  IF v_remaining > 0 THEN
    v_insufficient := TRUE;
  END IF;

  -- Update kolom stok ringkasan di inventory_item (single source of truth)
  UPDATE inventory_item
  SET stok = stok - (p_qty_needed - v_remaining)
  WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'totalCost', v_total_cost,
    'consumedBatches', v_consumed,
    'insufficient', v_insufficient,
    'qtyShortfall', v_remaining
  );
END;
$$ LANGUAGE plpgsql;
```

**Langkah 2:** Baca `useInventoryStore.ts` secara penuh. Ganti implementasi `consumeFIFO` yang lama (yang menggunakan `Promise.all` multi-UPDATE terpisah) dengan implementasi baru yang memanggil RPC:

```typescript
consumeFIFO: async (itemId: string, qtyNeeded: number) => {
  const { data, error } = await supabase.rpc('consume_fifo_atomic', {
    p_item_id: itemId,
    p_qty_needed: qtyNeeded,
  });
  if (error) throw error;

  // Refresh batches dari DB setelah konsumsi
  await get().fetchBatches(itemId);

  // Jika stok tidak cukup, kembalikan warning (bukan error — by design)
  if (data.insufficient) {
    console.warn(`[consumeFIFO] Stok tidak cukup untuk item ${itemId}. Shortfall: ${data.qtyShortfall}`);
  }

  return {
    totalCost: data.totalCost,
    consumedBatches: data.consumedBatches,
    insufficient: data.insufficient,
    qtyShortfall: data.qtyShortfall,
  };
},
```

> Sesuaikan dengan signature dan tipe yang sudah ada di store. Jika `fetchBatches` namanya berbeda, gunakan nama yang ada.

Di `ScanResult.tsx` (caller consumeFIFO), setelah pemanggilan berhasil, cek apakah `result.insufficient === true`. Jika ya, tampilkan pesan warning ke operator: `warning('Stok Aksesoris', 'Stok tidak mencukupi. Produksi tetap lanjut, harap segera input pembelian.')` — **jangan throw error, jangan hentikan proses**.

Setelah semua edit, baca 10 baris terakhir setiap file yang diubah.

---

## BUG #31 — invoiceCounter Tidak Persisten (SEDANG)
**File:** `src/stores/useInventoryStore.ts`

Cari fungsi `generateInvoiceNo` atau kode yang menghasilkan nomor invoice. Saat ini menggunakan counter in-memory yang reset setiap refresh. Ganti dengan pemanggilan RPC:

```typescript
generateInvoiceNo: async () => {
  const { data, error } = await supabase.rpc('get_next_invoice_number');
  if (error) throw error;
  return data as string;
},
```

Fungsi `get_next_invoice_number` sudah ada di SQL yang dibuat pada Bug #30.

Pastikan semua pemanggilan `generateInvoiceNo` sudah menggunakan `await` karena fungsi ini sekarang async.

---

## BUG #32 — Validasi qty dan harga di addBatch (SEDANG)
**File:** `src/stores/useInventoryStore.ts`

Di dalam fungsi `addBatch`, tambahkan validasi di awal sebelum operasi apapun:

```typescript
if (!batch.qty || batch.qty <= 0) {
  throw new Error('Qty batch harus lebih dari 0.');
}
if (!batch.hargaSatuan || batch.hargaSatuan <= 0) {
  throw new Error('Harga satuan harus lebih dari 0.');
}
```

> Sesuaikan nama field dengan interface yang ada (`batch.qty`, `batch.hargaSatuan`, dsb).

---

## BUG #33 — isSubmitting di FormBahanBaku (SEDANG)
**File:** `src/features/gudang/FormBahanBaku.tsx` (cari file dengan nama serupa)

Baca file ini. Tambahkan `isSubmitting` state dan bungkus fungsi submit:

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

// Di dalam handleSubmit:
if (isSubmitting) return;
setIsSubmitting(true);
try {
  // logika submit yang ada
} finally {
  setIsSubmitting(false);
}
```

Tambahkan `disabled={isSubmitting}` pada tombol submit.

---

## ATURAN WAJIB
1. Baca setiap file secara penuh sebelum mengedit.
2. Setelah mengedit, baca 10 baris terakhir untuk konfirmasi file tidak terpotong.
3. Jangan ubah file di luar daftar di atas kecuali `ScanResult.tsx` untuk handling warning insufficient stock.
4. Semua operasi store harus menggunakan pola optimistic update + rollback.
5. Simpan laporan sebagai `BUG_FIX_REPORT_PHASE10_20260415.md` di folder `Docs/`.
6. Laporan harus mencantumkan: kode bug, SEBELUM, SESUDAH, dan verifikasi file integrity.
