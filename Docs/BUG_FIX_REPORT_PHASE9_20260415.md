# Laporan Perbaikan Bug Phase 9 — Modul Keuangan & Jurnal

## DAFTAR BUG YANG DIPERBAIKI

### 1. BUG #25 — Kasbon Tidak Dicatat ke Jurnal (KRITIS)
- **File:** `src/stores/usePayrollStore.ts`, `Docs/SQL_PHASE_9_ATOMIC_KASBON.sql` (Baru)
- **SEBELUM:** Fungsi `addKasbon` hanya melakukan INSERT ke tabel `kasbon` lokal sebagai piutang karyawan. Tidak ada pencatatan ke `jurnal_entry`, sehingga membuat Saldo Jurnal Umum lebih besar secara artifisial ketimbang kas laci fisik aktual.
- **SESUDAH:** Menggubah mekanisme insert menjadi panggilan database RPC atomik `record_kasbon_atomic`. Prosedur tersebut membuat 1 baris di `kasbon` (sebagai jejak piutang individu) dan 1 baris bersamaan di `jurnal_entry` sebagai kategori pengeluaran jenis *overhead* uang kas keluar untuk pekerja. Disematkan juga mekanisme rollback Zustand untuk kegagalan RPC.

### 2. BUG #26 — Double-Submit pada Jurnal Manual (SEDANG)
- **File:** `src/features/keuangan/JurnalUmum/ModalTambahJurnal.tsx`
- **SEBELUM:** Tidak ada pengaman *State UI* pembatasan pemanggilan simpan form. Seorang admin yang me-klik submit berulang secara lekas dapat mengakibatkan *muti-insert data*.
- **SESUDAH:** Diimplementasikannya status *guard hook* `isSubmitting`, dan merubah teks Button menjadi "Memproses...". Atribut `disabled={isUpah || isSubmitting}` menghentikan multi-event per sesi, juga ditenagai blok instruksi `try {} finally { setIsSubmitting(false) }`.

### 3. BUG #27 — Input Nominal Negatif Tidak Divalidasi (SEDANG)
- **File:** `src/features/keuangan/JurnalUmum/ModalTambahJurnal.tsx`
- **SEBELUM:** Validasi native belum diubah sepenuhnya; masih menerima nominal Negatif `-300` / bypass.
- **SESUDAH:** Fungsi validasi ditugaskan untuk mengetes constraint `(!isUpah && (!formData.nominal || formData.nominal <= 0))` sebelum melakukan preparasi payload. Muncul native `alert('Nominal harus lebih dari 0.')` pada layer UI klien.

### 4. BUG #28 — Tidak Ada AuthGate pada Jurnal Manual (SEDANG)
- **File:** `src/features/keuangan/JurnalUmum/ModalTambahJurnal.tsx`
- **SEBELUM:** Penambahan pencatatan uang masuk dan keluar pada modal manual ini dilewati tanpa verifikasi akses level Supervisor/Owner layaknya pencairan Gaji.
- **SESUDAH:** Form *Submit Button* dijegal oleh state pemanggil Modal Otorisasi Sandi (`AuthGateModal`). Data formulir tertahan ke `pendingData`, dan setelah `AuthGateModal` melemparkan event `onSuccess`, fungsi asynchronous baru (`executeSubmit`) akan mengkonsumsi state cache serta mengintergasikannya ke DB utama.

---

## VERIFIKASI FILE INTEGRITY
1. `SQL_PHASE_9_ATOMIC_KASBON.sql`: Baris 36 berbunyi `$$ LANGUAGE plpgsql;` ✅ Utuh
2. `usePayrollStore.ts`: Baris 354 berbunyi `}));` ✅ Utuh
3. `ModalTambahJurnal.tsx`: Baris 324 berbunyi `}` ✅ Utuh
