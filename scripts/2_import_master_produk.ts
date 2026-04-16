import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const envVar = (name: string) => envFile.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
const supabase = createClient(envVar('NEXT_PUBLIC_SUPABASE_URL'), envVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'));

async function importMasterProduk() {
    console.log('⏳ Membaca file Data_base_utama.csv...');
    const csvContent = fs.readFileSync(path.join(process.cwd(), 'Docs', 'Data_base_utama.csv'), 'utf-8');
    
    // Dataset ini pakai koma (,)
    const { data } = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    const records = data as any[];

    // Filter Headers mana yang masuk Komponen HPP
    const ignoredCols = ['Client', 'SKU', 'Nama Produk', 'MODEL', 'WARNA', 'SIZE', 'Kategori', 'Harga Jual'];
    const headers = Object.keys(records[0] || {});
    const hppKompens = headers.filter(k => k && !ignoredCols.includes(k));

    // 1. Setup Klien Tunggal
    console.log('Memastikan Klien utama Elyasr Kids dibuat ke sistem...');
    await supabase.from('klien').upsert({ id: 'KLN-001', nama: 'Elyasr Kids' });

    // 2. Aggregate Master Data Array Unique (Menghindari Duplicate)
    const kategoriSet = new Set<string>();
    const modelSet = new Map<string, string>(); // [Model -> Kategori]
    const warnaSet = new Set<string>();
    const sizeSet = new Set<string>();

    for(const row of records) {
      if(row['Kategori']) kategoriSet.add(row['Kategori'].trim());
      if(row['WARNA']) warnaSet.add(row['WARNA'].trim());
      if(row['SIZE']) sizeSet.add(row['SIZE'].trim());
      if(row['MODEL'] && row['Kategori']) modelSet.set(row['MODEL'].trim(), row['Kategori'].trim());
    }

    console.log(`Ditemukan: ${kategoriSet.size} Kategori, ${modelSet.size} Model, ${warnaSet.size} Warna, ${sizeSet.size} Size, ${hppKompens.length} Komponen. Didaftarkan...`);

    // -> Upsert Kategori
    const katMap = new Map<string, string>();
    for (const k of kategoriSet) {
        if (!k) continue;
        const id = `KAT-${Buffer.from(k).toString('base64').slice(0,6).toUpperCase()}`;
        await supabase.from('kategori').upsert({ id, nama: k });
        katMap.set(k, id);
    }
    
    // -> Upsert Model
    const modMap = new Map<string, string>();
    for (const [m, k] of modelSet.entries()) {
        if (!m) continue;
        const id = `MDL-${Buffer.from(m).toString('base64').slice(0,6).toUpperCase()}`;
        await supabase.from('model').upsert({ id, nama: m, kategori_id: katMap.get(k) || null, target_poin: 0 });
        modMap.set(m, id);
    }

    // -> Upsert Warna
    const wMap = new Map<string, string>();
    for (const w of warnaSet) {
        if (!w) continue;
        const id = `WRN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; // generate random tail ID
        await supabase.from('warna').upsert({ id, nama: w, kode_hex: '#888888' });
        wMap.set(w, id);
    }

    // -> Upsert Size
    const szMap = new Map<string, string>();
    for (const s of sizeSet) {
        if (!s) continue;
        const id = `SZ-${s.replace(/\s+/g, '-').toUpperCase()}`;
        await supabase.from('size').upsert({ id, nama: s });
        szMap.set(s, id);
    }

    // -> Upsert Komponen HPP Utama
    const kompMap = new Map<string, string>();
    for (const c of hppKompens) {
        const id = `KOMP-${Buffer.from(c).toString('hex').slice(0, 12).toUpperCase()}`;
        const kategori = c.toLowerCase().includes('upah') ? 'Upah' : 
                         (c.toLowerCase().includes('oprasional') || c.toLowerCase().includes('makan') ? 'Operasional' : 'Bahan Baku');
        await supabase.from('hpp_komponen').upsert({ id, nama: c, kategori, satuan: 'pcs' });
        kompMap.set(c, id);
    }

    // 3. Merangkai Baris per Produk + Detail HPP
    console.log(`\nMenyimpan ${records.length} Jenis Produk (Memformat ID LYX-XXXXX)...`);
    
    let pCounter = 1;
    for (const row of records) {
        if (!row['Nama Produk']) continue;

        // Auto Generate Nomor SKU Internal
        const skuInternal = `LYX-${String(pCounter).padStart(5, '0')}`;
        const prodId = `PRD-DB-${skuInternal}`;
        pCounter++;

        // Hapus Pemisah Ribuan Pada CSV (Jika ada)
        const hJualRaw = row['Harga Jual'] || '0';
        const hargaJual = Number(hJualRaw.toString().replace(/,/g, ''));

        // Upsert Database: Produk Utama (SKU Klien elyXXX dimasukan disini) !!
        await supabase.from('produk').upsert({
            id: prodId,
            sku_klien: row['SKU']?.trim() || null,
            sku_internal: skuInternal,
            nama: row['Nama Produk']?.trim() || null,
            model_id: modMap.get(row['MODEL']?.trim()),
            warna_id: wMap.get(row['WARNA']?.trim()),
            size_id: szMap.get(row['SIZE']?.trim()),
            harga_jual: isNaN(hargaJual) ? 0 : hargaJual,
            aktif: true
        });

        // Upsert Database: Loop relasi Produk HPP Komponen Details!
        const hppItems = [];
        for (const k of hppKompens) {
            const valRaw = row[k] ? String(row[k]).replace(/,/g, '').trim() : '0';
            const valNum = Number(valRaw);
            
            // Masukan List Harga HANYA JIKA bernilai lebih dari 0
            if (!isNaN(valNum) && valNum > 0) {
               hppItems.push({
                   id: `PHI-${skuInternal}-${kompMap.get(k)}`, // Pastikan ID ini unik per Produk per Komponen
                   produk_id: prodId,
                   komponen_id: kompMap.get(k),
                   harga: valNum,
                   nilai: valNum,
                   qty: 1
               });
            }
        }

        // Tembak Batch Detail
        if (hppItems.length > 0) {
            await supabase.from('produk_hpp_item').upsert(hppItems);
        }
    }
    
    console.log(`✅ [SELESAI] Data Produk, Kategori Master, dan detail HPP selesani dipindahkan otomatis! (Menghasilkan SKU Terakhir: LYX-${String(pCounter-1).padStart(5, '0')})`);
}

importMasterProduk().catch(console.error);
