import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@purpose/api-client';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';

export function createServerSupabaseClient(): SupabaseDatabaseClient {
  return createRouteHandlerClient<Database>({ cookies }) as unknown as SupabaseDatabaseClient;
}
