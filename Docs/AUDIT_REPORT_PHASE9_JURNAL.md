# LAPORAN AUDIT PHASE 9 — Modul Keuangan & Jurnal

Laporan ini merupakan hasil audit struktural untuk modul Keuangan dan Pencatatan Jurnal pada aplikasi STITCHLYX SYNCORE V2.

---

## RINGKASAN EKSEKUTIF
Sistem jurnal utama telah mengadopsi struktur atomik yang baik untuk sinkronisasi dengan inventori (pembelian bahan) dan penggajian (pembayaran upah bersih). Namun, terdapat lubang celah pembukuan (financial leaky bucket) yang **kritis (severity A)** pada alur *Kasbon*, serta kerentanan skalabilitas pada kalkulasi saldo harian.

---

## TEMUAN AUDIT

### AUDIT A: Pencatatan Jurnal (Sinkronisasi & Atomicity)
- ✅ **Pembayaran Upah:** Saat admin mengonfirmasi pembayaran upah, sistem merangkai operasi menjadi transaksi atomik (via RPC `pay_salary_atomic`), yang memutus hutang (*ledger*), memotong outstanding kasbon, dan MENCATAT sekaligus pengeluarannya di Jurnal.
- ✅ **Pembelian Bahan:** Transaksi *direct_bahan* menggunakan RPC `record_purchase_atomic` sehingga terjamin secara absolut bahwa Uang Keluar = Barang Masuk di Inventori.
- 🔴 **Celak Duplikasi Manual (B-1):** Entri manual di `ModalTambahJurnal` diduga tidak memilki perlindungan (debounce/isSubmitting) layaknya modul sebelumnya. Admin dapat mendouble-klik dan menciptakan pengeluaran atau pemasukan yang dobel secara tak disengaja.

### AUDIT B: Kategori & Klasifikasi Transaksi
- ✅ **Klasifikasi:** Sistem memanfaatkan empat poros utama kategori: `'direct_bahan'`, `'direct_upah'`, `'overhead'`, dan `'masuk'`. Konsisten dari sisi UI filter maupun Database mapping.
- 🔴 **KASBON TIDAK TERCATAT KE JURNAL (A-1 - CRITICAL):** Terdapat kebocoran alur dana di fungsi `addKasbon` pada `usePayrollStore.ts` (baris 289-312). Pinjaman (kasbon) yang secara riil mengeluarkan likuiditas tunai perusahaan, **hanya dicatat ke tabel `kasbon`** sebagai piutang karyawan, tanpa menyentuh insert pengeluaran ke `jurnal_entry`. Dampak: Uang di laci akan selalu kurang (*shortcase*) dibandingkan total laporan Saldo pada sistem.

### AUDIT C: Laporan & Saldo
- 🔴 **Kalkulasi Client-Side Rendah Skalabilitas (C-1):** Penghitungan neraca Total Pemasukan vs Total Pengeluaran, serta Saldo Akhir periode, dilakukan menggunakan `.reduce()` array penuh oleh browser (client-side) di `JurnalUmumView.tsx`. Jika total jurnal melampaui 10,000+ entri, aplikasi akan mengalami *bottleneck/lag* sesaat setiap kali state ter-render akibat race load.
- 🔴 **Timezone Issues pada Filter Tanggal (C-2):** Pembacaan *start/end date* menggunakan native Javascript (`new Date(e.tanggal) >= new Date(dateStart)`). Bergantung pada zona waktu server vs browser admin, entri jurnal di hari yang sama bisa gagal di-render jika dimasukkan sore/malam.

### AUDIT D: Konsistensi Data
- 🔴 **Orphan Journal Issue terkait PO (D-1):** Modul `usePOStore` dapat menghapus PO (serta items/koreksinya). Namun, tiada baris penghapusan jurnal umum yang bertag ke PO tersebut (`po_id`). Bila biaya bahan telah dikeluarkan, maka historinya akan terapung secara permanen. Hal ini sebenarnya *ideal untuk prinsip Audisi Keuangan* (tidak menghapus jurnal masa lalu walau entitas aslinya dihapus), namun perlu dipastikan ini by-design.
- 🔴 **Input Nominal Negatif (D-2):** Model formulir Jurnal Manual mungkin rentan terhadap *Input Negatif* (`-50.000` via text-input). Pemasukan bernilai negatif akan merusak logika matematis yang ada di Reducer Saldo.

### AUDIT E: Edge Cases & Security 
- 🔴 **Bypass Otorisasi Pengeluaran (E-1):** Berbeda dengan module Penggajian yang membubuhkan komponen `AuthGateModal` tiap pembayaran, Jurnal menambahkan entri *bebas* (termasuk Overhead dan Masuk) tanpa adanya pop-up verifikasi otorisasi/password dari admin root/owner.

---

## TABEL KATEGORISASI BUG UNTUK REMEDIASI SELANJUTNYA

| Kode | Severity | Deskripsi Bug / Celah | Modul / Layanan Terdampak |
|------|----------|-----------------------------------------|--------------------------------|
| A-1  | CRITICAL | Pengajuan Kasbon gagal merecord pengeluaran uan tunai ke di Jurnal | `usePayrollStore.ts` |
| B-1  | MODERATE | Double-click Submit pada Jurnal Manual tidak dilindungi isSubmitting | `ModalTambahJurnal.tsx*` |
| C-1  | LOW      | Saldo dikalkulasi via client-side `.reduce()` dari memori Redux/Zustand | `JurnalUmumView.tsx` |
| D-2  | MODERATE | Validasi Absolut Nominal tidak dicegat (Mencegah Negatif Input) | `ModalTambahJurnal.tsx*` |
| E-1  | MODERATE | Ketiadaan AuthGate password untuk input/koreksi manual nilai jurnal | `JurnalUmumView.tsx` |

---

## VERIFIKASI INTEGRITAS FILE YANG DIAUDIT
- `useJurnalStore.ts`: Baris terakhir (202) tertutup dengan normal (`}));`) ✅
- `finance.types.ts`: Baris terakhir (25) tertutup dengan normal ✅
- `SQL_PHASE_6_ATOMIC_FINANCE.sql`: Baris terakhir (57) EOF utuh ✅
- `JurnalUmumView.tsx`: Baris terakhir (196) normal tertutup ✅
- `usePayrollStore.ts`: Baris terakhir (332) normal tertutup ✅
