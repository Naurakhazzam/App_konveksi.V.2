export interface InventoryItem {
  id: string;
  nama: string;
  jenisBahan?: 'kain' | 'aksesori' | 'kemasan' | 'lainnya';
  satuanId: string;
  stokAktual: number;
  stokMinimum: number;
}

export interface InventoryBatch {
  id: string;
  itemId: string;
  invoiceNo: string;
  qty: number;
  qtyTerpakai: number;
  hargaSatuan: number;
  tanggal: string;
  keterangan?: string;
}

export interface TransaksiMasuk {
  id: string;
  itemId: string;
  qty: number;
  tanggal: string;
  jurnalId: string; 
  keterangan: string;
}

export interface TransaksiKeluar {
  id: string;
  itemId: string;
  qty: number;
  tanggal: string;
  referensiPO: string;
  keterangan: string;
  fifoData?: {
    totalCost: number;
    consumedBatches: { batchId: string; qty: number; harga: number }[];
  };
}
