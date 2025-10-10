import { describe, expect, it, afterEach, vi } from 'vitest';

const MODULE_PATH = '../apps/web/src/lib/supabase/env';

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  vi.resetModules();
});

describe('supabase env helpers', () => {
  it('throws when public env vars are missing', async () => {
    const mod = await import(MODULE_PATH);
    expect(() => mod.getSupabasePublicEnv()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('returns configured public env vars', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const mod = await import(MODULE_PATH);
    expect(mod.getSupabasePublicEnv()).toEqual({
      url: 'https://example-project.supabase.co',
      anonKey: 'anon-key',
    });
  });

  it('throws when service role key is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const mod = await import(MODULE_PATH);
    expect(() => mod.getSupabaseServiceRoleKey()).toThrowError(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('returns the service role key when configured', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    const mod = await import(MODULE_PATH);
    expect(mod.getSupabaseServiceRoleKey()).toBe('service-role');
  });
});
