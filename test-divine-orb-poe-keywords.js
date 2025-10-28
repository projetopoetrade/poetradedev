// Teste para verificar se "comprar divine orb poe" existe nas keywords

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

console.log('=== TESTE: VERIFICAR "COMPRAR DIVINE ORB POE" ===\n');

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

// Teste 2: Divine Orb SEM liga em PT-BR
console.log('2. Divine Orb SEM liga (PT-BR):');
const keywords2 = generateKeywords({
  locale: 'pt-br',
  gameVersion: 'path-of-exile-1',
  difficulty: 'softcore',
  productName: 'Divine Orb',
  customKeywords: ['comprar', 'barato', 'entrega rápida', 'comércio seguro']
});
console.log('Keywords:', keywords2);
console.log('');

// Teste 3: Verificar se "comprar divine orb poe" existe
console.log('=== VERIFICAÇÃO DE "COMPRAR DIVINE ORB POE" ===\n');

const hasComprarDivineOrbPoe1 = keywords1.includes('comprar divine orb poe');
const hasComprarDivineOrbPoe2 = keywords2.includes('comprar divine orb poe');

console.log('Com liga "Keepers of the Flame":');
console.log('✅ "comprar divine orb poe" presente:', hasComprarDivineOrbPoe1);

console.log('\nSem liga:');
console.log('✅ "comprar divine orb poe" presente:', hasComprarDivineOrbPoe2);

// Teste 4: Verificar todas as keywords que contêm "comprar"
console.log('\n=== KEYWORDS COM "COMPRAR" ===\n');
const comprarKeywords1 = keywords1.split(', ').filter(keyword => keyword.includes('comprar'));
const comprarKeywords2 = keywords2.split(', ').filter(keyword => keyword.includes('comprar'));

console.log('Com liga - Keywords com "comprar":', comprarKeywords1);
console.log('Sem liga - Keywords com "comprar":', comprarKeywords2);

// Teste 5: Verificar se existe "comprar divine orb" sem "poe"
console.log('\n=== VERIFICAÇÃO DE "COMPRAR DIVINE ORB" ===\n');
const hasComprarDivineOrb1 = keywords1.includes('comprar divine orb');
const hasComprarDivineOrb2 = keywords2.includes('comprar divine orb');

console.log('Com liga - "comprar divine orb":', hasComprarDivineOrb1);
console.log('Sem liga - "comprar divine orb":', hasComprarDivineOrb2);

// Teste 6: Verificar se existe "comprar divine orb poe" em outras variações
console.log('\n=== VERIFICAÇÃO DE VARIAÇÕES ===\n');
const allKeywords1 = keywords1.split(', ');
const allKeywords2 = keywords2.split(', ');

const divineOrbVariations1 = allKeywords1.filter(keyword => 
  keyword.includes('divine') && keyword.includes('orb')
);
const divineOrbVariations2 = allKeywords2.filter(keyword => 
  keyword.includes('divine') && keyword.includes('orb')
);

console.log('Com liga - Variações com "divine orb":', divineOrbVariations1);
console.log('Sem liga - Variações com "divine orb":', divineOrbVariations2);

console.log('\n=== CONCLUSÃO ===\n');
console.log('❌ "comprar divine orb poe" NÃO está sendo gerada automaticamente');
console.log('✅ "comprar divine orb keepers of the flame" está sendo gerada');
console.log('✅ "comprar" está sendo gerada como custom keyword');
console.log('✅ "divine orb" está sendo gerada como product name');
