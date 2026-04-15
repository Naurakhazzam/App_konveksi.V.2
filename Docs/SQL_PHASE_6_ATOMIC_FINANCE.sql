-- =============================================
-- PHASE 6: ATOMIC FINANCE & INVENTORY SYNC
-- =============================================
-- Fungsi ini menjamin pembelian bahan (Keluar Uang) selalu sinkron dengan 
-- penambahan stok di gudang.

CREATE OR REPLACE FUNCTION record_purchase_atomic(
  p_jurnal_row JSONB,
  p_batch_row JSONB
) RETURNS void AS $$
DECLARE
    v_item_id TEXT;
    v_qty_new NUMERIC;
BEGIN
    -- 1. INSERT KE JURNAL UMUM
    INSERT INTO jurnal_entry (
      id, kategori, jenis, tipe, jumlah, keterangan, 
      tanggal, waktu, qty, inventory_item_id
    ) VALUES (
      (p_jurnal_row->>'id'),
      (p_jurnal_row->>'kategori'),
      (p_jurnal_row->>'jenis'),
      (p_jurnal_row->>'tipe'),
      (p_jurnal_row->>'nominal')::NUMERIC,
      (p_jurnal_row->>'keterangan'),
      (p_jurnal_row->>'tanggal')::DATE,
      (p_jurnal_row->>'tanggal')::TIMESTAMPTZ,
      (p_jurnal_row->>'qty')::NUMERIC,
      (p_jurnal_row->>'inventory_item_id')
    );

    -- 2. INSERT KE INVENTORY BATCH (BARANG MASUK)
    INSERT INTO inventory_batch (
      id, item_id, qty, qty_terpakai, harga_satuan, 
      tanggal, invoice_no, keterangan
    ) VALUES (
      (p_batch_row->>'id'),
      (p_batch_row->>'item_id'),
      (p_batch_row->>'qty')::NUMERIC,
      0,
      (p_batch_row->>'harga_satuan')::NUMERIC,
      (p_batch_row->>'tanggal')::TIMESTAMPTZ,
      (p_batch_row->>'invoice_no'),
      (p_batch_row->>'keterangan')
    );
    
    -- 3. UPDATE STOK AKHIR DI TABEL MASTER ITEMS
    v_item_id := (p_batch_row->>'item_id');
    v_qty_new := (p_batch_row->>'qty')::NUMERIC;
    
    UPDATE items 
    SET stok = COALESCE(stok, 0) + v_qty_new 
    WHERE id = v_item_id;

END;
$$ LANGUAGE plpgsql;
