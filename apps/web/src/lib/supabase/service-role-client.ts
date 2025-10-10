import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@purpose/api-client';
import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from '@/lib/supabase/env';

export function createServiceRoleSupabaseClient(): SupabaseClient<Database> {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
