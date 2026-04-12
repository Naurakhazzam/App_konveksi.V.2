# PROMPT — Sprint 5D: Dashboard (Produksi, Keuangan, Penggajian) + Audit Log

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1-4 dan Sprint 5A-5C (penggajian, inventory, keuangan) sudah selesai.
Semua fitur core sudah fungsional — Sprint 5D hanya mengkonsumsi data dari module lain.

**Status saat ini:**
- Semua store sudah fungsional (Bundle, PO, Payroll, Jurnal, Inventory, Koreksi, Pengiriman)
- Route pages untuk `/dashboard/produksi`, `/dashboard/keuangan`, `/dashboard/penggajian` sudah ada tapi berisi placeholder
- Route `/audit-log` sudah ada tapi berisi placeholder

**Sprint 5D ini akan membangun:**
1. **Dashboard Produksi** — KPI throughput, bottleneck, progress PO
2. **Dashboard Keuangan** — Arus kas, margin overview, overhead tracking
3. **Dashboard Penggajian** — Total upah, outstanding kasbon
4. **Audit Log** — Rekaman aksi CRUD penting (dummyable)

## Aturan Wajib

1. **CSS Modules + CSS Variables** — TIDAK gunakan Tailwind CSS
2. **Setiap komponen** = `NamaKomponen.tsx` + `NamaKomponen.module.css`
3. **Maks 200 baris per file** — pecah jadi sub-komponen jika perlu
4. **Import alias** gunakan `@/`
5. **Data CRUD** = baca/tulis ke Zustand store
6. **Komponen reusable** yang sudah ada WAJIB digunakan
7. **Feature components** disimpan di `src/features/dashboard/`
8. **Margin & HPP** HANYA boleh tampil di Dashboard Keuangan — DILARANG di Dashboard Produksi

---

## BAGIAN 1: DASHBOARD PRODUKSI

### 1.1 Halaman `/dashboard/produksi` — DashProduksiView

**File:** `src/features/dashboard/DashProduksi/DashProduksiView.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  PageWrapper: "Dashboard Produksi"                      │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │PO    │ │Total │ │Dlm   │ │Selesai│ │Berma-│          │
│  │Aktif │ │Bundel│ │Proses│ │Packing│ │salah │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                         │
│  ┌──────────────────────┐ ┌──────────────────────┐      │
│  │ Panel: Progress PO   │ │ Panel: Warning Aktif │      │
│  │                      │ │                      │      │
│  │ (tabel % per PO per │ │ (mandek, koreksi,   │      │
│  │  tahap)              │ │  qty kurang)         │      │
│  └──────────────────────┘ └──────────────────────┘      │
│                                                         │
│  ┌──────────────────────────────────────────────┐       │
│  │ Panel: Timeline Aktivitas Terbaru             │       │
│  │ (5-10 scan terakhir: barcode, tahap, waktu)  │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

**Sumber Data:**
- `useBundleStore` → progress bundel per tahap
- `usePOStore` → daftar PO aktif
- `getWarnings()` dari `production-helpers.ts`
- `useKoreksiStore.getPendingCount()` → koreksi pending

---

## BAGIAN 2: DASHBOARD KEUANGAN

### 2.1 Halaman `/dashboard/keuangan` — DashKeuanganView

**File:** `src/features/dashboard/DashKeuangan/DashKeuanganView.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  PageWrapper: "Dashboard Keuangan"                      │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │Total │ │Total │ │Saldo │ │Margin│                   │
│  │Masuk │ │Keluar│ │      │ │ Avg  │                   │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
│                                                         │
│  ┌──────────────────────┐ ┌──────────────────────┐      │
│  │ Panel: Arus Kas Bulan│ │ Panel: Breakdown     │      │
│  │ Ini                  │ │ Pengeluaran per      │      │
│  │ (chart sederhana)    │ │ Kategori             │      │
│  └──────────────────────┘ └──────────────────────┘      │
│                                                         │
│  ┌──────────────────────────────────────────────┐       │
│  │ Panel: Top PO by Revenue (5 teratas)          │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

