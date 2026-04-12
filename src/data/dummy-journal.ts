import { JurnalEntry } from '../types';

export const dummyJurnal: JurnalEntry[] = [
  { 
    id: 'JRN-001', 
    kategoriTrxId: 'KTR-001', 
    jenis: 'direct_bahan', 
    nominal: 2500000, 
    tanggal: '2026-04-01', 
    noFaktur: 'FAK-001',
    tagPOs: ['PO-001'],
    keterangan: 'Pembelian kain katun airflow hitam 100m' 
  },
  { 
    id: 'JRN-002', 
    kategoriTrxId: 'KTR-001', 
    jenis: 'direct_bahan', 
    nominal: 1800000, 
    tanggal: '2026-04-02', 
    noFaktur: 'FAK-002',
    tagPOs: ['PO-001', 'PO-002'],
    keterangan: 'Pembelian kain oxford navy 150m' 
  },
  { 
    id: 'JRN-003', 
    kategoriTrxId: 'KTR-007', 
    jenis: 'direct_bahan', 
    nominal: 350000, 
    tanggal: '2026-04-03', 
    keterangan: 'Beli benang jahit hitam dan kancing' 
  },
  { 
    id: 'JRN-004', 
    kategoriTrxId: 'KTR-003', 
    jenis: 'overhead', 
    nominal: 1200000, 
    tanggal: '2026-04-05', 
    keterangan: 'Bayar listrik konveksi bulan maret' 
  },
  { 
    id: 'JRN-005', 
    kategoriTrxId: 'KTR-005', 
    jenis: 'masuk', 
    nominal: 5000000, 
    tanggal: '2026-04-06', 
    poId: 'PO-001', 
    keterangan: 'DP Pembayaran PO 001 Elyon Store' 
  },
  { 
    id: 'JRN-006', 
    kategoriTrxId: 'KTR-006', 
    jenis: 'overhead', 
    nominal: 150000, 
    tanggal: '2026-04-07', 
    keterangan: 'Uang makan lembur' 
  },
  { 
    id: 'JRN-007', 
    kategoriTrxId: 'KTR-008', 
    jenis: 'masuk', 
    nominal: 10000000, 
    tanggal: '2026-04-10', 
    keterangan: 'Pinjaman modal usaha (Bank)' 
  },
  { 
    id: 'JRN-008', 
    kategoriTrxId: 'KTR-006', 
    jenis: 'overhead', 
    nominal: 200000, 
    tanggal: '2026-04-11', 
    keterangan: 'Uang makan siang' 
  },
  { 
    id: 'JRN-009', 
    kategoriTrxId: 'KTR-005', 
    jenis: 'masuk', 
    nominal: 8000000, 
    tanggal: '2026-04-12', 
    poId: 'PO-002', 
    keterangan: 'Pembayaran Lunas PO 002' 
  },
  { 
    id: 'JRN-010', 
    kategoriTrxId: 'KTR-002', 
    jenis: 'direct_upah', 
    nominal: 1450000, 
    tanggal: '2026-04-15', 
    keterangan: 'Pembayaran Gaji Periode 1-15 Apr' 
  },
];
