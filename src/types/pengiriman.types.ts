export interface SuratJalanItem {
  id: string;
  bundleBarcode: string;   
  poId: string;            
  modelId: string;
  warnaId: string;
  sizeId: string;
  skuKlien: string;        
  qty: number;             // Qty yang dikirim di SJ
  qtyPacking: number;      // Qty hasil akhir packing (sebagai referensi)
  alasanSelisih?: string;  // Alasan jika qty SJ berbeda dengan qty packing
}

export interface SuratJalan {
  id: string;               
  nomorSJ: string;          
  klienId: string;          
  tanggal: string;          
  items: SuratJalanItem[];   
  totalQty: number;          
  totalBundle: number;       
  catatan: string;
  status: 'draft' | 'dikirim' | 'diterima';
  dibuatOleh: string;       
  pengirim: string;          
}
