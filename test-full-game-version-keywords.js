// Teste para verificar keywords com gameVersion completo

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

  // Add custom keywords (if provided and relevant)
  if (customKeywords.length > 0) {
    keywords.push(...customKeywords.slice(0, 2)); // Limit to 2 custom keywords
  }

  // Remove duplicates and limit to 8 keywords maximum for natural SEO
  return Array.from(new Set(keywords)).slice(0, 8).join(', ');
}

console.log('=== TESTE: KEYWORDS COM GAMEVERSION COMPLETO ===\n');

// Teste 1: Divine Orb PoE 1 com liga
console.log('1. Divine Orb + PoE 1 + Keepers of the Flame (PT-BR):');
const keywords1 = generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-1',
  league: 'Keepers of the Flame',
  difficulty: 'softcore',
  productName: 'Divine Orb',
  customKeywords: ['comprar', 'barato']
});
console.log('Keywords:', keywords1);
console.log('');

// Teste 2: Divine Orb PoE 2 com liga
console.log('2. Divine Orb + PoE 2 + Keepers of the Flame (PT-BR):');
const keywords2 = generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-2',
  league: 'Keepers of the Flame',
  difficulty: 'softcore',
  productName: 'Divine Orb',
  customKeywords: ['comprar', 'barato']
});
console.log('Keywords:', keywords2);
console.log('');

// Teste 3: Divine Orb PoE 1 SEM liga
console.log('3. Divine Orb + PoE 1 SEM liga (PT-BR):');
const keywords3 = generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-1',
  difficulty: 'softcore',
  productName: 'Divine Orb',
  customKeywords: ['comprar', 'barato']
});
console.log('Keywords:', keywords3);
console.log('');

// Teste 4: Divine Orb PoE 2 SEM liga
console.log('4. Divine Orb + PoE 2 SEM liga (PT-BR):');
const keywords4 = generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-2',
  difficulty: 'softcore',
  productName: 'Divine Orb',
  customKeywords: ['comprar', 'barato']
});
console.log('Keywords:', keywords4);
console.log('');

// Teste 5: Verificar keywords específicas
console.log('=== VERIFICAÇÃO DE KEYWORDS ESPECÍFICAS ===\n');

const tests = [
  { 
    name: 'PoE 1 + Liga', 
    keywords: keywords1, 
    expected: [
      'comprar divine orb keepers of the flame', 
      'comprar divine orb poe 1',
      'comprar divine orb path of exile 1'
    ] 
  },
  { 
    name: 'PoE 2 + Liga', 
    keywords: keywords2, 
    expected: [
      'comprar divine orb keepers of the flame', 
      'comprar divine orb poe 2',
      'comprar divine orb path of exile 2'
    ] 
  },
  { 
    name: 'PoE 1 SEM Liga', 
    keywords: keywords3, 
    expected: [
      'comprar divine orb poe', 
      'comprar divine orb poe 1',
      'comprar divine orb path of exile 1'
    ] 
  },
  { 
    name: 'PoE 2 SEM Liga', 
    keywords: keywords4, 
    expected: [
      'comprar divine orb poe', 
      'comprar divine orb poe 2',
      'comprar divine orb path of exile 2'
    ] 
  }
];

tests.forEach(test => {
  console.log(`${test.name}:`);
  test.expected.forEach(expected => {
    const hasKeyword = test.keywords.includes(expected);
    console.log(`  ${hasKeyword ? '✅' : '❌'} "${expected}": ${hasKeyword}`);
  });
  console.log('');
});

// Teste 6: Teste em inglês
console.log('=== TESTE EM INGLÊS ===\n');

const keywordsEN = generateKeywords({
  locale: 'en',
  gameVersion: 'path-of-exile-1',
  league: 'Keepers of the Flame',
  difficulty: 'softcore',
  productName: 'Divine Orb',
  customKeywords: ['buy', 'cheap']
});

console.log('Divine Orb + PoE 1 + Keepers of the Flame (EN):');
console.log('Keywords:', keywordsEN);
console.log('');

const expectedEN = [
  'buy divine orb keepers of the flame',
  'buy divine orb poe 1',
  'buy divine orb path of exile 1'
];

console.log('Verificação EN:');
expectedEN.forEach(expected => {
  const hasKeyword = keywordsEN.includes(expected);
  console.log(`  ${hasKeyword ? '✅' : '❌'} "${expected}": ${hasKeyword}`);
});
