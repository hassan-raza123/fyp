import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-expect-error: eslint config is valid at runtime but removed from NextConfig types in v16
  eslint: {
    ignoreDuringBuilds: true,
  },
  // output: 'standalone',
  // images: {
  //   unoptimized: true,
  // },
};

export default nextConfig;
