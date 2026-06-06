import type { NextConfig } from "next";

// Content-Security-Policy tuned for exactly what this app loads:
// - Supabase REST + Realtime (wss) + Storage public URLs  -> *.supabase.co
// - Cloudflare R2 signed video playback AND direct multipart upload PUTs
//   from the browser                                       -> *.r2.cloudflarestorage.com
// - YouTube preview iframes                                -> youtube.com
// - motion / Tailwind inline styles + Next.js hydration    -> 'unsafe-inline'
// 'unsafe-inline'/'unsafe-eval' on script-src are kept because the App Router
// emits inline bootstrap scripts without a nonce; tightening that needs nonce
// middleware and is a separate task.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://*.r2.cloudflarestorage.com https://i.ytimg.com",
  "media-src 'self' blob: https://*.r2.cloudflarestorage.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Force HTTPS for 2 years incl. subdomains. Vercel already serves HTTPS only.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Clickjacking protection (pairs with frame-ancestors 'none' above).
  { key: "X-Frame-Options", value: "DENY" },
  // Stop MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Drop powerful APIs we never use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to every route.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
