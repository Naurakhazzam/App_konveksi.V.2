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
