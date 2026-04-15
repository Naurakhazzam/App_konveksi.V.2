-- SQL Script: Stored Procedure untuk Pembuatan PO Atomik
-- Jalankan skrip ini di SQL Editor di dashboard Supabase Anda.

CREATE OR REPLACE FUNCTION create_po_atomic(
    p_po JSONB,
    p_items JSONB,
    p_bundles JSONB
) RETURNS VOID AS $$
DECLARE
    v_po_id TEXT;
BEGIN
    -- Ambil ID PO untuk referensi
    v_po_id := p_po->>'id';

    -- 1. Insert ke Tabel purchase_order
    INSERT INTO purchase_order (
        id, 
        klien_id, 
        nomor_po, 
        tanggal_input, 
        status, 
        tanggal_deadline, 
        catatan
    )
    VALUES (
        v_po_id,
        (p_po->>'klien_id')::TEXT,
        (p_po->>'nomor_po')::TEXT,
        (p_po->>'tanggal_input')::TIMESTAMP WITH TIME ZONE,
        (p_po->>'status')::TEXT,
        (p_po->>'tanggal_deadline')::TIMESTAMP WITH TIME ZONE,
        (p_po->>'catatan')::TEXT
    );

    -- 2. Insert ke Tabel po_item
    INSERT INTO po_item (
        id, 
        po_id, 
        model_id, 
        warna_id, 
        size_id, 
        qty, 
        qty_per_bundle, 
        jumlah_bundle, 
        sku_klien, 
        sku_internal, 
        status_cutting
    )
    SELECT 
        (item->>'id')::TEXT,
        v_po_id,
        (item->>'model_id')::TEXT,
        (item->>'warna_id')::TEXT,
        (item->>'size_id')::TEXT,
        (item->>'qty')::NUMERIC,
        (item->>'qty_per_bundle')::NUMERIC,
        (item->>'jumlah_bundle')::NUMERIC,
        (item->>'sku_klien')::TEXT,
        (item->>'sku_internal')::TEXT,
        (item->>'status_cutting')::TEXT
    FROM jsonb_array_elements(p_items) AS item;

    -- 3. Insert ke Tabel bundle
    INSERT INTO bundle (
        id, 
        barcode, 
        po_id, 
        po_item_id, 
        model_id, 
        warna_id, 
        size_id, 
        qty_bundle, 
        sku_klien, 
        sku_internal
    )
    SELECT 
        (bundle->>'id')::TEXT,
        (bundle->>'barcode')::TEXT,
        v_po_id,
        (bundle->>'po_item_id')::TEXT,
        (bundle->>'model_id')::TEXT,
        (bundle->>'warna_id')::TEXT,
        (bundle->>'size_id')::TEXT,
        (bundle->>'qty_bundle')::NUMERIC,
        (bundle->>'sku_klien')::TEXT,
        (bundle->>'sku_internal')::TEXT
    FROM jsonb_array_elements(p_bundles) AS bundle;

END;
$$ LANGUAGE plpgsql;
