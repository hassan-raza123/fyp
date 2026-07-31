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

  /**
   * Security headers.
   *
   * Without these the dashboards could be framed and overlaid, which turns a
   * one-click destructive action (delete user, unlock results) into a
   * clickjacking target.
   *
   * The CSP allows `'unsafe-inline'` for styles because Tailwind and the Radix
   * primitives set inline styles, and `'unsafe-eval'` is deliberately absent.
   * `'unsafe-inline'` on scripts is required by Next's inlined bootstrap; a
   * nonce-based policy is the stricter follow-up once every inline script is
   * accounted for.
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
