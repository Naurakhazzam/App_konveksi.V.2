export interface AuditEntry {
  id: string;
  user: {
    id: string;
    nama: string;
    role: string;
  };
  modul: 'produksi' | 'inventory' | 'keuangan' | 'penggajian' | 'master';
  aksi: string;
  target: string;
  timestamp: string;
  metadata?: any;
}
