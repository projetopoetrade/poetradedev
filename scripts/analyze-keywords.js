#!/usr/bin/env node

/**
 * Script de análise de keywords para todas as páginas geradas
 * Executa após o build para mostrar todas as keywords de todas as páginas
 */

const fs = require('fs');
const path = require('path');

// Implementação da função generateKeywords (copiada de lib/utils.ts)
const BASE_KEYWORDS = {
  en: [
    'path of exile', 'poe currency', 'poe trading', 'path of trade'
  ],
  'pt-br': [
    'path of exile', 'poe currency', 'comércio poe', 'path of trade'
  ]
};

const GAME_VERSION_KEYWORDS = {
  'path-of-exile-1': {
    en: ['poe 1', 'path of exile 1'],
    'pt-br': ['poe 1', 'path of exile 1']
  },
  'path-of-exile-2': {
    en: ['poe 2', 'path of exile 2'],
    'pt-br': ['poe 2', 'path of exile 2']
  }
};

const LEAGUE_KEYWORDS = {
  en: ['league'],
  'pt-br': ['liga']
};

const DIFFICULTY_KEYWORDS = {
  'softcore': {
    en: ['softcore'],
    'pt-br': ['softcore']
  },
  'hardcore': {
    en: ['hardcore'],
    'pt-br': ['hardcore']
  }
};

const PRODUCT_CATEGORY_KEYWORDS = {
  'currency': {
    en: ['currency', 'orbs'],
    'pt-br': ['moedas', 'orbs']
  },
  'items': {
    en: ['items', 'equipment'],
    'pt-br': ['itens', 'equipamentos']
  },
  'services': {
    en: ['services'],
    'pt-br': ['serviços']
  }
};

