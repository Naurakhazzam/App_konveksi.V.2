export function generateBarcode(params: {
  nomorPO: string;
  model: string;
  warna: string;
  size: string;
  globalSequence: number;
  bundleIndex: number;
  tanggal: Date;
}): string {
  // PO[nopo]-[mdl]-[wrn]-[sz]-[urutglobal]-BDL[nourut]-[DD-MM-YY]
  
  const extractPO = (str: string) => str.replace('PO-', '');
  
  const padSequence = (num: number, length: number) => num.toString().padStart(length, '0');
  
  const nopo = extractPO(params.nomorPO);
  const mdl = params.model.substring(0, 3).toUpperCase();
  const wrn = params.warna.substring(0, 3).toUpperCase();
  const sz = params.size.toUpperCase();
  const urutglobal = padSequence(params.globalSequence, 5);
  const nourut = padSequence(params.bundleIndex, 3);
  
  const d = padSequence(params.tanggal.getDate(), 2);
  const m = padSequence(params.tanggal.getMonth() + 1, 2);
  const y = params.tanggal.getFullYear().toString().substring(2);
  const dateStr = `${d}-${m}-${y}`;

  return `PO-${nopo}-${urutglobal}-bdl${nourut}`;
}
