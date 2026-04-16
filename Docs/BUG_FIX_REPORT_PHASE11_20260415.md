# Laporan Perbaikan Bug (BUG FIX REPORT) — Phase 11
**Tanggal:** 2026-04-15
**Modul:** Master Data & Role-Based Access Control (RBAC)

---

## BUG #34 — Kode Darurat Terekspos ke Browser (KRITIS)

**File Terubah:** 
- `.env.local`
- `src/stores/useAuthStore.ts`
- `src/app/api/auth/emergency/route.ts` (File Baru)

**Deskripsi:**
Variabel `.env.local` sebelumnya mengekspos PIN darurat ke browser bundle pengguna melalui `NEXT_PUBLIC_` prefix. Hal ini berisiko bagi keamanan sistem.

**SEBELUM:**
```env
NEXT_PUBLIC_EMERGENCY_CODE_1=Demonsong44
NEXT_PUBLIC_EMERGENCY_CODE_2=030503
```
Pengecekan emergency code dilakukan secara client-side di dalam `useAuthStore.ts`.

**SESUDAH:**
```env
EMERGENCY_CODE_1=Demonsong44
EMERGENCY_CODE_2=030503
```
Dibuatkan REST API endpoint rahasia di `src/app/api/auth/emergency/route.ts` untuk memvalidasi kode di sisi backend Node.js (Server-Side). Komponen client (`useAuthStore`) sekarang melangsungkan komunikasi via fetching ke API ini.

---

## BUG #35 — `setPreviewRole` Bisa Dibajak (KRITIS)

**File Terubah:** `src/stores/useAuthStore.ts`

**Deskripsi:**
Celah pada Zustand store, yang mengizinkan simulasi akses sistem `previewRole`, tidak memeriksa otoritas eksekutor method tersebut.

**SEBELUM:**
```typescript
setPreviewRole: (role) => set({ previewRole: role }),
```

**SESUDAH:**
```typescript
setPreviewRole: (role) => {
  const user = get().currentUser;
  const isGodAdmin = user?.id === 'USR-FAUZAN' || user?.roles?.includes('godadmin');
  if (!isGodAdmin) return; // Hanya godadmin yang boleh simulasi role
  set({ previewRole: role });
},
```

---

## BUG #36 — Tidak Ada Guard Hapus Karyawan & Klien (TINGGI)

**File Terubah:** `src/stores/useMasterStore.ts`

**Deskripsi:**
Fungsi penghapusan entitas inti tidak memperhatikan relasi *foreign-key* dan transaksionalnya. 

**SEBELUM:**
```typescript
removeKaryawan: async (id) => {
  const backup = get().karyawan;
  set((s) => ({ karyawan: s.karyawan.filter((i) => i.id !== id) }));
  // ... delete ...
}
```

**SESUDAH:**
Ditambahkan pengecekan status *blocking*:
1. **Karyawan:** Memeriksa absensi tunggakan `kasbon` (dari `usePayrollStore`) dan tunggakan Upah Produksi di `gaji_ledger`. Jika > 0, throw error.
2. **Klien:** Mengekstraksi jumlah pesanan produksi dari `poList` (`usePOStore`). Jika Klien terikat PO aktif, penolakan dijalankan.

---

## BUG #37 — Tidak Ada Cek Username Duplikat (SEDANG)

**File Terubah:** `src/stores/useAuthStore.ts`

**Deskripsi:** 
Mencegah pembuatan pendaftaran staf baru dengan `username` kembar yang bisa mengakibatkan race-condition saat log in.

**SEBELUM:**
```typescript
addUser: async (item) => {
  const { error } = await supabase.from('users').insert([{ ... }]);
}
```

**SESUDAH:**
```typescript
addUser: async (item) => {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .ilike('username', item.username)
    .maybeSingle();

  if (existing) {
    throw new Error(`Username "${item.username}" sudah digunakan. Pilih username lain.`);
  }
  // insert ...
}
```

---

## VERIFIKASI INTEGRITAS FILE
1. `useAuthStore.ts`: Baris akhir `);` dikonfirmasi valid tanpa terpotong (Length: 433 lines). ✅
2. `useMasterStore.ts`: Baris akhir `}));` dikonfirmasi valid. Sintaks *throw error guard* berjalan sebagaimana mestinya. (Length: 708 lines). ✅
3. `.env.local`: Environment ditutup stabil tanpa ada kebocoran rahasia lebih jauh. ✅
4. Server Next.js divalidasi sehat dari kesalahan routing / API. ✅
