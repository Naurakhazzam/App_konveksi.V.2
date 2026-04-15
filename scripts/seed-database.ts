/**
 * STITCHLYX V2 — Database Seeder
 * Memindahkan data dari file TypeScript ke Supabase.
 *
 * Cara menjalankan:
 *   npm install --save-dev tsx dotenv
 *   npx tsx scripts/seed-database.ts
 *
 * Script ini aman dijalankan berkali-kali (menggunakan upsert, bukan insert).
 */

import { createClient } from '@supabase/supabase-js';
import {
  initialClients,
  initialKategori,
  initialModels,
  initialWarna,
  initialSizes,
  initialHPPKomponen,
  initialProduk,
  initialProdukHPPItems,
} from '../src/data/initial-production-data';
import { initialRealPOs, initialRealBundles } from '../src/data/real-po-data';

// ── Supabase Client ────────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan di .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Helper: Chunk Array ────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── Helper: Upsert dengan Batching ────────────────────────────────────────────

async function upsertBatch(
  tableName: string,
  rows: any[],
  conflictColumn: string = 'id',
  batchSize: number = 500
): Promise<void> {
  if (rows.length === 0) {
    console.log(`  ⏭️  ${tableName}: tidak ada data untuk di-seed.`);
    return;
  }

  const chunks = chunkArray(rows, batchSize);
  let totalInserted = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const { error } = await supabase
      .from(tableName)
      .upsert(chunk, { onConflict: conflictColumn, ignoreDuplicates: false });

    if (error) {
      console.error(`  ❌ ${tableName} batch ${i + 1}/${chunks.length} GAGAL:`, error.message);
      throw error;
    }

    totalInserted += chunk.length;
    console.log(`  ✅ ${tableName}: batch ${i + 1}/${chunks.length} (${totalInserted}/${rows.length} rows)`);
  }
}

// ── Seed Functions ─────────────────────────────────────────────────────────────

async function seedKategori() {
  console.log('\n📦 Seeding: kategori...');
  const rows = initialKategori.map((k) => ({
    id: k.id,
    nama: k.nama,
  }));
  await upsertBatch('kategori', rows);
}

async function seedKlien() {
  console.log('\n👥 Seeding: klien...');
  const rows = initialClients.map((k) => ({
    id: k.id,
    nama: k.nama,
    alamat: k.alamat ?? '-',
    kontak: k.kontak ?? '-',
  }));
  await upsertBatch('klien', rows);
}

async function seedModel() {
  console.log('\n👗 Seeding: model...');
  const rows = initialModels.map((m) => ({
    id: m.id,
    nama: m.nama,
    kategori_id: m.kategoriId,
    target_poin: m.targetPoin ?? 0,
  }));
  await upsertBatch('model', rows);
}

async function seedWarna() {
  console.log('\n🎨 Seeding: warna...');
  const rows = initialWarna.map((w) => ({
    id: w.id,
    nama: w.nama,
    kode_hex: (w as any).kodeHex ?? '#cccccc',
  }));
  await upsertBatch('warna', rows);
}

async function seedSize() {
  console.log('\n📏 Seeding: size...');
  const rows = initialSizes.map((s) => ({
    id: s.id,
    nama: s.nama,
  }));
  await upsertBatch('size', rows);
}

async function seedHPPKomponen() {
  console.log('\n🔧 Seeding: hpp_komponen...');
  const rows = initialHPPKomponen.map((h) => ({
    id: h.id,
    nama: h.nama,
    kategori: h.kategori,
    satuan: h.satuan,
  }));
  await upsertBatch('hpp_komponen', rows);
}

async function seedProduk() {
  console.log('\n🛍️ Seeding: produk...');
  const rows = initialProduk.map((p) => ({
    id: p.id,
    nama: p.nama,
    model_id: (p as any).modelId,
    size_id: (p as any).sizeId,
    warna_id: (p as any).warnaId,
    sku_internal: (p as any).skuInternal ?? '',
    sku_klien: (p as any).skuKlien ?? '',
    aktif: (p as any).aktif ?? true,
    harga_jual: (p as any).hargaJual ?? 0,
  }));
  await upsertBatch('produk', rows);
}

