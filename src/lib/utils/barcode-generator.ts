export function generateBarcode(params: {
  nomorPO: string;
  model: string;
  warna: string;
  size: string;
  globalSequence: number;
  bundleIndex: number;
  tanggal: Date;
}): string {
  // Pola yang disetujui User: PO-0001-00001-bdl001
  // Format: PO-[nomorPO]-[urutglobal]-bdl[nourut]
  
  const extractPO = (str: string) => str.replace('PO-', '');
  const padSequence = (num: number, length: number) => num.toString().padStart(length, '0');
  
  const nopo = extractPO(params.nomorPO);
  const urutglobal = padSequence(params.globalSequence, 5);
  const nourut = padSequence(params.bundleIndex, 3);
  
  return `PO-${nopo}-${urutglobal}-bdl${nourut}`;
}
