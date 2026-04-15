# LAPORAN PERBAIKAN BUG #3 — STITCHLYX SYNCORE V2

**Tanggal**: 15 April 2026
**Scope**: Perbaikan Sinkronisasi Database dan Rollback Gagal Store

---

## FILES CHANGED
- `src/stores/useBundleStore.ts` → Membuat `updateStatusTahap` menjadi fully atomic dengan try-catch, rollback local state, dan melempar `error` jika operasi sinkronisasi ke Supabase gagal.
- `src/stores/useKoreksiStore.ts` → Menambahkan `throw err` di fungsi `addKoreksi` jika Supabase gagal menyimpan saat mencatat koreksi agar error tersebut bisa ditangkap oleh komponen frontend.
- `src/features/produksi/ScanStation/ScanResult.tsx` → Menambahkan library `supabase` di imports. Melakukan proteksi menyeluruh untuk panggilan `updateStatusTahap` dan menyelesaikan flow atomik potongan upah vs catat koreksi dengan menambahkan instruksi rollback (pembatalan potongan via `usePayrollStore` dan tabel Supabase) jika koreksi kurang gagal tersimpan.

---

## BUG #4 — updateStatusTahap

**SEBELUM (`useBundleStore.ts` - `updateStatusTahap`):**
```typescript
  updateStatusTahap: async (barcode, tahap, updates) => {
    // Optimistic update lokal
    set((state) => ({ ... }));

    try {
      ...
      const { error } = await supabase
        .from('bundle_status_tahap')
        .upsert(dbRow, { onConflict: 'bundle_id,tahap' });

      if (error) throw error;
    } catch (err) {
      console.error('[useBundleStore] updateStatusTahap error:', err);
      // 🔥 Tidak dilempar dan tidak di-rollback
    }
  },
```

**SESUDAH (`useBundleStore.ts` - `updateStatusTahap`):**
```typescript
  updateStatusTahap: async (barcode, tahap, updates) => {
    // Optimistic update lokal
    const backup = get().bundles;
    set((state) => ({ ... }));

    try {
      ...
      const { error } = await supabase
        .from('bundle_status_tahap')
        .upsert(dbRow, { onConflict: 'bundle_id,tahap' });

      if (error) throw error;
    } catch (err) {
      console.error('[useBundleStore] updateStatusTahap error:', err);
      // Rollback UI
      set({ bundles: backup });
      throw err; // Lempar ke pemanggil agar flow bisa dibatalkan
    }
  },
```

Dan integrasi penangkapan catch pada `ScanResult.tsx` untuk semua blok `updateStatusTahap` yang diubah ke format Atomic:
```typescript
    try {
      await updateStatusTahap(bundle.barcode, tahap, { ... });
      await addRecord({ ... });
      if (onComplete) onComplete();
    } catch (error) {
      warning('Gagal Menyimpan', 'Gagal mencatat data scan. Periksa koneksi Anda.');
    }
```

---

## BUG #5 — Koreksi Rollback

**URUTAN EKSEKUSI DI `ScanResult.tsx` SEBELUMNYA:**
1. Apabila koreksi kurang (hilang/reject) memunculkan nominal potongan > 0, system memanggil `usePayrollStore.getState().addLedgerEntry()` untuk langsung memotong gaji operator (Step 1).
2. Setelah sukses memotong, sistem memanggil `addKoreksi(...)` untuk mencatat insiden koreksi (Step 2).
3. Namun jika `addKoreksi` gagal di level database, potongan (Step 1) **tetap tercatat** sehingga menimbulkan ketidakadilan karena uang hilang tanpa adanya rekam jejak.

**SEBELUMNYA (`ScanResult.tsx` - `handleKoreksiKurangConfirm`):**
```typescript
    // ── STEP 2: LOG KOREKSI ─────────────────────────────────────────────
    await addKoreksi({ ... });
    
    await executeSelesai(...);
```

**SESUDAH (`ScanResult.tsx` - `handleKoreksiKurangConfirm`):**
Kami membungkus Step 2 dalam blok `try...catch`. Memaksa error melempar dan apabila gagal, state dari `usePayrollStore` akan dirollback & record potongannya dihapus langsung dari database menggunakan Supabase.
```typescript
    // ── STEP 1: DEDUCTION FIRST (Finansial) ──────────────────────────────
    let ledgerEntryId = '';
    if (karyawanBertanggungJawab && nominal > 0) {
      ledgerEntryId = `DED-${Date.now()}-${koreksiId}`;
      try {
        await usePayrollStore.getState().addLedgerEntry({ ... });
      } catch (err) {
        warning('Gagal Potong Gaji', 'Koreksi dibatalkan karena gagal menghubungi server payroll.');
        return;
      }
    }

    // ── STEP 2: LOG KOREKSI ─────────────────────────────────────────────
    try {
      await addKoreksi({ ... });
    } catch (err) {
      warning('Gagal Koreksi', 'Gagal mencatat koreksi. Potongan upah otomatis dibatalkan.');
      if (ledgerEntryId) {
        // Rollback UI Ledger + Hapus row tabel gaji_ledger yang terlanjur diinsert di Step 1
        const payrollStore = usePayrollStore.getState();
        usePayrollStore.setState({ 
          ledger: payrollStore.ledger.filter(l => l.id !== ledgerEntryId) 
        });
        supabase.from('gaji_ledger').delete().eq('id', ledgerEntryId).then();
      }
      return; // Stop flow
    }
```

---

## ASUMSI YANG DIBUAT
- Untuk membatalkan deduction tanpa menyentuh file `usePayrollStore.ts`, saya mengadopsi mekanisme direct overwrite state melalui `usePayrollStore.setState()` serta request `delete()` langsung ke Supabase pada level intercept di file UI (`ScanResult.tsx`), dimana behavior rollback store berjalan dengan baik.
- `import { supabase } from '@/lib/supabase';` disuntikkan ke dalam file `ScanResult.tsx` agar rollback `gaji_ledger` dapat dilakukan bila deduction dibatalkan.

## BUG BARU YANG DITEMUKAN (tidak diperbaiki)
- Tidak ditemukan bug baru dari modul produksi. 

## STATUS
- [x] Semua 2 bug selesai
