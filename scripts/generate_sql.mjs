import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const cwd = process.cwd();

/** Escape string helper for SQL */
function e(str) {
    if (!str) return 'NULL';
    // escape single quotes
    return `'${String(str).replace(/'/g, "''")}'`;
}

function runKaryawan() {
    const csv = fs.readFileSync(path.join(cwd, 'Docs', 'DB_karyawan.csv'), 'utf-8');
    const { data } = Papa.parse(csv, { header: false, skipEmptyLines: true, delimiter: ';' });
    data.shift(); // skip header

    const jabatans = new Set();
    data.forEach(r => { if (r[4]) jabatans.add(r[4].trim()); });

    let sql = `-- ==========================================\n`;
    sql += `-- 1. INSERT DATA KARYAWAN & JABATAN\n`;
    sql += `-- ==========================================\n\n`;

    jabatans.forEach(j => {
        const id = `JAB-${j.replace(/\s+/g, '-').toUpperCase()}`;
        sql += `INSERT INTO public.jabatan (id, nama) VALUES (${e(id)}, ${e(j)}) ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama;\n`;
    });
    sql += `\n`;

    let kId = 1;
    data.forEach(r => {
        if (!r[1] || !r[1].trim()) return;
        const id = `KRY-${String(kId).padStart(3, '0')}`;
        const nama = r[1].trim();
        const gaji = Number(r[2]) || 0;
        const aktif = r[3]?.trim().toLowerCase() === 'aktif';
        const jabatan = `JAB-${r[4]?.trim().replace(/\s+/g, '-').toUpperCase()}`;
        
        let tahapList = r.slice(5).map(t => t.trim()).filter(Boolean).map(t => {
            const raw = t.toLowerCase();
            if (raw === 'lubang kancing') return 'Lubang Kancing';
            if (raw === 'buang benang') return 'Buang Benang';
            if (raw === 'qc') return 'QC';
            if (raw === 'steam') return 'Steam';
            if (raw === 'packing') return 'Packing';
            if (raw === 'cutting') return 'Cutting';
            if (raw === 'jahit') return 'Jahit';
            return t.charAt(0).toUpperCase() + t.slice(1);
        });
        
        const tahapSql = `ARRAY[${tahapList.map(t => e(t)).join(', ')}]::TEXT[]`;
        
        sql += `INSERT INTO public.karyawan (id, nama, jabatan, gaji_pokok, aktif, tahap_list) VALUES (${e(id)}, ${e(nama)}, ${e(jabatan)}, ${gaji}, ${aktif}, ${tahapSql}) ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, jabatan = EXCLUDED.jabatan, gaji_pokok = EXCLUDED.gaji_pokok, aktif = EXCLUDED.aktif, tahap_list = EXCLUDED.tahap_list;\n`;
        kId++;
    });

    fs.writeFileSync(path.join(cwd, 'Docs', '1_MIGRASI_KARYAWAN.sql'), sql);
}

