export interface InventoryItem {
  id: string;
  nama: string;
  jenisBahan?: 'kain' | 'aksesori' | 'kemasan' | 'lainnya';
  satuanId: string;
  stokAktual: number;
  stokMinimum: number;
  hargaSatuan?: number;
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
}
