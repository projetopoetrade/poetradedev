import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {

  async redirects() {
    return [
      {
        // Redireciona links /wiki/* que aparecem em blog posts para a PoE Wiki oficial
        source: '/wiki/:path*',
        destination: 'https://www.poewiki.net/wiki/:path*',
        permanent: false, // 307 — pode mudar para true (308) depois se necessário
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
