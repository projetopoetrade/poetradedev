import { type NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sanityFetch } from "@/sanity/sanity-utils";

// Generalized content index for the path-of-trade-content engine. Replaces
// the legacy /api/blog/index — this one returns a discriminated union of
// `post` and `product` items in a stable shape so the engine can index
// either type into Postgres + Qdrant for internal-link suggestions.
//
// Auth: requests must carry `X-Content-Index-Key` matching
// CONTENT_INDEX_SECRET. Cloudflare WAF allowlists the engine VPS IP, but
// the header is defense in depth in case the IP changes or someone else
// at the same datacenter inherits it.

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"
).replace(/\/$/, "");

const LOCALES = ["en", "pt-br"] as const;
type Locale = (typeof LOCALES)[number];

type ContentType = "post" | "product";

interface ContentIndexItem {
  type: ContentType;
  slug: string;
  language: Locale;
  title: string;
  metadata: string | null;
  tags: string[];
  category: string | null;
  gameVersion: "path-of-exile-1" | "path-of-exile-2" | null;
  publishedAt: string | null; // ISO — null for products (no publish date concept)
  updatedAt: string | null; // ISO
  url: string; // absolute
}

const postsQuery = groq`
  *[_type == "post" && defined(slug.current)
    && !(_id in path("drafts.**"))
    && publishedAt <= now()
  ] | order(publishedAt desc) {
    "slug": slug.current,
    language,
    title,
    metadata,
    "category": category->slug.current,
    tags,
    gameVersion,
    publishedAt,
    "updatedAt": _updatedAt
  }
`;

const blogUrl = (slug: string, language: Locale) =>
  language === "pt-br" ? `${SITE_URL}/pt-br/blog/${slug}` : `${SITE_URL}/blog/${slug}`;

const productUrl = (
  slug: string,
  gameVersion: string | null,
  language: Locale,
): string => {
  const pathBase =
    gameVersion === "path-of-exile-2"
      ? `/games/path-of-exile-2/products/${slug}`
      : `/products/${slug}`;
  return language === "pt-br"
    ? `${SITE_URL}/pt-br${pathBase}`
    : `${SITE_URL}${pathBase}`;
};

async function fetchPosts(): Promise<ContentIndexItem[]> {
  const raw = await sanityFetch<any[]>({
    query: postsQuery,
    qParams: {},
    tags: ["post", "category", "content-index"],
  });
  return (raw || []).map((p) => {
    const language: Locale = p.language === "pt-br" ? "pt-br" : "en";
    const slug = String(p.slug);
    return {
      type: "post" as const,
      slug,
      language,
      title: String(p.title ?? ""),
      metadata: p.metadata ?? null,
      tags: Array.isArray(p.tags) ? p.tags : [],
      category: p.category ?? null,
      gameVersion: p.gameVersion ?? null,
      publishedAt: p.publishedAt ?? null,
      updatedAt: p.updatedAt ?? null,
      url: blogUrl(slug, language),
    };
  });
}

async function fetchProducts(): Promise<ContentIndexItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const supabase = createSupabaseClient(url, key);

  // Real columns on the products table:
  //   id, name, imgUrl, category, price, league, gameVersion, difficulty,
  //   alt, updated_at, slug, in_stock, is_listed
  // The Product interface in lib/interface.ts mentions description /
  // seoTitle / metaDescription / body — those live in Sanity, not Postgres.
  // For the engine's link-suggestion use case we only need a stable label
  // and a few discriminators; the alt text is the closest thing to a
  // human-written description we have here.
  const { data, error } = await supabase
    .from("products")
    .select(
      'name, slug, category, "gameVersion", league, difficulty, alt, updated_at',
    );
  if (error) {
    console.error("[content/index] supabase products fetch failed:", error);
    return [];
  }

  const items: ContentIndexItem[] = [];
  for (const row of data || []) {
    if (!row.slug) continue;
    const slug: string = row.slug;
    const gameVersion = (row.gameVersion ?? null) as ContentIndexItem["gameVersion"];
    // Synthetic tag set so semantic search has signal — there is no real
    // tags column on products, so we lean on the structured filters.
    const tags = [row.category, row.league, row.difficulty, row.gameVersion].filter(
      (t): t is string => typeof t === "string" && t.length > 0,
    );
    const updatedAt = row.updated_at ? new Date(row.updated_at).toISOString() : null;
    const metadata =
      typeof row.alt === "string" && row.alt.trim() ? row.alt.trim() : null;

    for (const language of LOCALES) {
      items.push({
        type: "product",
        slug,
        language,
        title: row.name,
        metadata,
        tags,
        category: row.category ?? null,
        gameVersion,
        publishedAt: null,
        updatedAt,
        url: productUrl(slug, gameVersion, language),
      });
    }
  }
  return items;
}

const TYPES_WITH_FETCHER: Record<ContentType, () => Promise<ContentIndexItem[]>> = {
  post: fetchPosts,
  product: fetchProducts,
};

export async function GET(req: NextRequest) {
  const expected = process.env.CONTENT_INDEX_SECRET;
  if (!expected) {
    // Fail closed when not configured — never let an unauthenticated caller
    // hit Sanity/Supabase just because the operator forgot to set the env.
    return NextResponse.json({ error: "Endpoint not configured" }, { status: 500 });
  }
  const presented = req.headers.get("x-content-index-key");
  if (!presented || presented !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const typeParam = req.nextUrl.searchParams.get("type") || "all";
  const requested: ContentType[] =
    typeParam === "all"
      ? (["post", "product"] as ContentType[])
      : typeParam === "post" || typeParam === "product"
        ? [typeParam]
        : [];

  if (requested.length === 0) {
    return NextResponse.json(
      { error: `Unknown type: ${typeParam} (expected post | product | all)` },
      { status: 400 },
    );
  }

  try {
    const batches = await Promise.all(requested.map((t) => TYPES_WITH_FETCHER[t]()));
    const items = batches.flat();
    return NextResponse.json(
      {
        count: items.length,
        generatedAt: new Date().toISOString(),
        items,
      },
      {
        // Auth-gated → never share via shared CDN cache.
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("[content/index] failed:", error);
    return NextResponse.json(
      { error: "Failed to load content index" },
      { status: 500 },
    );
  }
}
