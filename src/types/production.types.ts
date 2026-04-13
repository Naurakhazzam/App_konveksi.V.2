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

export interface KoreksiQTY {
  id: string;
  barcode: string;                      // Barcode bundle
  poId: string;                         // ID PO
  tahapDitemukan: string;               // Tahap yang menemukan masalah (e.g., 'qc')
  tahapBertanggungJawab: string;        // Tahap yang bertanggung jawab (e.g., 'jahit')
  karyawanPelapor: string;              // ID karyawan yang melaporkan
  karyawanBertanggungJawab: string;     // ID karyawan di tahap yang bertanggung jawab

  jenisKoreksi: 'reject' | 'hilang' | 'salah_hitung' | 'lebih';
  alasanRejectId?: string;              // ID dari Master Alasan Reject (jika jenis = 'reject')
  alasanLebih?: string;                 // Alasan QTY lebih ('lebih_cutting' | 'koreksi_tahap_sebelumnya' | 'lainnya')
  alasanLebihText?: string;             // Catatan manual (jika alasanLebih = 'lainnya')

  qtyKoreksi: number;                   // Jumlah pcs yang bermasalah
  nominalPotongan: number;              // Nominal potongan gaji (auto-calculate)

  statusPotongan: 'pending' | 'applied' | 'cancelled'; // cancelled = sudah diperbaiki
  statusApproval?: 'menunggu' | 'approved' | 'ditolak'; // khusus QTY lebih
  approvedBy?: string;
  approvedAt?: string;

  waktuLapor: string;                   // ISO datetime
  waktuSelesai?: string;                // ISO datetime ketika reject sudah diperbaiki
}
