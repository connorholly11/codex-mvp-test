'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@purpose/api-client';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';

export function createBrowserSupabaseClient(): SupabaseDatabaseClient {
  return createClientComponentClient<Database>() as unknown as SupabaseDatabaseClient;
}
