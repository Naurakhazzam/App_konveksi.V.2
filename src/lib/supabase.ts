import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Environment variables tidak ditemukan. Pastikan .env.local sudah benar.'
  );
}

/**
 * Supabase Client — singleton untuk seluruh aplikasi.
 * Gunakan ini untuk semua operasi database di client-side.
 *
 * Contoh penggunaan:
 *   import { supabase } from '@/lib/supabase';
 *   const { data, error } = await supabase.from('tabel').select('*');
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