function generateKeywords(options) {
  const {
    locale,
    gameVersion,
    league,
    category,
    difficulty,
    productName,
    blogTitle,
    leagueSlug,
    customKeywords = []
  } = options;

  const keywords = [];
  const lang = locale === 'pt-br' ? 'pt-br' : 'en';

  // Add custom keywords first (highest priority)
  keywords.push(...customKeywords);

  // Add specific context keywords (high priority)
  if (productName) {
    const productWords = productName.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...productWords);
  }

  if (blogTitle) {
    const titleWords = blogTitle.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...titleWords);
  }

  if (leagueSlug) {
    const slugWords = leagueSlug.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...slugWords);
  }

  // Add league name as keyword (high priority)
  if (league) {
    keywords.push(league.toLowerCase());
  }

  // Add game version specific keywords
  if (gameVersion && GAME_VERSION_KEYWORDS[gameVersion]) {
    keywords.push(...GAME_VERSION_KEYWORDS[gameVersion][lang]);
  }

  // Add league keywords
  if (league) {
    keywords.push(...LEAGUE_KEYWORDS[lang]);

    // Add league-specific keywords with the actual league name
    if (lang === 'en') {
      keywords.push(`buy ${league.toLowerCase()} currency`);
      keywords.push(`${league.toLowerCase()} league`);
      keywords.push(`${league.toLowerCase()} trading`);
    } else {
      keywords.push(`comprar moedas ${league.toLowerCase()}`);
      keywords.push(`liga ${league.toLowerCase()}`);
      keywords.push(`comércio ${league.toLowerCase()}`);
    }
  }

  // Add difficulty keywords
  if (difficulty && DIFFICULTY_KEYWORDS[difficulty]) {
    keywords.push(...DIFFICULTY_KEYWORDS[difficulty][lang]);
  }

  // Add category keywords
  if (category && PRODUCT_CATEGORY_KEYWORDS[category]) {
    keywords.push(...PRODUCT_CATEGORY_KEYWORDS[category][lang]);
  }

  // Add specific product + league combinations for better SEO
  if (productName && league) {
    if (lang === 'en') {
      keywords.push(`buy ${productName.toLowerCase()} ${league.toLowerCase()}`);
    } else {
      keywords.push(`comprar ${productName.toLowerCase()} ${league.toLowerCase()}`);
    }
  }

  // Add generic product keywords when no specific league
  if (productName && !league) {
    if (lang === 'en') {
      keywords.push(`buy ${productName.toLowerCase()} poe`);
    } else {
      keywords.push(`comprar ${productName.toLowerCase()} poe`);
    }
  }

  // Add game version specific product keywords
  if (productName && gameVersion) {
    const gameVersionText = gameVersion === 'path-of-exile-1' ? 'poe 1' : 'poe 2';
    const gameVersionFull = gameVersion === 'path-of-exile-1' ? 'path of exile 1' : 'path of exile 2';

    if (lang === 'en') {
      keywords.push(`buy ${productName.toLowerCase()} ${gameVersionText}`);
      keywords.push(`buy ${productName.toLowerCase()} ${gameVersionFull}`);
    } else {
      keywords.push(`comprar ${productName.toLowerCase()} ${gameVersionText}`);
      keywords.push(`comprar ${productName.toLowerCase()} ${gameVersionFull}`);
    }
  }

  // Add base keywords (lower priority)
  keywords.push(...BASE_KEYWORDS[lang]);

  // Remove duplicates and limit to reasonable number
  const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 15);

  return uniqueKeywords.join(', ');
}

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Função para colorir output
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Função para buscar dados reais do banco de dados
async function fetchRealData() {
  try {
    console.log('🔍 Conectando com o banco de dados Supabase...');

    // Carregar variáveis de ambiente do arquivo .env.local
    const fs = await import('fs');
    const path = await import('path');

    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');

      envLines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
    }

    // Verificar se as variáveis de ambiente estão disponíveis
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Variáveis de ambiente do Supabase não encontradas');
    }

    // Importar Supabase diretamente
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar produtos reais
    console.log('📦 Buscando produtos...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('name, slug, category, gameVersion, league, difficulty')
      .limit(50); // Limitar para evitar muitos dados

    if (productsError) {
      throw new Error(`Erro ao buscar produtos: ${productsError.message}`);
    }

    const products = productsData || [];

    // Buscar ligas reais para PoE 1
    console.log('🏆 Buscando ligas PoE 1...');
    const { data: leaguesPoe1, error: leaguesPoe1Error } = await supabase
      .from('leagues')
      .select('name, gameVersion, isActive')
      .eq('gameVersion', 'path-of-exile-1')
      .eq('isActive', true);

    if (leaguesPoe1Error) {
      throw new Error(`Erro ao buscar ligas PoE 1: ${leaguesPoe1Error.message}`);
    }

    // Buscar ligas reais para PoE 2
    console.log('🏆 Buscando ligas PoE 2...');
    const { data: leaguesPoe2, error: leaguesPoe2Error } = await supabase
      .from('leagues')
      .select('name, gameVersion, isActive')
      .eq('gameVersion', 'path-of-exile-2')
      .eq('isActive', true);

    if (leaguesPoe2Error) {
      throw new Error(`Erro ao buscar ligas PoE 2: ${leaguesPoe2Error.message}`);
    }

    // Combinar todas as ligas e gerar slugs
    const allLeagues = [
      ...(leaguesPoe1 || []).map(league => ({
        ...league,
        gameVersion: 'path-of-exile-1',
        slug: league.name.toLowerCase().replace(/\s+/g, '-')
      })),
      ...(leaguesPoe2 || []).map(league => ({
        ...league,
        gameVersion: 'path-of-exile-2',
        slug: league.name.toLowerCase().replace(/\s+/g, '-')
      }))
    ];

    const difficulties = ['softcore', 'hardcore'];
    const gameVersions = ['path-of-exile-1', 'path-of-exile-2'];

    console.log(`✅ Dados carregados: ${products.length} produtos, ${allLeagues.length} ligas`);

    return { products, leagues: allLeagues, difficulties, gameVersions };
  } catch (error) {
    console.error('❌ Erro ao buscar dados do banco:', error.message);
    console.log('🔄 Usando dados de fallback...');

    // Fallback para dados estáticos
    return {
      products: [
        { name: 'Divine Orb', slug: 'divine-orb', category: 'currency', gameVersion: 'path-of-exile-1', league: 'Standard', difficulty: 'softcore' },
        { name: 'Exalted Orb', slug: 'exalted-orb', category: 'currency', gameVersion: 'path-of-exile-1', league: 'Standard', difficulty: 'softcore' },
        { name: 'Chaos Orb', slug: 'chaos-orb', category: 'currency', gameVersion: 'path-of-exile-1', league: 'Standard', difficulty: 'softcore' },
        { name: 'Mirror of Kalandra', slug: 'mirror-of-kalandra', category: 'currency', gameVersion: 'path-of-exile-1', league: 'Standard', difficulty: 'softcore' }
      ],
      // Só ligas permanentes no fallback. Nomear uma liga temporária aqui a
      // deixa envelhecer em silêncio: esta lista dizia 'Keepers of the Flame',
      // encerrada em 2026, e seguia gerando keyword para ela.
      leagues: [
        { name: 'Standard', slug: 'standard', gameVersion: 'path-of-exile-1', isActive: true },
        { name: 'Hardcore', slug: 'hardcore', gameVersion: 'path-of-exile-1', isActive: true }
      ],
      difficulties: ['softcore', 'hardcore'],
      gameVersions: ['path-of-exile-1', 'path-of-exile-2']
    };
  }
}

