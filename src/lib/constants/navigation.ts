// src/lib/constants/navigation.ts

export const NAV = [
  {
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    color: 'blue',
    subs: ['Ringkasan Utama', 'Produksi', 'Keuangan', 'Penggajian'],
    basePath: '/dashboard',
  },
  {
    label: 'Produksi',
    icon: 'Factory',
    color: 'green',
    subs: ['Input PO', 'Antrian Cutting', 'Cutting', 'Jahit', 'Lubang Kancing', 'Buang Benang', 'QC', 'Steam', 'Packing', 'Monitoring', 'Approval QTY'],
    basePath: '/produksi',
  },
  {
    label: 'Pengiriman',
    icon: 'Truck',
    color: 'blue',
    subs: ['Buat Surat Jalan', 'Riwayat Kirim'],
    basePath: '/pengiriman',
  },
  {
    label: 'Penggajian',
    icon: 'Wallet',
    color: 'purple',
    subs: ['Rekap Gaji', 'Kasbon', 'Slip Gaji'],
    basePath: '/penggajian',
  },
  {
    label: 'Inventory',
    icon: 'Package',
    color: 'green',
    subs: ['Overview Stok', 'Transaksi Keluar', 'Alert Order'],
    basePath: '/inventory',
  },
  {
    label: 'Keuangan',
    icon: 'TrendingUp',
    color: 'green',
    subs: ['Ringkasan', 'Jurnal Umum', 'Laporan Per PO', 'Laporan Per Bulan', 'Laporan Gaji', 'Laporan Koreksi QTY'],
    basePath: '/keuangan',
  },
  {
    label: 'RETURAN KONSUMEN',
    icon: 'CornerUpLeft',
    color: 'red',
    subs: ['Penerimaan Retur', 'Station Perbaikan', 'Pengiriman Retur', 'Monitoring Perbaikan'],
    basePath: '/retur',
  },
  {
    label: 'Master Data',
    icon: 'Database',
    color: 'blue',
    subs: ['Master Detail', 'Produk & HPP', 'Komponen HPP', 'Karyawan', 'Jabatan', 'Klien', 'Jenis Reject', 'Alasan Reject', 'Kategori Transaksi', 'Satuan (UOM)', 'User & Role'],
    basePath: '/master-data',
  },
  {
    label: 'Koreksi Data',
    icon: 'ShieldCheck',
    color: 'yellow',
    subs: [],           
    basePath: '/koreksi-data',
  },
  {
    label: 'Audit Log',
    icon: 'ScrollText',
    color: 'cyan',
    subs: [],           
    basePath: '/audit-log',
  },
  {
    label: 'Panduan',
    icon: 'BookOpen',
    color: 'cyan',
    subs: [],
    basePath: '/panduan',
  },
  {
    label: 'Pengaturan',
    icon: 'Settings',
    color: 'cyan',
    subs: [],
    basePath: '/settings',
  },
];

export function getSubPath(basePath: string, subLabel: string): string {
  const mapping: Record<string, Record<string, string>> = {
    '/dashboard': {
      'Ringkasan Utama': '/dashboard',
      'Produksi': '/dashboard/produksi',
      'Keuangan': '/dashboard/keuangan',
      'Penggajian': '/dashboard/penggajian',
    },
    '/produksi': {
      'Input PO': '/produksi/input-po',
      'Antrian Cutting': '/produksi/cutting',
      'Cutting': '/produksi/scan/cutting',
      'Jahit': '/produksi/scan/jahit',
      'Lubang Kancing': '/produksi/scan/lubang-kancing',
      'Buang Benang': '/produksi/scan/buang-benang',
      'QC': '/produksi/scan/qc',
      'Steam': '/produksi/scan/steam',
      'Packing': '/produksi/scan/packing',
      'Monitoring': '/produksi/monitoring',
      'Approval QTY': '/produksi/approval-qty',
    },
    '/pengiriman': {
      'Buat Surat Jalan': '/pengiriman/buat-surat-jalan',
      'Riwayat Kirim': '/pengiriman/riwayat',
    },
    '/penggajian': {
      'Rekap Gaji': '/penggajian/rekap-gaji',
      'Kasbon': '/penggajian/kasbon',
      'Slip Gaji': '/penggajian/slip-gaji',
    },
    '/inventory': {
      'Overview Stok': '/inventory/overview',
      'Transaksi Keluar': '/inventory/transaksi-keluar',
      'Alert Order': '/inventory/alert-order',
    },
    '/keuangan': {
      'Ringkasan': '/keuangan/ringkasan',
      'Jurnal Umum': '/keuangan/jurnal-umum',
      'Laporan Per PO': '/keuangan/laporan-po',
      'Laporan Per Bulan': '/keuangan/laporan-bulan',
      'Laporan Gaji': '/keuangan/laporan-gaji',
      'Laporan Koreksi QTY': '/keuangan/laporan-reject',
    },
    '/retur': {
      'Penerimaan Retur': '/retur/penerimaan',
      'Station Perbaikan': '/retur/perbaikan',
      'Pengiriman Retur': '/retur/pengiriman',
      'Monitoring Perbaikan': '/retur/monitoring',
    },
    '/master-data': {
      'Master Detail': '/master-data/detail',
      'Produk & HPP': '/master-data/produk-hpp',
      'Komponen HPP': '/master-data/hpp-komponen',
      'Karyawan': '/master-data/karyawan',
      'Jabatan': '/master-data/jabatan',
      'Klien': '/master-data/klien',
      'Jenis Reject': '/master-data/jenis-reject',
      'Alasan Reject': '/master-data/alasan-reject',
      'Kategori Transaksi': '/master-data/kategori-transaksi',
      'Satuan (UOM)': '/master-data/satuan',
      'User & Role': '/master-data/user-role',
    },
  };
  return mapping[basePath]?.[subLabel] || basePath;
}
