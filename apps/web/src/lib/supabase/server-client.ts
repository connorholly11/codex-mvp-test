import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@purpose/api-client';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';

export type CookieStore = Awaited<ReturnType<typeof cookies>>;

export async function createServerSupabaseClient(
  overrides?: { cookieStore?: CookieStore },
): Promise<SupabaseDatabaseClient> {
  const cookieStore = overrides?.cookieStore ?? (await cookies());
  const { url, anonKey } = getSupabasePublicEnv();

  return createRouteHandlerClient<Database>(
    { cookies: async () => cookieStore },
    { supabaseUrl: url, supabaseKey: anonKey },
  ) as unknown as SupabaseDatabaseClient;
}
