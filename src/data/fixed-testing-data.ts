import { Karyawan, PurchaseOrder, Bundle, StatusTahap } from '../types';

export const fixedEmployees: Karyawan[] = [
  { id: 'emp-abqi', nama: 'Abqi', jabatan: 'Cutting', aktif: true, tahapList: ['cutting'], gajiPokok: 0 },
  { id: 'emp-aldi', nama: 'Aldi', jabatan: 'Jahit', aktif: true, tahapList: ['jahit'], gajiPokok: 0 },
  { id: 'emp-hengky', nama: 'Hengky', jabatan: 'Finishing (LK, BB, QC, Steam, Packing)', aktif: true, tahapList: ['lkancing', 'bbenang', 'qc', 'steam', 'packing'], gajiPokok: 0 },
];

const defaultStatus: StatusTahap = {
  status: null,
  qtyTerima: null,
  qtySelesai: null,
  waktuTerima: null,
  waktuSelesai: null,
  karyawan: null,
  koreksiStatus: null,
  koreksiAlasan: null,
};

export const fixedPOs: PurchaseOrder[] = [
  {
    id: 'PO-1776066386300',
    nomorPO: 'PO-001',
    klienId: 'KLN-001',
    tanggalInput: '2026-04-13',
    tanggalDeadline: '',
    catatan: 'Data testing default',
    status: 'aktif',
    items: [
      {
        id: 'ITM-001',
        poId: 'PO-1776066386300',
        modelId: 'abudzar',
        warnaId: 'grey-x-black',
        sizeId: 's',
        qty: 10,
        qtyPerBundle: 1,
        jumlahBundle: 10,
        skuKlien: 'ely147',
        skuInternal: 'LYX-ABUDZAR-ELY-GREY-X-BLACK-S',
        statusCutting: 'waiting'
      }
    ]
  },
  {
    id: 'PO-1776066407097',
    nomorPO: 'PO-002',
    klienId: 'KLN-001',
    tanggalInput: '2026-04-13',
    tanggalDeadline: '',
    catatan: 'Data testing default',
    status: 'aktif',
    items: [
      {
        id: 'ITM-002',
        poId: 'PO-1776066407097',
        modelId: 'airflow',
        warnaId: 'black',
        sizeId: 's',
        qty: 15,
        qtyPerBundle: 5,
        jumlahBundle: 3,
        skuKlien: 'ely-airflow',
        skuInternal: 'LYX-AIRFLOW-ELY-BLACK-S',
        statusCutting: 'waiting'
      }
    ]
  }
];

export const fixedBundles: Bundle[] = [
  // PO-001 Bundles (1-10)
  ...Array.from({ length: 10 }).map((_, i) => ({
    barcode: `PO001-ABU-GRE-S-${(i + 1).toString().padStart(5, '0')}-BDL${(i + 1).toString().padStart(2, '0')}-13-04-26`,
    po: 'PO-1776066386300',
    model: 'abudzar',
    warna: 'grey-x-black',
    size: 's',
    qtyBundle: 1,
    skuKlien: 'ely147',
    skuInternal: 'LYX-ABUDZAR-ELY-GREY-X-BLACK-S',
    statusTahap: {
      cutting: { ...defaultStatus },
      jahit: { ...defaultStatus },
      lkancing: { ...defaultStatus },
      bbenang: { ...defaultStatus },
      qc: { ...defaultStatus },
      steam: { ...defaultStatus },
      packing: { ...defaultStatus },
    }
  })),
  // PO-002 Bundles (11-13)
  ...Array.from({ length: 3 }).map((_, i) => ({
    barcode: `PO002-AIR-BLA-S-${(i + 11).toString().padStart(5, '0')}-BDL${(i + 1).toString().padStart(2, '0')}-13-04-26`,
    po: 'PO-1776066407097',
    model: 'airflow',
    warna: 'black',
    size: 's',
    qtyBundle: 5,
    skuKlien: 'ely-airflow',
    skuInternal: 'LYX-AIRFLOW-ELY-BLACK-S',
    statusTahap: {
      cutting: { ...defaultStatus },
      jahit: { ...defaultStatus },
      lkancing: { ...defaultStatus },
      bbenang: { ...defaultStatus },
      qc: { ...defaultStatus },
      steam: { ...defaultStatus },
      packing: { ...defaultStatus },
    }
  }))
];
