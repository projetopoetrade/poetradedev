// sitemap-data-fetchers.js

const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const { createClient: createSanityClient } = require('@sanity/client');

// --- Environment Variables ---
// IMPORTANT: Ensure these variables are available in your Vercel build environment!
// Adjust these names if your environment variables are named differently.
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const SANITY_API_VERSION = '2023-05-03'; // Or your preferred version
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let sanityClient;
let supabaseClient;

// --- Initialize Sanity Client ---
if (SANITY_PROJECT_ID && SANITY_DATASET) {
  sanityClient = createSanityClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    useCdn: true, // Use CDN for performance; set to false if you need real-time data
  });
  console.log("Sitemap: Sanity client configured.");
} else {
  console.warn("Sitemap: Sanity environment variables missing. Sanity data will not be fetched.");
}

// --- Initialize Supabase Client ---
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("Sitemap: Supabase client configured.");
} else {
  console.warn("Sitemap: Supabase environment variables missing. Supabase data will not be fetched.");
}

// --- Data Fetching Functions ---

/**
 * Fetches blog posts from Sanity.
 * Selects slug and the most recent date (publishedAt or _updatedAt).
 */
async function getSitemapPosts() {
  if (!sanityClient) return []; // Return empty if client isn't configured
  try {
    const query = `*[_type == "post" && defined(slug.current)]{
      "slug": slug.current,
      "language": language,
      "lastmod": coalesce(publishedAt, _updatedAt) // Use publishedAt, fallback to _updatedAt
    }`;
    const posts = await sanityClient.fetch(query);
    console.log(`Sitemap: Fetched ${posts?.length || 0} posts from Sanity.`);
    // Ensure lastmod is in ISO format
    return (posts || []).map(post => ({
        ...post,
        lastmod: post.lastmod ? new Date(post.lastmod).toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error("Sitemap: Error fetching posts from Sanity:", error);
    return [];
  }
}

/**
 * Fetches all products from Supabase.
 * Selects only the columns needed for the sitemap URL and lastmod.
 */
async function getSitemapProducts() {
  if (!supabaseClient) return []; // Return empty if client isn't configured
  try {
    // IMPORTANT: Ensure 'updated_at' (or your timestamp column) exists and is selected.
    const { data: products, error } = await supabaseClient
      .from('products')
      .select('name, slug, gameVersion, league, difficulty, updated_at'); // Adjust 'updated_at' if needed

    if (error) throw error;
    console.log(`Sitemap: Fetched ${products?.length || 0} products from Supabase.`);
    // Rename updated_at to lastmod for consistency, or use it directly in next-sitemap.config
    return (products || []).map(p => ({
        ...p,
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error("Sitemap: Error fetching products from Supabase:", error);
    return [];
  }
}

/**
 * Fetches leagues by game version from Supabase.
 * Selects only the columns needed for the sitemap URL and lastmod.
 */
async function getSitemapLeagues(gameVersion) {
  if (!supabaseClient) return []; // Return empty if client isn't configured
  try {
    // IMPORTANT: Ensure 'updated_at' (or your timestamp column) exists and is selected.
    const { data: leagues, error } = await supabaseClient
      .from('leagues')
      .select('name, gameVersion, updated_at') // Adjust 'updated_at' if needed
      .eq('gameVersion', gameVersion);

    if (error) throw error;
    console.log(`Sitemap: Fetched ${leagues?.length || 0} leagues for ${gameVersion} from Supabase.`);
    return (leagues || []).map(l => ({
        ...l,
        lastmod: l.updated_at ? new Date(l.updated_at).toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Sitemap: Error fetching leagues for ${gameVersion} from Supabase:`, error);
    return [];
  }
}

const KEY_PRODUCT_SLUGS = ['divine-orb', 'chaos-orb', 'mirror-of-kalandra'];
const CATEGORY_SLUGS = ['currency', 'items', 'services'];

/**
 * Generates all league × slug page combinations for the sitemap.
 * Uses Supabase active leagues (same source as the product data).
 */
async function getSitemapLeagueSlugPages() {
  if (!supabaseClient) return [];
  try {
    const { data: leagues, error } = await supabaseClient
      .from('leagues')
      .select('name, gameVersion, updated_at')
      .eq('isActive', true);

    if (error) throw error;

    const result = [];
    for (const league of (leagues || [])) {
      const leagueSlug = league.name.toLowerCase().replace(/\s+/g, '-');
      const lastmod = league.updated_at
        ? new Date(league.updated_at).toISOString()
        : new Date().toISOString();
      const slugs = [...CATEGORY_SLUGS, ...KEY_PRODUCT_SLUGS];
      for (const slug of slugs) {
        result.push({
          leagueSlug,
          gameVersion: league.gameVersion,
          slug,
          lastmod,
        });
      }
    }
    console.log(`Sitemap: Generated ${result.length} league × slug pages from Supabase.`);
    return result;
  } catch (error) {
    console.error('Sitemap: Error fetching league slug pages from Supabase:', error);
    return [];
  }
}

/**
 * Fetches all published builds from Supabase.
 * Returns slug and updated_at for sitemap generation.
 */
async function getSitemapBuilds() {
  if (!supabaseClient) return [];
  try {
    const { data: builds, error } = await supabaseClient
      .from('builds')
      .select('slug, updated_at')
      .eq('is_published', true);

    if (error) throw error;
    console.log(`Sitemap: Fetched ${builds?.length || 0} published builds from Supabase.`);
    return (builds || []).map(b => ({
      slug: b.slug,
      lastmod: b.updated_at ? new Date(b.updated_at).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Sitemap: Error fetching builds from Supabase:', error);
    return [];
  }
}

/**
 * Fetches unique league slugs from published builds for /builds/league/[slug] pages.
 * Returns an array of { slug, lastmod } objects (one per unique league).
 */
async function getSitemapLeagueBuilds() {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from('builds')
      .select('league, updated_at')
      .eq('is_published', true)
      .not('league', 'is', null);

    if (error) throw error;

    // The `league` field stores display names (e.g. "Keepers of the Flame").
    // Slugify before deduplicating.
    const slugify = (name) =>
      name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Deduplicate by slug, keeping the most recent updated_at per slug
    const leagueMap = new Map();
    (data || []).forEach((b) => {
      const slug = slugify(b.league);
      if (!leagueMap.has(slug) || b.updated_at > leagueMap.get(slug)) {
        leagueMap.set(slug, b.updated_at);
      }
    });

    const result = [...leagueMap.entries()].map(([slug, updatedAt]) => ({
      slug,
      lastmod: updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString(),
    }));

    console.log(`Sitemap: Found ${result.length} unique build leagues.`);
    return result;
  } catch (error) {
    console.error('Sitemap: Error fetching league builds from Supabase:', error);
    return [];
  }
}

// --- Export using CommonJS ---
module.exports = {
  getSitemapPosts,
  getSitemapProducts,
  getSitemapLeagues,
  getSitemapLeagueSlugPages,
  getSitemapBuilds,
  getSitemapLeagueBuilds,
};