// Função para gerar keywords de exemplo para diferentes tipos de páginas
async function generatePageKeywords() {
  const pages = [];

  // Buscar dados reais do banco
  const { products, leagues, difficulties, gameVersions } = await fetchRealData();

  // 1. Homepage
  pages.push({
    type: 'Homepage',
    url: '/',
    locale: 'en',
    keywords: generateKeywords({
      locale: 'en',
      customKeywords: ['homepage', 'main page', 'poe trading site', 'poe 1', 'poe 2', 'path of exile 1', 'path of exile 2']
    })
  });

  pages.push({
    type: 'Homepage',
    url: '/pt-br',
    locale: 'pt-br',
    keywords: generateKeywords({
      locale: 'pt-br',
      customKeywords: ['homepage', 'main page', 'poe trading site', 'poe 1', 'poe 2', 'path of exile 1', 'path of exile 2']
    })
  });

  // 2. Páginas de produtos COM liga (usando dados reais)
  products.forEach(product => {
    leagues.forEach(league => {
      difficulties.forEach(difficulty => {
        // EN
        pages.push({
          type: 'Product Detail (with league)',
          url: `/products/${encodeURIComponent(product.name)}?gameVersion=${league.gameVersion}&league=${encodeURIComponent(league.name)}&difficulty=${difficulty}`,
          locale: 'en',
          keywords: generateKeywords({
            locale: 'en',
            gameVersion: league.gameVersion,
            league: league.name,
            difficulty,
            productName: product.name,
            category: product.category,
            customKeywords: ['buy', 'cheap', 'fast delivery', 'secure trading']
          })
        });

        // PT-BR
        pages.push({
          type: 'Product Detail (with league)',
          url: `/pt-br/products/${encodeURIComponent(product.name)}?gameVersion=${league.gameVersion}&league=${encodeURIComponent(league.name)}&difficulty=${difficulty}`,
          locale: 'pt-br',
          keywords: generateKeywords({
            locale: 'pt-br',
            gameVersion: league.gameVersion,
            league: league.name,
            difficulty,
            productName: product.name,
            category: product.category,
            customKeywords: ['comprar', 'barato', 'entrega rápida', 'comércio seguro']
          })
        });
      });
    });
  });

  // 3. Páginas de produtos SEM liga (para mostrar keywords genéricas)
  products.forEach(product => {
    difficulties.forEach(difficulty => {
      gameVersions.forEach(gameVersion => {
        // EN
        pages.push({
          type: 'Product Detail (no league)',
          url: `/products/${encodeURIComponent(product.name)}?gameVersion=${gameVersion}&difficulty=${difficulty}`,
          locale: 'en',
          keywords: generateKeywords({
            locale: 'en',
            gameVersion,
            difficulty,
            productName: product.name,
            category: product.category,
            customKeywords: ['buy', 'cheap', 'fast delivery', 'secure trading']
          })
        });

        // PT-BR
        pages.push({
          type: 'Product Detail (no league)',
          url: `/pt-br/products/${encodeURIComponent(product.name)}?gameVersion=${gameVersion}&difficulty=${difficulty}`,
          locale: 'pt-br',
          keywords: generateKeywords({
            locale: 'pt-br',
            gameVersion,
            difficulty,
            productName: product.name,
            category: product.category,
            customKeywords: ['comprar', 'barato', 'entrega rápida', 'comércio seguro']
          })
        });
      });
    });
  });

  // 3. Páginas de jogos
  gameVersions.forEach(gameVersion => {
    pages.push({
      type: 'Game Version',
      url: `/games/${gameVersion}`,
      locale: 'en',
      keywords: generateKeywords({
        locale: 'en',
        gameVersion,
        customKeywords: ['game', 'version', 'path of exile']
      })
    });

    pages.push({
      type: 'Game Version',
      url: `/pt-br/games/${gameVersion}`,
      locale: 'pt-br',
      keywords: generateKeywords({
        locale: 'pt-br',
        gameVersion,
        customKeywords: ['jogo', 'versão', 'path of exile']
      })
    });
  });

  // 4. Páginas de ligas (usando dados reais)
  leagues.forEach(league => {
    pages.push({
      type: 'League',
      url: `/games/${league.gameVersion}/league/${league.slug}`,
      locale: 'en',
      keywords: generateKeywords({
        locale: 'en',
        gameVersion: league.gameVersion,
        league: league.name,
        leagueSlug: league.slug,
        customKeywords: ['league', 'season', 'poe league']
      })
    });

    pages.push({
      type: 'League',
      url: `/pt-br/games/${league.gameVersion}/league/${league.slug}`,
      locale: 'pt-br',
      keywords: generateKeywords({
        locale: 'pt-br',
        gameVersion: league.gameVersion,
        league: league.name,
        leagueSlug: league.slug,
        customKeywords: ['liga', 'temporada', 'liga poe']
      })
    });
  });

  // 5. Páginas de produtos por categoria/dificuldade
  gameVersions.forEach(gameVersion => {
    leagues.forEach(league => {
      difficulties.forEach(difficulty => {
        pages.push({
          type: 'Products by Category',
          url: `/games/${gameVersion}/leagues/${league.slug}/${difficulty}`,
          locale: 'en',
          keywords: generateKeywords({
            locale: 'en',
            gameVersion,
            league: league.name,
            difficulty,
            customKeywords: ['products', 'currency', 'items']
          })
        });

        pages.push({
          type: 'Products by Category',
          url: `/pt-br/games/${gameVersion}/leagues/${league.slug}/${difficulty}`,
          locale: 'pt-br',
          keywords: generateKeywords({
            locale: 'pt-br',
            gameVersion,
            league: league.name,
            difficulty,
            customKeywords: ['produtos', 'moedas', 'itens']
          })
        });
      });
    });
  });

  // 6. Páginas de blog (exemplos)
  const blogPosts = [
    { title: 'Best Builds for Path of Exile 2', slug: 'best-builds-poe2' },
    { title: 'Currency Trading Guide', slug: 'currency-trading-guide' },
    { title: 'League Starter Builds', slug: 'league-starter-builds' },
    { title: 'How to Make Currency Fast', slug: 'make-currency-fast' },
    { title: 'Melhores Builds para Path of Exile 2', slug: 'melhores-builds-poe2' },
    { title: 'Guia de Comércio de Moedas', slug: 'guia-comercio-moedas' },
    { title: 'Builds para Iniciar Liga', slug: 'builds-iniciar-liga' },
    { title: 'Como Fazer Moedas Rápido', slug: 'fazer-moedas-rapido' }
  ];

  blogPosts.forEach(post => {
    const isPT = post.title.includes('Melhores') || post.title.includes('Guia') || post.title.includes('Builds para') || post.title.includes('Como Fazer');
    const locale = isPT ? 'pt-br' : 'en';
    const gameVersion = post.title.includes('Poe2') || post.title.includes('poe2') ? 'path-of-exile-2' : 'path-of-exile-1';
    const customKeywords = isPT
      ? ['guia poe', 'dicas poe', 'tutorial poe', 'build poe', 'builds', 'moedas', 'trading']
      : ['poe guide', 'path of exile guide', 'poe tips', 'poe tutorial', 'builds', 'currency', 'trading'];

    pages.push({
      type: 'Blog Post',
      url: `/${locale}/blog/${post.slug}`,
      locale,
      keywords: generateKeywords({
        locale,
        blogTitle: post.title,
        gameVersion,
        customKeywords
      })
    });
  });

  return pages;
}

