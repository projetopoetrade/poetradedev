import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/sanity-utils";

// Stable contract for the content engine (path-of-trade-content). Each row
// is one published post in one language — PT-BR and EN are separate
// documents in Sanity. The engine uses this to suggest internal links in
// generated posts. Keep fields minimal but sufficient for tag/category
// matching AND semantic embedding (title + metadata).
interface BlogIndexEntry {
  slug: string;
  language: "en" | "pt-br";
  title: string;
  metadata: string | null;
  category: string | null;
  tags: string[];
  gameVersion: string | null;
  publishedAt: string; // ISO
  updatedAt: string | null; // ISO
}

const indexQuery = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
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

export async function GET(req: NextRequest) {
  try {
    const language = req.nextUrl.searchParams.get("language");

    const raw = await sanityFetch<any[]>({
      query: indexQuery,
      qParams: {},
      tags: ["post", "category", "blog-index"],
    });

    const filtered = language
      ? raw.filter((p) => p.language === language)
      : raw;

    const posts: BlogIndexEntry[] = filtered.map((p) => ({
      slug: String(p.slug),
      language: p.language === "pt-br" ? "pt-br" : "en",
      title: String(p.title ?? ""),
      metadata: p.metadata ?? null,
      category: p.category ?? null,
      tags: Array.isArray(p.tags) ? p.tags : [],
      gameVersion: p.gameVersion ?? null,
      publishedAt: p.publishedAt ?? "",
      updatedAt: p.updatedAt ?? null,
    }));

    return NextResponse.json(
      {
        count: posts.length,
        generatedAt: new Date().toISOString(),
        posts,
      },
      {
        // Short-lived edge cache; the tag allows Sanity webhooks to
        // bust it explicitly via revalidateTag("blog-index") in the
        // future without waiting for the TTL.
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("blog/index: failed to fetch from Sanity:", error);
    return NextResponse.json(
      { error: "Failed to load blog index" },
      { status: 500 },
    );
  }
}
