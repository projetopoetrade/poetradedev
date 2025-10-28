// Teste das keywords para Exalted Orb + Keepers of the Flame

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
      'path of exile', 'poe currency', 'poe trading', 'path of trade'
    ],
    'pt-br': [
      'path of exile', 'poe currency', 'comércio poe', 'path of trade'
    ]
  };

  // League keywords
  const LEAGUE_KEYWORDS = {
    en: ['league'],
    'pt-br': ['liga']
  };

  // Add base keywords (essential only)
  keywords.push(...BASE_KEYWORDS[lang]);

  // Add product name as primary keyword
  if (productName) {
    keywords.push(productName.toLowerCase());
  }

  // Add blog title as primary keyword
  if (blogTitle) {
    keywords.push(blogTitle.toLowerCase());
  }

  // Add league name as primary keyword
  if (league) {
    keywords.push(league.toLowerCase());
  }

  // Add league slug as primary keyword
  if (leagueSlug) {
    keywords.push(leagueSlug.toLowerCase());
  }

  // Add league context (minimal)
  if (league) {
    keywords.push(...LEAGUE_KEYWORDS[lang]);
  }

  // Add specific product + league combinations for better SEO
  if (productName && league) {
    if (lang === 'en') {
      keywords.push(`buy ${productName.toLowerCase()} ${league.toLowerCase()}`);
    } else {
      keywords.push(`comprar ${productName.toLowerCase()} ${league.toLowerCase()}`);
    }
  }

  // Add custom keywords (if provided and relevant)
  if (customKeywords.length > 0) {
    keywords.push(...customKeywords.slice(0, 2)); // Limit to 2 custom keywords
  }

  // Remove duplicates and limit to 8 keywords maximum for natural SEO
  return Array.from(new Set(keywords)).slice(0, 8).join(', ');
}

console.log('=== TESTE: EXALTED ORB + KEEPERS OF THE FLAME ===\n');

// Teste 1: Exalted Orb com liga "Keepers of the Flame" em PT-BR
console.log('1. Exalted Orb + Keepers of the Flame + Softcore (PT-BR):');
const keywords1 = generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-1',
  league: 'Keepers of the Flame',
  difficulty: 'softcore',
  productName: 'Exalted Orb',
  customKeywords: ['comprar', 'barato', 'entrega rápida', 'comércio seguro']
});
console.log('Keywords:', keywords1);
console.log('');

// Teste 2: Exalted Orb com liga "Keepers of the Flame" em EN
console.log('2. Exalted Orb + Keepers of the Flame + Softcore (EN):');
const keywords2 = generateKeywords({
  locale: 'en',
  gameVersion: 'path-of-exile-1',
  league: 'Keepers of the Flame',
  difficulty: 'softcore',
  productName: 'Exalted Orb',
  customKeywords: ['buy', 'cheap', 'fast delivery', 'secure trading']
});
console.log('Keywords:', keywords2);
console.log('');

// Teste 3: Verificar keywords específicas
console.log('=== VERIFICAÇÃO DE KEYWORDS ESPECÍFICAS ===\n');

// PT-BR
const hasComprarExaltedOrbKeepers = keywords1.includes('comprar exalted orb keepers of the flame');
const hasExaltedOrb = keywords1.includes('exalted orb');
const hasKeepersOfTheFlame = keywords1.includes('keepers of the flame');

console.log('PT-BR - Keywords específicas:');
console.log('✅ "comprar exalted orb keepers of the flame":', hasComprarExaltedOrbKeepers);
console.log('✅ "exalted orb":', hasExaltedOrb);
console.log('✅ "keepers of the flame":', hasKeepersOfTheFlame);

// EN
const hasBuyExaltedOrbKeepers = keywords2.includes('buy exalted orb keepers of the flame');
const hasExaltedOrbEN = keywords2.includes('exalted orb');
const hasKeepersOfTheFlameEN = keywords2.includes('keepers of the flame');

console.log('\nEN - Keywords específicas:');
console.log('✅ "buy exalted orb keepers of the flame":', hasBuyExaltedOrbKeepers);
console.log('✅ "exalted orb":', hasExaltedOrbEN);
console.log('✅ "keepers of the flame":', hasKeepersOfTheFlameEN);

// Teste 4: Comparar com Divine Orb
console.log('\n=== COMPARAÇÃO: DIVINE ORB vs EXALTED ORB ===\n');

// Simular Divine Orb para comparação
const divineOrbKeywords = generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-1',
  league: 'Keepers of the Flame',
  difficulty: 'softcore',
  productName: 'Divine Orb',
  customKeywords: ['comprar', 'barato', 'entrega rápida', 'comércio seguro']
});

console.log('Divine Orb (PT-BR):');
console.log(divineOrbKeywords);
console.log('');

console.log('Exalted Orb (PT-BR):');
console.log(keywords1);
console.log('');

// Verificar diferenças
const divineKeywords = divineOrbKeywords.split(', ');
const exaltedKeywords = keywords1.split(', ');

const differentKeywords = exaltedKeywords.filter(keyword => !divineKeywords.includes(keyword));
const sameKeywords = exaltedKeywords.filter(keyword => divineKeywords.includes(keyword));

console.log('Keywords diferentes:', differentKeywords);
console.log('Keywords iguais:', sameKeywords.length, 'keywords');
