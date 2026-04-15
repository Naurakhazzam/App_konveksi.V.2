# LAPORAN PERBAIKAN BUG #4 — STITCHLYX SYNCORE V2

**Tanggal**: 15 April 2026
**Scope**: Fiksasi Sinkronsiasi Rollback Potongan Upah

---

## FILES CHANGED
- `src/features/produksi/ScanStation/ScanResult.tsx` → Mengganti perlakuan penghapusan database `supabase.delete` dari *fire-and-forget* menggunakan promise `.then()` menjadi eksekusi `await` agar terekam sempurna dan melakukan error log pada exception apabila terjadi kegagalan penghapusan ledger.

---

## PERUBAHAN
Penyesuaian dilakukan pada blok fungsi `handleKoreksiKurangConfirm` di dalam klausa `catch` pada Step 2 pencatatan log koreksi.

**SEBELUM:**
```typescript
        const payrollStore = usePayrollStore.getState();
        usePayrollStore.setState({ 
          ledger: payrollStore.ledger.filter(l => l.id !== ledgerEntryId) 
        });
        supabase.from('gaji_ledger').delete().eq('id', ledgerEntryId).then();
      }
      return;
```

**SESUDAH:**
```typescript
        const payrollStore = usePayrollStore.getState();
        usePayrollStore.setState({ 
          ledger: payrollStore.ledger.filter(l => l.id !== ledgerEntryId) 
        });
        
        const { error: rollbackError } = await supabase
          .from('gaji_ledger')
          .delete()
          .eq('id', ledgerEntryId);
        
        if (rollbackError) {
          console.error('[ScanResult] KRITIS: Rollback gaji gagal, ID:', ledgerEntryId, rollbackError);
        }
      }
      return;
```

---

## STATUS
- [x] Selesai
