import { groq } from "next-sanity";
const postData = `{
  title,
  metadata,
  slug,
  tags,
  language,
  gameVersion,
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
  _updatedAt,
  body
}`;

export const postQuery = groq`*[_type == "post" && language == $language] ${postData}`;

// Fetches a single post + its cross-language sibling slugs so the page
// can emit accurate hreflang alternates. Without `translations`, the
// generateMetadata falls back to assuming the same slug in every locale —
// which breaks when the Sanity editor slugifies from the translated title
// (e.g. EN "mana-issues--how-to-fix" vs PT-BR "problemas-com-mana-como-resolver-faq").
// References hop: post → translation.metadata → post (per language).
export const postQueryBySlug = groq`*[_type == "post" && slug.current == $slug && language == $language][0] {
  title,
  metadata,
  slug,
  tags,
  language,
  gameVersion,
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
  _updatedAt,
  body,
  "translations": *[_type == "translation.metadata" && references(^._id)][0].translations[]{
    "language": _key,
    "slug": value->slug.current
  }
}`;

export const postQueryByTag = groq`*[_type == "post" && $slug in tags[]->slug.current && language == $language] ${postData}`;

export const postQueryByAuthor = groq`*[_type == "post" && author->slug.current == $slug && language == $language] ${postData}`;

export const postQueryByCategory = groq`*[_type == "post" && category->slug.current == $slug && language == $language] ${postData}`;

export const postQueryByCategoryAndGameVersion = groq`*[_type == "post" && category->slug.current == $categorySlug && gameVersion == $gameVersion && language == $language] | order(publishedAt desc) ${postData}`;

export const productQuery = `*[_type == "product"]{
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

export const allAuthorsQuery = groq`*[_type == "author" && defined(slug.current)]{
  _id,
  name,
  "slug": slug.current,
  image,
  bio
}`;

export const buildGuideBySlugQuery = groq`*[_type == "buildGuide" && slug.current == $slug][0]{
  body
}`;
