import React from 'react';
import { Factory, Truck, Wallet, Package, TrendingUp, Database, ShieldCheck, ScrollText, LayoutDashboard } from 'lucide-react';
import styles from '../Panduan.module.css';

const modules = [
  {
    icon: <LayoutDashboard size={18} />,
    title: 'Dashboard',
    color: 'var(--color-blue)',
    desc: 'Ringkasan keseluruhan operasi konveksi. Tersedia 3 sub-dashboard: Produksi, Keuangan, dan Penggajian. Menampilkan KPI utama, tabel PO aktif, dan log aktivitas terbaru.',
    subs: ['Produksi', 'Keuangan', 'Penggajian'],
  },
  {
    icon: <Factory size={18} />,
    title: 'Produksi',
    color: 'var(--color-green)',
    desc: 'Input PO baru dan scan bundle di setiap tahap produksi. Setiap tahap menghitung QTY aktual dan mencatat upah otomatis. Monitoring real-time untuk semua PO.',
    subs: ['Input PO', 'Cutting', 'Jahit', 'L. Kancing', 'Buang Benang', 'QC', 'Steam', 'Packing', 'Monitoring'],
  },
  {
    icon: <Truck size={18} />,
    title: 'Pengiriman',
    color: 'var(--color-blue)',
    desc: 'Scan bundle untuk membuat surat jalan otomatis. Satu surat jalan bisa berisi bundle dari beberapa PO asal klien sama. Menggunakan SKU Klien sebagai acuan.',
    subs: ['Buat Surat Jalan', 'Riwayat Kirim'],
  },
  {
    icon: <Wallet size={18} />,
    title: 'Penggajian',
    color: 'var(--color-purple)',
    desc: 'Rekap upah karyawan berdasarkan hasil scan produksi. Mengelola kasbon dan menghasilkan slip gaji. Perhitungan: Upah Bersih = Upah - Potongan + Rework.',
    subs: ['Rekap Gaji', 'Kasbon', 'Slip Gaji'],
  },
  {
    icon: <Package size={18} />,
    title: 'Inventory',
    color: 'var(--color-green)',
    desc: 'Stok bertambah otomatis saat jurnal "Pembelian Bahan Baku" dicatat. Hanya ada transaksi KELUAR untuk pemakaian produksi. Alert muncul saat stok di bawah minimum.',
    subs: ['Overview Stok', 'Transaksi Keluar', 'Alert Order'],
  },
  {
    icon: <TrendingUp size={18} />,
    title: 'Keuangan',
    color: 'var(--color-green)',
    desc: 'Jurnal umum, laporan per PO, per bulan, dan laporan gaji. Data HPP & Margin hanya tampil di sini dan Master Data. Biaya overhead dibagi rata ke semua PO aktif.',
    subs: ['Ringkasan', 'Jurnal Umum', 'Laporan PO', 'Laporan Bulan', 'Laporan Gaji', 'Laporan Reject'],
  },
  {
    icon: <Database size={18} />,
    title: 'Master Data',
    color: 'var(--color-blue)',
    desc: 'Kelola semua data referensi: produk, HPP per size, karyawan, klien, jenis reject, satuan, dan pengaturan user & role. Hanya Owner yang bisa mengedit.',
    subs: ['Master Detail', 'Produk & HPP', 'Karyawan', 'Klien', 'Jenis Reject', 'Kategori Trx', 'Satuan', 'User & Role'],
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Koreksi Data',
    color: 'var(--color-yellow)',
    desc: 'Antrian review untuk bundle yang QTY-nya melebihi target. Owner bisa APPROVE (QTY aktual dipertahankan) atau REJECT (QTY dikembalikan ke target untuk mencegah overpay).',
    subs: [],
  },
  {
    icon: <ScrollText size={18} />,
    title: 'Audit Log',
    color: 'var(--color-cyan)',
    desc: 'Catatan seluruh aktivitas sistem: siapa melakukan apa, kapan, dan di mana. Tidak bisa diedit atau dihapus. Digunakan untuk audit trail dan akuntabilitas.',
    subs: [],
  },
];

export default function SectionModules() {
  return (
    <>
      {modules.map(mod => (
        <div key={mod.title} className={styles.moduleCard} style={{ borderLeftColor: mod.color }}>
          <div className={styles.moduleCardHeader}>
            <div className={styles.moduleCardIcon} style={{ color: mod.color }}>{mod.icon}</div>
            <span className={styles.moduleCardTitle}>{mod.title}</span>
          </div>
          <p className={styles.moduleCardDesc}>{mod.desc}</p>
          {mod.subs.length > 0 && (
            <div className={styles.moduleCardSubs}>
              {mod.subs.map(s => <span key={s} className={styles.subTag}>{s}</span>)}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
