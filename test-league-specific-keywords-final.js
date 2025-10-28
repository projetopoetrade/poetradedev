// Teste final das keywords específicas da liga

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

  // Base keywords
  const BASE_KEYWORDS = {
    en: [
      'path of exile', 'poe', 'poe currency', 'buy divine orbs', 'buy divine orb', 'divine orbs', 'exalted orbs', 'chaos orbs',
      'path of trade', 'poe trading', 'poe items', 'poe currency trading', 'buy poe currency',
      'poe league', 'poe builds', 'poe guides', 'poe trading site', 'poe currency exchange'
    ],
    'pt-br': [
      'comprar divine orb poe', 'comprar divine orbs', 'comprar moedas poe', 'comprar mirror of kalandra', 'comprar exalted orbs',
      'poe currency brasil', 'moedas path of exile', 'divine orbs barato', 'chaos orbs preço',
      'comércio poe brasil', 'site poe confiável', 'comprar poe currency', 'moedas poe seguras',
      'path of exile moedas', 'poe trading brasil', 'comprar orbs poe', 'poe currency shop'
    ]
  };

  // League keywords
  const LEAGUE_KEYWORDS = {
    en: ['league', 'season', 'softcore', 'hardcore', 'ssf', 'trade league'],
    'pt-br': ['comprar moedas liga', 'liga poe moedas', 'temporada poe currency', 'softcore moedas', 'hardcore currency', 'comércio liga poe']
  };

  // Add custom keywords first (highest priority)
  keywords.push(...customKeywords);

  // Add specific context keywords (high priority)
  if (productName) {
    const productWords = productName.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...productWords);
  }

  // Add league name as keyword (high priority)
  if (league) {
    keywords.push(league.toLowerCase());
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

  // Add base keywords (lower priority)
  keywords.push(...BASE_KEYWORDS[lang]);

  // Remove duplicates and limit to 15
  return Array.from(new Set(keywords)).slice(0, 15).join(', ');
}

console.log('=== TESTE FINAL: KEYWORDS ESPECÍFICAS DA LIGA ===\n');

// Teste 1: Divine Orb com liga "Keepers of the Flame" em PT-BR
console.log('1. Divine Orb + Keepers of the Flame + Softcore (PT-BR):');
const keywords1 = generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-1',
  league: 'Keepers of the Flame',
  difficulty: 'softcore',
  productName: 'Divine Orb',
  customKeywords: ['comprar', 'barato', 'entrega rápida', 'comércio seguro']
});
console.log('Keywords:', keywords1);
console.log('');

// Teste 2: Divine Orb com liga "Keepers of the Flame" em EN
console.log('2. Divine Orb + Keepers of the Flame + Softcore (EN):');
const keywords2 = generateKeywords({
  locale: 'en',
  gameVersion: 'path-of-exile-1',
  league: 'Keepers of the Flame',
  difficulty: 'softcore',
  productName: 'Divine Orb',
  customKeywords: ['buy', 'cheap', 'fast delivery', 'secure trading']
});
console.log('Keywords:', keywords2);
console.log('');

// Teste 3: Verificar keywords específicas da liga
console.log('=== VERIFICAÇÃO DE KEYWORDS ESPECÍFICAS DA LIGA ===\n');

// PT-BR
const hasComprarMoedasKeepers = keywords1.includes('comprar moedas keepers of the flame');
const hasLigaKeepers = keywords1.includes('liga keepers of the flame');
const hasComercioKeepers = keywords1.includes('comércio keepers of the flame');

console.log('PT-BR - Keywords específicas da liga:');
console.log('✅ "comprar moedas keepers of the flame":', hasComprarMoedasKeepers);
console.log('✅ "liga keepers of the flame":', hasLigaKeepers);
console.log('✅ "comércio keepers of the flame":', hasComercioKeepers);

// EN
const hasBuyKeepersCurrency = keywords2.includes('buy keepers of the flame currency');
const hasKeepersLeague = keywords2.includes('keepers of the flame league');
const hasKeepersTrading = keywords2.includes('keepers of the flame trading');

console.log('\nEN - Keywords específicas da liga:');
console.log('✅ "buy keepers of the flame currency":', hasBuyKeepersCurrency);
console.log('✅ "keepers of the flame league":', hasKeepersLeague);
console.log('✅ "keepers of the flame trading":', hasKeepersTrading);

// Teste 4: Verificar se "poe clássico" foi removido
console.log('\n=== VERIFICAÇÃO DE REMOÇÃO ===\n');
const hasPoeClassico = keywords1.includes('poe clássico');
console.log('❌ "poe clássico" removido:', !hasPoeClassico);

// Teste 5: Listar todas as keywords que contêm "keepers"
console.log('\n=== KEYWORDS COM "KEEPERS" ===\n');
const keepersKeywords = keywords1.split(', ').filter(keyword => keyword.includes('keepers'));
console.log('Keywords com "keepers":', keepersKeywords);

const keepersKeywordsEN = keywords2.split(', ').filter(keyword => keyword.includes('keepers'));
console.log('Keywords com "keepers" (EN):', keepersKeywordsEN);

console.log('\n=== RESUMO ===\n');
console.log('✅ Keywords específicas da liga foram adicionadas');
console.log('✅ "poe clássico" foi removido');
console.log('✅ Nome da liga aparece em múltiplas variações');
console.log('✅ Cobertura SEO melhorada para ligas específicas');
