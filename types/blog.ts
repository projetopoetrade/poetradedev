import { PortableTextBlock } from "sanity";

export type Author = {
  name: string,
  image: string,
  bio?: string,
  slug: {
    current: string,
  },
  _id?: number | string,
  _ref?: number | string,
};

export type PostTranslation = {
  language: "en" | "pt-br",
  slug: string | null,
};

export type Blog = {
  _id: number,
  title: string,
  slug: any,
  metadata: string,
  body: PortableTextBlock[],
  mainImage: any,
  author: Author,
  tags: string[],
  publishedAt: string,
  _updatedAt?: string,
  gameVersion?: string,
  language?: string,
  category?: {
    title: string,
    slug: {
      current: string,
    }
  },
  // Populated by postQueryBySlug (sanity-query.ts). Contains both language
  // siblings via Sanity's @sanity/document-internationalization metadata.
  translations?: PostTranslation[],
};