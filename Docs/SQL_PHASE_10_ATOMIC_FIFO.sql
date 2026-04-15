-- ============================================================
-- PHASE 10: ATOMIC FIFO CONSUMPTION + PERSISTENT INVOICE SEQ
-- ============================================================

-- ── Sequence untuk invoice number yang persisten lintas sesi ──────────────────
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

-- ── Atomic FIFO Consumption dengan SELECT FOR UPDATE ─────────────────────────
-- Mencegah:
--   1. Race condition antar dua operator yang scan bersamaan (B-4)
--   2. Multi-UPDATE terpisah tanpa rollback (B-3)
--   3. Stok negatif tanpa peringatan (B-2)
--
-- Jika stok tidak cukup:
--   - Tidak throw error (tidak menghentikan produksi)
--   - Mengembalikan flag insufficient + qtyShortfall sebagai WARNING
--   - Stok di inventory_item di-update sesuai yang benar-benar tersedia
--
CREATE OR REPLACE FUNCTION consume_fifo_atomic(
  p_item_id    TEXT,
  p_qty_needed NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_batch        RECORD;
  v_remaining    NUMERIC := p_qty_needed;
  v_total_cost   NUMERIC := 0;
  v_consumed     JSONB   := '[]'::JSONB;
  v_take         NUMERIC;
  v_available    NUMERIC;
  v_insufficient BOOLEAN := FALSE;
BEGIN
  -- Loop batch dari terlama (FIFO), lock baris untuk mencegah race condition
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
    v_consumed   := v_consumed || jsonb_build_array(jsonb_build_object(
      'batchId', v_batch.id,
      'qty',     v_take,
      'harga',   v_batch.harga_satuan
    ));
    v_remaining := v_remaining - v_take;
  END LOOP;

  -- Tandai insufficient jika stok tidak mencukupi seluruh permintaan
  IF v_remaining > 0 THEN
    v_insufficient := TRUE;
  END IF;

  -- Update ringkasan stok di inventory_item — hanya kurangi sesuai yang tersedia
  UPDATE inventory_item
  SET stok = GREATEST(0, stok - (p_qty_needed - v_remaining))
  WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'totalCost',       v_total_cost,
    'consumedBatches', v_consumed,
    'insufficient',    v_insufficient,
    'qtyShortfall',    v_remaining
  );
END;
$$ LANGUAGE plpgsql;
