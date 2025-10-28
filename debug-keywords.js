// Debug da função generateKeywords

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

  console.log('=== DEBUG ===');
  console.log('Input options:', options);
  console.log('Language:', lang);

  // Add base keywords
  const baseKeywords = [
    'path of exile', 'poe', 'poe currency', 'divine orbs', 'exalted orbs', 'chaos orbs',
    'path of trade', 'poe trading', 'poe items', 'poe currency trading', 'buy poe currency',
    'poe league', 'poe builds', 'poe guides', 'poe trading site', 'poe currency exchange'
  ];
  keywords.push(...baseKeywords);
  console.log('After base keywords:', keywords.length);

  // Add custom keywords if provided
  keywords.push(...customKeywords);
  console.log('After custom keywords:', keywords.length);

  // Add game version specific keywords
  if (gameVersion) {
    const gameKeywords = gameVersion === 'path-of-exile-1' 
      ? ['poe 1', 'path of exile 1', 'poe classic', 'poe original']
      : ['poe 2', 'path of exile 2', 'poe sequel', 'poe new'];
    keywords.push(...gameKeywords);
    console.log('After game version keywords:', keywords.length);
  }

  // Add league keywords
  if (league) {
    const leagueKeywords = ['league', 'season', 'softcore', 'hardcore', 'ssf', 'trade league'];
    keywords.push(...leagueKeywords);
    keywords.push(league.toLowerCase());
    console.log('After league keywords:', keywords.length);
  }

  // Add difficulty keywords
  if (difficulty) {
    const difficultyKeywords = difficulty === 'softcore'
      ? ['softcore', 'sc', 'standard', 'trade league']
      : ['hardcore', 'hc', 'hardcore league'];
    keywords.push(...difficultyKeywords);
    console.log('After difficulty keywords:', keywords.length);
  }

  // Add category keywords
  if (category) {
    const categoryKeywords = category === 'currency'
      ? ['currency', 'orbs', 'divine', 'exalted', 'chaos', 'fusing', 'jeweller', 'chromatic']
      : ['items', 'uniques', 'rares', 'magic', 'normal', 'equipment', 'weapons', 'armor'];
    keywords.push(...categoryKeywords);
    console.log('After category keywords:', keywords.length);
  }

  // Add product name keywords
  if (productName) {
    const productWords = productName.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...productWords);
    console.log('After product name keywords:', keywords.length);
  }

  // Add blog title keywords
  if (blogTitle) {
    const titleWords = blogTitle.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...titleWords);
    console.log('After blog title keywords:', keywords.length);
  }

  // Add league slug keywords
  if (leagueSlug) {
    const slugWords = leagueSlug.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...slugWords);
    console.log('After league slug keywords:', keywords.length);
  }

  // Remove duplicates and limit to reasonable number
  const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 15);
  console.log('Final unique keywords count:', uniqueKeywords.length);
  console.log('Final keywords:', uniqueKeywords);

  return uniqueKeywords.join(', ');
}

// Teste com exemplo complexo
console.log('=== TESTE COMPLEXO ===');
const result = generateKeywords({
  locale: 'en',
  gameVersion: 'path-of-exile-1',
  league: 'Keepers of the Flame',
  category: 'currency',
  difficulty: 'softcore',
  customKeywords: ['buy', 'cheap', 'best price', 'fast delivery']
});

console.log('\n=== RESULTADO FINAL ===');
console.log(result);
