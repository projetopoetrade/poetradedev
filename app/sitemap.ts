import type { MetadataRoute } from "next";
import {
  getSitemapBuilds,
  getSitemapLeagueBuilds,
  getSitemapLeagueSlugPages,
  getSitemapPosts,
  getSitemapProducts,
} from "@/lib/sitemap-data";

// Refresh every 5 minutes. Sanity webhook hits /api/revalidate which calls
// revalidatePath('/sitemap.xml') for posts → fresh sitemap on next request.
export const revalidate = 300;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"
).replace(/\/$/, "");

// Stamped at build time via next.config.ts → constant per deploy.
// Falls back to "now" only in dev where the env var isn't injected.
const BUILD_LASTMOD = new Date(process.env.BUILD_TIME || new Date().toISOString());

const LOCALES = ["en", "pt-br"] as const;
const DEFAULT_LOCALE: (typeof LOCALES)[number] = "en";
type Locale = (typeof LOCALES)[number];

// BCP 47 — Google requires pt-BR (capitalized region) in hreflang
const HREFLANG_MAP: Record<Locale, string> = { en: "en", "pt-br": "pt-BR" };

const localizedPath = (locale: Locale, basePath: string) =>
  locale === DEFAULT_LOCALE ? basePath : `/${locale}${basePath}`;

const alternateLanguages = (basePath: string): Record<string, string> => {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[HREFLANG_MAP[locale]] = `${SITE_URL}${localizedPath(locale, basePath)}`;
  }
  // x-default → English (default locale)
  languages["x-default"] = `${SITE_URL}${localizedPath(DEFAULT_LOCALE, basePath)}`;
  return languages;
};

type StaticPage = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified: Date;
};

