import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase dari .env.local
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim() || '';
const supabaseKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim() || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function importKaryawan() {
    console.log('⏳ Membaca file DB_karyawan.csv...');
    const csvContent = fs.readFileSync(path.join(process.cwd(), 'Docs', 'DB_karyawan.csv'), 'utf-8');
    
    // Karena kolom "Tahap Produksi" ada banyak dengan nama header yang sama, kita parse sebagai ARRAY (bukan objek)
    const { data } = Papa.parse(csvContent, { 
        header: false, 
        skipEmptyLines: true, 
        delimiter: ';' // Perhatikan delimiter semicolon pada CSV DB_Karyawan
    });

    const records = data as string[][];
    // Buang baris pertama (Header)
    records.shift();

    // 1. Ekstrak unik Jabatan Master
    const jabatans = new Set<string>();
    records.forEach(row => {
        if (row[4]) jabatans.add(row[4].trim());
    });

    console.log(`Menyiapkan ${jabatans.size} Jabatan Master...`);
    for (const j of jabatans) {
        const id = `JAB-${j.replace(/\s+/g, '-').toUpperCase()}`;
        const { error } = await supabase.from('jabatan').upsert({ id, nama: j });
        if (error) console.error(`Error Insert Jabatan ${j}:`, error.message);
    }

    // 2. Ekstrak Karyawan dan mapping tahap produksi berurutan
    console.log('Menyiapkan Sinkronisasi Karyawan Database...');
    let kryCounter = 1;

    for (const row of records) {
        // [1] = Nama Karyawan, [2] = Gaji Pokok, [3] = Status, [4] = Jabatan
        if (!row[1] || !row[1].trim()) continue;
        
        const id = `KRY-${String(kryCounter).padStart(3, '0')}`;
        const nama = row[1].trim();
        const gajiPokok = Number(row[2]) || 0;
        const aktif = row[3]?.trim().toLowerCase() === 'aktif';
        // Ambil mapping jabatan ID
        const jabatan = `JAB-${row[4]?.trim().replace(/\s+/g, '-').toUpperCase()}`;
        
        // Mulai dari Index[5] ke belakang, itu adalah nama tahapan
        const tahapCols = row.slice(5).map(t => t.trim()).filter(t => t.length > 0);
        const tahapList = tahapCols.map(t => {
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

        const { error } = await supabase.from('karyawan').upsert({
            id,
            nama,
            jabatan,
            gaji_pokok: gajiPokok,
            aktif,
            tahap_list: tahapList
        });

        if (error) console.error(`Error Insert Karyawan ${nama}:`, error.message);
        kryCounter++;
    }
    console.log(`✅ [SELESAI] ${kryCounter - 1} Karyawan berhasil di-Upsert ke Supabase!`);
}

importKaryawan().catch(console.error);
