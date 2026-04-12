const fs = require('fs');
const path = require('path');

const CSV_PATH = 'd:/Project Konveksi.V.2/Docs/Data_base_utama.csv';
const OUTPUT_PATH = 'd:/Project Konveksi.V.2/src/data/initial-production-data.ts';

function slugify(text) {
  if (!text) return 'n-a';
  return text.toString().toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function process() {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const clients = [{ id: 'KLN-001', nama: 'Elyasr Kids', alamat: '-', kontak: '-' }];
  
  const kategoriMap = new Map();
  const modelMap = new Map();
  const warnaMap = new Map();
  const sizeMap = new Map();
  
  // Define HPP Components from headers (indices 7 to 31)
  const hppHeaderIndices = [];
  const hppKomponen = [];
  
  for (let i = 7; i <= 31; i++) {
    const name = headers[i];
    let kategori = 'overhead'; // Default
    if (name.startsWith('Upah')) kategori = 'biaya_produksi';
    else if (name.toLowerCase().includes('oprasional') || name.toLowerCase().includes('makan')) kategori = 'overhead';
    else if (name === 'HPP Bahan' || name === 'Kain saku' || name === 'Puring' || name === 'Kain Keras' || 
             ['Variasi', 'Karet', 'Tali', 'Stoper', 'Mata itik', 'Sleting Topi', 'Sleting Saku', 'Sleting Badan', 'Kancing', 'Benang'].includes(name)) {
      kategori = 'bahan_baku';
    }
    
    const id = `HPP-${slugify(name)}`;
    hppHeaderIndices.push({ index: i, name, kategori, id });
    hppKomponen.push({
      id,
      nama: name,
      kategori: kategori,
      satuan: 'Pcs'
    });
  }

  const produk = [];
  const produkHPPItems = [];
  const inventoryItems = [];

  lines.slice(1).forEach((line, idx) => {
    const cols = line.split(',');
    if (cols.length < 33) return;

    const rawClient = cols[0].trim();
    const skuKlien = cols[1].trim();
    const namaProduk = cols[2].trim();
    const modelName = cols[3].trim();
    const warnaName = cols[4].trim();
    const sizeName = cols[5].trim();
    let kategoriName = cols[6].trim() || 'Polo Wangky';
    
    // Merge categories as requested
    if (kategoriName === 'Lain-lain') kategoriName = 'Polo Wangky';

    if (!skuKlien || !namaProduk) return;

    // Build unique sets/maps
    const katId = slugify(kategoriName);
    if (!kategoriMap.has(katId)) kategoriMap.set(katId, { id: katId, nama: kategoriName });

    const modId = slugify(modelName);
    if (!modelMap.has(modId)) modelMap.set(modId, { id: modId, nama: modelName, kategoriId: katId, targetPoin: 0 });

    const warId = slugify(warnaName);
    if (!warnaMap.has(warId)) warnaMap.set(warId, { id: warId, nama: warnaName, kodeHex: '#cccccc' });

    const sizId = slugify(sizeName);
    if (!sizeMap.has(sizId)) sizeMap.set(sizId, { id: sizId, nama: sizeName });

    const produkId = `PRD-${(idx + 1).toString().padStart(5, '0')}`;
    const skuInternal = `LYX-${slugify(modelName)}-${slugify(rawClient).substring(0,3)}-${warId}-${sizId}`.toUpperCase();

    hppHeaderIndices.forEach(h => {
      const val = parseFloat(cols[h.index]) || 0;
      if (val > 0) {
        produkHPPItems.push({
          id: `PHPP-${produkId}-${h.id}`,
          produkId,
          komponenId: h.id,
          harga: val,
          qty: 1
        });
      }
    });

    produk.push({
      id: produkId,
      modelId: modId,
      sizeId: sizId,
      warnaId: warId,
      skuInternal,
      skuKlien,
      nama: namaProduk,
      aktif: true,
      hargaJual: parseFloat(cols[32]) || 0
    });
    
    inventoryItems.push({
        id: `INV-${produkId}`,
        nama: namaProduk,
        kategoriId: katId,
        satuanId: 'pcs',
        stokAktual: 0,
        stokMinimum: 10
    });
  });

  const output = `
import { Produk, HPPKomponen, ProdukHPPItem, Klien, Kategori, Model, Warna, Size, InventoryItem } from '../types';

export const initialClients: Klien[] = ${JSON.stringify(clients, null, 2)};

export const initialKategori: Kategori[] = ${JSON.stringify(Array.from(kategoriMap.values()), null, 2)};

export const initialModels: Model[] = ${JSON.stringify(Array.from(modelMap.values()), null, 2)};

export const initialWarna: Warna[] = ${JSON.stringify(Array.from(warnaMap.values()), null, 2)};

export const initialSizes: Size[] = ${JSON.stringify(Array.from(sizeMap.values()), null, 2)};

export const initialHPPKomponen: HPPKomponen[] = ${JSON.stringify(hppKomponen, null, 2)};

export const initialProduk: Produk[] = ${JSON.stringify(produk, null, 2)};

export const initialProdukHPPItems: ProdukHPPItem[] = ${JSON.stringify(produkHPPItems, null, 2)};

export const initialInventoryItems: InventoryItem[] = ${JSON.stringify(inventoryItems, null, 2)};
`;

  fs.writeFileSync(OUTPUT_PATH, output);
  console.log('Successfully generated initial-production-data.ts');
}

process();