const buildStaticPages = (): StaticPage[] => {
  // Frozen dates so re-deploys don't signal "updated" to crawlers on
  // pages whose content rarely changes.
  const staticContentLastMod = new Date("2025-06-01T00:00:00.000Z");
  const legalLastMod = new Date("2025-01-01T00:00:00.000Z");

  return [
    { path: "/", changeFrequency: "daily", lastModified: BUILD_LASTMOD },
    { path: "/products", changeFrequency: "daily", lastModified: BUILD_LASTMOD },
    { path: "/builds", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/blog", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/tools/price-tracker", changeFrequency: "daily", lastModified: BUILD_LASTMOD },
    { path: "/games/path-of-exile-1", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/games/path-of-exile-2", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/games/path-of-exile-1/builds", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/games/path-of-exile-2/builds", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/games/path-of-exile-1/currency", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/games/path-of-exile-2/currency", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/games/path-of-exile-1/items", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/games/path-of-exile-2/items", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/games/path-of-exile-1/services", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/games/path-of-exile-2/services", changeFrequency: "weekly", lastModified: BUILD_LASTMOD },
    { path: "/tools", changeFrequency: "monthly", lastModified: staticContentLastMod },
    { path: "/tools/build-randomizer", changeFrequency: "monthly", lastModified: staticContentLastMod },
    { path: "/tools/pob-viewer", changeFrequency: "monthly", lastModified: staticContentLastMod },
    { path: "/about", changeFrequency: "monthly", lastModified: staticContentLastMod },
    { path: "/contact", changeFrequency: "monthly", lastModified: staticContentLastMod },
    { path: "/faq", changeFrequency: "monthly", lastModified: staticContentLastMod },
    { path: "/terms", changeFrequency: "yearly", lastModified: legalLastMod },
    { path: "/privacy", changeFrequency: "yearly", lastModified: legalLastMod },
  ];
};

// Mirror of url-helper.ts encodeProductName — kept here to avoid pulling
// an "@/utils/..." path that may need server-only context.
const encodeProductSlug = (name: string): string =>
  encodeURIComponent(
    name
      .normalize("NFD")
      .replace(/[\s+&%#@!()[\]{}:;'",.?<>/\\|]/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-|-$/g, "")
  ).toLowerCase();

// Image sitemap requires absolute URLs (per Google's spec). Sanity URLs are
// already absolute; product imgUrl in Supabase can be a same-origin path
// like "/images/products/foo.webp" — prefix SITE_URL when needed.
const absolutizeImage = (url: string): string =>
  url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

type EntryMeta = Omit<MetadataRoute.Sitemap[number], "url" | "alternates">;

const expandLocales = (basePath: string, meta: EntryMeta): MetadataRoute.Sitemap => {
  const languages = alternateLanguages(basePath);
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}${localizedPath(locale, basePath)}`,
    ...meta,
    alternates: { languages },
  }));
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of buildStaticPages()) {
    entries.push(
      ...expandLocales(page.path, {
        lastModified: page.lastModified,
        changeFrequency: page.changeFrequency,
      })
    );
  }

  const [posts, products, leagueSlugPages, builds, leagueBuilds] = await Promise.all([
    getSitemapPosts(),
    getSitemapProducts(),
    getSitemapLeagueSlugPages(),
    getSitemapBuilds(),
    getSitemapLeagueBuilds(),
  ]);

  for (const product of products) {
    if (!product.name) continue;
    const slug = product.slug ?? encodeProductSlug(product.name);
    const basePath =
      product.gameVersion === "path-of-exile-2"
        ? `/games/path-of-exile-2/products/${slug}`
        : `/products/${slug}`;
    entries.push(
      ...expandLocales(basePath, {
        lastModified: new Date(product.lastmod),
        changeFrequency: "daily",
        ...(product.image ? { images: [absolutizeImage(product.image)] } : {}),
      })
    );
  }

  for (const post of posts) {
    if (!post.slug) continue;
    const basePath = `/blog/${encodeURIComponent(post.slug)}`;

    // Build hreflang alternates from Sanity's translation.metadata, not from
    // a shared-slug assumption. Each language has its own slug
    // (e.g. EN "mana-issues--how-to-fix" vs PT-BR "problemas-com-mana-…").
    // Emitting the current slug under every locale used to link to 404s,
    // causing Google to drop the whole hreflang cluster.
    const siblings = new Map<string, string>(); // language code → slug
    if (post.language && post.slug) {
      siblings.set(post.language, post.slug);
    }
    for (const t of post.translations || []) {
      if (t.language && t.slug) siblings.set(t.language, t.slug);
    }

    const languages: Record<string, string> = {};
    for (const locale of LOCALES) {
      const siblingSlug = siblings.get(locale);
      if (!siblingSlug) continue;
      languages[HREFLANG_MAP[locale]] = `${SITE_URL}${localizedPath(
        locale,
        `/blog/${encodeURIComponent(siblingSlug)}`,
      )}`;
    }
    const enAlternate = languages[HREFLANG_MAP[DEFAULT_LOCALE]];
    if (enAlternate) languages["x-default"] = enAlternate;

    // If post.language is set, emit only that locale. Otherwise emit only
    // the default locale — avoids advertising a /pt-br/blog/<slug> URL
    // for an English post that doesn't render in pt-br.
    const targetLocales: Locale[] = post.language
      ? LOCALES.filter((l) => l === post.language)
      : [DEFAULT_LOCALE];

    for (const locale of targetLocales) {
      entries.push({
        url: `${SITE_URL}${localizedPath(locale, basePath)}`,
        lastModified: new Date(post.lastmod),
        changeFrequency: "weekly",
        alternates: { languages },
        ...(post.image ? { images: [absolutizeImage(post.image)] } : {}),
      });
    }
  }

  for (const { leagueSlug, gameVersion, slug, lastmod } of leagueSlugPages) {
    entries.push(
      ...expandLocales(`/games/${gameVersion}/league/${leagueSlug}/${slug}`, {
        lastModified: new Date(lastmod),
        changeFrequency: "weekly",
      })
    );
  }

  for (const { slug, lastmod } of builds) {
    entries.push(
      ...expandLocales(`/builds/${slug}`, {
        lastModified: new Date(lastmod),
        changeFrequency: "weekly",
      })
    );
  }

  for (const { slug, lastmod } of leagueBuilds) {
    entries.push(
      ...expandLocales(`/builds/league/${slug}`, {
        lastModified: new Date(lastmod),
        changeFrequency: "weekly",
      })
    );
  }

  return entries;
}
