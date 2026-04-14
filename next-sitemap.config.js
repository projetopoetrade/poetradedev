const {
  getSitemapPosts,
  getSitemapProducts,
  getSitemapLeagueSlugPages,
  getSitemapBuilds,
  getSitemapLeagueBuilds,
} = require('./lib/sitemap-data-fetchers.js');

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net',
  generateRobotsTxt: true,
  sitemapSize: 5000,

  // Clean Crawl Budget: Exclude internal/private routes (images allowed for Google Images)
  exclude: ['/admin', '/api', '/_next', '/cart', '/auth', '/tools/price-comparison'],

  // Robots.txt options: Block admin and private routes only (images allowed for Google Images)
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/_next', '/cart', '/auth', '/tools/price-comparison']
      }
    ]
  },

  additionalPaths: async (config) => {
    const paths = [];
    // lastmod dinâmico: só para páginas que realmente mudam a cada deploy
    const buildLastMod = new Date().toISOString();
    // Páginas de conteúdo estático — data fixa para não sinalizar "updated" em todo deploy
    const staticContentLastMod = '2025-06-01T00:00:00.000Z';
    const legalLastMod = '2025-01-01T00:00:00.000Z';

    const locales = ['en', 'pt-br'];
    const defaultLocale = 'en';

    // Capture the base siteUrl once — config.siteUrl can be mutated per-page by next-sitemap
    // and would otherwise cause path duplication in xhtml:link hrefs (e.g. /builds/builds)
    // Strip trailing slash to avoid double slashes when concatenating with leading-slash paths
    const baseSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net').replace(/\/$/, '');

    // BCP 47 locale map — Google requires pt-BR not pt-br
    const hreflangMap = { 'pt-br': 'pt-BR', 'en': 'en' };

    // Helper to generate Hreflang alternateRefs for a given base path
    const generateAlternateRefs = (basePath) => {
      const refs = locales.map(locale => {
        const localePath = locale === defaultLocale ? basePath : `/${locale}${basePath}`;
        // Ensure we don't end up with double slashes if basePath is /
        const cleanPath = localePath === '/' ? '/' : localePath.replace(/\/$/, '');
        return {
          href: `${baseSiteUrl}${cleanPath}`,
          hreflang: hreflangMap[locale] || locale,
          hrefIsAbsolute: true,
        };
      });
      // x-default aponta para a versão em inglês (padrão)
      const defaultPath = basePath === '/' ? '/' : basePath.replace(/\/$/, '');
      refs.push({
        href: `${baseSiteUrl}${defaultPath}`,
        hreflang: 'x-default',
        hrefIsAbsolute: true,
      });
      return refs;
    };

    // ============================================================
    // 1. PÁGINAS ESTÁTICAS
    // ============================================================
    const staticPages = [
      // Páginas dinâmicas — lastmod = build time (conteúdo muda a cada deploy/publicação)
      { path: '/', priority: 1.0, changefreq: 'daily', lastmod: buildLastMod },
      { path: '/products', priority: 0.85, changefreq: 'daily', lastmod: buildLastMod },
      { path: '/builds', priority: 0.85, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/blog', priority: 0.8, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/tools/price-tracker', priority: 0.85, changefreq: 'daily', lastmod: buildLastMod },
      { path: '/games/path-of-exile-1', priority: 0.9, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/games/path-of-exile-2', priority: 0.9, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/games/path-of-exile-1/builds', priority: 0.85, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/games/path-of-exile-2/builds', priority: 0.85, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/games/path-of-exile-1/currency', priority: 0.9, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/games/path-of-exile-2/currency', priority: 0.9, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/games/path-of-exile-1/items', priority: 0.85, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/games/path-of-exile-2/items', priority: 0.85, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/games/path-of-exile-1/services', priority: 0.8, changefreq: 'weekly', lastmod: buildLastMod },
      { path: '/games/path-of-exile-2/services', priority: 0.8, changefreq: 'weekly', lastmod: buildLastMod },
      // Ferramentas públicas
      { path: '/tools', priority: 0.8, changefreq: 'monthly', lastmod: staticContentLastMod },
      { path: '/tools/build-randomizer', priority: 0.7, changefreq: 'monthly', lastmod: staticContentLastMod },
      { path: '/tools/pob-viewer', priority: 0.7, changefreq: 'monthly', lastmod: staticContentLastMod },
      // Páginas de conteúdo estático — data fixa (não sinalizar "updated" em todo deploy)
      { path: '/about', priority: 0.5, changefreq: 'monthly', lastmod: staticContentLastMod },
      { path: '/contact', priority: 0.4, changefreq: 'monthly', lastmod: staticContentLastMod },
      { path: '/faq', priority: 0.6, changefreq: 'monthly', lastmod: staticContentLastMod },
      // Legais — mudam raramente
      { path: '/terms', priority: 0.3, changefreq: 'yearly', lastmod: legalLastMod },
      { path: '/privacy', priority: 0.3, changefreq: 'yearly', lastmod: legalLastMod },
    ];

    staticPages.forEach((page) => {
      const alternates = generateAlternateRefs(page.path);

      locales.forEach((locale) => {
        const localePath = locale === defaultLocale ? page.path : `/${locale}${page.path}`;
        // Handle root special case for concatenation
        const finalLoc = localePath.replace(/\/\//g, '/');

        paths.push({
          loc: finalLoc,
          lastmod: page.lastmod,
          changefreq: page.changefreq,
          priority: page.priority,
          alternateRefs: alternates,
        });
      });
    });

    // Fetch Data
    const [posts, products, leagueSlugPages, builds, leagueBuilds] = await Promise.all([
      getSitemapPosts(),
      getSitemapProducts(),
      getSitemapLeagueSlugPages(),
      getSitemapBuilds(),
      getSitemapLeagueBuilds(),
    ]);

    // ============================================================
    // 2. PRODUTOS (URL Limpa Enforced)
    // ============================================================
    if (products && products.length > 0) {
      products.forEach((product) => {
        if (product && product.name) {
          // Use the DB slug directly if available, otherwise generate from name
          // This must match url-helper.ts encodeProductName() logic
          let productSlug = (product.slug || encodeURIComponent(
            product.name.normalize('NFD')
              .replace(/[\s\+\&\%\#\@\!\(\)\[\]\{\}\:\;\'\"\,\.\?\<\>\/\\\|]/g, '-')
              .replace(/--+/g, '-')
              .replace(/^-|-$/g, '')
          )).toLowerCase();
          let productPath = `/products/${productSlug}`;

          // PoE 2 usa URL por gameVersion no path, PoE 1 mantém /products/[slug]
          if (product.gameVersion === 'path-of-exile-2') {
            productPath = `/games/path-of-exile-2/products/${productSlug}`;
          }

          // Generate alternates tailored to this product's path
          // Note for Query Params: strictly speaking hreflang should match the URL exactly.
          const alternates = generateAlternateRefs(productPath);

          locales.forEach((locale) => {
            const localePath = locale === defaultLocale ? productPath : `/${locale}${productPath}`;

            paths.push({
              loc: localePath,
              lastmod: product.lastmod || buildLastMod,
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
              lastmod: post.lastmod || buildLastMod,
              changefreq: 'weekly',
              priority: 0.7,
              alternateRefs: alternates,
            });
          });
        }
      });
    }

    // ============================================================
    // 5. LEAGUE × SLUG PAGES (categorias + produtos-chave × ligas)
    // ============================================================
    if (leagueSlugPages && leagueSlugPages.length > 0) {
      leagueSlugPages.forEach(({ leagueSlug, gameVersion, slug, lastmod }) => {
        const path = `/games/${gameVersion}/league/${leagueSlug}/${slug}`;
        const alternates = generateAlternateRefs(path);
        locales.forEach((locale) => {
          paths.push({
            loc: locale === defaultLocale ? path : `/${locale}${path}`,
            lastmod: lastmod || buildLastMod,
            changefreq: 'weekly',
            priority: 0.8,
            alternateRefs: alternates,
          });
        });
      });
    }

    // ============================================================
    // 6. BUILDS INDIVIDUAIS
    // ============================================================
    if (builds && builds.length > 0) {
      builds.forEach(({ slug, lastmod }) => {
        const buildPath = `/builds/${slug}`;
        const alternates = generateAlternateRefs(buildPath);
        locales.forEach((locale) => {
          paths.push({
            loc: locale === defaultLocale ? buildPath : `/${locale}${buildPath}`,
            lastmod: lastmod || buildLastMod,
            changefreq: 'weekly',
            priority: 0.8,
            alternateRefs: alternates,
          });
        });
      });
    }

    // ============================================================
    // 7. BUILDS POR LIGA (/builds/league/[slug])
    // ============================================================
    if (leagueBuilds && leagueBuilds.length > 0) {
      leagueBuilds.forEach(({ slug, lastmod }) => {
        const leagueBuildPath = `/builds/league/${slug}`;
        const alternates = generateAlternateRefs(leagueBuildPath);
        locales.forEach((locale) => {
          paths.push({
            loc: locale === defaultLocale ? leagueBuildPath : `/${locale}${leagueBuildPath}`,
            lastmod: lastmod || buildLastMod,
            changefreq: 'weekly',
            priority: 0.75,
            alternateRefs: alternates,
          });
        });
      });
    }

    return paths;
  }
};