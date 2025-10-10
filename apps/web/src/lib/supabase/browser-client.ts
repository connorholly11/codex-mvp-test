'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@purpose/api-client';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';

export function createBrowserSupabaseClient(): SupabaseDatabaseClient {
  const { url, anonKey } = getSupabasePublicEnv();
  return createClientComponentClient<Database>({
    supabaseUrl: url,
    supabaseKey: anonKey,
  }) as unknown as SupabaseDatabaseClient;
}
