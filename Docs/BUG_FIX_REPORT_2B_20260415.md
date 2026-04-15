# LAPORAN PERBAIKAN BUG #2B — STITCHLYX SYNCORE V2

**Tanggal**: 15 April 2026
**Scope**: Pengerasan Keamanan & Resiliensi Scan 'Terima'

---

## PERBAIKAN #1 — Fallback Password
Dilakukan pengubahan fallback credentials dari string dummy menjadi string kosong `''` dan penambahan validasi *truthy* untuk mencegah kecocokan pada input kosong jika environment variable tidak terdefinisi.

### 1. Emergency Codes (Fauzan Backdoor)
**SEBELUM:**
```typescript
const emergency1 = process.env.NEXT_PUBLIC_EMERGENCY_CODE_1 || 'FALLBACK_EMG1';
const emergency2 = process.env.NEXT_PUBLIC_EMERGENCY_CODE_2 || 'FALLBACK_EMG2';
const isEmergencyCode = (password_or_pin === emergency1 || password_or_pin === emergency2);
```

**SESUDAH:**
```typescript
const emergency1 = process.env.NEXT_PUBLIC_EMERGENCY_CODE_1 || '';
const emergency2 = process.env.NEXT_PUBLIC_EMERGENCY_CODE_2 || '';
// Menambahkan check password_or_pin agar tidak login jika input & env sama-sama kosong
const isEmergencyCode = password_or_pin && (password_or_pin === emergency1 || password_or_pin === emergency2);
```

### 2. Visitor Passwords
**SEBELUM:**
```typescript
const vis1 = process.env.NEXT_PUBLIC_VISITOR_PASS_1 || 'FALLBACK_VIS1';
const validPasswords = [vis1.toLowerCase(), ...];
```

**SESUDAH:**
```typescript
const vis1 = process.env.NEXT_PUBLIC_VISITOR_PASS_1 || '';
// Memfilter string kosong agar tidak ada password valid jika env tidak diset
const validPasswords = [vis1, vis2, vis3].filter(v => !!v).map(v => v.toLowerCase());
if (password && validPasswords.includes(password.toLowerCase())) { ... }
```

---

## PERBAIKAN #2 — Scan Terima
Status: **SUDAH DIPROTEKSI**. 

Pada perbaikan sebelumnya, fungsi `executeTerima` di dalam `ScanResult.tsx` telah dibungkus dengan blok `try-catch` untuk menangani kegagalan penyimpanan data scan ke Supabase secara asinkron.

### Kode di `ScanResult.tsx`:
```typescript
  const executeTerima = async (finalQty: number) => {
    const now = new Date().toISOString();
    updateStatusTahap(bundle.barcode, tahap, {
      status: 'terima',
      qtyTerima: finalQty,
      waktuTerima: now,
      karyawan: needsKaryawan ? selectedKaryawan : null,
    });

    try {
      await addRecord({
        id: `SCAN-${Date.now()}`,
        barcode: bundle.barcode,
        po: bundle.po,
        tahap,
        aksi: 'terima',
        qty: finalQty,
        waktu: now
      });
      if (onComplete) onComplete();
    } catch (error) {
      warning('Gagal Menyimpan', 'Gagal mencatat data scan terima. Periksa koneksi Anda.');
    }
  };
```

---

## SQL LENGKAP — record_purchase_atomic
Diambil dari file `Docs/SQL_PHASE_6_ATOMIC_FINANCE.sql`. Function ini sekarang secara konsisten menggunakan tabel `inventory_item`.

```sql
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
    
    UPDATE inventory_item 
    SET stok = COALESCE(stok, 0) + v_qty_new 
    WHERE id = v_item_id;

END;
$$ LANGUAGE plpgsql;
```

---

## STATUS
- [x] Semua selesai
