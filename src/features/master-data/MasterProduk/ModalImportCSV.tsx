import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Typography';
import { useMasterStore } from '@/stores/useMasterStore';
import { useToast } from '@/components/molecules/Toast';
import { downloadCSV } from '@/lib/utils/export-utils';
import Papa from 'papaparse';

interface ModalImportCSVProps {
  onClose: () => void;
}

export default function ModalImportCSV({ onClose }: ModalImportCSVProps) {
  const { 
    klien, model, warna, sizes, hppKomponen, produk, produkHPPItems,
    importProdukBulk 
  } = useMasterStore();
  const { success, error } = useToast();

  const handleDownloadTemplate = () => {
    const template = [{
      "Client": "Elysar Kids",
      "SKU": "ely01",
      "Nama Produk": "Arslan Black x Grey - S",
      "MODEL": "Arslan",
      "WARNA": "Black x Grey",
      "SIZE": "S",
      "Kategori": "Kaos Anak",
      "HPP Bahan": "12950",
      "Upah Cutting": "1500",
      "Upah Jahit": "11000",
      "Upah Lubang Kancing": "600",
      "Upah Buang Benang": "350",
      "Upah QC": "250",
      "Upah Steam": "400",
      "Upah Packing": "150",
      "oprasional Rumah": "1000",
      "Oprasional Listrik": "1000",
      "Oprasional Sehari-hari": "1000",
      "Uang makan": "1500",
      "Aksesories": "3000",
      "Total HPP": "34700",
      "Harga Jual": "39659"
    }];
    downloadCSV(template, 'template_produk_hpp');
  };

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSummary(null);
    }
  };

  const handleParse = () => {
    if (!file) return;
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      beforeFirstChunk: (chunk) => {
        // Remove Excel-specific "sep=," line if present (handles potential BOM)
        return chunk.replace(/^(\uFEFF)?sep=.*?\r?\n/, "");
      },
      complete: (results) => {
        analyzeData(results.data);
      },
      error: (err) => {
        error("Gagal Membaca File", err.message);
        setLoading(false);
      }
    });
  };

  const cleanNominal = (val: string) => {
    if (!val) return 0;
    // Remove "Rp", dots, commas, spaces
    const cleaned = val.replace(/[^0-9]/g, '');
    return Number(cleaned) || 0;
  };

  const analyzeData = (data: any[]) => {
    try {
      if (data.length === 0) throw new Error("File CSV Kosong");

      const headers = Object.keys(data[0]);

      // Robust helper to get value by case-insensitive header name
      const getVal = (row: any, key: string) => {
        const actualKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
        return actualKey ? row[actualKey] : undefined;
      };

      // Identify dynamic HPP columns
      // Start after SIZE or Kategori, end before "Total HPP" or "Harga Jual"
      const sizeIndex = headers.findIndex(h => h.trim().toUpperCase() === 'SIZE');
      const katIndex = headers.findIndex(h => h.trim().toUpperCase() === 'KATEGORI');
      
      // If kategori exists, HPP components start after it. Otherwise after SIZE.
      const startIndex = (katIndex !== -1 ? katIndex : sizeIndex) + 1;
      
      let endIndex = headers.findIndex(h => h.trim().toUpperCase() === 'TOTAL HPP');
      if (endIndex === -1) endIndex = headers.findIndex(h => h.trim().toUpperCase() === 'HARGA JUAL');

      if (startIndex <= 0 || endIndex <= 0 || startIndex >= endIndex) {
        throw new Error("Format kolom HPP dinamis tidak ditemukan. Pastikan ada komponen HPP di antara kolom 'SIZE/Kategori' dan 'Harga Jual'.");
      }

      const hppHeaderNames = headers.slice(startIndex, endIndex);

      // Trackers for bulk insert
      const newClients = new Map();
      const newModels = new Map();
      const newColors = new Map();
      const newSizes = new Map();
      const newKomponen = new Map();
      const newKategori = new Map();
      const newProduk: any[] = [];
      const newProdukHpp: any[] = [];

      let errorCount = 0;

      data.forEach((row, i) => {
        const clientName = getVal(row, 'Client');
        const csvSku = getVal(row, 'SKU');
        const internalName = getVal(row, 'Nama Produk');
        const modelName = getVal(row, 'MODEL');
        const warnaName = getVal(row, 'WARNA');
        const sizeName = getVal(row, 'SIZE');
        const categoryName = getVal(row, 'Kategori');
        const hargaJual = cleanNominal(getVal(row, 'Harga Jual'));

        if (!clientName || !modelName || !sizeName) {
          errorCount++;
          return; // Skip invalid rows
        }

        const cleanStr = (s: any) => s?.toString().trim() || "";

        // 1. Resolve Foreign Keys or Register New
        let clientId = klien.find(k => k.nama.toLowerCase() === clientName.toLowerCase())?.id;
        if (!clientId) {
          const match = Array.from(newClients.values()).find(k => k.nama.toLowerCase() === clientName.toLowerCase());
          if (match) {
            clientId = match.id;
          } else {
            const newId = `C-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            newClients.set(clientName, { id: newId, nama: clientName, kontak: '', alamat: '' });
            clientId = newId;
          }
        }

        let categoryId = 'KAT-001'; // Default
        if (categoryName) {
          const existingKat = useMasterStore.getState().kategori.find(k => k.nama.toLowerCase() === categoryName.toString().toLowerCase());
          if (existingKat) {
            categoryId = existingKat.id;
          } else {
            const matchInBatch = Array.from(newKategori.values()).find(k => k.nama.toLowerCase() === categoryName.toString().toLowerCase());
            if (matchInBatch) {
                categoryId = matchInBatch.id;
            } else {
                const newId = `KAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                newKategori.set(categoryName, { id: newId, nama: categoryName });
                categoryId = newId;
            }
          }
        }

        let modelId = model.find(m => m.nama.toLowerCase() === modelName.toLowerCase())?.id;
        if (!modelId) {
          const matchInBatch = Array.from(newModels.values()).find(m => m.nama.toLowerCase() === modelName.toLowerCase());
          if (matchInBatch) {
            modelId = matchInBatch.id;
          } else {
            const newId = `MDL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            newModels.set(modelName, { id: newId, nama: modelName, kategoriId: categoryId, targetPoin: 1 });
            modelId = newId;
          }
        }

        let warnaId = "WRN-DEF";
        if (warnaName) {
          warnaId = warna.find(w => w.nama.toLowerCase() === warnaName.toLowerCase())?.id || "";
          if (!warnaId) {
            const matchInBatch = Array.from(newColors.values()).find(w => w.nama.toLowerCase() === warnaName.toLowerCase());
            if (matchInBatch) {
                warnaId = matchInBatch.id;
            } else {
                const newId = `WRN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                newColors.set(warnaName, { id: newId, nama: warnaName, kodeHex: '#CCCCCC' });
                warnaId = newId;
            }
          }
        }

        let sizeId = sizes.find((s: any) => s.nama.toLowerCase() === sizeName.toString().toLowerCase())?.id;
        if (!sizeId) {
          const matchInBatch = Array.from(newSizes.values()).find(s => s.nama.toLowerCase() === sizeName.toString().toLowerCase());
          if (matchInBatch) {
            sizeId = matchInBatch.id;
          } else {
            const newId = `SZ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            newSizes.set(sizeName, { id: newId, nama: sizeName });
            sizeId = newId;
          }
        }

        // 2. Create Product
        // Check if product already exists (by Model, Warna, Size)
        const isExists = produk.find(p => p.modelId === modelId && p.warnaId === warnaId && p.sizeId === sizeId);
        let currentProdukId = isExists?.id;

        if (!currentProdukId) {
          currentProdukId = `PRD-${Date.now()}-${i}`;
          // SKU Internal Auto Gen: LYX-[MODEL]-[WL]-[SZ]
          const modelSlug = modelName.toString().substring(0, 3).toUpperCase();
          const warnaSlug = (warnaName || "DEF").toString().substring(0, 2).toUpperCase();
          const sizeSlug = sizeName.toString().toUpperCase();
          const autoSku = `LYX-${modelSlug}-${warnaSlug}-${sizeSlug}-${i}`;

          newProduk.push({
            id: currentProdukId,
            modelId,
            warnaId,
            sizeId,
            skuInternal: autoSku,
            skuKlien: csvSku || '',
            nama: internalName || '',
            aktif: true,
            hargaJual: hargaJual
          });
        }

        // 3. Map HPP Components
        hppHeaderNames.forEach(kompName => {
          const nominal = cleanNominal(row[kompName]);
          if (nominal > 0) {
            let kompId = hppKomponen.find(hk => hk.nama.toLowerCase() === kompName.trim().toLowerCase())?.id;
            if (!kompId) {
              const matchInBatch = Array.from(newKomponen.values()).find(hk => hk.nama.toLowerCase() === kompName.trim().toLowerCase());
              if (matchInBatch) {
                kompId = matchInBatch.id;
              } else {
                const cat = kompName.toLowerCase().includes('bahan') ? 'bahan_baku' : (kompName.toLowerCase().includes('oprasional') || kompName.toLowerCase().includes('sewa') || kompName.toLowerCase().includes('listrik') || kompName.toLowerCase().includes('makan') ? 'overhead' : 'biaya_produksi');
                const newId = `HK-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                newKomponen.set(kompName, { 
                  id: newId, 
                  nama: kompName.trim(), 
                  kategori: cat, 
                  satuan: 'pcs' 
                });
                kompId = newId;
              }
            }

            // check if relationship exists
            const hasHpp = produkHPPItems.some(phi => phi.produkId === currentProdukId && phi.komponenId === kompId);
            if (!hasHpp) {
                const inBatch = newProdukHpp.some(phi => phi.produkId === currentProdukId && phi.komponenId === kompId);
                if (!inBatch) {
                    newProdukHpp.push({
                    id: `PHI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    produkId: currentProdukId,
                    komponenId: kompId,
                    harga: nominal,
                    qty: 1
                    });
                }
            }
          }
        });

      });

      setParsedData({
        kategori: Array.from(newKategori.values()),
        klien: Array.from(newClients.values()),
        model: Array.from(newModels.values()),
        warna: Array.from(newColors.values()),
        sizes: Array.from(newSizes.values()),
        hppKomponen: Array.from(newKomponen.values()),
        produk: newProduk,
        produkHPPItems: newProdukHpp
      });

      setSummary({
        totalRows: data.length,
        errorRows: errorCount,
        newProducts: newProduk.length,
        newHppItems: newProdukHpp.length,
        newKlien: newClients.size,
        newModels: newModels.size,
        newColors: newColors.size,
        newSizes: newSizes.size,
        newKategori: newKategori.size,
        newKomponen: newKomponen.size,
        hppColumnsDetected: hppHeaderNames.length
      });

      setLoading(false);
    } catch (err: any) {
      error("Format Salah", err.message);
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!parsedData) return;
    importProdukBulk(parsedData);
    success("Import Berhasil", `${summary.newProducts} produk dan ${summary.newHppItems} item HPP berhasil dimasukkan.`);
    onClose();
  };

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <ModalHeader title="Import Produk & HPP dari CSV" onClose={onClose} />
      <ModalBody>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'var(--color-card2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <Label>Aturan Format (Sesuai Standar Konveksi.V.2)</Label>
                <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
                   📄 Download Template CSV
                </Button>
             </div>
             <ul style={{ paddingLeft: '20px', color: 'var(--color-text-sub)', fontSize: '13px', marginTop: '8px' }}>
                <li>Header WAJIB minimal memiliki: <strong>Client, SKU, Nama Produk, MODEL, WARNA, SIZE, Kategori, Harga Jual</strong></li>
                <li>Kolom <strong>Kategori</strong> ditempatkan <strong>SETELAH kolom SIZE</strong>.</li>
                <li>Kolom <strong>HPP Komponen</strong> (Upah Cutting, Jahit, Bahan, dsb) ditempatkan <strong>SETELAH kolom Kategori</strong> dan <strong>SEBELUM kolom Total HPP/Harga Jual</strong>.</li>
                <li>Sistem akan mendeteksi komponen HPP secara dinamis. Total HPP akan otomatis dihitung ulang.</li>
                <li>Gunakan format nilai rupiah standar (contoh: Rp12.000 atau cuma angka 12000).</li>
             </ul>
          </div>

          <div>
             <Label>Pilih File CSV (.csv)</Label>
             <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                style={{ marginTop: '8px', display: 'block' }}
             />
          </div>

          {file && !summary && (
              <Button type="button" variant="ghost" onClick={handleParse} disabled={loading}>
                 {loading ? "Membaca data..." : "Analisa Template CSV"}
              </Button>
          )}

          {summary && (
             <div style={{ background: '#1c3127', padding: '16px', borderRadius: '8px', border: '1px solid #205c3d' }}>
                <h4 style={{ color: '#4ade80', marginBottom: '12px' }}>Ringkasan Hasil Analisa</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div>Data Terbaca: <strong>{summary.totalRows} baris</strong> {summary.errorRows > 0 && <span style={{ color: '#f87171' }}>({summary.errorRows} error)</span>}</div>
                  <div>Produk Baru: <strong>{summary.newProducts} item</strong></div>
                  <div>Rincian HPP: <strong>{summary.newHppItems} item</strong></div>
                  <div>Master Klien Baru: <strong>{summary.newKlien} master</strong></div>
                  <div>Master Kategori Baru: <strong>{summary.newKategori} master</strong></div>
                  <div>Master Model Baru: <strong>{summary.newModels} master</strong></div>
                  <div>Master Warna Baru: <strong>{summary.newColors} master</strong></div>
                  <div>Master Size Baru: <strong>{summary.newSizes} master</strong></div>
                  <div>Komponen HPP Baru: <strong>{summary.newKomponen} master</strong> <span style={{ color: 'var(--color-text-sub)'}}>(dari {summary.hppColumnsDetected} kolom dinamis)</span></div>
                </div>
             </div>
          )}

        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" onClick={handleImport} disabled={!summary}>
          Mulai Tambahkan Data
        </Button>
      </ModalFooter>
    </Modal>
  );
}
