const {
  getSitemapPosts,
  getSitemapProducts,
  getSitemapLeagues
} = require('./lib/sitemap-data-fetchers.js');

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net',
  generateRobotsTxt: true,
  sitemapSize: 5000,

  // Robots.txt options: Block admin and private routes
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/_next', '/cart', '/auth']
      }
    ]
  },

  additionalPaths: async (config) => {
    const paths = [];
    const defaultLastMod = new Date().toISOString();

    const locales = ['en', 'pt-br'];
    const defaultLocale = 'en';

    // ============================================================
    // 1. PÁGINAS ESTÁTICAS
    // ============================================================
    const staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/blog', priority: 0.8, changefreq: 'weekly' },
      { path: '/contact', priority: 0.4, changefreq: 'monthly' },
      { path: '/faq', priority: 0.6, changefreq: 'monthly' },
      { path: '/terms', priority: 0.3, changefreq: 'yearly' },
      { path: '/games/path-of-exile-1', priority: 0.9, changefreq: 'weekly' },
      { path: '/games/path-of-exile-2', priority: 0.9, changefreq: 'weekly' },
    ];

    staticPages.forEach((page) => {
      locales.forEach((locale) => {
        // Enforce trailing slash consistency if needed, but next-sitemap usually handles it
        const localePath = locale === defaultLocale ? page.path : `/${locale}${page.path}`;
        paths.push({
          loc: localePath,
          lastmod: defaultLastMod,
          changefreq: page.changefreq,
          priority: page.priority,
        });
      });
    });

    // Fetch Data
    const [posts, products] = await Promise.all([
      getSitemapPosts(),
      getSitemapProducts(),
      // We don't strictly need leagues anymore if products handle it, 
      // but if you have landing pages for leagues, keep them. 
      // For now, focusing on PRODUCTS as per rescue protocol.
    ]);

    // ============================================================
    // 2. PRODUTOS (URL Limpa Enforced)
    // ============================================================
    products.forEach((product) => {
      if (product && product.name) {
        locales.forEach((locale) => {
          // CLEAN URL ONLY: /products/divine-orb
          // No query params!
          const productPath = `/products/${encodeURIComponent(product.name.replace(/ /g, '-').toLowerCase())}`;

          const localePath = locale === defaultLocale ? productPath : `/${locale}${productPath}`;

          paths.push({
            loc: localePath,
            lastmod: product.lastmod || defaultLastMod,
            changefreq: 'daily',
            priority: 0.9,
          });
        });
      }
    });

    // ============================================================
    // 3. BLOG POSTS
    // ============================================================
    posts.forEach((post) => {
      if (post && post.slug) {
        // Assuming posts are language specific or translated
        // If posts are unique per language, check post.language. 
        // If they are translated with same slug:
        locales.forEach((locale) => {
          // Check if post language matches or if we translate slugs (assuming simple structure for now)
          if (post.language && post.language !== locale && !(post.language === 'en' && locale === 'en' || post.language === 'pt-br' && locale === 'pt-br')) {
            return; // Skip if strict language binding exists in CMS
          }

          const postPath = `/blog/${encodeURIComponent(post.slug)}`;
          const localePath = locale === defaultLocale ? postPath : `/${locale}${postPath}`;

          paths.push({
            loc: localePath,
            lastmod: post.lastmod || defaultLastMod,
            changefreq: 'weekly',
            priority: 0.7,
          });
        });
      }
    });

    return paths;
  }
};