import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  transpilePackages: ['@freshy/db', '@freshy/ui'],
};

export default nextConfig;
