const fs = require('fs');
const path = require('path');

const pages = [
  // Dashboard
  { path: 'dashboard/keuangan', title: 'Dashboard Keuangan', subtitle: 'Ringkasan Keuangan' },
  { path: 'dashboard/penggajian', title: 'Dashboard Penggajian', subtitle: 'Ringkasan Penggajian' },
  
  // Produksi
  { path: 'produksi/input-po', title: 'Input PO', subtitle: 'Buat Purchase Order baru' },
  { path: 'produksi/monitoring', title: 'Monitoring Produksi', subtitle: 'Status Produksi Real-time' },
  
  // Pengiriman
  { path: 'pengiriman/buat-surat-jalan', title: 'Buat Surat Jalan', subtitle: 'Form Surat Jalan' },
  { path: 'pengiriman/riwayat', title: 'Riwayat Kirim', subtitle: 'Daftar Surat Jalan' },
  
  // Penggajian
  { path: 'penggajian/rekap-gaji', title: 'Rekap Gaji', subtitle: 'Rekap Gaji Karyawan' },
  { path: 'penggajian/kasbon', title: 'Kasbon', subtitle: 'Manajemen Kasbon' },
  { path: 'penggajian/slip-gaji', title: 'Slip Gaji', subtitle: 'Cetak Slip Gaji' },
  
  // Inventory
  { path: 'inventory/overview', title: 'Overview Stok', subtitle: 'Ringkasan Stok Barang' },
  { path: 'inventory/transaksi-keluar', title: 'Transaksi Keluar', subtitle: 'Barang Keluar' },
  { path: 'inventory/alert-order', title: 'Alert Order', subtitle: 'Stok Kritis' },
  
  // Keuangan
  { path: 'keuangan/ringkasan', title: 'Ringkasan Keuangan', subtitle: 'Ringkasan Laporan' },
  { path: 'keuangan/jurnal-umum', title: 'Jurnal Umum', subtitle: 'Pencatatan Jurnal' },
  { path: 'keuangan/laporan-po', title: 'Laporan Per PO', subtitle: 'Laba/Rugi per PO' },
  { path: 'keuangan/laporan-bulan', title: 'Laporan Per Bulan', subtitle: 'Laporan Bulanan' },
  { path: 'keuangan/laporan-gaji', title: 'Laporan Gaji', subtitle: 'Pengeluaran Gaji' },
  { path: 'keuangan/laporan-reject', title: 'Laporan Reject', subtitle: 'Biaya Reject' },
  
  // Master Data
  { path: 'master-data/detail', title: 'Master Detail', subtitle: 'Detail Master Data' },
  { path: 'master-data/produk-hpp', title: 'Produk & HPP', subtitle: 'Katalog Produk dan HPP' },
  { path: 'master-data/karyawan', title: 'Karyawan', subtitle: 'Data Karyawan' },
  { path: 'master-data/klien', title: 'Klien', subtitle: 'Data Klien' },
  { path: 'master-data/jenis-reject', title: 'Jenis Reject', subtitle: 'Daftar Jenis Reject' },
  { path: 'master-data/kategori-transaksi', title: 'Kategori Transaksi', subtitle: 'Kategori Transaksi Keuangan' },
  { path: 'master-data/satuan', title: 'Satuan (UOM)', subtitle: 'Satuan Ukuran' },
  { path: 'master-data/user-role', title: 'User & Role', subtitle: 'Manajemen Akses' },
  
  // Standalone
  { path: 'koreksi-data', title: 'Koreksi Data', subtitle: 'Antrian Review Koreksi' },
  { path: 'audit-log', title: 'Audit Log', subtitle: 'Log Aktivitas Sistem' },
];

const basePath = path.join(__dirname, '..', 'src', 'app', '(dashboard)');

pages.forEach(page => {
  const fullDir = path.join(basePath, page.path);
  fs.mkdirSync(fullDir, { recursive: true });
  const filePath = path.join(fullDir, 'page.tsx');
  
  const componentName = page.path.split('/').map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/[^a-zA-Z]/g, '')).join('');
  
  const content = `'use client';

import React from 'react';
import PageWrapper from '@/components/templates/PageWrapper';

export default function ${componentName}Page() {
  return (
    <PageWrapper title="${page.title}" subtitle="${page.subtitle}">
      <p style={{ color: 'var(--color-text-sub)', fontSize: 13 }}>
        Halaman ${page.title} — akan dibangun di Sprint berikutnya
      </p>
    </PageWrapper>
  );
}
`;
  
  fs.writeFileSync(filePath, content);
});

// Dynamic scan page
const scanPath = path.join(basePath, 'produksi', 'scan', '[tahap]');
fs.mkdirSync(scanPath, { recursive: true });
fs.writeFileSync(path.join(scanPath, 'page.tsx'), `'use client';

import { use } from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import { TAHAP_PRODUKSI } from '@/lib/constants/production';

export default function ScanPage({ params }: { params: Promise<{ tahap: string }> }) {
  const { tahap } = use(params);
  const tahapInfo = TAHAP_PRODUKSI.find(t => t.slug === tahap);
  const title = tahapInfo ? \`Scan \${tahapInfo.label}\` : 'Scan Station';

  return (
    <PageWrapper title={title} subtitle={\`Station \${tahapInfo?.label || tahap}\`}>
      <p style={{ color: 'var(--color-text-sub)', fontSize: 13 }}>
        Scan Station — akan dibangun di Sprint 3
      </p>
    </PageWrapper>
  );
}
`);

console.log('Static and dynamic placeholder pages created successfully.');