function runMaster() {
    const csv = fs.readFileSync(path.join(cwd, 'Docs', 'Data_base_utama.csv'), 'utf-8');
    const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
    
    let sql = `-- ==========================================================\n`;
    sql += `-- 2. INSERT KLIEN, KATEGORI, MODEL, WARNA, SIZE, HPP KOMPONEN\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `INSERT INTO public.klien (id, nama) VALUES ('KLN-001', 'Elyasr Kids') ON CONFLICT (id) DO NOTHING;\n\n`;

    const kategoriSet = new Set();
    const modelMap = new Map();
    const warnaSet = new Set();
    const sizeSet = new Set();

    data.forEach(r => {
        if(r['Kategori']) kategoriSet.add(r['Kategori'].trim());
        if(r['WARNA']) warnaSet.add(r['WARNA'].trim());
        if(r['SIZE']) sizeSet.add(r['SIZE'].trim());
        if(r['MODEL'] && r['Kategori']) modelMap.set(r['MODEL'].trim(), r['Kategori'].trim());
    });

    const katMap = new Map();
    kategoriSet.forEach(k => {
        const id = `KAT-${Buffer.from(k).toString('hex').slice(0, 10).toUpperCase()}`;
        sql += `INSERT INTO public.kategori (id, nama) VALUES (${e(id)}, ${e(k)}) ON CONFLICT (id) DO NOTHING;\n`;
        katMap.set(k, id);
    });
    sql += `\n`;

    const modMap = new Map();
    modelMap.forEach((k, m) => {
        const id = `MDL-${Buffer.from(m).toString('hex').slice(0, 10).toUpperCase()}`;
        const kid = katMap.get(k);
        sql += `INSERT INTO public.model (id, nama, target_poin, kategori_id) VALUES (${e(id)}, ${e(m)}, 0, ${e(kid)}) ON CONFLICT (id) DO NOTHING;\n`;
        modMap.set(m, id);
    });
    sql += `\n`;

    const wMap = new Map();
    let wCounter = 1;
    warnaSet.forEach(w => {
        const id = `WRN-${String(wCounter).padStart(3, '0')}`;
        sql += `INSERT INTO public.warna (id, nama, kode_hex) VALUES (${e(id)}, ${e(w)}, '#888888') ON CONFLICT (id) DO NOTHING;\n`;
        wMap.set(w, id);
        wCounter++;
    });
    sql += `\n`;

    const szMap = new Map();
    sizeSet.forEach(s => {
        const id = `SZ-${s.replace(/\\s+/g, '-').toUpperCase()}`;
        sql += `INSERT INTO public.size (id, nama) VALUES (${e(id)}, ${e(s)}) ON CONFLICT (id) DO NOTHING;\n`;
        szMap.set(s, id);
    });
    sql += `\n`;

    const ignoredCols = ['Client', 'SKU', 'Nama Produk', 'MODEL', 'WARNA', 'SIZE', 'Kategori', 'Harga Jual'];
    const hppKompens = Object.keys(data[0]).filter(k => k && !ignoredCols.includes(k));
    
    const kompMap = new Map();
    hppKompens.forEach(c => {
        const id = `KOMP-${Buffer.from(c).toString('hex').slice(0, 12).toUpperCase()}`;
        const kat = c.toLowerCase().includes('upah') ? 'Upah' : 
                   (c.toLowerCase().includes('oprasional') || c.toLowerCase().includes('makan') ? 'Operasional' : 'Bahan Baku');
        sql += `INSERT INTO public.hpp_komponen (id, nama, kategori, satuan) VALUES (${e(id)}, ${e(c)}, ${e(kat)}, 'pcs') ON CONFLICT (id) DO NOTHING;\n`;
        kompMap.set(c, id);
    });
    sql += `\n`;

    sql += `-- ==========================================================\n`;
    sql += `-- 3. INSERT PRODUK & DETAIL HPP ITEMNYA\n`;
    sql += `-- ==========================================================\n\n`;

    let pCounter = 1;
    let hppDetailsSqls = [];

    data.forEach(r => {
        if (!r['Nama Produk']) return;
        const skuInternal = `LYX-${String(pCounter).padStart(5, '0')}`;
        const prodId = `PRD-DB-${skuInternal}`;
        pCounter++;

        const hj = Number(String(r['Harga Jual'] || '0').replace(/,/g, ''));
        const hjual = isNaN(hj) ? 0 : hj;

        sql += `INSERT INTO public.produk (id, sku_klien, sku_internal, nama, model_id, warna_id, size_id, harga_jual, aktif) ` +
               `VALUES (${e(prodId)}, ${e(r['SKU']?.trim())}, ${e(skuInternal)}, ${e(r['Nama Produk'].trim())}, ${e(modMap.get(r['MODEL']?.trim()))}, ${e(wMap.get(r['WARNA']?.trim()))}, ${e(szMap.get(r['SIZE']?.trim()))}, ${hjual}, true) ON CONFLICT (id) DO NOTHING;\n`;
        
        hppKompens.forEach(k => {
            const valRaw = r[k] ? String(r[k]).replace(/,/g, '').trim() : '0';
            const valNum = Number(valRaw);
            if (!isNaN(valNum) && valNum > 0) {
                const phiId = `PHI-${skuInternal}-${kompMap.get(k)}`;
                hppDetailsSqls.push(`INSERT INTO public.produk_hpp_item (id, produk_id, komponen_id, harga, nilai, qty) VALUES (${e(phiId)}, ${e(prodId)}, ${e(kompMap.get(k))}, ${valNum}, ${valNum}, 1) ON CONFLICT (id) DO NOTHING;`);
            }
        });
    });

    sql += `\n-- DETAIL ITEM HPP PRODUK --\n\n`;
    sql += hppDetailsSqls.join('\n') + '\n';

    fs.writeFileSync(path.join(cwd, 'Docs', '2_MIGRASI_MASTER_PRODUK.sql'), sql);
    
    // Simpan Map SKU ke file JSON sementara untuk PO importer
    const skuMap = {};
    data.forEach(r => {
        if (r['SKU']?.trim() && r['Nama Produk']) {
           skuMap[r['SKU'].trim()] = {
               id: `PRD-DB-LYX-${String(pCounter-1).padStart(5, '0')}`, // Wait, bug here!!
               harga_jual: Number(String(r['Harga Jual'] || '0').replace(/,/g, ''))
           };
        }
    });
}

function runMasterWithCorrectMap() {
    const csv = fs.readFileSync(path.join(cwd, 'Docs', 'Data_base_utama.csv'), 'utf-8');
    const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
    
    let sql = `-- ==========================================================\n`;
    sql += `-- 2. INSERT KLIEN, KATEGORI, MODEL, WARNA, SIZE, HPP KOMPONEN\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `INSERT INTO public.klien (id, nama) VALUES ('KLN-001', 'Elyasr Kids') ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama;\n\n`;

    const kategoriSet = new Set();
    const modelMap = new Map();
    const warnaSet = new Set();
    const sizeSet = new Set();

    data.forEach(r => {
        let kat = r['Kategori'] ? r['Kategori'].trim() : '';
        if (!kat && r['MODEL']?.trim().toLowerCase() === 'arden') kat = 'Polo Wangky';
        if (!kat) kat = 'Tanpa Kategori';
        
        kategoriSet.add(kat);
        if(r['WARNA']) warnaSet.add(r['WARNA'].trim());
        if(r['SIZE']) sizeSet.add(r['SIZE'].trim());
        if(r['MODEL']) modelMap.set(r['MODEL'].trim(), kat);
    });

    const katMap = new Map();
    kategoriSet.forEach(k => {
        const id = `KAT-${Buffer.from(k).toString('hex').slice(0, 10).toUpperCase()}`;
        sql += `INSERT INTO public.kategori (id, nama) VALUES (${e(id)}, ${e(k)}) ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama;\n`;
        katMap.set(k, id);
    });
    sql += `\n`;

    const modMap = new Map();
    modelMap.forEach((k, m) => {
        const id = `MDL-${Buffer.from(m).toString('hex').slice(0, 10).toUpperCase()}`;
        const kid = katMap.get(k);
        sql += `INSERT INTO public.model (id, nama, target_poin, kategori_id) VALUES (${e(id)}, ${e(m)}, 0, ${e(kid)}) ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, kategori_id = EXCLUDED.kategori_id, target_poin = EXCLUDED.target_poin;\n`;
        modMap.set(m, id);
    });
    sql += `\n`;

    const wMap = new Map();
    let wCounter = 1;
    warnaSet.forEach(w => {
        const id = `WRN-${String(wCounter).padStart(3, '0')}`;
        sql += `INSERT INTO public.warna (id, nama, kode_hex) VALUES (${e(id)}, ${e(w)}, '#888888') ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, kode_hex = EXCLUDED.kode_hex;\n`;
        wMap.set(w, id);
        wCounter++;
    });
    sql += `\n`;

    const szMap = new Map();
    sizeSet.forEach(s => {
        const id = `SZ-${s.replace(/\\s+/g, '-').toUpperCase()}`;
        sql += `INSERT INTO public.size (id, nama) VALUES (${e(id)}, ${e(s)}) ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama;\n`;
        szMap.set(s, id);
    });
    sql += `\n`;

    // ---------------------------------------------------------------
    // PETA KOMPONEN HPP: ID STABIL (TIDAK BERUBAH WALAU CSV BERBEDA)
    // Kategori: bahan_baku | biaya_produksi | overhead
    // ---------------------------------------------------------------
    const KOMPONEN_MASTER = {
        'HPP Bahan':             { id: 'KOMP-001', kat: 'bahan_baku' },
        'Variasi':               { id: 'KOMP-002', kat: 'bahan_baku' },
        'Karet':                 { id: 'KOMP-003', kat: 'bahan_baku' },
        'Tali':                  { id: 'KOMP-004', kat: 'bahan_baku' },
        'Stoper':                { id: 'KOMP-005', kat: 'bahan_baku' },
        'Mata itik':             { id: 'KOMP-006', kat: 'bahan_baku' },
        'Sleting Topi':          { id: 'KOMP-007', kat: 'bahan_baku' },
        'Sleting Saku':          { id: 'KOMP-008', kat: 'bahan_baku' },
        'Sleting Badan':         { id: 'KOMP-009', kat: 'bahan_baku' },
        'Kain Keras':            { id: 'KOMP-010', kat: 'bahan_baku' },
        'Kain saku':             { id: 'KOMP-011', kat: 'bahan_baku' },
        'Kancing':               { id: 'KOMP-012', kat: 'bahan_baku' },
        'Puring':                { id: 'KOMP-013', kat: 'bahan_baku' },
        'Benang':                { id: 'KOMP-014', kat: 'bahan_baku' },
        'Upah Cutting':          { id: 'KOMP-015', kat: 'biaya_produksi' },
        'Upah Jahit':            { id: 'KOMP-016', kat: 'biaya_produksi' },
        'Upah Lubang-Kancing':   { id: 'KOMP-017', kat: 'biaya_produksi' },
        'Upah Buang Benang':     { id: 'KOMP-018', kat: 'biaya_produksi' },
        'Upah QC':               { id: 'KOMP-019', kat: 'biaya_produksi' },
        'Upah Steam':            { id: 'KOMP-020', kat: 'biaya_produksi' },
        'Upah Packing':          { id: 'KOMP-021', kat: 'biaya_produksi' },
        'oprasional Rumah':      { id: 'KOMP-022', kat: 'overhead' },
        'Oprasional Listrik':    { id: 'KOMP-023', kat: 'overhead' },
        'Oprasional Sehari-hari':{ id: 'KOMP-024', kat: 'overhead' },
        'Uang makan':            { id: 'KOMP-025', kat: 'overhead' },
    };

    const ignoredCols = ['Client', 'SKU', 'Nama Produk', 'MODEL', 'WARNA', 'SIZE', 'Kategori', 'Harga Jual'];
    const hppKompens = Object.keys(data[0]).filter(k => k && !ignoredCols.includes(k));
    
    const kompMap = new Map();
    hppKompens.forEach(c => {
        const entry = KOMPONEN_MASTER[c];
        if (!entry) {
            console.warn(`⚠️  KOLOM TIDAK DIKENAL: "${c}" — silakan tambahkan ke KOMPONEN_MASTER`);
            return;
        }
        const { id, kat } = entry;
        sql += `INSERT INTO public.hpp_komponen (id, nama, kategori, satuan) VALUES (${e(id)}, ${e(c)}, ${e(kat)}, 'pcs') ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, kategori = EXCLUDED.kategori, satuan = EXCLUDED.satuan;\n`;
        kompMap.set(c, id);
    });
    sql += `\n`;


    fs.writeFileSync(path.join(cwd, 'Docs', '2A_MIGRASI_MASTER_DASAR.sql'), sql);
    
    let pCounter = 1;
    const skuMap = {};
    const CHUNK_SIZE = 150;
    let filePart = 1;

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        let chunkSql = `-- ==========================================================\n`;
        chunkSql += `-- 3. INSERT PRODUK & DETAIL HPP ITEMNYA (PART ${filePart})\n`;
        chunkSql += `-- ==========================================================\n\n`;

        let hppDetailsSqls = [];
        const chunk = data.slice(i, i + CHUNK_SIZE);

        chunk.forEach(r => {
            if (!r['Nama Produk']) return;
            const skuInternal = `LYX-${String(pCounter).padStart(5, '0')}`;
            const prodId = `PRD-DB-${skuInternal}`;
            pCounter++;

            const hj = Number(String(r['Harga Jual'] || '0').replace(/,/g, ''));
            const hjual = isNaN(hj) ? 0 : hj;

            if (r['SKU']?.trim()) {
                skuMap[r['SKU'].trim()] = { 
                    id: prodId, 
                    harga_jual: hjual,
                    modelId: modMap.get(r['MODEL']?.trim()),
                    warnaId: wMap.get(r['WARNA']?.trim()),
                    sizeId: szMap.get(r['SIZE']?.trim()),
                    skuInternal: skuInternal
                };
            }

            chunkSql += `INSERT INTO public.produk (id, sku_klien, sku_internal, nama, model_id, warna_id, size_id, harga_jual, aktif) ` +
                   `VALUES (${e(prodId)}, ${e(r['SKU']?.trim())}, ${e(skuInternal)}, ${e(r['Nama Produk'].trim())}, ${e(modMap.get(r['MODEL']?.trim()))}, ${e(wMap.get(r['WARNA']?.trim()))}, ${e(szMap.get(r['SIZE']?.trim()))}, ${hjual}, true) ON CONFLICT (id) DO UPDATE SET sku_klien = EXCLUDED.sku_klien, sku_internal = EXCLUDED.sku_internal, nama = EXCLUDED.nama, model_id = EXCLUDED.model_id, warna_id = EXCLUDED.warna_id, size_id = EXCLUDED.size_id, harga_jual = EXCLUDED.harga_jual, aktif = EXCLUDED.aktif;\n`;
            
            hppKompens.forEach(k => {
                const valRaw = r[k] ? String(r[k]).replace(/,/g, '').trim() : '0';
                const valNum = Number(valRaw);
                if (!isNaN(valNum) && valNum > 0) {
                    const phiId = `PHI-${skuInternal}-${kompMap.get(k)}`;
                    hppDetailsSqls.push(`INSERT INTO public.produk_hpp_item (id, produk_id, komponen_id, harga, qty) VALUES (${e(phiId)}, ${e(prodId)}, ${e(kompMap.get(k))}, ${valNum}, 1) ON CONFLICT (id) DO UPDATE SET harga = EXCLUDED.harga, qty = EXCLUDED.qty;`);
                }
            });
        });

        chunkSql += `\n-- DETAIL ITEM HPP PRODUK --\n\n`;
        chunkSql += hppDetailsSqls.join('\n') + '\n';
        
        fs.writeFileSync(path.join(cwd, 'Docs', `2B_MIGRASI_PRODUK_PART_${filePart}.sql`), chunkSql);
        filePart++;
    }

    fs.writeFileSync(path.join(cwd, 'Docs', '.temp_sku.json'), JSON.stringify(skuMap));
}

