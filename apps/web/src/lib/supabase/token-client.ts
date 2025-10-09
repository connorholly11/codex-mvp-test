import { createClient } from '@supabase/supabase-js';
import type { Database } from '@purpose/api-client';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';

export function createSupabaseClientForToken(token: string): SupabaseDatabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }) as SupabaseDatabaseClient;
}
