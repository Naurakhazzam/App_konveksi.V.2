export interface StatusTahap {
  status: null | 'terima' | 'selesai';
  qtyTerima: number | null;
  qtySelesai: number | null;
  waktuTerima: string | null;
  waktuSelesai: string | null;
  karyawan: string | null;        // Hanya untuk cutting & jahit
  koreksiStatus: null | 'pending' | 'approved' | 'rejected';
  koreksiAlasan: string | null;
  upahDibayar?: boolean; // New for payroll integration
}

export interface Bundle {
  barcode: string;
  po: string;
  poItemId?: string;
  model: string;
  warna: string;
  size: string;
  qtyBundle: number;
  skuKlien: string;
  skuInternal: string;
  statusTahap: {
    cutting: StatusTahap;
    jahit: StatusTahap;
    lkancing: StatusTahap;
    bbenang: StatusTahap;
    qc: StatusTahap;
    steam: StatusTahap;
    packing: StatusTahap;
  };
  suratJalanId?: string;
}
