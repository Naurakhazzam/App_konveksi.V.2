import Papa from 'papaparse';
import { downloadCSV } from './export-utils';

export const PO_CSV_HEADER = [
  'Nomor_PO',
  'ID_Klien',
  'SKU_Klien',
  'Nama_produk',
  'Total_QTY',
  'QTY_Per_Bundle',
  'Catatan'
];

export const generatePOMassTemplate = () => {
  const data = [
    {
      'Nomor_PO': 'PO-100',
      'ID_Klien': 'KLI-001',
      'SKU_Klien': 'SKU-ABC-01',
      'Nama_produk': 'Contoh Produk A',
      'Total_QTY': '100',
      'QTY_Per_Bundle': '20',
      'Catatan': 'Segera kirim'
    },
    {
      'Nomor_PO': 'PO-100',
      'ID_Klien': 'KLI-001',
      'SKU_Klien': 'SKU-ABC-02',
      'Nama_produk': 'Contoh Produk B',
      'Total_QTY': '50',
      'QTY_Per_Bundle': '25',
      'Catatan': ''
    }
  ];
  
  downloadCSV(data, 'template_upload_po');
};


export interface ProcessedPOData {
  pos: any[];
  bundles: any[];
  errors: string[];
}

export const processPOCSV = (
  results: Papa.ParseResult<any>,
  masterData: { klien: any[], produk: any[], model: any[], warna: any[], sizes: any[] },
  incrementGlobalSeq: (count: number) => number
): ProcessedPOData => {
  const pos: any[] = [];
  const bundles: any[] = [];
  const errors: string[] = [];
  const rows = results.data;

  if (rows.length === 0) {
    return { pos, bundles, errors: ['File CSV kosong'] };
  }

  // Group by Nomor_PO
  const poGroups: { [key: string]: any[] } = {};
  rows.forEach((row, index) => {
    // Skip header and empty rows
    // Also skip Excel's "sep=," line if present
    if (index === 0 || !row[0] || (typeof row[0] === 'string' && row[0].startsWith('sep='))) return;
    
    const nopo = row[0];
    if (!poGroups[nopo]) poGroups[nopo] = [];
    poGroups[nopo].push(row);
  });

  Object.entries(poGroups).forEach(([nomorPO, poRows]) => {
    const poId = `PO-IMP-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const klienIdTemp = poRows[0][1];
    
    // Find Klien
    const matchKlien = masterData.klien.find(k => k.id === klienIdTemp || k.nama === klienIdTemp);
    if (!matchKlien) {
      errors.push(`Klien dengan ID/Nama "${klienIdTemp}" tidak ditemukan (PO: ${nomorPO})`);
      return;
    }

    const items: any[] = [];
    let poTotalBundles = 0;

    poRows.forEach((row, rowIdx) => {
      const skuKlien = row[2];
      const totalQty = Number(row[4] || 0);
      const qtyPerBdl = Number(row[5] || 0);
      const catatanRow = row[6] || '';

      // Find Produk by SKU
      const matchProduk = masterData.produk.find(p => p.skuKlien === skuKlien || p.skuInternal === skuKlien);
      if (!matchProduk) {
        errors.push(`SKU "${skuKlien}" tidak ditemukan di database master produk (PO: ${nomorPO})`);
        return;
      }

      const numBundles = qtyPerBdl > 0 ? Math.ceil(totalQty / qtyPerBdl) : 0;
      const itemId = `ITM-IMP-${Date.now()}-${rowIdx}-${Math.random().toString(36).slice(2, 4)}`;

      items.push({
        id: itemId,
        poId,
        modelId: matchProduk.modelId,
        warnaId: matchProduk.warnaId,
        sizeId: matchProduk.sizeId,
        qty: totalQty,
        qtyPerBundle: qtyPerBdl,
        jumlahBundle: numBundles,
        skuKlien: matchProduk.skuKlien,
        skuInternal: matchProduk.skuInternal,
        statusCutting: 'waiting'
      });

      poTotalBundles += numBundles;
    });

    if (items.length === 0) return;

    // Create PO
    pos.push({
      id: poId,
      klienId: matchKlien.id,
      nomorPO,
      tanggalInput: new Date().toISOString().split('T')[0],
      items,
      status: 'aktif',
      catatan: poRows[0][6] || ''
    });

    // Generate Bundles
    const startSeq = incrementGlobalSeq(poTotalBundles);
    let currentGlobalSeq = startSeq;

    items.forEach(item => {
      const modelName = masterData.model.find(m => m.id === item.modelId)?.nama || 'MDL';
      const warnaName = masterData.warna.find(w => w.id === item.warnaId)?.nama || 'WRN';
      const sizeName = masterData.sizes.find(s => s.id === item.sizeId)?.nama || 'SZ';
      
      let qtyLeft = item.qty;
      const defaultStatus = { status: null, qtyTerima: 0, qtySelesai: 0, waktuTerima: null, waktuSelesai: null, karyawan: null, koreksiStatus: null, koreksiAlasan: null };

      for (let i = 1; i <= item.jumlahBundle; i++) {
        const bundleQty = Math.min(qtyLeft, item.qtyPerBundle);
        qtyLeft -= bundleQty;

        // Custom function locally since we can't easily import from another feature folder without circular issues
        const barcodeString = `PO${nomorPO.replace(/[^a-zA-Z0-9]/g, '')}-${currentGlobalSeq.toString().padStart(5, '0')}-BDL${i.toString().padStart(2, '0')}`;

        bundles.push({
          barcode: barcodeString,
          po: poId,
          model: item.modelId,
          warna: item.warnaId,
          size: item.sizeId,
          qtyBundle: bundleQty,
          skuKlien: item.skuKlien,
          skuInternal: item.skuInternal,
          statusTahap: {
            cutting: { ...defaultStatus },
            jahit: { ...defaultStatus },
            lkancing: { ...defaultStatus },
            bbenang: { ...defaultStatus },
            qc: { ...defaultStatus },
            steam: { ...defaultStatus },
            packing: { ...defaultStatus },
          }
        });

        currentGlobalSeq++;
      }
    });
  });

  return { pos, bundles, errors };
};

