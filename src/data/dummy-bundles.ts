import { Bundle, StatusTahap } from '../types';

const defaultStatus: StatusTahap = {
  status: null,
  qtyTerima: 0,
  qtySelesai: 0,
  waktuTerima: null,
  waktuSelesai: null,
  karyawan: null,
  koreksiStatus: null,
  koreksiAlasan: null,
};

export const dummyBundles: Bundle[] = [
  {
    barcode: 'PO0001-Air-blck-s-0001-BDL01-01-04-26',
    po: 'PO-001',
    model: 'Airflow',
    warna: 'Black',
    size: 'S',
    qtyBundle: 25,
    skuKlien: 'AIR-BLK-S',
    skuInternal: 'LYX-MDL1-BL-S',
    statusTahap: {
      cutting: { ...defaultStatus, status: 'selesai', qtyTerima: 25, qtySelesai: 25, karyawan: 'KRY-001', waktuTerima: '2026-04-02T08:00:00Z', waktuSelesai: '2026-04-02T10:00:00Z' },
      jahit: { ...defaultStatus, status: 'selesai', qtyTerima: 25, qtySelesai: 25, karyawan: 'KRY-002', waktuTerima: '2026-04-02T10:10:00Z', waktuSelesai: '2026-04-02T15:00:00Z' },
      lkancing: { ...defaultStatus, status: 'selesai', qtyTerima: 25, qtySelesai: 25, waktuTerima: '2026-04-03T08:00:00Z', waktuSelesai: '2026-04-03T09:00:00Z' },
      bbenang: { ...defaultStatus, status: 'selesai', qtyTerima: 25, qtySelesai: 25, waktuTerima: '2026-04-03T09:10:00Z', waktuSelesai: '2026-04-03T10:00:00Z' },
      qc: { ...defaultStatus, status: 'selesai', qtyTerima: 25, qtySelesai: 24, koreksiStatus: 'approved', koreksiAlasan: 'Cacat kain 1', waktuTerima: '2026-04-03T10:10:00Z', waktuSelesai: '2026-04-03T11:00:00Z' },
      steam: { ...defaultStatus, status: 'selesai', qtyTerima: 24, qtySelesai: 24, waktuTerima: '2026-04-03T11:10:00Z', waktuSelesai: '2026-04-03T12:00:00Z' },
      packing: { ...defaultStatus, status: 'selesai', qtyTerima: 24, qtySelesai: 24, waktuTerima: '2026-04-03T13:00:00Z', waktuSelesai: '2026-04-03T14:00:00Z' }
    }
  },
  {
    barcode: 'PO0001-Air-blck-s-0001-BDL02-01-04-26',
    po: 'PO-001',
    model: 'Airflow',
    warna: 'Black',
    size: 'S',
    qtyBundle: 25,
    skuKlien: 'AIR-BLK-S',
    skuInternal: 'LYX-MDL1-BL-S',
    statusTahap: {
      cutting: { ...defaultStatus, status: 'selesai', qtyTerima: 25, qtySelesai: 25, karyawan: 'KRY-004', waktuTerima: '2026-04-02T10:00:00Z', waktuSelesai: '2026-04-02T12:00:00Z' },
      jahit: { ...defaultStatus, status: 'terima', qtyTerima: 25, qtySelesai: 0, karyawan: 'KRY-003', waktuTerima: '2026-04-03T08:00:00Z', waktuSelesai: null },
      lkancing: { ...defaultStatus },
      bbenang: { ...defaultStatus },
      qc: { ...defaultStatus },
      steam: { ...defaultStatus },
      packing: { ...defaultStatus }
    }
  },
  {
    barcode: 'PO0001-Air-blck-s-0001-BDL03-01-04-26',
    po: 'PO-001',
    model: 'Airflow',
    warna: 'Black',
    size: 'S',
    qtyBundle: 25,
    skuKlien: 'AIR-BLK-S',
    skuInternal: 'LYX-MDL1-BL-S',
    statusTahap: {
      cutting: { ...defaultStatus, status: 'selesai', qtyTerima: 25, qtySelesai: 26, karyawan: 'KRY-001', waktuTerima: '2026-04-02T13:00:00Z', waktuSelesai: '2026-04-02T15:00:00Z', koreksiStatus: 'pending' },
      jahit: { ...defaultStatus },
      lkancing: { ...defaultStatus },
      bbenang: { ...defaultStatus },
      qc: { ...defaultStatus },
      steam: { ...defaultStatus },
      packing: { ...defaultStatus }
    }
  },
  {
    barcode: 'PO0002-Nec-navy-l-0002-BDL01-05-04-26',
    po: 'PO-002',
    model: 'Nectar',
    warna: 'Navy',
    size: 'L',
    qtyBundle: 30,
    skuKlien: 'NEC-NVY-L',
    skuInternal: 'LYX-MDL2-NV-L',
    statusTahap: {
      cutting: { ...defaultStatus, status: 'selesai', qtyTerima: 30, qtySelesai: 30, karyawan: 'KRY-004', waktuTerima: '2026-04-06T08:00:00Z', waktuSelesai: '2026-04-06T10:00:00Z' },
      jahit: { ...defaultStatus, status: 'selesai', qtyTerima: 30, qtySelesai: 30, karyawan: 'KRY-008', waktuTerima: '2026-04-06T10:10:00Z', waktuSelesai: '2026-04-06T16:00:00Z' },
      lkancing: { ...defaultStatus, status: 'terima', qtyTerima: 30, qtySelesai: 0, waktuTerima: '2026-04-07T08:00:00Z', waktuSelesai: null },
      bbenang: { ...defaultStatus },
      qc: { ...defaultStatus },
      steam: { ...defaultStatus },
      packing: { ...defaultStatus }
    }
  }
];
