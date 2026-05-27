import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Security response headers applied to every route. We allow what we
 * actually need (YouTube iframes, Supabase storage, Spline 3D, Google
 * fonts) and deny everything else.
 */
const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js inlines small scripts and uses eval for dev/HMR. 'unsafe-inline'
  // is needed for Tailwind's runtime style injection. 'unsafe-eval' is only
  // needed for dev — Next strips it from prod builds where possible.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://*.googletagmanager.com https://prod.spline.design",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://i.ytimg.com https://img.youtube.com https://images.unsplash.com https://media.rawg.io https://yt3.ggpht.com https://yt4.ggpht.com https://yt3.googleusercontent.com https://yt4.googleusercontent.com https://*.supabase.co https://api.dicebear.com https://lh3.googleusercontent.com https://cdn.discordapp.com",
  "media-src 'self' data: https://*.supabase.co",
  // YouTube/Discord embeds + Spline 3D scene canvas
  "frame-src https://www.youtube.com https://youtube.com https://*.spline.design https://discord.com",
  // Outbound fetches: same origin, Supabase project, YouTube API, unpkg (for spline)
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googleapis.com https://*.spline.design https://unpkg.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  // Stops other sites from putting our pages inside an iframe (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Blocks browsers from MIME-sniffing response bodies away from their
  // declared Content-Type — defeats some XSS-via-uploaded-files attacks.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send the origin in Referer headers when crossing origins. Avoids
  // leaking full path/query params (e.g. password-reset tokens) to third
  // parties like analytics or external links.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Denies access to powerful browser APIs we never use. Camera/mic/etc.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()",
  },
  // Force HTTPS for 2 years on production. Skipped on localhost by browsers.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Enforce CSP in production. Keep it report-only in local development so
  // dev-only tooling can warn without breaking HMR or experiments.
  {
    key: isProduction
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only",
    value: ContentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  compiler: {
    removeConsole: isProduction,
  },
  async headers() {
    return [
      {
        // Apply to every route. Static asset routes still get them but the
        // browser ignores irrelevant ones (e.g. CSP on an image).
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "yt4.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "yt3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "yt4.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
