import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] Peringatan: Environment variables tidak ditemukan. Client akan menggunakan placeholder sementara untuk kebutuhan Build.'
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