**Sumber Data:**
- `useJurnalStore` → total masuk/keluar, breakdown per kategori
- Kalkulasi margin dari `finance-calculations.ts` (Sprint 5C)

---

## BAGIAN 3: DASHBOARD PENGGAJIAN

### 3.1 Halaman `/dashboard/penggajian` — DashPenggajianView

**File:** `src/features/dashboard/DashPenggajian/DashPenggajianView.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  PageWrapper: "Dashboard Penggajian"                    │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │Total │ │Upah  │ │Kasbon│ │Kary. │                   │
│  │ Upah │ │Dibayar│ │Aktif │ │Aktif │                   │
│  └──────┘ └──────┘ └──────┘ └──────┘                   │
│                                                         │
│  ┌──────────────────────┐ ┌──────────────────────┐      │
│  │ Panel: Top Earners   │ │ Panel: Kasbon         │      │
│  │ (5 karyawan upah    │ │ Outstanding            │      │
│  │  tertinggi)          │ │                       │      │
│  └──────────────────────┘ └──────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**Sumber Data:**
- `usePayrollStore` → ledger, kasbon
- `useMasterStore` → daftar karyawan

---

## BAGIAN 4: AUDIT LOG

### 4.1 Halaman `/audit-log` — AuditLogView

**File:** `src/features/audit-log/AuditLogView.tsx`

**Konsep:**
Audit Log merekam aksi penting. Tanpa database, kita simulasi dengan state Zustand.

**Store baru:** `src/stores/useAuditStore.ts`

```typescript
interface AuditEntry {
  id: string;
  aksi: string;        // 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'BAYAR' | 'SCAN'
  modul: string;       // 'PO' | 'BUNDLE' | 'KOREKSI' | 'GAJI' | 'JURNAL' | 'INVENTORI' | 'PENGIRIMAN'
  detail: string;      // Deskripsi human-readable
  userId: string;
  waktu: string;
}
```

**Layout:**
- Tabel sederhana dengan filter modul dan aksi
- Data dummy: 10-15 entri yang merepresentasikan berbagai aktivitas

**NOTE:** Dalam fase ini, audit log adalah "read-only dummy". Di fase production nanti, setiap store action tertentu akan menulis ke audit log secara otomatis.

---

## BAGIAN 5: ROUTING

Ganti isi file placeholder berikut:
- `src/app/(dashboard)/dashboard/produksi/page.tsx`
- `src/app/(dashboard)/dashboard/keuangan/page.tsx`
- `src/app/(dashboard)/dashboard/penggajian/page.tsx`
- `src/app/(dashboard)/audit-log/page.tsx`

---

## Deliverable Sprint 5D

- [ ] **Dashboard Produksi** fungsional: KPI real-time dari data bundle
- [ ] **Dashboard Keuangan** fungsional: arus kas + margin overview
- [ ] **Dashboard Penggajian** fungsional: upah overview + kasbon tracker
- [ ] **Audit Log** fungsional: tabel dummy + filter
- [ ] Semua halaman terintegrasi dengan store yang sudah ada
- [ ] `npx tsc --noEmit` = 0 errors

## File yang akan dibuat/dimodifikasi

### File Baru (~12 file):
| Grup | File |
|---|---|
| Dash Produksi | `DashProduksiView.tsx`, `.css` |
| Dash Keuangan | `DashKeuanganView.tsx`, `.css` |
| Dash Penggajian | `DashPenggajianView.tsx`, `.css` |
| Audit Log | `AuditLogView.tsx`, `.css` |
| Store | `src/stores/useAuditStore.ts` |
| Data | `src/data/dummy-audit.ts` |

### File Dimodifikasi:
| File | Perubahan |
|---|---|
| 4 file `page.tsx` | Ganti placeholder |
