# DIRECTOR PROMPT — Phase 10: Audit Modul Inventori & Gudang

## KONTEKS PROJECT
Kamu sedang bekerja di project `STITCHLYX SYNCORE V2` — aplikasi manajemen produksi konveksi berbasis Next.js + TypeScript + Zustand + Supabase.

Lakukan audit menyeluruh terhadap modul Inventori dan Gudang (stok bahan baku, pembelian bahan, konsumsi FIFO).

Mulai dengan menjelajahi struktur folder:
- `src/features/gudang/` atau `src/features/inventori/` atau nama serupa
- `src/stores/useInventoryStore.ts`
- File tipe data terkait inventory/gudang
- File SQL terkait jika ada di folder `Docs/`

Baca setiap file secara penuh sebelum mengaudit.

---

## AUDIT A — Pembelian Bahan (Purchase)
- Apakah operasi pembelian bahan sudah atomik? (insert inventori + insert jurnal dalam 1 RPC)
- Apakah ada proteksi double-submit pada form pembelian?
- Apakah qty pembelian divalidasi > 0 dan harga > 0?
- Apakah ada guard terhadap pembelian dengan supplier/item yang tidak valid?

## AUDIT B — FIFO Consumption
- Baca implementasi `consumeFIFO` secara penuh di `useInventoryStore.ts`.
- Apakah urutan batch benar-benar dipakai dari yang paling lama masuk (FIFO)?
- Apakah ada penanganan ketika stok tidak cukup (insufficient stock)? Apakah sistem menolak, memperingatkan, atau diam-diam mencatat angka negatif?
- Apakah `consumeFIFO` bersifat atomik di database, atau hanya update client-side yang kemudian di-sync?
- Apakah ada rollback jika operasi consumeFIFO sebagian gagal?

## AUDIT C — Akurasi Stok
- Apakah total stok yang ditampilkan di UI dihitung dari jumlah batch yang ada, atau dari field `qty` tunggal yang di-update?
- Apakah ada kemungkinan stok menjadi negatif tanpa peringatan?
- Apakah ada reconciliation antara total konsumsi di `pemakaian_bahan` dengan total penurunan stok di `inventory_item`/`inventory_batch`?
- Apakah penghapusan item master (jenis bahan) akan menghapus batch stok dan histori pemakaian, atau diblokir?

## AUDIT D — Konsistensi Data
- Apakah ada UNIQUE CONSTRAINT di database untuk mencegah batch ID ganda?
- Jika pembelian dihapus, apakah batch stoknya ikut dihapus? Apakah ini aman jika sebagian batch sudah dikonsumsi?
- Apakah histori pemakaian (`pemakaian_bahan`) menyimpan snapshot (harga per unit saat itu) atau hanya referensi ID yang bisa berubah?
- Apakah ada field `updated_at` atau audit trail untuk perubahan stok?

## AUDIT E — Edge Cases
- Apa yang terjadi jika dua operator scan produksi bersamaan dan keduanya memanggil `consumeFIFO` untuk batch yang sama? Apakah ada race condition?
- Apa yang terjadi jika stok suatu batch = 5 meter, tapi `consumeFIFO` diminta mengambil 10 meter?
- Apakah ada batas minimum stok (safety stock) yang memicu peringatan?
- Apakah ada fitur penyesuaian stok manual (stock adjustment) untuk koreksi perbedaan fisik vs sistem?

---

## FORMAT LAPORAN
Simpan hasil audit sebagai `AUDIT_REPORT_PHASE10_INVENTORI.md` di folder `Docs/`.

Format: ringkasan eksekutif, temuan per audit (A/B/C/D/E), tabel severity dengan kode (A-1, B-1, dst) dan label (🔴 KRITIS / 🟠 TINGGI / 🟡 SEDANG / 🔵 INFO), serta verifikasi file integrity (baris terakhir tiap file yang dibaca).
