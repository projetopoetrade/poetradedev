import ImageUrlBuilder from "@sanity/image-url";
import { createClient, type QueryParams } from "next-sanity";
import clientConfig from "./config/client-config";
import { postQuery, postQueryBySlug, productQuery, postQueryByCategory, postQueryByCategoryAndGameVersion, postQueryByAuthor, allAuthorsQuery, buildGuideBySlugQuery } from "./sanity-query";
import { Blog } from "@/types/blog";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import type { Product } from "@/lib/interface";
import { groq } from "next-sanity";

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

export type BuildGuideSanity = { body: unknown } | null;

export const getBuildGuideBySlug = async (slug: string): Promise<BuildGuideSanity> => {
  const data = await sanityFetch<{ body: unknown } | null>({
    query: buildGuideBySlugQuery,
    qParams: { slug },
    tags: ["buildGuide"],
  });
  return data && Array.isArray(data.body) && data.body.length > 0 ? data : null;
};

export const getPostsByCategoryAndGameVersion = async (categorySlug: string, gameVersion: string, language: string) => {
  const data: Blog[] = await sanityFetch({
    query: postQueryByCategoryAndGameVersion,
    qParams: { categorySlug, gameVersion, language },
    tags: ["post", "author", "category"],
  });

  return data;
};

export const getRecentPostsByGameVersion = async (
  gameVersion: string,
  language: string,
  limit: number = 3
): Promise<Blog[]> => {
  const query = `*[_type == "post" && gameVersion == $gameVersion && language == $language] | order(publishedAt desc)[0...$limit] {
    _id, title, slug, metadata,
    mainImage{ asset->{ _id, url } },
    publishedAt,
    author->{ name }
  }`;
  return sanityFetch<Blog[]>({
    query,
    qParams: { gameVersion, language, limit },
    tags: ["post"],
  });
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
// AUTHOR
// ============================================================

export type SanityAuthor = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  bio?: string;
};

const authorBySlugQuery = groq`*[_type == "author" && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  image,
  bio
}`;

export const getAuthorBySlug = async (slug: string): Promise<SanityAuthor | null> => {
  const data = await sanityFetch<SanityAuthor>({
    query: authorBySlugQuery,
    qParams: { slug },
    tags: ["author"],
  });
  return data || null;
};

export const getPostsByAuthor = async (slug: string, language: string): Promise<Blog[]> => {
  const data = await sanityFetch<Blog[]>({
    query: postQueryByAuthor,
    qParams: { slug, language },
    tags: ["post", "author"],
  });
  return data || [];
};

export const getAllAuthors = async (): Promise<SanityAuthor[]> => {
  const data = await sanityFetch<SanityAuthor[]>({
    query: allAuthorsQuery,
    qParams: {},
    tags: ["author"],
  });
  return data || [];
};