async function seedProdukHPPItems() {
  console.log('\n💰 Seeding: produk_hpp_item...');
  const rows = initialProdukHPPItems.map((item: any) => ({
    id: item.id,
    produk_id: item.produkId,
    komponen_id: item.komponenId,
    harga: item.harga ?? 0,
    qty: item.qty ?? 1,
  }));
  await upsertBatch('produk_hpp_item', rows, 'id', 500);
}

async function seedPurchaseOrders() {
  console.log('\n📋 Seeding: purchase_order + po_item...');

  // Pisahkan headers dan items
  const poHeaders = initialRealPOs.map((po: any) => ({
    id: po.id,
    klien_id: po.klienId,
    nomor_po: po.nomorPO ?? po.id,
    tanggal_input: po.tanggalInput ?? new Date().toISOString(),
    catatan: po.catatan ?? '',
  }));

  const poItems: any[] = [];
  for (const po of initialRealPOs as any[]) {
    if (!po.items || !Array.isArray(po.items)) continue;
    for (const item of po.items) {
      poItems.push({
        id: item.id,
        po_id: item.poId ?? po.id,
        model_id: item.modelId,
        warna_id: item.warnaId,
        size_id: item.sizeId,
        qty: item.qty ?? 0,
        qty_per_bundle: item.qtyPerBundle ?? 0,
        jumlah_bundle: item.jumlahBundle ?? 0,
        sku_klien: item.skuKlien ?? '',
        sku_internal: item.skuInternal ?? '',
        status_cutting: item.statusCutting ?? 'waiting',
      });
    }
  }

  await upsertBatch('purchase_order', poHeaders);
  await upsertBatch('po_item', poItems);
}

