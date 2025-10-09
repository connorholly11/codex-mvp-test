import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@purpose/api-client';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { createSupabaseClientForToken } from '@/lib/supabase/token-client';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';

export type AuthenticatedSupabase = {
  client: SupabaseDatabaseClient;
  user: User;
  accessToken?: string;
};

export async function getAuthenticatedSupabase(
  request: NextRequest,
): Promise<AuthenticatedSupabase | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    return {
      client: supabase,
      user: session.user,
      accessToken: session.access_token ?? undefined,
    };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not configured');
    }

    const verifier = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await verifier.auth.getUser(token);
    if (error || !data?.user) {
      return null;
    }

    const client = createSupabaseClientForToken(token);
    return { client, user: data.user, accessToken: token };
  }

  return null;
}
