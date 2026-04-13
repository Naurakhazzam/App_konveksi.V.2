import { InventoryItem, TransaksiMasuk, TransaksiKeluar } from '../types';

export const dummyInventory: InventoryItem[] = [
  { id: 'INV-001', nama: 'Kain Katun Airflow Hitam', jenisBahan: 'kain', satuanId: 'UOM-001', stokAktual: 120, stokMinimum: 50 },
  { id: 'INV-002', nama: 'Kain Katun Airflow Putih', jenisBahan: 'kain', satuanId: 'UOM-001', stokAktual: 15, stokMinimum: 50 }, // Alert
  { id: 'INV-003', nama: 'Kain Oxford Navy', jenisBahan: 'kain', satuanId: 'UOM-001', stokAktual: 200, stokMinimum: 100 },
  { id: 'INV-004', nama: 'Benang Jahit Hitam', jenisBahan: 'aksesori', satuanId: 'UOM-004', stokAktual: 50, stokMinimum: 20 },
  { id: 'INV-005', nama: 'Benang Jahit Putih', jenisBahan: 'aksesori', satuanId: 'UOM-004', stokAktual: 8, stokMinimum: 20 }, // Alert
  { id: 'INV-006', nama: 'Kancing Kemeja Bening', jenisBahan: 'aksesori', satuanId: 'UOM-006', stokAktual: 20, stokMinimum: 5 },
  { id: 'INV-007', nama: 'Resleting YKK 15cm', jenisBahan: 'aksesori', satuanId: 'UOM-004', stokAktual: 100, stokMinimum: 50 },
  { id: 'INV-008', nama: 'Label Woven Stitchlyx', jenisBahan: 'aksesori', satuanId: 'UOM-005', stokAktual: 2, stokMinimum: 5 }, // Alert
];

export const dummyTrxMasuk: TransaksiMasuk[] = [
  { id: 'TM-001', itemId: 'INV-001', qty: 100, tanggal: '2026-04-01T08:00:00Z', jurnalId: 'JRN-001', keterangan: 'Pembelian stok kain hitan awal bulan' },
  { id: 'TM-002', itemId: 'INV-003', qty: 150, tanggal: '2026-04-02T09:00:00Z', jurnalId: 'JRN-002', keterangan: 'Restock kain navy untuk seragam' },
];

export const dummyTrxKeluar: TransaksiKeluar[] = [
  { id: 'TK-001', itemId: 'INV-002', qty: 35, tanggal: '2026-04-03T10:00:00Z', referensiPO: 'PO-001', keterangan: 'Pemakaian untuk PO 001' },
  { id: 'TK-002', itemId: 'INV-005', qty: 12, tanggal: '2026-04-04T11:00:00Z', referensiPO: 'PO-002', keterangan: 'Permintaan benang tambahan' },
];
