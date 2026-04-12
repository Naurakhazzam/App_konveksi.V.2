export interface POItem {
  id: string;
  poId: string;
  modelId: string;
  warnaId: string;
  sizeId: string;
  qty: number;
  qtyPerBundle: number;
  jumlahBundle: number;
  skuKlien: string;
  skuInternal: string;
  statusCutting?: 'waiting' | 'started' | 'finished';
}

export interface Artikel {
  id: string;
  poId: string;
  modelId: string;
  warnaId: string;
  sizeId: string;
  qtyTarget: number;
}

export interface PurchaseOrder {
  id: string;
  klienId: string;
  nomorPO: string;
  tanggalInput: string;
  items: POItem[];
  status: 'draft' | 'aktif' | 'selesai';
  tanggalDeadline?: string;
  catatan?: string;
}
