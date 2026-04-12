# 🧵 Stitchlyx.Syncore (V2)
> **Advanced Garment Production & Financial Management System**

Stitchlyx V2 adalah sistem manajemen konveksi modern yang dibangun dengan arsitektur **Next.js 15 Modular**. Versi ini adalah evolusi dari versi sebelumnya (V1 monolith) yang telah dipecah menjadi komponen-komponen atomic untuk skalabilitas, performa maksimal, dan kemudahan pemeliharaan.

---

## 🚀 Fitur Utama

### 📊 Dashboard Eksekutif
* **Produksi**: Monitoring real-time status PO, progress artikel, dan rincian per tahap (Cutting, Jahit, QC, dll).
* **Keuangan**: Laba/Rugi berjalan (MTD), saldo kas, dan analisis profitabilitas.
* **Penggajian**: Rekapitulasi upah terbayar dan sisa kasbon karyawan.

### 🏭 Manajemen Produksi (QR/Barcode System)
* **Input PO & Barcode**: Pembuatan PO otomatis menghasilkan tiket bundle dengan kode unik.
* **Scan Stations**: 7 Stasiun scan (Cutting s/d Packing) dengan validasi chain-logic untuk mencegah manipulasi data.
* **Real-Time Monitoring**: Lacak setiap helai kain dari tahap pemotongan hingga siap kirim.

### 💰 Akuntansi & HPP Realisasi
* **HPP Estimasi vs Realisasi**: Hitung margin keuntungan asli berdasarkan pemakaian bahan dan upah aktual di lapangan.
* **Jurnal Umum Otomatis**: Integrasi otomatis antara inventory, penggajian, dan pembukuan keuangan.
* **Laporan Eksekutif**: Income Statement bulanan dan laporan per-PO yang mendalam.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 15 (App Router)
* **Language**: TypeScript (Strict Mode)
* **State Management**: Zustand
* **Styling**: CSS Modules & Global Design System Variables
* **Icons**: Lucide React
* **Architecture**: Atomic Design (Atoms, Molecules, Organisms, Templates)

---

## 📁 Struktur Proyek

```text
src/
 ├── app/             # App Router & Page Layouts
 ├── components/      # Atomic Components (Reusable)
 ├── features/        # Business Logic & Feature-specific UI
 ├── lib/             # Utilities, Constants & Hooks
 ├── stores/          # Zustand State Management
 └── types/           # TypeScript Definitions
```

---

## ⚙️ Cara Menjalankan Lokal

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/Naurakhazzam/App_konveksi.V.2.git
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Jalankan development server:**
   ```bash
   npm run dev
   ```
4. **Buka di browser:** `http://localhost:3000`

---

## 📈 Roadmap (Next Phase)
- [ ] Integrasi Database (Supabase/PostgreSQL)
- [ ] Sistem Authentication & Role-Based Access Control (RBAC)
- [ ] Export Laporan & Slip Gaji ke PDF
- [ ] PWA (Progressive Web App) untuk mode Offline Scan

---
*Developed by **Antigravity AI** for **Syncore Stitchlyx**.*
