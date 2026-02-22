import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildAbsoluteUrl(pathOrUrl: string): string {
  try {
    const url = new URL(pathOrUrl, process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net");
    return url.toString();
  } catch {
    return `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
  }
}

export function getHreflangAlternates(pathsByLocale: Record<string, string>, defaultLocalePath?: string) {
  const entries = Object.entries(pathsByLocale);
  const languages: Record<string, string> = {};

  // Ensure we only have unique locale codes
  const uniqueLocales = new Set<string>();

  for (const [locale, path] of entries) {
    // Normalize locale codes to avoid duplicates (e.g., 'pt-br' vs 'pt_br')
    const normalizedLocale = locale.toLowerCase().replace('_', '-');

    if (!uniqueLocales.has(normalizedLocale)) {
      uniqueLocales.add(normalizedLocale);
      languages[normalizedLocale] = buildAbsoluteUrl(path);
    }
  }

  // Add x-default if provided and it's different from all existing locales
  if (defaultLocalePath) {
    const defaultUrl = buildAbsoluteUrl(defaultLocalePath);
    // Only add x-default if it's not already covered by another locale
    const isDuplicate = Object.values(languages).some(url => url === defaultUrl);
    if (!isDuplicate) {
      languages['x-default'] = defaultUrl;
    }
  }

  return { languages };
}

export function buildCanonical(pathOrUrl: string, locale?: string, defaultLocale: string = 'en') {
  // Force lowercase to avoid canonical mismatches (e.g. /products/Divine-Orb vs /products/divine-orb)
  pathOrUrl = pathOrUrl.toLowerCase();
  // For default locale with as-needed prefix, use the path without locale
  if (locale === defaultLocale) {
    // Remove the locale prefix from the path for the default locale
    const pathWithoutLocale = pathOrUrl.replace(`/${defaultLocale}`, '') || '/';
    const absoluteUrl = buildAbsoluteUrl(pathWithoutLocale);
    // Ensure trailing slash is removed for canonical (except for root)
    return pathWithoutLocale === '/' ? absoluteUrl : absoluteUrl.replace(/\/$/, '');
  }
  const absoluteUrl = buildAbsoluteUrl(pathOrUrl);
  // Ensure trailing slash is removed for canonical
  return absoluteUrl.replace(/\/$/, '');
}

export function formatPrice(price: number, currency: string = 'USD', locale: string = 'en-US') {
  // Default to USD if currency is missing or invalid
  const currencyCode = currency ? currency.toUpperCase() : 'USD';

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(price);
  } catch (error) {
    // Fallback to basic formatting if there's an error with the currency code
    console.error(`Error formatting price with currency ${currencyCode}:`, error);
    return `${currencyCode} ${price.toFixed(2)}`;
  }
}

// Base keywords for the site - focused and natural
const BASE_KEYWORDS = {
  en: [
    'path of exile', 'poe currency', 'poe trading', 'path of trade'
  ],
  'pt-br': [
    'path of exile', 'poe currency', 'comércio poe', 'path of trade'
  ]
};

// Game version specific keywords - focused
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

// League specific keywords - focused
const LEAGUE_KEYWORDS = {
  en: ['league'],
  'pt-br': ['liga']
};

// Product category keywords
const PRODUCT_CATEGORY_KEYWORDS: Record<string, { en: string[]; 'pt-br': string[] }> = {
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

// Difficulty keywords
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

export interface KeywordOptions {
  locale: string;
  gameVersion?: 'path-of-exile-1' | 'path-of-exile-2';
  league?: string;
  category?: string;
  difficulty?: 'softcore' | 'hardcore';
  productName?: string;
  blogTitle?: string;
  leagueSlug?: string;
  customKeywords?: string[];
}

export function generateKeywords(options: KeywordOptions): string {
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

  const keywords: string[] = [];
  const lang = locale === 'pt-br' ? 'pt-br' : 'en';

  // Add base keywords (essential only)
  keywords.push(...BASE_KEYWORDS[lang]);

  // Add product name as primary keyword
  if (productName) {
    keywords.push(productName.toLowerCase());
  }

  // Add blog title as primary keyword and extract individual words
  if (blogTitle) {
    // Add full title as primary keyword
    keywords.push(blogTitle.toLowerCase());

    // Extract individual words from title (filter out common words)
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'o', 'a', 'e', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas', 'para', 'com', 'por', 'sobre'];
    const titleWords = blogTitle.toLowerCase()
      .split(/[\s\-_]+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));

    keywords.push(...titleWords);
  }

  // Add league name as primary keyword
  if (league) {
    keywords.push(league.toLowerCase());
  }

  // Add league slug as primary keyword
  if (leagueSlug) {
    keywords.push(leagueSlug.toLowerCase());
  }

  // Add game version (contextual)
  if (gameVersion && GAME_VERSION_KEYWORDS[gameVersion]) {
    keywords.push(...GAME_VERSION_KEYWORDS[gameVersion][lang]);
  }

  // Add difficulty (contextual)
  if (difficulty && DIFFICULTY_KEYWORDS[difficulty]) {
    keywords.push(...DIFFICULTY_KEYWORDS[difficulty][lang]);
  }

  // Add category (contextual)
  if (category && PRODUCT_CATEGORY_KEYWORDS[category]) {
    keywords.push(...PRODUCT_CATEGORY_KEYWORDS[category][lang]);
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
  const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 8);

  return uniqueKeywords.join(', ');
}

// Generate focused, natural titles for SEO
export function generateFocusedTitle(options: {
  locale: string;
  productName?: string;
  gameVersion?: 'path-of-exile-1' | 'path-of-exile-2';
  league?: string;
  difficulty?: 'softcore' | 'hardcore';
  pageType: 'homepage' | 'product' | 'game' | 'league' | 'blog';
  blogTitle?: string;
}): string {
  const { locale, productName, gameVersion, league, difficulty, pageType, blogTitle } = options;
  const lang = locale === 'pt-br' ? 'pt-br' : 'en';
  const brand = 'Path of Trade';

  switch (pageType) {
    case 'homepage':
      return lang === 'en'
        ? `Buy PoE Currency: Divine, Exalted, Chaos | ${brand}`
        : `Comprar Moedas PoE: Divine, Exalted, Chaos | ${brand}`;

    case 'product':
      if (!productName) return brand;

      const gameVersionText = gameVersion === 'path-of-exile-1' ? 'PoE 1' : 'PoE 2';
      const leagueText = league ? `, ${league}` : '';
      const difficultyText = difficulty ? ` (${difficulty})` : '';

      return lang === 'en'
        ? `Buy ${productName} — ${gameVersionText}${leagueText}${difficultyText} | ${brand}`
        : `Comprar ${productName} — ${gameVersionText}${leagueText}${difficultyText} | ${brand}`;

    case 'game':
      const gameName = gameVersion === 'path-of-exile-1' ? 'Path of Exile 1' : 'Path of Exile 2';
      return lang === 'en'
        ? `${gameName} Currency Trading | ${brand}`
        : `Comércio de Moedas ${gameName} | ${brand}`;

    case 'league':
      const leagueName = league || 'League';
      return lang === 'en'
        ? `${leagueName} Currency Trading | ${brand}`
        : `Comércio de Moedas ${leagueName} | ${brand}`;

    case 'blog':
      return blogTitle || brand;

    default:
      return brand;
  }
}

// Generate focused, natural descriptions for SEO
export function generateFocusedDescription(options: {
  locale: string;
  productName?: string;
  gameVersion?: 'path-of-exile-1' | 'path-of-exile-2';
  league?: string;
  difficulty?: 'softcore' | 'hardcore';
  pageType: 'homepage' | 'product' | 'game' | 'league' | 'blog';
  blogTitle?: string;
}): string {
  const { locale, productName, gameVersion, league, difficulty, pageType, blogTitle } = options;
  const lang = locale === 'pt-br' ? 'pt-br' : 'en';

  switch (pageType) {
    case 'homepage':
      return lang === 'en'
        ? 'Buy PoE currency safely and quickly. Divine Orbs, Exalted Orbs, Chaos Orbs and more. Fast delivery, secure trading.'
        : 'Compre moedas PoE com segurança e rapidez. Divine Orbs, Exalted Orbs, Chaos Orbs e mais. Entrega rápida, comércio seguro.';

    case 'product':
      if (!productName) return '';

      const gameVersionText = gameVersion === 'path-of-exile-1' ? 'Path of Exile 1' : 'Path of Exile 2';
      const leagueText = league ? ` in ${league}` : '';
      const difficultyText = difficulty ? ` (${difficulty})` : '';

      return lang === 'en'
        ? `Buy ${productName} for ${gameVersionText}${leagueText}${difficultyText}. Fast delivery, secure trading, competitive prices.`
        : `Compre ${productName} para ${gameVersionText}${leagueText}${difficultyText}. Entrega rápida, comércio seguro, preços competitivos.`;

    case 'game':
      const gameName = gameVersion === 'path-of-exile-1' ? 'Path of Exile 1' : 'Path of Exile 2';
      return lang === 'en'
        ? `Trade ${gameName} currency safely. Buy and sell Divine Orbs, Exalted Orbs, and more with fast delivery.`
        : `Comercie moedas ${gameName} com segurança. Compre e venda Divine Orbs, Exalted Orbs e mais com entrega rápida.`;

    case 'league':
      const leagueName = league || 'League';
      return lang === 'en'
        ? `Trade currency in ${leagueName}. Buy and sell PoE currency with fast delivery and secure trading.`
        : `Comercie moedas na ${leagueName}. Compre e venda moedas PoE com entrega rápida e comércio seguro.`;

    case 'blog':
      return blogTitle || '';

    default:
      return '';
  }
}

export function buildBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${baseUrl}${item.url}`,
    })),
  };
}

