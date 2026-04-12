export interface SuratJalanItem {
  id: string;
  bundleBarcode: string;   
  poId: string;            
  modelId: string;
  warnaId: string;
  sizeId: string;
  skuKlien: string;        
  qty: number;             
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