// Função para analisar keywords
function analyzeKeywords(pages) {
  console.log(colorize('\n🔍 ANÁLISE DE KEYWORDS - TODAS AS PÁGINAS', 'bright'));
  console.log(colorize('='.repeat(80), 'cyan'));

  // Estatísticas gerais
  const totalPages = pages.length;
  const enPages = pages.filter(p => p.locale === 'en').length;
  const ptPages = pages.filter(p => p.locale === 'pt-br').length;

  console.log(colorize(`\n📊 ESTATÍSTICAS GERAIS:`, 'yellow'));
  console.log(`Total de páginas: ${totalPages}`);
  console.log(`Páginas em inglês: ${enPages}`);
  console.log(`Páginas em português: ${ptPages}`);

  // Análise por tipo de página
  const pageTypes = {};
  pages.forEach(page => {
    if (!pageTypes[page.type]) {
      pageTypes[page.type] = { en: 0, 'pt-br': 0 };
    }
    pageTypes[page.type][page.locale]++;
  });

  console.log(colorize(`\n📋 PÁGINAS POR TIPO:`, 'yellow'));
  Object.entries(pageTypes).forEach(([type, counts]) => {
    console.log(`${type}: ${counts.en} EN, ${counts['pt-br']} PT-BR`);
  });

  // Análise de keywords mais comuns
  const allKeywords = {};
  pages.forEach(page => {
    const keywords = page.keywords.split(', ');
    keywords.forEach(keyword => {
      if (!allKeywords[keyword]) {
        allKeywords[keyword] = { en: 0, 'pt-br': 0, total: 0 };
      }
      allKeywords[keyword][page.locale]++;
      allKeywords[keyword].total++;
    });
  });

  // Top keywords
  const topKeywords = Object.entries(allKeywords)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 20);

  console.log(colorize(`\n🏆 TOP 20 KEYWORDS MAIS COMUNS:`, 'yellow'));
  topKeywords.forEach(([keyword, stats], index) => {
    const bar = '█'.repeat(Math.floor(stats.total / 2));
    console.log(`${(index + 1).toString().padStart(2)}. ${keyword.padEnd(30)} ${stats.total.toString().padStart(3)}x ${bar}`);
  });

  // Keywords específicas de compra
  const purchaseKeywords = Object.keys(allKeywords).filter(keyword =>
    keyword.includes('buy') || keyword.includes('comprar')
  );

  console.log(colorize(`\n💰 KEYWORDS DE COMPRA (${purchaseKeywords.length}):`, 'yellow'));
  purchaseKeywords.forEach(keyword => {
    const stats = allKeywords[keyword];
    console.log(`  ${keyword}: ${stats.total}x (EN: ${stats.en}, PT-BR: ${stats['pt-br']})`);
  });

  // Keywords de liga
  const leagueKeywords = Object.keys(allKeywords).filter(keyword =>
    keyword.includes('league') || keyword.includes('liga') || keyword.includes('season') || keyword.includes('temporada')
  );

  console.log(colorize(`\n🏆 KEYWORDS DE LIGA (${leagueKeywords.length}):`, 'yellow'));
  leagueKeywords.forEach(keyword => {
    const stats = allKeywords[keyword];
    console.log(`  ${keyword}: ${stats.total}x (EN: ${stats.en}, PT-BR: ${stats['pt-br']})`);
  });

  return { totalPages, allKeywords, topKeywords, purchaseKeywords, leagueKeywords };
}

