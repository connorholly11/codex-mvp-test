import { createClient } from '@supabase/supabase-js';
import type { Database } from '@purpose/api-client';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';

export function createSupabaseClientForToken(token: string): SupabaseDatabaseClient {
  const { url, anonKey } = getSupabasePublicEnv();

  return createClient<Database>(url, anonKey, {
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
