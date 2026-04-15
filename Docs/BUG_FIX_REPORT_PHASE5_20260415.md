# Laporan Perbaikan Bug Phase 5 — Modul Penggajian

## FILES CHANGED
- `src/stores/usePayrollStore.ts` → Memperbaiki logika `getSisaKasbon` agar kalkulasi kasbon inklusif memotong nilai sisa dari catatan rekam bayar (payment negative entry).
- `src/features/pengajian/RekapGaji/RekapGajiTable.tsx` → Mengubah kondisi rendering tombol untuk memastikan Karyawan _Murni Gaji Pokok_ mendapatkan akses pelunasan gaji.
- `src/features/pengajian/RekapGaji/RekapGajiView.tsx` → Menambah parameter komputasi indikator pengeluaran `Gaji Pokok` (Gapok) ke dalam ringkasan _Total Upah_.

---

## BUG #12 — Kasbon Fix
**Opsi yang dipilih:** `OPSI B` — **alasan:** Berjalan lebih harmonis dengan arsitektur _Immutable Ledger_ sistem yang sekarang. Di `prosesBayar`, pembayaran kasbon (*payment*) sebenarnya dicatat sebagai baris mutasi baru bernilai _negatif_ dengan `status: lunas`. Ketimbang melakukan modifikasi *(update constraint)* ke pinjaman lama, Opsi B bekerja jauh lebih aman dan akurat dengan menyatukan seluruh mutasi riwayat untuk _Karyawan_ terkait, yang mana rumusnya `Loan (+) ditambah Payment (-) = Sisa Hutang Realtime`.

**SEBELUM:**
```typescript
  getSisaKasbon: (karyawanId: string) =>
    get().kasbon.filter((k) => k.karyawanId === karyawanId)
      .reduce((acc, curr) => acc + (curr.status === 'belum_lunas' ? curr.jumlah : 0), 0),
```
**SESUDAH:**
```typescript
  getSisaKasbon: (karyawanId: string) =>
    get().kasbon.filter((k) => k.karyawanId === karyawanId)
      .reduce((acc, curr) => acc + curr.jumlah, 0),
```

---

## BUG #13 — Tombol Bayar Gaji Pokok
**Nama field yang diverifikasi:** `row.gajiPokok` (sesuai *Interface* `RekapKaryawan` pada file tersebut).

**SEBELUM:** Karyawan pabrik yang gajinya murni pokok (_maintenance_, kebersihan, satpam) tanpa catatan *scan record* produksi memiliki upah bersih 0.
```tsx
  {!row.isLunas && row.upahBersih > 0 && (
    <Button variant="primary" size="sm" onClick={() => onBayar(row)}>
      💸 Bayar
    </Button>
  )}
```

**SESUDAH:** Diintegrasikan secara luwes apabila terdapat jaminan nilai dari Gaji Pokok.
```tsx
  {!row.isLunas && (row.upahBersih + row.gajiPokok) > 0 && (
    <Button variant="primary" size="sm" onClick={() => onBayar(row)}>
      💸 Bayar
    </Button>
  )}
```

---

## BUG #14 — KPI Total Upah
**SEBELUM:**
```typescript
    rekapData.forEach(r => {
      totalUpah += r.upahBersih;
      sisaKasbon += r.sisaKasbon;
      if (r.isLunas) totalSudah += r.upahBersih;
      else totalBelum += r.upahBersih;
    });
```
**SESUDAH:** 
*Menyesuaikan angka representatif gaji pokok sebagai nilai ekspektasi _Cash Outbound_ yang ditarik dari jurnal.*
```typescript
    rekapData.forEach(r => {
      const upahKotorAwal = r.upahBersih + (r.gajiPokok || 0);
      totalUpah += upahKotorAwal;
      sisaKasbon += r.sisaKasbon;
      if (r.isLunas) totalSudah += upahKotorAwal;
      else totalBelum += upahKotorAwal;
    });
```

---

## VERIFIKASI FILE INTEGRITY
*Seluruh komponen ditutup sempurna.*

**usePayrollStore.ts**
```typescript
329:     }
330:   },
331: }));
```
**RekapGajiTable.tsx**
```typescript
88:   return <DataTable columns={columns} data={data} keyField="id" />;
89: }
90: 
```
**RekapGajiView.tsx**
```typescript
190:     </PageWrapper>
191:   );
192: }
```

## ASUMSI YANG DIBUAT
1. Opsi Gaji Pokok (`gajiPokok`) direpresentasikan sebagai taksiran 1 Minggu utuh untuk nilai pra-kalkulasi di KPI _Dashboard_ mengingat sistem Penggajian bekerja dengan siklus prabayar 6 Harian. Bila terjadi pelunasan (*prorata*) dengan nilai hari < 6 oleh Admin di Modal, nilai final (Netto) yang diproses log _Payroll_ akan tetap akurat.

## BUG BARU YANG DITEMUKAN (tidak diperbaiki)
- Tidak ada bug lain yang secara eksplisit merusak alur atomik maupun logika di dalam scope file ini.

## STATUS
- [x] Semua 3 bug selesai
