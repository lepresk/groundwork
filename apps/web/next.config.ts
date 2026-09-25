/**
 * Next.js config: standalone output for small Docker images, typed routes,
 * source transpilation of `@groundwork/ui`, and security headers on every route.
 */
import { resolve } from 'node:path';
import type { NextConfig } from 'next';

/** Conservative security headers applied to every route. */
const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const config: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: resolve(import.meta.dirname, '../..'),
  transpilePackages: ['@groundwork/ui'],
  typedRoutes: true,
  poweredByHeader: false,
  headers: () => Promise.resolve([{ source: '/:path*', headers: SECURITY_HEADERS }]),
};

export default config;
