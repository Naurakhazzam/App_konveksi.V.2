export interface InventoryItem {
  id: string;
  nama: string;
  kategoriId: string;
  satuanId: string;
  stokAktual: number;
  stokMinimum: number;
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
