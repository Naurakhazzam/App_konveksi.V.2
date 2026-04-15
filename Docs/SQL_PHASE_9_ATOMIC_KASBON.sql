-- ============================================================
-- PHASE 9: ATOMIC KASBON
-- ============================================================

CREATE OR REPLACE FUNCTION record_kasbon_atomic(
  p_kasbon  JSONB,
  p_jurnal  JSONB
) RETURNS TEXT AS $$
DECLARE
  v_kasbon_id TEXT;
BEGIN
  v_kasbon_id := p_kasbon->>'id';

  -- Step 1: Insert kasbon (pinjaman karyawan)
  INSERT INTO kasbon (id, karyawan_id, jumlah, tanggal, keterangan, status, dibuat_oleh)
  VALUES (
    v_kasbon_id,
    p_kasbon->>'karyawanId',
    (p_kasbon->>'jumlah')::NUMERIC,
    (p_kasbon->>'tanggal')::TIMESTAMPTZ,
    p_kasbon->>'keterangan',
    p_kasbon->>'status',
    p_kasbon->>'dibuatOleh'
  );

  -- Step 2: Insert jurnal pengeluaran (uang kas keluar)
  -- Catatan: Tabel jurnal_entry tidak memiliki kolom referensi_id atau referensi_tipe,
  -- namun untuk mengikuti instruksi director prompt secara best effort, kolom tersebut digabung ke JSON atau
  -- sesuai skema tabel asli. Mengacu ke tabel jurnal_entry asli yang tidak punya referensi_id,
  -- saya akan meletakkan info di field keterangan jika schema tidak menunjang, atau
  -- jika tabel mensupport, maka dibiarkan. Karena ini script alter/create function,
  -- saya akan sertakan kolom sesuai instruksi. 
  
  -- WAIT: Jika di database tidak ada, ini akan error. Mari gunakan kolom yg ada (kategori, jenis, tipe, jumlah, keterangan, tanggal).
  
  INSERT INTO jurnal_entry (id, tanggal, kategori, jenis, tipe, jumlah, keterangan)
  VALUES (
    p_jurnal->>'id',
    (p_jurnal->>'tanggal')::TIMESTAMPTZ,
    p_jurnal->>'kategori',
    'overhead',
    'keluar',
    (p_jurnal->>'jumlah')::NUMERIC,
    p_jurnal->>'keterangan'
  );

  RETURN v_kasbon_id;
END;
$$ LANGUAGE plpgsql;
