import Papa from 'papaparse';
import { downloadCSV } from './export-utils';
import { generateBarcode } from './barcode-generator';

export const PO_CSV_HEADER = [
  'Nomor_PO',
  'ID_Klien',
  'SKU_Klien',
  'Nama_produk',
  'Total_QTY',
  'QTY_Per_Bundle',
  'Catatan',
  'Tanggal_Deadline'
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
      'Catatan': 'Segera kirim',
      'Tanggal_Deadline': '2026-05-01'
    },
    {
      'Nomor_PO': 'PO-100',
      'ID_Klien': 'KLI-001',
      'SKU_Klien': 'SKU-ABC-02',
      'Nama_produk': 'Contoh Produk B',
      'Total_QTY': '50',
      'QTY_Per_Bundle': '25',
      'Catatan': '',
      'Tanggal_Deadline': ''
    }
  ];
  
  downloadCSV(data, 'template_upload_po');
};


export interface ProcessedPOEntry {
  po: any;
  bundles: any[];
}

export interface ProcessedPOData {
  entries: ProcessedPOEntry[];
  errors: string[];
  /** @deprecated Gunakan entries[].bundles — dipertahankan untuk kompatibilitas UI summary */
  totalBundles: number;
}

export const processPOCSV = (
  results: Papa.ParseResult<any>,
  masterData: { klien: any[], produk: any[], model: any[], warna: any[], sizes: any[] },
  existingNomorPOs: string[] = []
): ProcessedPOData => {
  const entries: ProcessedPOEntry[] = [];
  const errors: string[] = [];
  const rows = results.data;

  if (rows.length === 0) {
    return { entries, errors: ['File CSV kosong'], totalBundles: 0 };
  }

  // Helper to parse date or return null
  const parseDate = (val: any) => {
    if (!val || val.toString().trim() === '') return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  // Group by Nomor_PO
  const poGroups: { [key: string]: any[] } = {};
  rows.forEach((row, index) => {
    // Skip header and empty rows
    if (index === 0 || !row[0] || (typeof row[0] === 'string' && row[0].startsWith('sep='))) return;
    
    const nopo = row[0];
    if (!poGroups[nopo]) poGroups[nopo] = [];
    poGroups[nopo].push(row);
  });

  Object.entries(poGroups).forEach(([nomorPO, poRows]) => {
    // Cek duplikat: Nomor_PO sudah ada di database
    if (existingNomorPOs.includes(nomorPO)) {
      errors.push(`Nomor PO "${nomorPO}" sudah ada di database. Impor dibatalkan untuk PO ini agar tidak terjadi duplikasi data.`);
      return;
    }

    const poId = `PO-IMP-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const klienIdTemp = poRows[0][1];
    const deadlineRaw = poRows[0][7];
    const tanggalDeadline = parseDate(deadlineRaw);
    
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

    // Create PO object
    const po = {
      id: poId,
      klienId: matchKlien.id,
      nomorPO,
      tanggalInput: new Date().toISOString(),
      tanggalDeadline,
      items,
      status: 'aktif',
      catatan: poRows[0][6] || ''
    };

    // Generate Bundles dengan placeholder sequence 00000 (akan diganti di store)
    const poBundles: any[] = [];

    items.forEach(item => {
      const mMatch = masterData.model.find(m => m.id === item.modelId);
      const modelName = mMatch?.nama || 'MDL';
      const warnaName = masterData.warna.find(w => w.id === item.warnaId)?.nama || 'WRN';
      const sizeName = masterData.sizes.find(s => s.id === item.sizeId)?.nama || 'SZ';
      
      let qtyLeft = item.qty;
      const defaultStatus = { status: null, qtyTerima: 0, qtySelesai: 0, waktuTerima: null, waktuSelesai: null, karyawan: null, koreksiStatus: null, koreksiAlasan: null };

      for (let i = 1; i <= item.jumlahBundle; i++) {
        const bundleQty = Math.min(qtyLeft, item.qtyPerBundle);
        qtyLeft -= bundleQty;

        // Gunakan generateBarcode() dengan sequence 0 sebagai template
        const barcodeString = generateBarcode({
          nomorPO,
          model: modelName,
          warna: warnaName,
          size: sizeName,
          globalSequence: 0,
          bundleIndex: i,
          tanggal: new Date()
        });

        poBundles.push({
          id: `BNL-IMP-${Date.now()}-${item.id}-${i}`,
          barcode: barcodeString,
          po: poId,
          poItemId: item.id, // K3: Wajib isi poItemId
          model: item.modelId,
          modelName,
          warna: item.warnaId,
          warnaName,
          size: item.sizeId,
          sizeName,
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
      }
    });

    // Gabungkan PO + bundle-nya menjadi satu entry
    entries.push({ po, bundles: poBundles });
  });

  const totalBundles = entries.reduce((acc, e) => acc + e.bundles.length, 0);
  return { entries, errors, totalBundles };
};

