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
    ],
  },

  experimental: {
    useCache: true,
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