function runPO() {
    const csv = fs.readFileSync(path.join(cwd, 'Docs', 'Upload_PO.csv'), 'utf-8');
    const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true, delimiter: ';' });
    
    let skuMap = {};
    if (fs.existsSync(path.join(cwd, 'Docs', '.temp_sku.json'))) {
        skuMap = JSON.parse(fs.readFileSync(path.join(cwd, 'Docs', '.temp_sku.json'), 'utf-8'));
    }

    const orders = new Map();
    data.forEach(r => {
        const pNo = r['Nomor_PO']?.trim();
        if (!pNo) return;
        if (!orders.has(pNo)) orders.set(pNo, []);
        orders.get(pNo).push(r);
    });

    let sql = `-- ==========================================================\n`;
    sql += `-- 4. INSERT PURCHASE ORDER\n`;
    sql += `-- ==========================================================\n\n`;

    const today = new Date().toISOString();

    for (const [noPO, itemsRaw] of orders.entries()) {
        const orderId = `POID-${noPO}`;
        const klienId = itemsRaw[0]['ID_Klien']?.trim() || 'KLN-001';

        sql += `INSERT INTO public.purchase_order (id, nomor_po, klien_id, tanggal_input, tanggal_deadline, status) VALUES (${e(orderId)}, ${e(noPO)}, ${e(klienId)}, ${e(today)}, ${e(today)}, 'aktif') ON CONFLICT (id) DO UPDATE SET nomor_po = EXCLUDED.nomor_po, klien_id = EXCLUDED.klien_id, tanggal_input = EXCLUDED.tanggal_input, tanggal_deadline = EXCLUDED.tanggal_deadline, status = EXCLUDED.status;\n`;

        itemsRaw.forEach((ir, idx) => {
            const sku = ir['SKU_Klien']?.trim();
            const pData = skuMap[sku];
            if (!pData) return; 

            const total = parseInt(ir['Total_QTY']) || 0;
            const bundl = parseInt(ir['QTY_Per_Bundle']) || 6;
            const jmlBdl = Math.ceil(total / bundl);
            const itemId = `POI-${orderId}-${idx}`;

            sql += `INSERT INTO public.po_item (id, po_id, model_id, warna_id, size_id, qty, qty_per_bundle, jumlah_bundle, sku_klien, sku_internal, status_cutting) VALUES (${e(itemId)}, ${e(orderId)}, ${e(pData.modelId)}, ${e(pData.warnaId)}, ${e(pData.sizeId)}, ${total}, ${bundl}, ${jmlBdl}, ${e(sku)}, ${e(pData.skuInternal)}, 'waiting') ON CONFLICT (id) DO UPDATE SET qty = EXCLUDED.qty, qty_per_bundle = EXCLUDED.qty_per_bundle, jumlah_bundle = EXCLUDED.jumlah_bundle;\n`;
        });
        sql += `\n`;
    }

    fs.writeFileSync(path.join(cwd, 'Docs', '3_MIGRASI_PO.sql'), sql);
}

runKaryawan();
runMasterWithCorrectMap();
runPO();

console.log('Semua file SQL telah digenerate di folder Docs!');
