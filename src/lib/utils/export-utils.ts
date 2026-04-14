import Papa from 'papaparse';

export const downloadCSV = (data: Record<string, any>[], filename: string) => {
  if (!data || data.length === 0) return;

  // Generate CSV string standar
  const csvContent = Papa.unparse(data);

  // Kita gunakan tipe 'application/octet-stream' untuk memaksa browser mengunduhnya sebagai file, 
  // bukan sebagai teks/sumber daya web biasa.
  // Gunakan BOM (\uFEFF) saja tanpa sep=, agar tidak dianggap teks oleh mime-sniffer browser
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'application/octet-stream' });
  
  const url = URL.createObjectURL(blob);
  const link = document.body.appendChild(document.createElement('a'));
  
  // Set nama file dengan sangat eksplisit
  const cleanName = filename.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  link.href = url;
  link.download = `${cleanName}.csv`;
  link.style.display = 'none';
  
  // Trigger klik secara sinkron
  link.click();
  
  // Berikan jeda lama sebelum pembersihan
  setTimeout(() => {
    URL.revokeObjectURL(url);
    if (link.parentNode) link.parentNode.removeChild(link);
  }, 1000);
};





