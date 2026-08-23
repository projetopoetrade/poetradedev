import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Baseline CSP compatible with the current app integrations (Supabase, Stripe,
// Turnstile, Tawk and YouTube). The broad HTTPS allowances preserve those
// dynamic hosts while the high-value restrictions still block plugins,
// hostile base URL rewrites and third-party framing of the storefront.
const contentSecurityPolicy = [
  "default-src 'self' https: data: blob:",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');

const nextConfig: NextConfig = {

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        // Redireciona links /wiki/* que aparecem em blog posts para a PoE Wiki oficial
        source: '/wiki/:path*',
        destination: 'https://www.poewiki.net/wiki/:path*',
        permanent: true, // 308 — permanente para transferir link equity
      },
      {
        source: '/products/:slug',
        has: [{ type: 'query', key: 'gameVersion', value: 'path-of-exile-2' }],
        destination: '/games/path-of-exile-2/products/:slug',
        permanent: true,
      },
      {
        source: '/pt-br/products/:slug',
        has: [{ type: 'query', key: 'gameVersion', value: 'path-of-exile-2' }],
        destination: '/pt-br/games/path-of-exile-2/products/:slug',
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        hostname: "cdn.sanity.io",
      },
      {
        hostname: "web.poecdn.com",
      },
      {
        hostname: "poe.ninja",
      },
      {
        // YouTube thumbnails for league trailers (i.ytimg.com/vi/<id>/...).
        // ytimg is the CDN img.youtube.com redirects to; pointing at it directly
        // skips a hop per thumbnail.
        hostname: "i.ytimg.com",
      },
      {
        // Self-hosted passive icons (/images/passives/*.webp). Same-origin in
        // production, but preview deploys (preview-xxx.vercel.app) load from
        // the prod origin via absolute URLs returned by the engine.
        hostname: "pathoftrade.net",
      },
      {
        hostname: "www.pathoftrade.net",
      },
      {
        // Wiki Special:Filepath redirects for items poe.ninja doesn't track
        // (Chaos Orb, defunct sextants, niche bases). 302s to the actual CDN.
        hostname: "www.poewiki.net",
      },
      {
        // GGG skilltree-export sprite sheets (assets/frame-N.png,
        // skills-N.jpg, etc). Kept here for a future re-enable of
        // canvas-side sprite rendering in /preview/tree — passive
        // tooltips are served from /images/passives/ (same-origin, no
        // remotePatterns needed).
        hostname: "raw.githubusercontent.com",
      },
    ],
  },

  experimental: {
    useCache: true,
  },

  // Resolved at build time so app/sitemap.ts can stamp a stable lastmod on
  // static pages — otherwise revalidate=300 would refresh that timestamp
  // every 5 min and Googlebot would dessensitize to the signal.
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
