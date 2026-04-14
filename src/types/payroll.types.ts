export interface GajiLedgerEntry {
  id: string;
  karyawanId: string;
  tipe: 'selesai' | 'reject_potong' | 'rework';
  total: number;
  tanggal: string;
  sumberId: string; 
  keterangan: string;
  status: 'belum_lunas' | 'lunas' | 'cancelled' | 'escrow';
  tanggalBayar?: string;
  isPrinted?: boolean;
}

export interface KasbonEntry {
  id: string;
  karyawanId: string;
  jumlah: number;
  tanggal: string;
  keterangan: string;
  status: 'belum_lunas' | 'lunas';
}
