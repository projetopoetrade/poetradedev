import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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
