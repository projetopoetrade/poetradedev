const {
  getSitemapPosts,
  getSitemapProducts,
  getSitemapLeagues
} = require('./lib/sitemap-data-fetchers.js');

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net',
  generateRobotsTxt: true,
  additionalPaths: async (config) => {
    const paths = [];
    const defaultLastMod = new Date().toISOString();
    
    // Define supported locales (default locale 'en' doesn't need prefix)
    const locales = ['en', 'pt-br'];
    const defaultLocale = 'en';

    // Static pages to include in sitemap
    const staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/blog', priority: 0.8, changefreq: 'daily' },
      { path: '/contact', priority: 0.6, changefreq: 'monthly' },
      { path: '/faq', priority: 0.6, changefreq: 'monthly' },
      { path: '/terms', priority: 0.5, changefreq: 'monthly' },
      { path: '/games/path-of-exile-1', priority: 0.5, changefreq: 'monthly' },
      { path: '/games/path-of-exile-2', priority: 0.5, changefreq: 'monthly' },
      { path: '/league/keepers-of-the-flame', priority: 0.8, changefreq: 'weekly' },
    ];

    // Add static pages for all locales
    staticPages.forEach((page) => {
      locales.forEach((locale) => {
        const localePath = locale === defaultLocale ? page.path : `/${locale}${page.path}`;
        paths.push({
          loc: localePath,
          lastmod: defaultLastMod,
          changefreq: page.changefreq,
          priority: page.priority,
        });
      });
    });

    const [posts, products, leaguePoe1, leaguePoe2] = await Promise.all([
      getSitemapPosts(),
      getSitemapProducts(),
      getSitemapLeagues("path-of-exile-1"),
      getSitemapLeagues("path-of-exile-2"),
    ]);

    // Add products for all locales
    products.forEach((product) => {
      if (product && product.name && product.gameVersion && product.league) {
        locales.forEach((locale) => {
          const productPath = `/products/${encodeURIComponent(product.name)}?gameVersion=${encodeURIComponent(product.gameVersion)}&league=${encodeURIComponent(product.league)}&difficulty=${encodeURIComponent(product.difficulty)}`;
          const localePath = locale === defaultLocale ? productPath : `/${locale}${productPath}`;
          paths.push({
            loc: localePath,
            lastmod: product.lastmod || defaultLastMod,
            changefreq: 'daily',
            priority: 1,
          });
        });
      }
    });

    // Add blog posts (one per post, based on post language)
    posts.forEach((post) => {
      if (post && post.slug) {
        // Determine the locale based on the post's language field
        // If language is 'pt-br', use pt-br locale; otherwise default to 'en'
        const postLocale = post.language === 'pt-br' ? 'pt-br' : 'en';
        
        const postPath = `/blog/${encodeURIComponent(post.slug)}`;
        const localePath = postLocale === defaultLocale ? postPath : `/${postLocale}${postPath}`;
        
        paths.push({
          loc: localePath,
          lastmod: post.lastmod || defaultLastMod,
          changefreq: 'daily',
          priority: 0.5,
        });
      }
    });

    // Add POE1 leagues for all locales (both softcore and hardcore)
    leaguePoe1.forEach((league) => {
      const difficulties = ['softcore', 'hardcore'];
      
      difficulties.forEach((difficulty) => {
        locales.forEach((locale) => {
          const leaguePath = `/products?gameVersion=${encodeURIComponent(league.gameVersion)}&league=${encodeURIComponent(league.name)}&difficulty=${difficulty}`;
          const localePath = locale === defaultLocale ? leaguePath : `/${locale}${leaguePath}`;
          console.log(localePath);
          paths.push({
            loc: localePath,
            lastmod: league.lastmod || defaultLastMod,
            changefreq: 'daily',
            priority: 0.8,
          });
        });
      });
    });

    // Add POE2 leagues for all locales (both softcore and hardcore)
    leaguePoe2.forEach((league) => {
      const difficulties = ['softcore', 'hardcore'];
      
      difficulties.forEach((difficulty) => {
        locales.forEach((locale) => {
          const leaguePath = `/products?gameVersion=${encodeURIComponent(league.gameVersion)}&league=${encodeURIComponent(league.name)}&difficulty=${difficulty}`;
          const localePath = locale === defaultLocale ? leaguePath : `/${locale}${leaguePath}`;
          console.log(localePath);
          paths.push({
            loc: localePath,
            lastmod: league.lastmod || defaultLastMod,
            changefreq: 'daily',
            priority: 0.8,
          });
        });
      });
    });

    return paths;
  }
};