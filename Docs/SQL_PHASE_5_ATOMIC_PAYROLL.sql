-- ==========================================
-- PHASE 5: ATOMIC PAYROLL TRANSACTION
-- ==========================================
-- Fungsi ini menjamin seluruh proses pembayaran gaji (BORONGAN + GAPOK - KASBON) 
-- tercatat secara atomik di database dan sinkron dengan Jurnal Umum.

CREATE OR REPLACE FUNCTION pay_salary_atomic(
  p_karyawan_id TEXT,
  p_ledger_ids TEXT[],
  p_tanggal_bayar TIMESTAMPTZ,
  p_gapok_row JSONB DEFAULT NULL,
  p_kasbon_row JSONB DEFAULT NULL,
  p_jurnal_row JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- 1. UPDATE STATUS LEDGER BORONGAN MENJADI LUNAS
  IF array_length(p_ledger_ids, 1) > 0 THEN
    UPDATE gaji_ledger 
    SET 
        status = 'lunas', 
        lunas = true, 
        tanggal_bayar = p_tanggal_bayar
    WHERE id = ANY(p_ledger_ids);
  END IF;

  -- 2. INSERT GAJI POKOK (IF EXISTS)
  IF p_gapok_row IS NOT NULL THEN
    INSERT INTO gaji_ledger (
      id, karyawan_id, tipe, total, jumlah, tanggal, 
      sumber_id, keterangan, status, lunas, tanggal_bayar, is_printed
    ) VALUES (
      (p_gapok_row->>'id'),
      (p_gapok_row->>'karyawan_id'),
      (p_gapok_row->>'tipe'),
      (p_gapok_row->>'total')::NUMERIC,
      (p_gapok_row->>'total')::NUMERIC,
      (p_gapok_row->>'tanggal')::TIMESTAMPTZ,
      (p_gapok_row->>'sumber_id'),
      (p_gapok_row->>'keterangan'),
      (p_gapok_row->>'status'),
      true,
      p_tanggal_bayar,
      false
    );
  END IF;

  -- 3. INSERT POTONGAN KASBON (IF EXISTS)
  IF p_kasbon_row IS NOT NULL THEN
    INSERT INTO kasbon (
      id, karyawan_id, jumlah, tanggal, keterangan, status, lunas
    ) VALUES (
      (p_kasbon_row->>'id'),
      (p_kasbon_row->>'karyawan_id'),
      (p_kasbon_row->>'jumlah')::NUMERIC,
      (p_kasbon_row->>'tanggal')::TIMESTAMPTZ,
      (p_kasbon_row->>'keterangan'),
      (p_kasbon_row->>'status'),
      true
    );
  END IF;

  -- 4. INSERT JURNAL ENTRY (PENGELUARAN KAS)
  IF p_jurnal_row IS NOT NULL THEN
    INSERT INTO jurnal_entry (
      id, kategori, jenis, tipe, jumlah, keterangan, tanggal, waktu
    ) VALUES (
      (p_jurnal_row->>'id'),
      (p_jurnal_row->>'kategori'),
      (p_jurnal_row->>'jenis'),
      (p_jurnal_row->>'tipe'),
      (p_jurnal_row->>'nominal')::NUMERIC,
      (p_jurnal_row->>'keterangan'),
      (p_jurnal_row->>'tanggal')::DATE,
      (p_jurnal_row->>'tanggal')::TIMESTAMPTZ
    );
  END IF;

END;
$$ LANGUAGE plpgsql;
