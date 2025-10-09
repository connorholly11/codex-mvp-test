import { defineConfig } from 'vitest/config';
import path from 'node:path';
import url from 'node:url';

const rootDir = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    alias: {
      '@': path.join(rootDir, 'apps/web/src'),
      '@purpose/api-client': path.join(rootDir, 'packages/api-client/src'),
    },
  },
});
