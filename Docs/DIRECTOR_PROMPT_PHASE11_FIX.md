# DIRECTOR PROMPT — Phase 11 Bug Fix: Master Data & RBAC

## KONTEKS PROJECT
Kamu sedang bekerja di project `STITCHLYX SYNCORE V2` — aplikasi manajemen produksi konveksi berbasis Next.js + TypeScript + Zustand + Supabase.

Perbaiki 4 bug keamanan hasil audit Phase 11. **Baca setiap file secara penuh sebelum mengeditnya.**

File yang akan diubah:
- `src/stores/useAuthStore.ts`
- `src/stores/useMasterStore.ts`
- `src/app/api/auth/emergency/route.ts` ← file BARU
- `.env.local` ← rename variabel

---

## BUG #34 — Kode Darurat Terekspos ke Browser (KRITIS)

Masalah: variabel `.env.local` menggunakan prefix `NEXT_PUBLIC_EMERGENCY_CODE_1` dan `NEXT_PUBLIC_EMERGENCY_CODE_2`. Prefix `NEXT_PUBLIC_` membuat nilai ini ter-embed ke dalam JavaScript bundle yang dikirim ke browser — siapapun bisa membacanya di DevTools.

### Langkah 1: Update `.env.local`
Baca file `.env.local`. Ganti nama variabel:
- `NEXT_PUBLIC_EMERGENCY_CODE_1` → `EMERGENCY_CODE_1`
- `NEXT_PUBLIC_EMERGENCY_CODE_2` → `EMERGENCY_CODE_2`

Variabel lain (`NEXT_PUBLIC_VISITOR_PASS_*`) boleh tetap dengan prefix NEXT_PUBLIC karena password visitor memang boleh diketahui client (hanya akses view-only).

### Langkah 2: Buat API Route baru
Buat file baru di `src/app/api/auth/emergency/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { username, code } = await req.json();

  if (!username || !code) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const isFauzan = username.toLowerCase() === 'fauzan';
  if (!isFauzan) {
    return NextResponse.json({ valid: false }, { status: 403 });
  }

  const code1 = process.env.EMERGENCY_CODE_1 || '';
  const code2 = process.env.EMERGENCY_CODE_2 || '';

  const valid = !!(code1 && code === code1) || !!(code2 && code === code2);
  return NextResponse.json({ valid });
}
```

### Langkah 3: Update `useAuthStore.ts`
Baca file `useAuthStore.ts` secara penuh. Di dalam fungsi `login`, cari bagian yang mengecek emergency code:

```typescript
const emergency1 = process.env.NEXT_PUBLIC_EMERGENCY_CODE_1 || '';
const emergency2 = process.env.NEXT_PUBLIC_EMERGENCY_CODE_2 || '';
const isEmergencyCode = password_or_pin && (password_or_pin === emergency1 || password_or_pin === emergency2);
```

Ganti seluruh blok tersebut dengan pemanggilan API route:

```typescript
// Cek emergency code via server (kode tidak ter-expose ke browser)
let isEmergencyCode = false;
if (isFauzan && password_or_pin) {
  try {
    const res = await fetch('/api/auth/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code: password_or_pin }),
    });
    const data = await res.json();
    isEmergencyCode = data.valid === true;
  } catch {
    isEmergencyCode = false;
  }
}
```

Juga di fungsi `validateOwnerCode`, ganti penggunaan `process.env.NEXT_PUBLIC_EMERGENCY_CODE_*` dengan return false (karena validasi owner code sekarang hanya dilakukan server-side):
```typescript
validateOwnerCode: (code) => {
  // Emergency code validation now handled server-side via /api/auth/emergency
  // This client-side function is kept for backward compatibility but always returns false
  return false;
},
```

Setelah semua edit, baca 10 baris terakhir `useAuthStore.ts` untuk konfirmasi tidak terpotong.

---

## BUG #35 — `setPreviewRole` Bisa Dibajak (KRITIS)