// Função para mostrar exemplos de páginas específicas
function showPageExamples(pages) {
  console.log(colorize(`\n📄 EXEMPLOS DE PÁGINAS ESPECÍFICAS:`, 'yellow'));
  console.log(colorize('='.repeat(80), 'cyan'));

  // Exemplo 1: Divine Orb com liga específica
  const divineOrbExample = pages.find(p =>
    p.url.includes('Divine%20Orb') &&
    p.url.includes('Keepers%20of%20the%20Flame') &&
    p.locale === 'en'
  );

  if (divineOrbExample) {
    console.log(colorize(`\n1. ${divineOrbExample.type} - ${divineOrbExample.url}`, 'green'));
    console.log(`Keywords: ${divineOrbExample.keywords}`);
  }

  // Exemplo 2: Divine Orb PT-BR com liga
  const divineOrbPT = pages.find(p =>
    p.url.includes('Divine%20Orb') &&
    p.url.includes('Keepers%20of%20the%20Flame') &&
    p.locale === 'pt-br'
  );

  if (divineOrbPT) {
    console.log(colorize(`\n2. ${divineOrbPT.type} - ${divineOrbPT.url}`, 'green'));
    console.log(`Keywords: ${divineOrbPT.keywords}`);
  }

  // Exemplo 3: Divine Orb SEM liga (PT-BR)
  const divineOrbNoLeague = pages.find(p =>
    p.url.includes('Divine%20Orb') &&
    !p.url.includes('league') &&
    p.locale === 'pt-br' &&
    p.type === 'Product Detail (no league)'
  );

  if (divineOrbNoLeague) {
    console.log(colorize(`\n3. ${divineOrbNoLeague.type} - ${divineOrbNoLeague.url}`, 'green'));
    console.log(`Keywords: ${divineOrbNoLeague.keywords}`);
  }

  // Exemplo 4: Divine Orb SEM liga (EN)
  const divineOrbNoLeagueEN = pages.find(p =>
    p.url.includes('Divine%20Orb') &&
    !p.url.includes('league') &&
    p.locale === 'en' &&
    p.type === 'Product Detail (no league)'
  );

  if (divineOrbNoLeagueEN) {
    console.log(colorize(`\n4. ${divineOrbNoLeagueEN.type} - ${divineOrbNoLeagueEN.url}`, 'green'));
    console.log(`Keywords: ${divineOrbNoLeagueEN.keywords}`);
  }

  // Exemplo 5: Homepage
  const homepageEN = pages.find(p => p.type === 'Homepage' && p.locale === 'en');
  if (homepageEN) {
    console.log(colorize(`\n5. ${homepageEN.type} - ${homepageEN.url}`, 'green'));
    console.log(`Keywords: ${homepageEN.keywords}`);
  }

  // Exemplo 6: Homepage PT-BR
  const homepagePT = pages.find(p => p.type === 'Homepage' && p.locale === 'pt-br');
  if (homepagePT) {
    console.log(colorize(`\n6. ${homepagePT.type} - ${homepagePT.url}`, 'green'));
    console.log(`Keywords: ${homepagePT.keywords}`);
  }

  // Exemplo 7: Blog Post EN
  const blogEN = pages.find(p => p.type === 'Blog Post' && p.locale === 'en');
  if (blogEN) {
    console.log(colorize(`\n7. ${blogEN.type} - ${blogEN.url}`, 'green'));
    console.log(`Keywords: ${blogEN.keywords}`);
  }

  // Exemplo 8: Blog Post PT-BR
  const blogPT = pages.find(p => p.type === 'Blog Post' && p.locale === 'pt-br');
  if (blogPT) {
    console.log(colorize(`\n8. ${blogPT.type} - ${blogPT.url}`, 'green'));
    console.log(`Keywords: ${blogPT.keywords}`);
  }
}

// Função principal
async function main() {
  console.log(colorize('🚀 INICIANDO ANÁLISE DE KEYWORDS...', 'bright'));
  console.log(colorize('📊 Buscando dados reais do banco de dados...', 'yellow'));

  try {
    const pages = await generatePageKeywords();
    const analysis = analyzeKeywords(pages);
    showPageExamples(pages);

    console.log(colorize(`\n✅ ANÁLISE CONCLUÍDA!`, 'green'));
    console.log(colorize(`Total de páginas analisadas: ${analysis.totalPages}`, 'cyan'));
    console.log(colorize(`Total de keywords únicas: ${Object.keys(analysis.allKeywords).length}`, 'cyan'));
    console.log(colorize(`Keywords de compra: ${analysis.purchaseKeywords.length}`, 'cyan'));
    console.log(colorize(`Keywords de liga: ${analysis.leagueKeywords.length}`, 'cyan'));

  } catch (error) {
    console.error(colorize('❌ ERRO:', 'red'), error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { generatePageKeywords, analyzeKeywords, showPageExamples };
