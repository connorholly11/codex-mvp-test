import type { NextConfig } from 'next';
import { loadEnvConfig } from '@next/env';
import path from 'node:path';

// Ensure root-level .env files are loaded when running from the monorepo root.
loadEnvConfig(process.cwd(), true);
loadEnvConfig(path.resolve(__dirname, '..', '..'), true);

const requiredClientEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const clientEnvEntries = requiredClientEnv.map((key) => {
  const value = process.env[key];
  if (typeof value !== 'string' || value.length === 0) {
    console.warn(
      `⚠️ Missing required environment variable "${key}". Supabase client may fail at runtime.`,
    );
  }
  return [key, value ?? ''];
});

const nextConfig: NextConfig = {
  transpilePackages: ['@purpose/api-client', '@purpose/ui', '@purpose/analytics'],
  env: Object.fromEntries(clientEnvEntries),
};

export default nextConfig;
