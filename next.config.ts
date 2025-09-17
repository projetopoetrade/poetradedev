import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {

  images: {
    remotePatterns: [
      {
        hostname: "cdn.sanity.io",
      },
    ],
  },

  experimental: {
    useCache: true,
  },
  /* config options here */
  typescript:{
    ignoreBuildErrors: true,
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
