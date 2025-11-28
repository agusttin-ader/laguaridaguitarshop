import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {
    // Pin root to this workspace to avoid multi-lockfile confusion
    root,
  },
  images: {
    // Allow images served from Supabase storage and other remote hosts used by uploaded product images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nlxihuohlbzxfsumnfxk.supabase.co',
        pathname: '/**',
      },
    ],
    // Configure image quality values used by next/image `quality` prop.
    // We use 75 as the baseline and 80 for some thumbnails where we explicitly set quality=80.
    qualities: [75, 80],
    // Disable Next image optimization in development to avoid proxying remote
    // image requests through the dev server (which can cause 504 Gateway Timeout
    // when the remote host is slow). Keep optimizer enabled in production.
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  async headers() {
    // Security headers. We remove 'unsafe-eval' from script-src and tighten
    // resource origins. Note: we keep 'unsafe-inline' for styles and scripts
    // for now to avoid breaking existing inline JSON-LD and style usage; a
    // follow-up would replace inline scripts with nonces/hashes and remove
    // 'unsafe-inline' entirely.
    // Build CSP with a small dev-only relaxation for tooling that uses eval
    // (e.g. Turbopack / React dev helpers). We only allow 'unsafe-eval' when
    // not in production to avoid weakening CSP in deployed sites.
    const scriptSrcDirective = process.env.NODE_ENV === 'production'
      ? "script-src 'self' 'unsafe-inline' https:;"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;"

    const common = [
      { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
      // Hardened Content-Security-Policy (progressive tightening)
      {
        key: 'Content-Security-Policy',
        value: `default-src 'self' https:; img-src 'self' data: blob: https://nlxihuohlbzxfsumnfxk.supabase.co; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; connect-src 'self' https://nlxihuohlbzxfsumnfxk.supabase.co wss:; ${scriptSrcDirective} frame-ancestors 'none';`,
      },
    ]

    // Include HSTS only in production
    if (process.env.NODE_ENV === 'production') {
      common.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' })
    }

    return [
      { source: '/(.*)', headers: common },
      // Long cache for public images and optimized assets
      {
        source: '/images/:all*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
      {
        source: '/_optimized/:all*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
    ]
  },
};

export default nextConfig;
