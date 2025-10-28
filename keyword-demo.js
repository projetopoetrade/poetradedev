// Demonstração das keywords geradas pela função generateKeywords

// Simulando a função para mostrar os resultados
const BASE_KEYWORDS = {
  en: [
    'path of exile', 'poe', 'poe currency', 'divine orbs', 'exalted orbs', 'chaos orbs',
    'path of trade', 'poe trading', 'poe items', 'poe currency trading', 'buy poe currency',
    'poe league', 'poe builds', 'poe guides', 'poe trading site', 'poe currency exchange'
  ],
  'pt-br': [
    'path of exile', 'poe', 'moedas poe', 'divine orbs', 'exalted orbs', 'chaos orbs',
    'path of trade', 'comércio poe', 'itens poe', 'troca de moedas poe', 'comprar moedas poe',
    'liga poe', 'builds poe', 'guias poe', 'site de comércio poe', 'troca de moedas poe'
  ]
};

const GAME_VERSION_KEYWORDS = {
  'path-of-exile-1': {
    en: ['poe 1', 'path of exile 1', 'poe classic', 'poe original'],
    'pt-br': ['poe 1', 'path of exile 1', 'poe clássico', 'poe original']
  },
  'path-of-exile-2': {
    en: ['poe 2', 'path of exile 2', 'poe sequel', 'poe new'],
    'pt-br': ['poe 2', 'path of exile 2', 'poe sequência', 'poe novo']
  }
};

const LEAGUE_KEYWORDS = {
  en: ['league', 'season', 'softcore', 'hardcore', 'ssf', 'trade league'],
  'pt-br': ['liga', 'temporada', 'softcore', 'hardcore', 'ssf', 'liga de comércio']
};

const PRODUCT_CATEGORY_KEYWORDS = {
  'currency': {
    en: ['currency', 'orbs', 'divine', 'exalted', 'chaos', 'fusing', 'jeweller', 'chromatic'],
    'pt-br': ['moedas', 'orbs', 'divine', 'exalted', 'chaos', 'fusing', 'jeweller', 'chromatic']
  },
  'items': {
    en: ['items', 'uniques', 'rares', 'magic', 'normal', 'equipment', 'weapons', 'armor'],
    'pt-br': ['itens', 'uniques', 'raros', 'mágicos', 'normais', 'equipamentos', 'armas', 'armaduras']
  }
};

const DIFFICULTY_KEYWORDS = {
  'softcore': {
    en: ['softcore', 'sc', 'standard', 'trade league'],
    'pt-br': ['softcore', 'sc', 'padrão', 'liga de comércio']
  },
  'hardcore': {
    en: ['hardcore', 'hc', 'hardcore league'],
    'pt-br': ['hardcore', 'hc', 'liga hardcore']
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

  // Add base keywords
  keywords.push(...BASE_KEYWORDS[lang]);

  // Add custom keywords if provided
  keywords.push(...customKeywords);

  // Add game version specific keywords
  if (gameVersion && GAME_VERSION_KEYWORDS[gameVersion]) {
    keywords.push(...GAME_VERSION_KEYWORDS[gameVersion][lang]);
  }

  // Add league keywords
  if (league) {
    keywords.push(...LEAGUE_KEYWORDS[lang]);
    keywords.push(league.toLowerCase());
  }

  // Add difficulty keywords
  if (difficulty && DIFFICULTY_KEYWORDS[difficulty]) {
    keywords.push(...DIFFICULTY_KEYWORDS[difficulty][lang]);
  }

  // Add category keywords
  if (category && PRODUCT_CATEGORY_KEYWORDS[category]) {
    keywords.push(...PRODUCT_CATEGORY_KEYWORDS[category][lang]);
  }

  // Add product name keywords
  if (productName) {
    const productWords = productName.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...productWords);
  }

  // Add blog title keywords
  if (blogTitle) {
    const titleWords = blogTitle.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...titleWords);
  }

  // Add league slug keywords
  if (leagueSlug) {
    const slugWords = leagueSlug.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...slugWords);
  }

  // Remove duplicates and limit to reasonable number
  const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 15);

  return uniqueKeywords.join(', ');
}

// Exemplos de uso
console.log('=== EXEMPLOS DE KEYWORDS GERADAS ===\n');

console.log('1. PÁGINA INICIAL (EN):');
console.log(generateKeywords({
  locale: 'en',
  customKeywords: ['homepage', 'main page', 'poe trading site']
}));
console.log('\n');

console.log('2. PÁGINA INICIAL (PT-BR):');
console.log(generateKeywords({
  locale: 'pt-br',
  customKeywords: ['homepage', 'main page', 'poe trading site']
}));
console.log('\n');

console.log('3. PRODUTO: Divine Orb (EN):');
console.log(generateKeywords({
  locale: 'en',
  productName: 'Divine Orb',
  customKeywords: ['buy', 'cheap', 'fast delivery', 'secure trading']
}));
console.log('\n');

console.log('4. PRODUTOS: PoE 1 Currency, Keepers of the Flame, Softcore (PT-BR):');
console.log(generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-1',
  league: 'Keepers of the Flame',
  category: 'currency',
  difficulty: 'softcore',
  customKeywords: ['buy', 'cheap', 'best price', 'fast delivery']
}));
console.log('\n');

console.log('5. LEAGUE: Keepers of the Flame (EN):');
console.log(generateKeywords({
  locale: 'en',
  leagueSlug: 'keepers-of-the-flame',
  customKeywords: ['poe league', 'league guide', 'patch notes', 'league starters', 'buy currency']
}));
console.log('\n');

console.log('6. BLOG: Best PoE Builds for 3.27 (EN):');
console.log(generateKeywords({
  locale: 'en',
  blogTitle: 'Best PoE Builds for 3.27',
  customKeywords: ['poe guide', 'path of exile guide', 'poe tips', 'poe tutorial']
}));
console.log('\n');

console.log('7. GAME VERSION: Path of Exile 2 (PT-BR):');
console.log(generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-2',
  customKeywords: ['buy currency', 'trading', 'items', 'guides']
}));
console.log('\n');

console.log('8. LEAGUE POR DIFICULDADE: Settlers of Kalguur Hardcore (EN):');
console.log(generateKeywords({
  locale: 'en',
  gameVersion: 'path-of-exile-1',
  league: 'Settlers of Kalguur',
  difficulty: 'hardcore',
  customKeywords: ['buy currency', 'poe items', 'trading']
}));
