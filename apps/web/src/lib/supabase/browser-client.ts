'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@purpose/api-client';

export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  return createClientComponentClient<Database>();
}
