import ImageUrlBuilder from "@sanity/image-url";
import { createClient, type QueryParams } from "next-sanity";
import clientConfig from "./config/client-config";
import { postQuery, postQueryBySlug, productQuery, postQueryByCategory, postQueryByCategoryAndGameVersion } from "./sanity-query";
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
  return (
    client.fetch <
    QueryResponse >
    (query,
    qParams,
    {
      cache: "force-cache",
      next: { 
        tags,
        revalidate: 3600 // Revalidate every 60 seconds
      },
    })
  );
}

export const getPosts = async (language: string) => {
  const data: Blog[] = await sanityFetch({
    query: postQuery,
    qParams: { language },
    tags: ["post", "author", "category"],
  });
  return data;
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