async function seedBundles() {
  console.log('\n📦 Seeding: bundle + bundle_status_tahap...');

  const ALL_TAHAP = ['cutting', 'jahit', 'lkancing', 'bbenang', 'qc', 'steam', 'packing'];

  // Map tahap name dari data file ke nama internal store
  // Data file pakai: cutting, jahit, lkancing, buang_benang, qc, steam, packing
  // Store pakai:     cutting, jahit, lkancing, bbenang,      qc, steam, packing
  const tahapMap: Record<string, string> = {
    cutting: 'cutting',
    jahit: 'jahit',
    lkancing: 'lkancing',
    buang_benang: 'bbenang',
    bbenang: 'bbenang',
    qc: 'qc',
    steam: 'steam',
    packing: 'packing',
  };

  // Insert bundles dulu (tanpa statusTahap & tanpa id — biar DB generate UUID)
  const bundleRows = (initialRealBundles as any[]).map((b) => ({
    barcode: b.barcode,
    po_id: b.po,
    model_id: b.model,
    warna_id: b.warna,
    size_id: b.size,
    qty_bundle: b.qtyBundle ?? 0,
    sku_klien: b.skuKlien ?? '',
    sku_internal: b.skuInternal ?? '',
  }));

  // Gunakan insert dengan ignoreDuplicates agar aman dijalankan berulang
  const bundleChunks = chunkArray(bundleRows, 500);
  let totalBundles = 0;
  for (let i = 0; i < bundleChunks.length; i++) {
    const { error } = await supabase
      .from('bundle')
      .upsert(bundleChunks[i], { onConflict: 'barcode', ignoreDuplicates: true });
    if (error) {
      console.error(`  ❌ bundle batch ${i + 1} GAGAL:`, error.message);
      throw error;
    }
    totalBundles += bundleChunks[i].length;
    console.log(`  ✅ bundle: batch ${i + 1}/${bundleChunks.length} (${totalBundles}/${bundleRows.length} rows)`);
  }

  // Ambil mapping barcode → id dari DB
  console.log('  🔍 Mengambil mapping barcode → id dari DB...');
  const { data: bundleDbRows, error } = await supabase
    .from('bundle')
    .select('id, barcode')
    .in('barcode', bundleRows.map((b) => b.barcode));

  if (error) {
    console.error('  ❌ Gagal mengambil bundle IDs:', error.message);
    throw error;
  }

  const barcodeToId: Record<string, string> = {};
  (bundleDbRows ?? []).forEach((row: any) => {
    barcodeToId[row.barcode] = row.id;
  });

  // Buat bundle_status_tahap rows
  const statusRows: any[] = [];
  for (const bundle of initialRealBundles as any[]) {
    const bundleId = barcodeToId[bundle.barcode];
    if (!bundleId) continue;

    const statusTahap = bundle.statusTahap ?? {};
    const tahapKeys = Object.keys(statusTahap);

    for (const rawTahap of tahapKeys) {
      const tahap = tahapMap[rawTahap] ?? rawTahap;
      if (!ALL_TAHAP.includes(tahap)) continue;

      const st = statusTahap[rawTahap];
      statusRows.push({
        bundle_id: bundleId,
        tahap: tahap,
        status: st?.status ?? null,
        qty_terima: st?.qtyTerima ?? null,
        qty_selesai: st?.qtySelesai ?? null,
        waktu_terima: st?.waktuTerima ?? null,
        waktu_selesai: st?.waktuSelesai ?? null,
        karyawan_id: st?.karyawan ?? null,
        koreksi_status: st?.koreksiStatus ?? null,
        koreksi_alasan: st?.koreksiAlasan ?? null,
        upah_dibayar: st?.upahDibayar ?? false,
      });
    }
  }

  // Upsert bundle_status_tahap dengan conflict pada (bundle_id, tahap)
  if (statusRows.length > 0) {
    const chunks = chunkArray(statusRows, 500);
    let total = 0;
    for (let i = 0; i < chunks.length; i++) {
      const { error: stErr } = await supabase
        .from('bundle_status_tahap')
        .upsert(chunks[i], { onConflict: 'bundle_id,tahap', ignoreDuplicates: false });

      if (stErr) {
        console.error(`  ❌ bundle_status_tahap batch ${i + 1} GAGAL:`, stErr.message);
        throw stErr;
      }
      total += chunks[i].length;
      console.log(`  ✅ bundle_status_tahap: batch ${i + 1}/${chunks.length} (${total}/${statusRows.length} rows)`);
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 STITCHLYX V2 — Database Seeder dimulai...');
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  console.log('');

  try {
    // Urutan penting! Ikuti dependency foreign key
    await seedKategori();
    await seedKlien();
    await seedModel();         // depends on: kategori
    await seedWarna();
    await seedSize();
    await seedHPPKomponen();
    await seedProduk();        // depends on: model, warna, size
    await seedProdukHPPItems(); // depends on: produk, hpp_komponen
    await seedPurchaseOrders(); // depends on: klien, model, warna, size
    await seedBundles();        // depends on: purchase_order, model, warna, size

    console.log('\n');
    console.log('════════════════════════════════════════');
    console.log('✅ SELESAI! Semua data berhasil di-seed ke Supabase.');
    console.log('════════════════════════════════════════');
    console.log('');
    console.log('Langkah selanjutnya:');
    console.log('  1. Refresh aplikasi di browser');
    console.log('  2. Cek halaman Produksi → data PO & Bundle harus muncul');
    console.log('  3. Cek halaman Master Data → model, warna, size harus muncul');
    console.log('  4. File src/data/ sekarang bisa dihapus atau diabaikan');
    console.log('');
  } catch (err) {
    console.error('\n❌ SEEDER GAGAL:', err);
    process.exit(1);
  }
}

main();
