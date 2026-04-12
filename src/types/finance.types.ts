export type JenisTransaksi = 'direct_bahan' | 'direct_upah' | 'overhead' | 'masuk';

export interface DetailUpah {
  karyawan: string;
  jumlah: number;
  po: string;
}

export interface JurnalEntry {
  id: string;
  kategoriTrxId: string; 
  namaKategori?: string; // Optional helper
  jenis: JenisTransaksi; 
  nominal: number;
  tanggal: string;
  waktu?: string;
  noFaktur?: string;     // Untuk pembelian bahan
  tagPOs?: string[];     // Multi-PO (untuk direct_bahan)
  poId?: string;         // Legacy support/Single PO link
  keterangan: string;
  detailUpah?: DetailUpah[]; // Khusus untuk direct_upah (hasil rekap gaji)
}
