import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@purpose/api-client';

export type SupabaseDatabaseClient = SupabaseClient<Database, 'public'>;
