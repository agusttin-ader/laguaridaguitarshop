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
  },
  async headers() {
    // Security headers. We remove 'unsafe-eval' from script-src and tighten
    // resource origins. Note: we keep 'unsafe-inline' for styles and scripts
    // for now to avoid breaking existing inline JSON-LD and style usage; a
    // follow-up would replace inline scripts with nonces/hashes and remove
    // 'unsafe-inline' entirely.
    const common = [
      { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
      // Hardened Content-Security-Policy (progressive tightening)
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self' https:; img-src 'self' data: blob: https://nlxihuohlbzxfsumnfxk.supabase.co; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; connect-src 'self' https://nlxihuohlbzxfsumnfxk.supabase.co wss:; script-src 'self' 'unsafe-inline' https:; frame-ancestors 'none';",
      },
    ]

    // Include HSTS only in production
    if (process.env.NODE_ENV === 'production') {
      common.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' })
    }

    return [
      { source: '/(.*)', headers: common },
    ]
  },
};

export default nextConfig;
