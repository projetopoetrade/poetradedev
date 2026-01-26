const {
  getSitemapPosts,
  getSitemapProducts,
  getSitemapLeagues
} = require('./lib/sitemap-data-fetchers.js');

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net',
  generateRobotsTxt: true,
  // Otimização: Divide sitemaps grandes para não estourar o limite do Google
  sitemapSize: 5000, 
  
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
      { path: '/contact', priority: 0.4, changefreq: 'monthly' }, // Baixa prioridade
      { path: '/faq', priority: 0.6, changefreq: 'monthly' },
      { path: '/terms', priority: 0.3, changefreq: 'yearly' },
      { path: '/games/path-of-exile-1', priority: 0.9, changefreq: 'weekly' },
      { path: '/games/path-of-exile-2', priority: 0.9, changefreq: 'weekly' },
    ];

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

    // Fetch de dados
    const [posts, products, leaguePoe1, leaguePoe2] = await Promise.all([
      getSitemapPosts(),
      getSitemapProducts(),
      getSitemapLeagues("path-of-exile-1"),
      getSitemapLeagues("path-of-exile-2"),
    ]);

    // ============================================================
    // 2. PRODUTOS (Correção de Canonical)
    // ============================================================
    // O Sitemap deve apontar para a URL PRINCIPAL do produto.
    // Se a sua canonical na página do produto é limpa (sem query params), o sitemap deve ser limpo.
    // Se você precisa dos params para a página funcionar, mantenha-os, 
    // mas garanta que a tag <link rel="canonical"> na página bata com isso.
    
    products.forEach((product) => {
      if (product && product.name) {
        locales.forEach((locale) => {
          // Geração da URL Limpa (Recomendado para SEO se a página suportar)
          // Ex: /products/divine-orb
          // Se sua página PRECISA dos params para carregar, descomente a linha de baixo e comente a curta.
          
          // Opção A (URL Limpa - Melhor SEO):
          const productPath = `/products/${encodeURIComponent(product.name)}`;
          
          // Opção B (URL com Params - Use apenas se a página quebrar sem eles):
          // const productPath = `/products/${encodeURIComponent(product.name)}?gameVersion=${encodeURIComponent(product.gameVersion)}&league=${encodeURIComponent(product.league)}&difficulty=${encodeURIComponent(product.difficulty)}`;

          const localePath = locale === defaultLocale ? productPath : `/${locale}${productPath}`;
          
          paths.push({
            loc: localePath,
            lastmod: product.lastmod || defaultLastMod,
            changefreq: 'daily',
            priority: 0.9, // Produtos são alta prioridade
          });
        });
      }
    });

    // ============================================================
    // 3. BLOG POSTS
    // ============================================================
    posts.forEach((post) => {
      if (post && post.slug) {
        const postLocale = post.language === 'pt-br' ? 'pt-br' : 'en';
        const postPath = `/blog/${encodeURIComponent(post.slug)}`;
        const localePath = postLocale === defaultLocale ? postPath : `/${postLocale}${postPath}`;
        
        paths.push({
          loc: localePath,
          lastmod: post.lastmod || defaultLastMod,
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
    });

    // ============================================================
    // 4. LIGAS (A Grande Correção)
    // ============================================================
    // Aqui mudamos para apontar para a ROTA DE PÁGINA (landing page)
    // e não para a rota de busca (/products?...)
    
    const processLeagues = (leagues, gameVersion) => {
      const difficulties = ['softcore', 'hardcore'];
      
      leagues.forEach((league) => {
        difficulties.forEach((difficulty) => {
          locales.forEach((locale) => {
            // URL CORRETA baseada na estrutura de pastas:
            // app/[locale]/games/[gameVersion]/leagues/[league]/[difficulty]/page.tsx
            const leaguePath = `/games/${gameVersion}/leagues/${encodeURIComponent(league.name)}/${difficulty}`;
            
            const localePath = locale === defaultLocale ? leaguePath : `/${locale}${leaguePath}`;
            
            paths.push({
              loc: localePath,
              lastmod: league.lastmod || defaultLastMod,
              changefreq: 'daily', // Ligas mudam preços todo dia
              priority: 0.8,
            });
          });
        });
      });
    };

    processLeagues(leaguePoe1, 'path-of-exile-1');
    processLeagues(leaguePoe2, 'path-of-exile-2');

    return paths;
  }
};