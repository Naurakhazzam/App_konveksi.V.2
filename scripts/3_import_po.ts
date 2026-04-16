import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

// Hubungkan Supabase dari Environment `.env.local`
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const envVar = (name: string) => envFile.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
const supabase = createClient(envVar('NEXT_PUBLIC_SUPABASE_URL'), envVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'));

async function importPOData() {
    console.log('⏳ Membaca file Purchase Orders (Upload_PO.csv)...');
    const csvContent = fs.readFileSync(path.join(process.cwd(), 'Docs', 'Upload_PO.csv'), 'utf-8');
    
    // Delimiter file PO memakai Titik Koma (;)
    const { data } = Papa.parse(csvContent, { header: true, skipEmptyLines: true, delimiter: ';' });
    const records = data as any[];

    // 1. Ekstrak Map Relasi (Client SKU) menuju Produk Asli
    console.log('Memverifikasi Identitas Produk terhadap sku_klien pada Database Supabase...');
    const { data: listProduk, error } = await supabase.from('produk').select('id, sku_klien, sku_internal, harga_jual');
    
    if (error) {
       console.error("Gagal melakukan mapping produk!", error.message);
       return;
    }
    
    const prodMapByKlienSKU = new Map<string, any>();
    if (listProduk) {
        listProduk.forEach(p => {
          if (p.sku_klien) prodMapByKlienSKU.set(p.sku_klien, p)
        });
    }

    // 2. Kumpulkan pesanan terpisah berdasarkan Grup (Cart Bundling) "Nomor_PO"
    const orders = new Map<string, any[]>();
    for (const row of records) {
      const pNo = row['Nomor_PO']?.trim();
      if (!pNo) continue;
      
      if (!orders.has(pNo)) orders.set(pNo, []);
      orders.get(pNo)?.push(row);
    }

    console.log(`\nMenemukan ${orders.size} Nomor Resi Pesanan PO yang Dikelompokkan.`);
    const today = new Date().toISOString();
    
    let counter = 0;
    
    // 3. Eksekusi Header ke "purchase_order" disusul rinciannya ke "po_item"
    for (const [noPO, itemsRaw] of orders.entries()) {
       const orderId = `POID-${noPO}`;
       const klienId = itemsRaw[0]['ID_Klien']?.trim() || 'KLN-001';

       // Upsert Header
       await supabase.from('purchase_order').upsert({
           id: orderId,
           nomor_po: noPO,
           klien_id: klienId,
           tanggal_masuk: today,
           target_selesai: today,
           status: 'pending'
       });

       // Meracik Detail Produk yang dipesan dalam PO TSB
       const items = itemsRaw.map((ir, idx) => {
           // Membaca ID_PRODUK berdasarkan mapping SKU Klien dari file tsb !! (Sesuai Permintaan VLOOKUP Logika Anda)
           const pData = prodMapByKlienSKU.get(ir['SKU_Klien']?.trim());
           if (!pData) {
              console.warn(`[WARNING] Baris Skipped: Produk untuk sku klien "${ir['SKU_Klien']}" tidak match dengan data Master Database Utama!`);
              return null;
           }
           
           const total = parseInt(ir['Total_QTY']) || 0;
           const bundl = parseInt(ir['QTY_Per_Bundle']) || 6;

           return {
               id: `POI-${orderId}-${idx}`,
               po_id: orderId,
               produk_id: pData.id,
               kuantitas: total,
               qty_per_bundle: bundl,
               harga_satuan: pData.harga_jual || 0,
           }
       }).filter(Boolean); // Buang yang null / tidak ketemu warnig

       // Masukan rincian isi keranjangnya
       if (items.length > 0) {
           await supabase.from('po_item').upsert(items);
           counter++;
       }
    }
    console.log(`✅ [SELESAI] Data Purchase Order telah didistribusikan ke Database pada ${counter} dokumen resi.`);
}

importPOData().catch(console.error);
