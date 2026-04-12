import { PurchaseOrder } from '../types';

export const dummyPO: PurchaseOrder[] = [
  {
    id: 'PO-001',
    klienId: 'KLN-001',
    nomorPO: 'PO0001',
    tanggalInput: '2026-04-01T10:00:00Z',
    status: 'aktif',
    items: [
      { id: 'ITM-001', poId: 'PO-001', modelId: 'MDL-001', warnaId: 'WRN-001', sizeId: 'SZ-M', qty: 120, qtyPerBundle: 12, jumlahBundle: 10, skuKlien: 'SKU-001', skuInternal: 'INT-001' },
      { id: 'ITM-002', poId: 'PO-001', modelId: 'MDL-001', warnaId: 'WRN-001', sizeId: 'SZ-L', qty: 96, qtyPerBundle: 12, jumlahBundle: 8, skuKlien: 'SKU-002', skuInternal: 'INT-002' }
    ]
  },
  {
    id: 'PO-002',
    klienId: 'KLN-002',
    nomorPO: 'PO0002',
    tanggalInput: '2026-04-05T10:00:00Z',
    status: 'aktif',
    items: [
      { id: 'ITM-003', poId: 'PO-002', modelId: 'MDL-002', warnaId: 'WRN-002', sizeId: 'SZ-XL', qty: 48, qtyPerBundle: 12, jumlahBundle: 4, skuKlien: 'SKU-003', skuInternal: 'INT-003' }
    ]
  },
  {
    id: 'PO-003',
    klienId: 'KLN-003',
    nomorPO: 'PO0003',
    tanggalInput: '2026-04-10T10:00:00Z',
    status: 'draft',
    items: [
      { id: 'ITM-004', poId: 'PO-003', modelId: 'MDL-003', warnaId: 'WRN-003', sizeId: 'SZ-S', qty: 24, qtyPerBundle: 12, jumlahBundle: 2, skuKlien: 'SKU-004', skuInternal: 'INT-004' }
    ]
  }
];