Masalah: fungsi `setPreviewRole` tidak mengecek siapa yang memanggilnya. User biasa yang tahu cara manipulasi Zustand DevTools bisa set `previewRole = 'owner'` dan mendapat akses penuh.

**File:** `src/stores/useAuthStore.ts`

Cari implementasi `setPreviewRole`:
```typescript
setPreviewRole: (role) => set({ previewRole: role }),
```

Ganti dengan:
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

**File:** `src/stores/useMasterStore.ts`

Baca file ini secara penuh. Cari fungsi `removeKaryawan` dan `removeKlien`.

### Perbaikan `removeKaryawan`:
Tambahkan guard sebelum operasi delete. Import atau akses `usePayrollStore` untuk mengecek:

```typescript
removeKaryawan: async (id) => {
  // Guard: cek apakah ada kasbon aktif (belum lunas)
  const { kasbon } = usePayrollStore.getState();
  const activeKasbon = kasbon.filter(k => k.karyawanId === id && k.status === 'belum_lunas');
  if (activeKasbon.length > 0) {
    throw new Error(`Karyawan tidak bisa dihapus. Masih ada ${activeKasbon.length} kasbon belum lunas.`);
  }

  // Guard: cek apakah ada upah yang belum dibayar di gaji_ledger
  const { data: unpaidLedger } = await supabase
    .from('gaji_ledger')
    .select('id')
    .eq('karyawan_id', id)
    .eq('status', 'belum_lunas')
    .limit(1);
  if (unpaidLedger && unpaidLedger.length > 0) {
    throw new Error('Karyawan tidak bisa dihapus. Masih ada upah yang belum dibayarkan.');
  }

  // Lanjut delete jika aman
  // ... logika hapus yang sudah ada ...
},
```

> Sesuaikan nama field dan import dengan yang sudah ada di file. Jika `usePayrollStore` belum diimport, tambahkan importnya.

### Perbaikan `removeKlien`:
Tambahkan guard sebelum operasi delete:

```typescript
removeKlien: async (id) => {
  // Guard: cek apakah ada PO aktif dari klien ini
  const { poList } = usePOStore.getState();
  const activePO = poList.filter(po => po.klienId === id);
  if (activePO.length > 0) {
    throw new Error(`Klien tidak bisa dihapus. Masih ada ${activePO.length} PO aktif terkait klien ini.`);
  }

  // Lanjut delete jika aman
  // ... logika hapus yang sudah ada ...
},
```

> Jika `usePOStore` belum diimport di file ini, tambahkan importnya.

Setelah semua edit, baca 10 baris terakhir `useMasterStore.ts` untuk konfirmasi tidak terpotong.

---

## BUG #37 — Tidak Ada Cek Username Duplikat (SEDANG)

**File:** `src/stores/useAuthStore.ts`

Cari fungsi `addUser`. Tambahkan pengecekan duplikat username sebelum insert:

```typescript
addUser: async (item) => {
  // Cek apakah username sudah digunakan
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .ilike('username', item.username)
    .maybeSingle();

  if (existing) {
    throw new Error(`Username "${item.username}" sudah digunakan. Pilih username lain.`);
  }

  // ... lanjut insert seperti biasa ...
},
```

Pastikan pemanggil `addUser` di UI (mis. `FormPendaftaran.tsx` atau sejenisnya) sudah membungkus pemanggilan dengan try-catch dan menampilkan error ke user.

---

## ATURAN WAJIB
1. Baca setiap file secara penuh sebelum mengedit.
2. Setelah mengedit, baca 10 baris terakhir untuk konfirmasi file tidak terpotong.
3. Jangan ubah file di luar daftar di atas.
4. Simpan laporan sebagai `BUG_FIX_REPORT_PHASE11_20260415.md` di folder `Docs/`.
5. Laporan harus mencantumkan: kode bug, SEBELUM, SESUDAH, dan verifikasi file integrity.
