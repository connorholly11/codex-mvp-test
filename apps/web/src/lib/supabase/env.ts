export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

let cachedPublicEnv: SupabasePublicEnv | null = null;
let cachedServiceRoleKey: string | null = null;

function ensureValue(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Environment variable "${name}" is required. Add it to your .env/.env.local before running the app.`,
    );
  }
  return value;
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  if (!cachedPublicEnv) {
    // Direct reference to env vars so Next.js can inline them at build time
    const url = ensureValue(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
    const anonKey = ensureValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
    cachedPublicEnv = { url, anonKey };
  }
  return cachedPublicEnv;
}

export function getSupabaseServiceRoleKey(): string {
  if (!cachedServiceRoleKey) {
    // Direct reference so Next.js can inline it (server-side only)
    cachedServiceRoleKey = ensureValue(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  }
  return cachedServiceRoleKey;
}

export function clearSupabaseEnvCache(): void {
  cachedPublicEnv = null;
  cachedServiceRoleKey = null;
}
