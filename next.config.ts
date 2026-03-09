import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@resvg/resvg-js', 'satori'],
};

export default nextConfig;
