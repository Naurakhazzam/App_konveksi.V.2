// src/lib/constants/production.ts

export const TAHAP_PRODUKSI = [
  { key: 'cutting', label: 'Cutting', slug: 'cutting', requireKaryawan: true },
  { key: 'jahit', label: 'Jahit', slug: 'jahit', requireKaryawan: true },
  { key: 'lkancing', label: 'Lubang Kancing', slug: 'lubang-kancing', requireKaryawan: false },
  { key: 'bbenang', label: 'Buang Benang', slug: 'buang-benang', requireKaryawan: false },
  { key: 'qc', label: 'QC', slug: 'qc', requireKaryawan: false },
  { key: 'steam', label: 'Steam', slug: 'steam', requireKaryawan: false },
  { key: 'packing', label: 'Packing', slug: 'packing', requireKaryawan: false },
] as const;

export const OWNER_AUTH_CODE = '030503';
