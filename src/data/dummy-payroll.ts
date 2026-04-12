import { GajiLedgerEntry, KasbonEntry } from '../types';

export const dummyGajiLedger: GajiLedgerEntry[] = [
  // PO-001 (MDL-001) - Some paid, some pending
  { 
    id: 'LED-001', 
    karyawanId: 'KRY-001', 
    tipe: 'selesai', 
    total: 350000, 
    tanggal: '2026-03-25', 
    keterangan: 'Cutting PO-001 Airflow', 
    status: 'lunas',
    tanggalBayar: '2026-04-01',
    sumberId: 'STR-MOCK-001'
  },
  { 
    id: 'LED-002', 
    karyawanId: 'KRY-002', 
    tipe: 'selesai', 
    total: 850000, 
    tanggal: '2026-03-26', 
    keterangan: 'Jahit PO-001 Airflow (170 pcs)', 
    status: 'lunas',
    tanggalBayar: '2026-04-01',
    sumberId: 'STR-MOCK-002'
  },
  { 
    id: 'LED-003', 
    karyawanId: 'KRY-002', 
    tipe: 'reject_potong', 
    total: -50000, 
    tanggal: '2026-03-26', 
    keterangan: 'Reject Jahitan Loncat (10 pcs)', 
    status: 'lunas',
    tanggalBayar: '2026-04-01',
    sumberId: 'STR-MOCK-003'
  },
  
  // Pending entries for current period
  { 
    id: 'LED-004', 
    karyawanId: 'KRY-001', 
    tipe: 'selesai', 
    total: 150000, 
    tanggal: '2026-04-05', 
    keterangan: 'Cutting PO-002 Nectar', 
    status: 'belum_lunas',
    sumberId: 'STR-MOCK-001'
  },
  { 
    id: 'LED-005', 
    karyawanId: 'KRY-003', 
    tipe: 'selesai', 
    total: 600000, 
    tanggal: '2026-04-06', 
    keterangan: 'Jahit PO-002 Nectar (100 pcs)', 
    status: 'belum_lunas',
    sumberId: 'STR-MOCK-002'
  },
  { 
    id: 'LED-006', 
    karyawanId: 'KRY-003', 
    tipe: 'reject_potong', 
    total: -30000, 
    tanggal: '2026-04-06', 
    keterangan: 'Reject Noda Kain (10 pcs)', 
    status: 'belum_lunas',
    sumberId: 'STR-MOCK-003'
  },
  { 
    id: 'LED-007', 
    karyawanId: 'KRY-002', 
    tipe: 'rework', 
    total: 25000, 
    tanggal: '2026-04-07', 
    keterangan: 'Perbaikan saku PO-001', 
    status: 'belum_lunas',
    sumberId: 'STR-MOCK-004'
  },
];

export const dummyKasbon: KasbonEntry[] = [
  { 
    id: 'KSB-001', 
    karyawanId: 'KRY-002', 
    jumlah: 200000, 
    tanggal: '2026-03-10', 
    keterangan: 'Pinjaman awal bulan', 
    status: 'belum_lunas' 
  },
  { 
    id: 'KSB-PYMT-001', 
    karyawanId: 'KRY-002', 
    jumlah: -100000, 
    tanggal: '2026-04-01', 
    keterangan: 'Potongan gajian 1 Apr', 
    status: 'lunas' 
  },
];
