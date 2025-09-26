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
      .select('name, gameVersion, league, difficulty, updated_at'); // Adjust 'updated_at' if needed

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

// --- Export using CommonJS ---
module.exports = {
  getSitemapPosts,
  getSitemapProducts,
  getSitemapLeagues,
};