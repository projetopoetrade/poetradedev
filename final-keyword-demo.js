// Demonstração final das keywords geradas pela função generateKeywords

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

  // Add specific keywords based on context
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

  if (league) {
    keywords.push(league.toLowerCase());
  }

  // Add game version specific keywords
  if (gameVersion) {
    const gameKeywords = gameVersion === 'path-of-exile-1' 
      ? ['poe 1', 'path of exile 1', 'poe classic', 'poe original']
      : ['poe 2', 'path of exile 2', 'poe sequel', 'poe new'];
    keywords.push(...gameKeywords);
  }

  // Add difficulty keywords
  if (difficulty) {
    const difficultyKeywords = difficulty === 'softcore'
      ? ['softcore', 'sc', 'standard', 'trade league']
      : ['hardcore', 'hc', 'hardcore league'];
    keywords.push(...difficultyKeywords);
  }

  // Add category keywords
  if (category) {
    const categoryKeywords = category === 'currency'
      ? ['currency', 'orbs', 'divine', 'exalted', 'chaos', 'fusing', 'jeweller', 'chromatic']
      : ['items', 'uniques', 'rares', 'magic', 'normal', 'equipment', 'weapons', 'armor'];
    keywords.push(...categoryKeywords);
  }

  // Add league keywords
  if (league) {
    const leagueKeywords = ['league', 'season', 'softcore', 'hardcore', 'ssf', 'trade league'];
    keywords.push(...leagueKeywords);
  }

  // Add base keywords (lowest priority)
  const baseKeywords = [
    'path of exile', 'poe', 'poe currency', 'divine orbs', 'exalted orbs', 'chaos orbs',
    'path of trade', 'poe trading', 'poe items', 'poe currency trading', 'buy poe currency',
    'poe league', 'poe builds', 'poe guides', 'poe trading site', 'poe currency exchange'
  ];
  keywords.push(...baseKeywords);

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
