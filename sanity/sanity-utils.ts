import ImageUrlBuilder from "@sanity/image-url";
import { createClient, type QueryParams } from "next-sanity";
import clientConfig from "./config/client-config";
import { postQuery, postQueryBySlug, productQuery, postQueryByCategory, postQueryByCategoryAndGameVersion, leagueBySlugQuery, allLeaguesQuery, liveLeagueQuery } from "./sanity-query";
import { Blog } from "@/types/blog";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import type { Product } from "@/lib/interface";

export const client = createClient(clientConfig);
export function imageBuilder(source: SanityImageSource) {
  return ImageUrlBuilder(clientConfig).image(source);
}

export async function sanityFetch<QueryResponse>({
  query,
  qParams,
  tags,
}: {
  query: string,
  qParams: QueryParams,
  tags: string[],
}): Promise<QueryResponse> {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    client.fetch<
      QueryResponse>
      (query,
        qParams,
        isDevelopment ? { cache: "no-store" } : {
          cache: "force-cache",
          next: {
            tags,
            revalidate: 3600 // Revalidate every 60 seconds
          },
        })
  );
}

export const getPosts = async (language: string, page: number = 1, pageSize: number = 10) => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize; // GROQ slice is exclusive of end index

  const paginatedQuery = `*[_type == "post" && language == $language] | order(publishedAt desc) [${start}...${end}] {
    _id,
    title,
    metadata,
    slug,
    tags,
    language,
    author->{
      _id,
      name,
      slug,
      image,
      bio
    },
    mainImage{
      asset->{
        _id,
        url
      }
    },
    publishedAt,
    body
  }`;

  const data: Blog[] = await sanityFetch({
    query: paginatedQuery,
    qParams: { language },
    tags: ["post", "author", "category"],
  });
  return data;
};

export const getPostsCount = async (language: string) => {
  const countQuery = `count(*[_type == "post" && language == $language])`;

  const count: number = await sanityFetch({
    query: countQuery,
    qParams: { language },
    tags: ["post"],
  });
  return count;
};

export const getProducts = async () => {
  const data: Product[] = await sanityFetch({
    query: productQuery,
    qParams: {},
    tags: ["product"],
  });
  return data;
}

export const getProductBySlug = async (slug: string) => {
  const query = `*[_type == "product" && slug.current == $slug][0]{
    _id,
    name,
    category,
    body,
    alt,
    gameVersion,
    league,
    difficulty,
    seoTitle,
    metaDescription,
    updatedAt,
    "slug": slug.current
  }`;

  const data: Product = await sanityFetch({
    query,
    qParams: { slug },
    tags: ["product"],
  });

  return data;
}

export const getPostBySlug = async (slug: string, language: string) => {
  const data: Blog = await sanityFetch({
    query: postQueryBySlug,
    qParams: { slug, language },
    tags: ["post", "author", "category"],
  });

  return data;
};

export const getPostsByCategoryAndGameVersion = async (categorySlug: string, gameVersion: string, language: string) => {
  const data: Blog[] = await sanityFetch({
    query: postQueryByCategoryAndGameVersion,
    qParams: { categorySlug, gameVersion, language },
    tags: ["post", "author", "category"],
  });

  return data;
};

export async function getRelatedPosts(currentPostSlug: string, language: string, limit: number = 3): Promise<Blog[]> {
  const query = `*[_type == "post" && slug.current != $currentPostSlug && language == $language] | order(publishedAt desc)[0...$limit] {
    _id,
    title,
    slug,
    publishedAt,
    metadata,
    mainImage{
      asset->{
        _id,
        url
      }
    },
    author->{
      name
    }
  }`;

  return sanityFetch<Blog[]>({
    query,
    qParams: { currentPostSlug, language, limit },
    tags: ["post"],
  });
}

// ============================================================
// LEAGUE
// ============================================================

export type SanityGggPost = {
  title: string;
  url: string;
  date: string;
  summary: string;
};

export type SanityLeagueBuild = {
  name: string;
  class: string;
  tier?: 'S' | 'A' | 'B' | 'C';
  difficulty?: string;
  description?: string;
  pros?: string[];
  cons?: string[];
  guideUrl?: string;
  guides?: { title: string; url: string; author?: string; variant?: string }[];
  author?: string;
};

export type SanityLeague = {
  title: string;
  slug: string;
  subtitle?: string;
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
  patchVersion?: string;
  status: 'announced' | 'live' | 'ended';
  launchDate?: string;
  endDate?: string;
  datePublished?: string;
  bannerImage?: { asset: { url: string } };
  // Pre-launch
  prelaunchTeaser?: string;
  prelaunchMediaUrls?: string[];
  gggPosts?: SanityGggPost[];
  // Post-launch structured sections
  tldr?: { title: string; items: { text: string; type?: string }[] };
  mechanics?: {
    title: string;
    description: string;
    points: { title: string; description: string }[];
    tradeImpact?: { title: string; points: string[] };
  };
  patchNotes?: {
    title: string;
    subtitle?: string;
    officialUrl?: string;
    officialText?: string;
    categories: { title: string; changes: string[] }[];
  };
  starters?: {
    title: string;
    subtitle?: string;
    tierS?: { title: string; description: string };
    tierA?: { title: string; description: string };
    builds: SanityLeagueBuild[];
  };
  ctaLink?: string;
  seoTitle?: string;
  seoDescription?: string;
  _updatedAt?: string;
};

export type SanityLeagueSummary = {
  slug: string;
  title: string;
  status: string;
  gameVersion: string;
  launchDate?: string;
  _updatedAt: string;
};

export const getLeagueBySlug = async (slug: string): Promise<SanityLeague | null> => {
  const data = await sanityFetch<SanityLeague>({
    query: leagueBySlugQuery,
    qParams: { slug },
    tags: ["league"],
  });
  return data || null;
};

export const getAllLeagues = async (): Promise<SanityLeagueSummary[]> => {
  return sanityFetch<SanityLeagueSummary[]>({
    query: allLeaguesQuery,
    qParams: {},
    tags: ["league"],
  });
};

export const getLiveLeague = async (): Promise<{ title: string; slug: string; gameVersion: string } | null> => {
  const data = await sanityFetch<{ title: string; slug: string; gameVersion: string }>({
    query: liveLeagueQuery,
    qParams: {},
    tags: ["league"],
  });
  return data || null;
};