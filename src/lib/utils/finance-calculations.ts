import { JurnalEntry, PurchaseOrder, ProdukHPPItem, HPPKomponen } from '@/types';

/**
 * 1. ESTIMASI: Menghitung Budget berdasarkan Master HPP
 */
export const calculateHPPEstimatePO = (
  poItems: PurchaseOrder['items'],
  allHppItems: ProdukHPPItem[]
) => {
  return poItems.reduce((acc, item) => {
    // Cari komponen HPP untuk produk ini
    const hppComponents = allHppItems.filter(h => h.produkId === item.id || h.produkId === `${item.modelId}-${item.sizeId}`); 
    // Note: link bisa via produkId atau kombinasi model-size di dummy
    const hppPerPCS = hppComponents.reduce((sum, kom) => sum + (kom.harga * kom.qty), 0);
    return acc + (hppPerPCS * item.qty);
  }, 0);
};

/**
 * 2. REALISASI: Biaya Bahan Aktul
 */
export const calculateHPPBahanReal = (poId: string, entries: JurnalEntry[]) => {
  return entries
    .filter(e => e.jenis === 'direct_bahan' && (e.poId === poId || e.tagPOs?.includes(poId)))
    .reduce((acc, curr) => {
      const multiplier = curr.tagPOs?.length ? 1 / curr.tagPOs.length : 1;
      return acc + (curr.nominal * multiplier);
    }, 0);
};

/**
 * 3. REALISASI: Biaya Upah Aktul
 */
export const calculateHPPUpahReal = (poId: string, entries: JurnalEntry[]) => {
  return entries
    .filter(e => e.jenis === 'direct_upah' && (e.poId === poId || e.tagPOs?.includes(poId)))
    .reduce((acc, curr) => acc + curr.nominal, 0);
};

/**
 * 4. REALISASI: Alokasi Overhead Proporsional
 */
export const calculateOverheadAllocation = (
  entries: JurnalEntry[],
  totalDeliveredInMonth: number,
  poDeliveredInMonth: number
) => {
  const totalOverhead = entries
    .filter(e => e.jenis === 'overhead')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  if (totalDeliveredInMonth === 0) return 0;
  return (totalOverhead / totalDeliveredInMonth) * poDeliveredInMonth;
};

export interface POFinancialSummary {
  poId: string;
  noPO: string;
  klienNama: string;
  totalQty: number;
  
  // Financials
  nilaiProject: number;
  hppEstimasi: number;
  biayaBahanReal: number;
  biayaUpahReal: number;
  biayaOverheadReal: number;
  totalRealisasi: number;
  
  // Analytics
  gap: number; // Real - Est
  profit: number; // Nilai - Real
  status: 'hemat' | 'boncos' | 'on_budget';
}

export const getPOFinancialSummary = (
  po: PurchaseOrder, 
  allEntries: JurnalEntry[],
  allHppItems: ProdukHPPItem[],
  klienNama: string,
  totalDeliveredInMonth: number,
  poDeliveredInMonth: number
): POFinancialSummary => {
  const hppEstimasi = calculateHPPEstimatePO(po.items, allHppItems);
  const biayaBahanReal = calculateHPPBahanReal(po.id, allEntries);
  const biayaUpahReal = calculateHPPUpahReal(po.id, allEntries);
  const biayaOverheadReal = calculateOverheadAllocation(allEntries, totalDeliveredInMonth, poDeliveredInMonth);
  
  const totalRealisasi = biayaBahanReal + biayaUpahReal + biayaOverheadReal;
  const nilaiProject = totalRealisasi * 1.25; // Dummy: assume 25% margin as target if no sell price found
  
  const gap = totalRealisasi - hppEstimasi;
  let status: POFinancialSummary['status'] = 'on_budget';
  if (gap > 50000) status = 'boncos'; // threshold 50rb
  else if (gap < -50000) status = 'hemat';

  return {
    poId: po.id,
    noPO: po.nomorPO,
    klienNama,
    totalQty: po.items.reduce((a, c) => a + c.qty, 0),
    nilaiProject,
    hppEstimasi,
    biayaBahanReal,
    biayaUpahReal,
    biayaOverheadReal,
    totalRealisasi,
    gap,
    profit: nilaiProject - totalRealisasi,
    status
  };
};
