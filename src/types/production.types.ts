export interface PemakaianBahan {
  po: string;
  skuKlien: string;
  modelId: string;
  warnaId: string;
  sizeId: string;
  artikelNama: string;
  pemakaianKainMeter: number;   // meter per pcs
  pemakaianBeratGram: number;   // gram per pcs
  inputOleh: string;
  waktuInput: string;
}

export interface ScanRecord {
  id: string;
  barcode: string;
  tahap: string;
  waktuScan: string;
  karyawanId: string | null;
  qty: number;
  tipe: 'terima' | 'selesai';
  koreksiOleh?: string;
  koreksiWaktu?: string;
}

export interface SerahTerimaJahit {
  id: string;
  barcode: string;
  poNomor: string;
  modelId: string;
  warnaId: string;
  sizeId: string;
  qtyBundle: number;
  karyawanId: string;
  tanggal: string;
  items: SerahTerimaItem[];
  status: 'draft' | 'approved';
}

export interface SerahTerimaItem {
  komponenHPPId: string;
  inventoryItemId: string;
  qtyDiserahkan: number;
  qtyFisikPerPcs: number;
}
