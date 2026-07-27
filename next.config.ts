import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Type errors and lint errors must fail the build. Suppressing them is how a
  // duplicate-import syntax error previously reached the repo unnoticed.
  typescript: {
    ignoreBuildErrors: false,
  },
  // @ts-expect-error: eslint config is valid at runtime but removed from NextConfig types in v16
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
