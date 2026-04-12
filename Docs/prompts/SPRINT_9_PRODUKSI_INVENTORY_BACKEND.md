# Target: Core API untuk Produksi & Inventory
Mentransisikan logika utama operasional pabrik—yaitu pembuatan Purchase Order, Scan Tiket Bundle, dan Manajemen Stok Gudang—ke backend.

## Tugas
1. **Purchase Order (PO) Transaction API:**
   - Server Action untuk `BuatPO`.
   - Logika: Menyimpan record PO, meng-generate rincian `Bundle` (memotong QTY PO menjadi qty kecil), lalu meng-generate UUID Barcode di server.
   - Hapus *dummy state* pada `usePOStore.ts`.
2. **Scan Station API (Core Engine):**
   - Endpoint/Action: `SubmitScanBarcode`.
   - Proses update status Bundle berdasarkan tahap (Cutting -> Jahit -> QC -> dsb) di DB.
   - Pengecekan Server: Pastikan bundle ID ini belum di-scan di tahap ini, validasi qty tidak melebihi tahap sebelumnya.
   - Proses Koreksi Data: Flag status khusus di DB (Pending Approval).
3. **Inventory & Logistik API:**
   - Hubungkan input pemakaian bahan baku dengan relasi database Gudang.
   - Server Actions khusus transaksi Keluar/Masuk material.
   - Hapus penggunaan state dummy di `useInventoryStore.ts` dan `useKoreksiStore.ts`.
4. **Endpoint Dashboard Berjalan:**
   - Endpoint query Prisma untuk fetch progres status produksi per PO (menghitung agregasi persentase selesai dari data real).

## Kriteria Selesai
- User dapat membuat PO dan mencetak tiket dengan data yg menetap (persisted) meskipun browser di-refresh.
- Operator dapat menyeken Barcode yang valid, record bergeser ke tahapan produksi selanjutnya di DB.
- Tabel Stok Gudang berkurang secara permanen akibat pemakaian produksi.
