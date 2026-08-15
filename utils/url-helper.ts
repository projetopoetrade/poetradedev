/**
 * Utilities for handling currency names and URLs
 */

/**
 * Safely encode product names for use in URLs
 * Handles special characters in currency names
 */
export const encodeProductName = (name: string): string => {
  // First normalize the string (handle accents, etc.) and lowercase
  const normalized = name.toLowerCase().normalize('NFD');

  // Replace spaces with hyphens and remove problematic characters
  const slugified = normalized
    .replace(/[\s\+\&\%\#\@\!\(\)\[\]\{\}\:\;\'\"\,\.\?\<\>\/\\\|]/g, '-')
    .replace(/--+/g, '-')  // Replace multiple hyphens with a single one
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Finally, encode the result for URL safety
  return encodeURIComponent(slugified);
};

/**
 * Decode a slugified product name back to a readable format
 */
export const decodeProductName = (slug: string): string => {
  const decoded = decodeURIComponent(slug);

  // Replace hyphens with spaces and capitalize first letter of each word
  return decoded
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Generate a full, secure URL for a product
 */
/**
 * Generate a full, clean URL for a product
 * Prefer clean URLs: /products/divine-orb (Canonical)
 * Avoid: /products/Divine%20Orb?league=... (Legacy/Search)
 */
export const getProductUrl = (
  productName: string,
  locale: string = 'en',
  // Keep these for backward compatibility or strict searches
  league?: string,
  difficulty?: string,
  gameVersion?: string
): string => {
  // Normalize locale path
  const localePath = locale === 'en' ? '' : `/${locale}`;

  // Create base URL with encoded product name (slug)
  const slug = encodeProductName(productName);

  // URL canônica do produto: /games/<jogo>/products/<slug> (sem liga; resolve
  // para a liga atual via smart-default). Aponta os links internos direto para
  // a canônica — sem o redirect /products/<slug> que duplicava títulos.
  const gv = gameVersion === 'path-of-exile-2' ? 'path-of-exile-2' : 'path-of-exile-1';
  return `${localePath}/games/${gv}/products/${slug}`;
};

/**
 * URL da página de preço de um item no price tracker.
 * Usa o mesmo encodeProductName do sitemap/produtos — antes os links do
 * PriceTrackerClient montavam o slug com replace(/ /g,'-'), o que divergia em
 * nomes com apóstrofo (Blacksmith's Whetstone) e gerava %27 na URL.
 */
export const getPriceTrackerUrl = (itemName: string, locale: string = 'en'): string => {
  const localePath = locale === 'en' ? '' : `/${locale}`;
  return `${localePath}/tools/price-tracker/${encodeProductName(itemName)}`;
};

/**
 * Converte um slug de item num padrão ilike tolerante para buscar o produto
 * no Supabase. encodeProductName colapsa apóstrofos e pontuação em hífen, então
 * "blacksmith-s-whetstone" precisa casar com "Blacksmith's Whetstone" — trocar
 * cada separador por % faz o ilike atravessar a pontuação perdida.
 */
export const slugToIlikePattern = (slug: string): string => {
  const decoded = (() => {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  })();
  return `%${decoded.split('-').filter(Boolean).join('%')}%`;
};

/**
 * Ensure URLs always use HTTPS
 */
export const enforceHttps = (url: string): string => {
  // If it's an absolute URL starting with http, make sure it's https
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  // If it's a relative URL or already https, return as is
  return url;
};

/**
 * Parse a product slug back into a readable name
 */
export const parseProductSlug = (slug: string): string => {
  try {
    return decodeProductName(slug);
  } catch (error) {
    // Fallback in case of decoding errors
    return slug.replace(/-/g, ' ');
  }
}; 