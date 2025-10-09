import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@purpose/api-client', '@purpose/ui', '@purpose/analytics'],
};

export default nextConfig;
