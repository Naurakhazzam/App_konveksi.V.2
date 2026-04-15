# DIRECTOR PROMPT — Phase 9 Bug Fix: Modul Keuangan & Jurnal

## KONTEKS PROJECT
Kamu sedang bekerja di project `STITCHLYX SYNCORE V2` — aplikasi manajemen produksi konveksi berbasis Next.js + TypeScript + Zustand + Supabase.

Kamu harus memperbaiki 4 bug di modul Keuangan & Jurnal. **Baca setiap file secara penuh sebelum mengeditnya.**

File yang akan diubah:
- `src/stores/usePayrollStore.ts`
- `src/features/pengajian/ModalTambahKasbon.tsx`
- `src/features/keuangan/jurnal/ModalTambahJurnal.tsx` (atau nama file serupa)
- `src/features/keuangan/jurnal/JurnalUmumView.tsx` (atau nama file serupa)
- `Docs/SQL_PHASE_9_ATOMIC_KASBON.sql` ← file BARU

---

## BUG #25 — Kasbon Tidak Dicatat ke Jurnal (KRITIS)
**File:** `src/stores/usePayrollStore.ts` + `Docs/SQL_PHASE_9_ATOMIC_KASBON.sql`

Saat ini fungsi `addKasbon` hanya menyimpan record ke tabel `kasbon`. Uang tunai yang keluar dari kas perusahaan tidak pernah dicatat sebagai pengeluaran di tabel `jurnal_entry`. Ini membuat laporan keuangan selalu lebih tinggi dari kenyataan.

**Langkah perbaikan:**

1. Baca `usePayrollStore.ts` secara penuh untuk memahami interface `addKasbon` dan struktur data kasbon.
2. Baca `useJurnalStore.ts` secara penuh untuk memahami interface `JurnalEntry` dan struktur tabel `jurnal_entry`.
3. Buat file `Docs/SQL_PHASE_9_ATOMIC_KASBON.sql` dengan function baru:

```sql
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
  INSERT INTO jurnal_entry (id, tanggal, kategori, jumlah, keterangan, referensi_id, referensi_tipe)
  VALUES (
    p_jurnal->>'id',
    (p_jurnal->>'tanggal')::TIMESTAMPTZ,
    p_jurnal->>'kategori',
    (p_jurnal->>'jumlah')::NUMERIC,
    p_jurnal->>'keterangan',
    v_kasbon_id,
    'kasbon'
  );

  RETURN v_kasbon_id;
END;
$$ LANGUAGE plpgsql;
```

> Sesuaikan nama kolom tabel dengan nama kolom aktual yang kamu temukan di kode. Jika ada kolom yang berbeda, gunakan nama kolom yang ada di codebase, bukan nama di atas.

4. Di `usePayrollStore.ts`, ganti implementasi `addKasbon` agar memanggil RPC `record_kasbon_atomic` dengan payload:
   - `p_kasbon`: data kasbon yang sudah ada
   - `p_jurnal`: object JurnalEntry baru dengan:
     - `kategori: 'overhead'` (atau kategori yang sesuai untuk pengeluaran kas)
     - `jumlah: kasbon.jumlah`
     - `keterangan: 'Kasbon - ' + nama karyawan`
     - `referensi_id: kasbon.id`
5. Gunakan pola optimistic update + rollback (backup state, update local, try RPC, catch → restore + throw).
6. Setelah edit, baca 10 baris terakhir file untuk konfirmasi tidak terpotong.

---

## BUG #26 — Double-Submit pada Jurnal Manual (SEDANG)
**File:** `src/features/keuangan/jurnal/ModalTambahJurnal.tsx` (cari file yang berisi modal input jurnal manual)

Tambahkan proteksi double-submit:
- Tambahkan `const [isSubmitting, setIsSubmitting] = useState(false);`
- Bungkus fungsi submit dengan:
```typescript
if (isSubmitting) return;
setIsSubmitting(true);
try {
  // logika submit yang sudah ada
} finally {
  setIsSubmitting(false);
}
```
- Tambahkan `disabled={isSubmitting}` pada tombol submit
- Setelah edit, baca 10 baris terakhir file.

---

## BUG #27 — Input Nominal Negatif Tidak Divalidasi (SEDANG)
**File:** `src/features/keuangan/jurnal/ModalTambahJurnal.tsx`

Di dalam fungsi submit (atau validasi sebelum submit), tambahkan guard:
```typescript
if (!jumlah || jumlah <= 0) {
  setError('Nominal harus lebih dari 0.');
  return;
}
```
Juga pastikan input field untuk nominal memiliki atribut `min={1}` atau `min={0}` (sesuaikan dengan apakah sistem mendukung nilai 0).

---

## BUG #28 — Tidak Ada AuthGate pada Jurnal Manual (SEDANG)
**File:** `src/features/keuangan/jurnal/JurnalUmumView.tsx` atau `ModalTambahJurnal.tsx`

Lihat bagaimana `AuthGateModal` digunakan di modul penggajian. Terapkan mekanisme yang sama untuk submit jurnal manual:
- Sebelum submit, tampilkan `AuthGateModal` yang meminta konfirmasi PIN/password owner
- Jika konfirmasi berhasil, baru jalankan proses insert jurnal
- Jika dibatalkan, tidak ada perubahan

Jika `AuthGateModal` menggunakan pattern callback `onSuccess`, gunakan pattern yang sama seperti di modul penggajian.

---

## ATURAN WAJIB
1. Baca setiap file secara penuh sebelum mengedit.
2. Setelah mengedit, baca 10 baris terakhir untuk konfirmasi file tidak terpotong.
3. Jangan ubah file di luar daftar di atas.
4. Semua operasi store harus menggunakan pola optimistic update + rollback.
5. Simpan laporan sebagai `BUG_FIX_REPORT_PHASE9_20260415.md` di folder `Docs/`.
6. Laporan harus mencantumkan: kode bug, SEBELUM, SESUDAH, dan verifikasi file integrity (baris terakhir tiap file yang diubah).
