
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: any = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('--- KATEGORI ---');
  const { data: kat } = await supabase.from('kategori').select('id, nama').limit(5);
  console.table(kat);

  console.log('--- MODEL ---');
  const { data: mod } = await supabase.from('model').select('id, nama').limit(5);
  console.table(mod);

  console.log('--- WARNA ---');
  const { data: war } = await supabase.from('warna').select('id, nama').limit(5);
  console.table(war);

  console.log('--- SIZE ---');
  const { data: siz } = await supabase.from('size').select('id, nama').limit(5);
  console.table(siz);
}

checkData();
