import React from 'react';
import styles from '../Panduan.module.css';

const faq = [
  {
    q: 'Apa yang terjadi jika QTY scan melebihi target?',
    a: 'Sistem akan meminta kode validasi Owner (otentikasi lapangan). Setelah divalidasi, bundle akan masuk antrian di halaman "Koreksi Data" dengan status PENDING. Bundle otomatis diblokir dari tahap berikutnya sampai Owner melakukan review — APPROVE (QTY aktual dipertahankan) atau REJECT (QTY dikembalikan ke target untuk mencegah overpay).',
  },
  {
    q: 'Apa yang terjadi jika QTY scan kurang dari target?',
    a: 'Operator wajib mengisi alasan (misalnya: cacat kain, potong kurang). Bundle TIDAK diblokir dan langsung bisa dilanjutkan ke tahap berikutnya. Status koreksi otomatis menjadi "approved". Owner hanya bisa melihat dan acknowledge — tidak ada tombol reject.',
  },
  {
    q: 'Bagaimana cara menghitung upah karyawan?',
    a: 'Upah dicatat otomatis setiap kali scan selesai. Cutting & Jahit: upah terkait nama karyawan yang dipilih. Tahap lain (L. Kancing s/d Packing): upah dicatat global per tahap per periode. Rumus: Upah Bersih = Upah - Potongan Reject + Rework. Saat pembayaran: Total Bayar = Upah Bersih - Kasbon.',
  },
  {
    q: 'Siapa yang bisa melihat data HPP dan Margin?',
    a: 'Hanya role Owner, Admin Keuangan, dan Supervisor. Data HPP & Margin TIDAK muncul di Dashboard Produksi, Scan Station, maupun Pengiriman. Data ini hanya tampil di Dashboard Keuangan, halaman Keuangan, dan Master Data (Owner only).',
  },
  {
    q: 'Bagaimana stok inventory bertambah?',
    a: 'Stok bertambah secara OTOMATIS ketika jurnal bertipe "Pembelian Bahan Baku" dicatat di Jurnal Umum. Tidak ada input stok manual — semuanya terintegrasi via pencatatan keuangan. Untuk pengurangan stok, gunakan fitur Transaksi Keluar.',
  },
  {
    q: 'Apa itu Dual SKU?',
    a: 'Setiap produk memiliki 2 kode: SKU Internal (otomatis: LYX-0001-KOU) dan SKU Klien (input manual dari kode klien). Semua dokumen yang dikirim ke klien (surat jalan) menggunakan SKU Klien. Internal workflow tetap menggunakan SKU Internal.',
  },
  {
    q: 'Bisakah satu surat jalan berisi lebih dari satu PO?',
    a: 'Ya, bisa. Satu surat jalan bisa berisi bundle dari beberapa PO selama klien-nya sama. Scan bundle secara langsung menambahkan ke surat jalan yang sedang dibuat.',
  },
  {
    q: 'Bagaimana biaya overhead dibagi ke tiap PO?',
    a: 'Biaya yang tidak bisa dikalkulasi per PO (seperti listrik, sewa) dibagi rata ke semua PO yang sedang aktif. Pinjaman dipisahkan dari pengeluaran dan TIDAK masuk ke dalam kalkulasi margin.',
  },
];

export default function SectionFAQ() {
  return (
    <div className={styles.faqList}>
      {faq.map((item, i) => (
        <div key={i} className={styles.faqItem}>
          <h4 className={styles.faqQuestion}>{item.q}</h4>
          <p className={styles.faqAnswer}>{item.a}</p>
        </div>
      ))}
    </div>
  );
}
