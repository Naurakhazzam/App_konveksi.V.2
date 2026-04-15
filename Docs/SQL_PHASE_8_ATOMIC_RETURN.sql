-- ============================================================
-- PHASE 8: ATOMIC RETURN PROCESSING
-- ============================================================
-- Function ini menjamin 3 operasi retur diproses dalam satu
-- transaksi PostgreSQL yang atomik:
--   1. INSERT ke return_items
--   2. INSERT ke gaji_ledger (potongan upah)
--   3. UPDATE bundle_status_tahap (reset 6 tahap ke null)
--
-- Jika satu langkah gagal, seluruh transaksi di-ROLLBACK.
-- Tidak akan ada kondisi "gaji sudah dipotong tapi retur tidak tercatat".
-- ============================================================

CREATE OR REPLACE FUNCTION process_return_atomic(
  p_return_item    JSONB,
  p_ledger_entry   JSONB,
  p_bundle_barcode TEXT
) RETURNS TEXT AS $$
DECLARE
  v_return_id     TEXT;
  v_bundle_db_id  TEXT;
  v_tahap         TEXT;
  v_reset_stages  TEXT[] := ARRAY['jahit', 'lkancing', 'bbenang', 'qc', 'steam', 'packing'];
BEGIN
  v_return_id := p_return_item->>'id';

  -- ── STEP 1: INSERT ke return_items ─────────────────────────────────────────
  INSERT INTO return_items (
    id,
    barcode,
    po_id,
    klien_id,
    artikel_nama,
    alasan_reject_id,
    alasan_reject_nama,
    original_size,
    current_size,
    karyawan_original,
    karyawan_perbaikan,
    jenis_reject,
    status,
    nominal_potongan,
    qty_bundle,
    waktu_diterima,
    is_self_repair
  ) VALUES (
    v_return_id,
    (p_return_item->>'barcode')::TEXT,
    (p_return_item->>'po_id')::TEXT,
    (p_return_item->>'klien_id')::TEXT,
    (p_return_item->>'artikel_nama')::TEXT,
    (p_return_item->>'alasan_reject_id')::TEXT,
    (p_return_item->>'alasan_reject_nama')::TEXT,
    (p_return_item->>'original_size')::TEXT,
    (p_return_item->>'current_size')::TEXT,
    (p_return_item->>'karyawan_original')::TEXT,
    NULL,
    (p_return_item->>'jenis_reject')::TEXT,
    'diterima',
    (p_return_item->>'nominal_potongan')::NUMERIC,
    (p_return_item->>'qty_bundle')::NUMERIC,
    (p_return_item->>'waktu_diterima')::TIMESTAMPTZ,
    FALSE
  );

  -- ── STEP 2: INSERT ke gaji_ledger (potongan upah penjahit asal) ────────────
  INSERT INTO gaji_ledger (
    id,
    karyawan_id,
    tanggal,
    keterangan,
    sumber_id,
    total,
    tipe,
    status
  ) VALUES (
    (p_ledger_entry->>'id')::TEXT,
    (p_ledger_entry->>'karyawan_id')::TEXT,
    (p_ledger_entry->>'tanggal')::TIMESTAMPTZ,
    (p_ledger_entry->>'keterangan')::TEXT,
    (p_ledger_entry->>'sumber_id')::TEXT,
    (p_ledger_entry->>'total')::NUMERIC,
    (p_ledger_entry->>'tipe')::TEXT,
    (p_ledger_entry->>'status')::TEXT
  );

  -- ── STEP 3: Resolve bundle UUID dari barcode ────────────────────────────────
  SELECT id INTO v_bundle_db_id
  FROM bundle
  WHERE barcode = p_bundle_barcode
  LIMIT 1;

  -- ── STEP 4: UPDATE bundle_status_tahap — reset 6 tahap ke NULL ─────────────
  IF v_bundle_db_id IS NOT NULL THEN
    FOREACH v_tahap IN ARRAY v_reset_stages LOOP
      UPDATE bundle_status_tahap
      SET
        status       = NULL,
        qty_terima   = NULL,
        qty_selesai  = NULL,
        karyawan_id  = NULL,
        updated_at   = NOW()
      WHERE bundle_id = v_bundle_db_id
        AND tahap     = v_tahap;
    END LOOP;
  END IF;

  RETURN v_return_id;

END;
$$ LANGUAGE plpgsql;
