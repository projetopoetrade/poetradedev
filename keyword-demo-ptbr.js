// Demonstração das keywords em português com foco em SEO de compra

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
    
    if (lang === 'pt-br') {
      const gameKeywordsPT = gameVersion === 'path-of-exile-1' 
        ? ['comprar moedas poe 1', 'poe 1 currency', 'path of exile 1 moedas', 'poe clássico moedas', 'comprar divine poe 1']
        : ['comprar moedas poe 2', 'poe 2 currency', 'path of exile 2 moedas', 'poe sequência moedas', 'comprar divine poe 2'];
      keywords.push(...gameKeywordsPT);
    } else {
      keywords.push(...gameKeywords);
    }
  }

  // Add difficulty keywords
  if (difficulty) {
    const difficultyKeywords = difficulty === 'softcore'
      ? ['softcore', 'sc', 'standard', 'trade league']
      : ['hardcore', 'hc', 'hardcore league'];
    
    if (lang === 'pt-br') {
      const difficultyKeywordsPT = difficulty === 'softcore'
        ? ['comprar moedas softcore', 'softcore poe currency', 'liga softcore moedas', 'sc poe moedas', 'comércio softcore']
        : ['comprar moedas hardcore', 'hardcore poe currency', 'liga hardcore moedas', 'hc poe moedas', 'comércio hardcore'];
      keywords.push(...difficultyKeywordsPT);
    } else {
      keywords.push(...difficultyKeywords);
    }
  }

  // Add category keywords
  if (category) {
    const categoryKeywords = category === 'currency'
      ? ['currency', 'orbs', 'divine', 'exalted', 'chaos', 'fusing', 'jeweller', 'chromatic']
      : ['items', 'uniques', 'rares', 'magic', 'normal', 'equipment', 'weapons', 'armor'];
    
    if (lang === 'pt-br') {
      const categoryKeywordsPT = category === 'currency'
        ? ['comprar divine orbs', 'comprar chaos orbs', 'comprar exalted orbs', 'comprar fusing orbs', 'comprar jeweller orbs', 'comprar chromatic orbs', 'moedas poe baratas', 'orbs poe preço']
        : ['comprar itens poe', 'comprar uniques poe', 'comprar equipamentos poe', 'itens raros poe', 'armas poe', 'armaduras poe', 'equipamentos path of exile'];
      keywords.push(...categoryKeywordsPT);
    } else {
      keywords.push(...categoryKeywords);
    }
  }

  // Add league keywords
  if (league) {
    const leagueKeywords = ['league', 'season', 'softcore', 'hardcore', 'ssf', 'trade league'];
    
    if (lang === 'pt-br') {
      const leagueKeywordsPT = ['comprar moedas liga', 'liga poe moedas', 'temporada poe currency', 'softcore moedas', 'hardcore currency', 'comércio liga poe'];
      keywords.push(...leagueKeywordsPT);
    } else {
      keywords.push(...leagueKeywords);
    }
  }

  // Add base keywords (lowest priority)
  const baseKeywords = lang === 'pt-br' ? [
    'comprar divine orbs', 'comprar moedas poe', 'comprar chaos orbs', 'comprar exalted orbs',
    'poe currency brasil', 'moedas path of exile', 'divine orbs barato', 'chaos orbs preço',
    'comércio poe brasil', 'site poe confiável', 'comprar poe currency', 'moedas poe seguras',
    'path of exile moedas', 'poe trading brasil', 'comprar orbs poe', 'poe currency shop'
  ] : [
    'path of exile', 'poe', 'poe currency', 'divine orbs', 'exalted orbs', 'chaos orbs',
    'path of trade', 'poe trading', 'poe items', 'poe currency trading', 'buy poe currency',
    'poe league', 'poe builds', 'poe guides', 'poe trading site', 'poe currency exchange'
  ];
  keywords.push(...baseKeywords);

  // Remove duplicates and limit to reasonable number
  const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 15);

  return uniqueKeywords.join(', ');
}

// Exemplos de uso em português
console.log('=== KEYWORDS EM PORTUGUÊS - FOCO EM SEO DE COMPRA ===\n');

console.log('1. PÁGINA INICIAL (PT-BR):');
console.log(generateKeywords({
  locale: 'pt-br',
  customKeywords: ['homepage', 'main page', 'poe trading site']
}));
console.log('\n');

console.log('2. PRODUTO: Divine Orb (PT-BR):');
console.log(generateKeywords({
  locale: 'pt-br',
  productName: 'Divine Orb',
  customKeywords: ['comprar', 'barato', 'entrega rápida', 'comércio seguro']
}));
console.log('\n');

console.log('3. PRODUTOS: PoE 1 Currency, Keepers of the Flame, Softcore (PT-BR):');
console.log(generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-1',
  league: 'Keepers of the Flame',
  category: 'currency',
  difficulty: 'softcore',
  customKeywords: ['comprar', 'barato', 'melhor preço', 'entrega rápida']
}));
console.log('\n');

console.log('4. LEAGUE: Keepers of the Flame (PT-BR):');
console.log(generateKeywords({
  locale: 'pt-br',
  leagueSlug: 'keepers-of-the-flame',
  customKeywords: ['liga poe', 'guia liga', 'patch notes', 'league starters', 'comprar moedas']
}));
console.log('\n');

console.log('5. BLOG: Melhores Builds PoE para 3.27 (PT-BR):');
console.log(generateKeywords({
  locale: 'pt-br',
  blogTitle: 'Melhores Builds PoE para 3.27',
  customKeywords: ['guia poe', 'guia path of exile', 'dicas poe', 'tutorial poe']
}));
console.log('\n');

console.log('6. GAME VERSION: Path of Exile 2 (PT-BR):');
console.log(generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-2',
  customKeywords: ['comprar moedas', 'comércio', 'itens', 'guias']
}));
console.log('\n');

console.log('7. LEAGUE POR DIFICULDADE: Settlers of Kalguur Hardcore (PT-BR):');
console.log(generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-1',
  league: 'Settlers of Kalguur',
  difficulty: 'hardcore',
  customKeywords: ['comprar moedas', 'itens poe', 'comércio']
}));
