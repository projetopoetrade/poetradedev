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

  // Clean Crawl Budget: Exclude internal/private routes (images allowed for Google Images)
  exclude: ['/admin', '/api', '/_next', '/cart', '/auth'],

  // Robots.txt options: Block admin and private routes only (images allowed for Google Images)
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
    // Lastmod: Current (February 2026)
    const defaultLastMod = new Date().toISOString();

    const locales = ['en', 'pt-br'];
    const defaultLocale = 'en';

    // Helper to generate Hreflang alternateRefs for a given base path
    const generateAlternateRefs = (basePath) => {
      return locales.map(locale => {
        const localePath = locale === defaultLocale ? basePath : `/${locale}${basePath}`;
        // Ensure we don't end up with double slashes if basePath is /
        const cleanPath = localePath === '/' ? '/' : localePath.replace(/\/$/, '');
        return {
          href: `${config.siteUrl}${cleanPath}`,
          hreflang: locale,
        };
      });
    };

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
      const alternates = generateAlternateRefs(page.path);

      locales.forEach((locale) => {
        const localePath = locale === defaultLocale ? page.path : `/${locale}${page.path}`;
        // Handle root special case for concatenation
        const finalLoc = localePath.replace(/\/\//g, '/');

        paths.push({
          loc: finalLoc,
          lastmod: defaultLastMod,
          changefreq: page.changefreq,
          priority: page.priority,
          alternateRefs: alternates,
        });
      });
    });

    // Fetch Data
    const [posts, products] = await Promise.all([
      getSitemapPosts(),
      getSitemapProducts(),
    ]);

    // ============================================================
    // 2. PRODUTOS (URL Limpa Enforced)
    // ============================================================
    if (products && products.length > 0) {
      products.forEach((product) => {
        if (product && product.name) {
          // Base Clean URL calculation
          let productSlug = encodeURIComponent(product.name.replace(/ /g, '-').toLowerCase());
          let productPath = `/products/${productSlug}`;

          // HYBRID URL STRATEGY (PoE 2 param)
          if (product.gameVersion === 'path-of-exile-2') {
            productPath += '?gameVersion=path-of-exile-2';
          }

          // Generate alternates tailored to this product's path
          // Note for Query Params: strictly speaking hreflang should match the URL exactly.
          const alternates = generateAlternateRefs(productPath);

          locales.forEach((locale) => {
            const localePath = locale === defaultLocale ? productPath : `/${locale}${productPath}`;

            paths.push({
              loc: localePath,
              lastmod: product.lastmod || defaultLastMod,
              changefreq: 'daily',
              priority: product.gameVersion === 'path-of-exile-2' ? 0.85 : 0.9,
              alternateRefs: alternates,
            });
          });
        }
      });
    }

    // ============================================================
    // 3. BLOG POSTS
    // ============================================================
    if (posts && posts.length > 0) {
      posts.forEach((post) => {
        if (post && post.slug) {
          const postPath = `/blog/${encodeURIComponent(post.slug)}`;
          const alternates = generateAlternateRefs(postPath);

          // Filtering logic: Check if post has a language field
          // If strict language separation exists in CMS, logic might differ. 
          // For now, assuming translated content shares the slug or we iterate locales.

          locales.forEach((locale) => {
            // Language filtering (if post.language exists and mismatches)
            if (post.language && post.language !== locale &&
              !(post.language === 'en' && locale === 'en' || post.language === 'pt-br' && locale === 'pt-br')) {
              return;
            }

            const localePath = locale === defaultLocale ? postPath : `/${locale}${postPath}`;

            paths.push({
              loc: localePath,
              lastmod: post.lastmod || defaultLastMod,
              changefreq: 'weekly',
              priority: 0.7,
              alternateRefs: alternates,
            });
          });
        }
      });
    }

    return paths;
  }
};