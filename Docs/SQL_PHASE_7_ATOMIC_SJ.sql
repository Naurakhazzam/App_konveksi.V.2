-- ==========================================
-- PHASE 7: ATOMIC SURAT JALAN CREATION
-- ==========================================
-- Fungsi ini menjamin seluruh proses pembuatan Surat Jalan
-- (header SJ + items SJ + update suratJalanId pada bundle)
-- tercatat secara atomik di database dalam satu transaksi.
-- Jika satu langkah gagal, seluruhnya di-ROLLBACK otomatis.
--
-- Prasyarat: get_next_sj_number() SEQUENCE harus sudah ada di DB.
-- Contoh:
--   CREATE SEQUENCE IF NOT EXISTS sj_global_seq START 1;
--   CREATE OR REPLACE FUNCTION get_next_sj_number()
--   RETURNS TEXT AS $$
--   DECLARE
--     v_seq  BIGINT;
--     v_year TEXT;
--   BEGIN
--     v_seq  := nextval('sj_global_seq');
--     v_year := TO_CHAR(NOW(), 'YYYY');
--     RETURN 'SJ/' || v_year || '/' || LPAD(v_seq::TEXT, 4, '0');
--   END;
--   $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_sj_atomic(
  p_sj              JSONB,
  p_items           JSONB,
  p_bundle_barcodes TEXT[]
) RETURNS TEXT AS $$
DECLARE
  v_sj_id    TEXT;
  v_nomor_sj TEXT;
BEGIN
  -- Ambil ID dari payload
  v_sj_id := p_sj->>'id';

  -- STEP 1: Dapatkan nomor SJ unik dari server-side SEQUENCE
  v_nomor_sj := get_next_sj_number();

  -- STEP 2: INSERT header ke tabel surat_jalan
  INSERT INTO surat_jalan (
    id,
    nomor_sj,
    klien_id,
    tanggal,
    total_qty,
    total_bundle,
    catatan,
    status,
    dibuat_oleh,
    pengirim
  ) VALUES (
    v_sj_id,
    v_nomor_sj,
    (p_sj->>'klien_id')::TEXT,
    (p_sj->>'tanggal')::TIMESTAMPTZ,
    (p_sj->>'total_qty')::NUMERIC,
    (p_sj->>'total_bundle')::NUMERIC,
    (p_sj->>'catatan')::TEXT,
    (p_sj->>'status')::TEXT,
    (p_sj->>'dibuat_oleh')::TEXT,
    (p_sj->>'pengirim')::TEXT
  );

  -- STEP 3: INSERT setiap item ke tabel surat_jalan_items
  INSERT INTO surat_jalan_items (
    id,
    surat_jalan_id,
    bundle_barcode,
    po_id,
    model_id,
    warna_id,
    size_id,
    sku_klien,
    qty,
    qty_packing,
    alasan_selisih
  )
  SELECT
    (item->>'id')::TEXT,
    v_sj_id,
    (item->>'bundle_barcode')::TEXT,
    (item->>'po_id')::TEXT,
    (item->>'model_id')::TEXT,
    (item->>'warna_id')::TEXT,
    (item->>'size_id')::TEXT,
    (item->>'sku_klien')::TEXT,
    (item->>'qty')::NUMERIC,
    (item->>'qty_packing')::NUMERIC,
    (item->>'alasan_selisih')::TEXT
  FROM jsonb_array_elements(p_items) AS item;

  -- STEP 4: UPDATE surat_jalan_id pada setiap bundle yang dikirim
  UPDATE bundle
  SET surat_jalan_id = v_sj_id
  WHERE barcode = ANY(p_bundle_barcodes);

  -- Kembalikan nomor SJ yang dihasilkan ke client
  RETURN v_nomor_sj;

END;
$$ LANGUAGE plpgsql;
