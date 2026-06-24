// Fetchers used by app/sitemap.ts. Pulls posts from Sanity and
// products/builds/leagues from Supabase. Errors are swallowed (returning
// []) so a flaky upstream never breaks the sitemap response.

import { createClient as createSanityClient } from "@sanity/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const SANITY_API_VERSION = "2023-05-03";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sanityClient =
  SANITY_PROJECT_ID && SANITY_DATASET
    ? createSanityClient({
        projectId: SANITY_PROJECT_ID,
        dataset: SANITY_DATASET,
        apiVersion: SANITY_API_VERSION,
        // useCdn: false — sitemap revalidates server-side via `revalidate`,
        // we want fresh data on each cache miss (post just published).
        useCdn: false,
      })
    : null;

const supabaseClient =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const toIso = (value: string | null | undefined): string =>
  value ? new Date(value).toISOString() : new Date().toISOString();

export type SitemapPostTranslation = {
  language: "en" | "pt-br";
  slug: string | null;
};

export type SitemapPost = {
  slug: string;
  language: "en" | "pt-br" | null;
  lastmod: string;
  image: string | null;
  // Sibling slugs per language — lets app/sitemap.ts emit hreflang alternates
  // that point to the real translated URL instead of assuming a shared slug.
  // Null when the post has no translation for that language.
  translations: SitemapPostTranslation[];
};

export async function getSitemapPosts(): Promise<SitemapPost[]> {
  if (!sanityClient) return [];
  try {
    // Filters:
    //  - !(_id in path("drafts.**"))   → exclude unpublished drafts
    //  - publishedAt <= now()          → exclude scheduled future posts
    // The `translations` projection hops into Sanity's translation.metadata
    // document (created by @sanity/document-internationalization) to resolve
    // sibling slugs across languages. Needed for correct hreflang.
    const query = `*[_type == "post"
      && defined(slug.current)
      && !(_id in path("drafts.**"))
      && publishedAt <= now()
    ]{
      "slug": slug.current,
      "language": language,
      "lastmod": coalesce(publishedAt, _updatedAt),
      "image": mainImage.asset->url,
      "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{
        "language": _key,
        "slug": value->slug.current
      }
    }`;
    const posts = await sanityClient.fetch<SitemapPost[]>(query);
    return (posts || []).map((p) => ({
      ...p,
      lastmod: toIso(p.lastmod),
      image: p.image ?? null,
      translations: Array.isArray(p.translations) ? p.translations : [],
    }));
  } catch (error) {
    console.error("[sitemap] sanity posts fetch failed:", error);
    return [];
  }
}

export type SitemapProduct = {
  name: string;
  slug: string | null;
  urlSlug: string | null;
  gameVersion: string;
  league: string | null;
  difficulty: string | null;
  lastmod: string;
  image: string | null;
};

export async function getSitemapProducts(): Promise<SitemapProduct[]> {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select('name, slug, url_slug, gameVersion, league, difficulty, updated_at, "imgUrl"')
      .eq("is_listed", true);
    if (error) throw error;
    return (data || []).map((p) => ({
      name: p.name,
      slug: p.slug ?? null,
      urlSlug: p.url_slug ?? null,
      gameVersion: p.gameVersion,
      league: p.league ?? null,
      difficulty: p.difficulty ?? null,
      lastmod: toIso(p.updated_at),
      image: p.imgUrl ?? null,
    }));
  } catch (error) {
    console.error("[sitemap] supabase products fetch failed:", error);
    return [];
  }
}

export type SitemapLeagueSlugPage = {
  leagueSlug: string;
  gameVersion: string;
  slug: string;
  lastmod: string;
};

const KEY_PRODUCT_SLUGS = ["divine-orb", "chaos-orb", "mirror-of-kalandra"];
const CATEGORY_SLUGS = ["currency", "items", "services"];

export async function getSitemapLeagueSlugPages(): Promise<SitemapLeagueSlugPage[]> {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from("leagues")
      .select("name, gameVersion, updated_at")
      .eq("isActive", true);
    if (error) throw error;

    const result: SitemapLeagueSlugPage[] = [];
    for (const league of data || []) {
      const leagueSlug = league.name.toLowerCase().replace(/\s+/g, "-");
      const lastmod = toIso(league.updated_at);
      for (const slug of [...CATEGORY_SLUGS, ...KEY_PRODUCT_SLUGS]) {
        result.push({ leagueSlug, gameVersion: league.gameVersion, slug, lastmod });
      }
    }
    return result;
  } catch (error) {
    console.error("[sitemap] supabase league pages fetch failed:", error);
    return [];
  }
}

export type SitemapBuild = { slug: string; lastmod: string };

export async function getSitemapBuilds(): Promise<SitemapBuild[]> {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from("builds")
      .select("slug, updated_at")
      .eq("is_published", true);
    if (error) throw error;
    return (data || []).map((b) => ({ slug: b.slug, lastmod: toIso(b.updated_at) }));
  } catch (error) {
    console.error("[sitemap] supabase builds fetch failed:", error);
    return [];
  }
}

export async function getSitemapLeagueBuilds(): Promise<SitemapBuild[]> {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from("builds")
      .select("league, updated_at")
      .eq("is_published", true)
      .not("league", "is", null);
    if (error) throw error;

    const slugify = (name: string) =>
      name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Dedupe by league slug, keep the most-recent updated_at per slug
    const leagueMap = new Map<string, string>();
    for (const row of data || []) {
      if (!row.league) continue;
      const slug = slugify(row.league);
      const prev = leagueMap.get(slug);
      if (!prev || (row.updated_at && row.updated_at > prev)) {
        leagueMap.set(slug, row.updated_at);
      }
    }

    return [...leagueMap.entries()].map(([slug, updatedAt]) => ({
      slug,
      lastmod: toIso(updatedAt),
    }));
  } catch (error) {
    console.error("[sitemap] supabase league builds fetch failed:", error);
    return [];
  }
}
