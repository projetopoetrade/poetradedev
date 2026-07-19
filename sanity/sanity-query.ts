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

// ─── Build Overview (montável) ─────────────────────────────────────────────
// Cada bloco é um objeto no array `blocks`. Projetamos só os campos que
// cada renderer precisa — nunca o documento inteiro, pra o cache do Sanity
// não invalidar com mudanças em campos não-relevantes.
export const buildOverviewBySlugQuery = groq`*[_type == "buildOverview" && slug.current == $slug] | order(_createdAt desc)[0]{
  _id,
  sections[] {
    _key,
    heading,
    body,
  }
}`;

// ─── League landing ───────────────────────────────────────────────────────────
// Both locales are pulled in a single projection (localeString/localeText are
// inline objects, not translated documents) and collapsed per-request by
// resolveLocale() in lib/league-landing.ts. `isPublished` gates the fetch, so an
// unpublished draft 404s rather than leaking an unannounced league name.

const leagueLandingData = `{
  _id,
  _updatedAt,
  name,
  "slug": slug.current,
  gameVersion,
  version,
  tagline,
  intro,
  supabaseLeagueName,
  startsAt,
  revealAt,
  patchNotesAt,
  accentColor,
  keyArt{ alt, asset->{ _id, url, metadata{ lqip, dimensions } } },
  logo{ asset->{ _id, url } },
  trailers[]{
    title,
    youtubeId,
    kind,
    thumbnail{ asset->{ _id, url } }
  },
  mechanics[]{
    title,
    summary,
    category,
    bullets,
    image{ asset->{ _id, url, metadata{ lqip, dimensions } } },
    video{ asset->{ _id, url } },
    imagePosition
  },
  highlights[]{ label, value },
  officialUrl,
  patchNotesUrl,
  faq[]{ question, answer },
  seoTitle,
  seoDescription,
  ogImage{ asset->{ _id, url } }
}`;

export const leagueLandingBySlugQuery = groq`*[_type == "leagueLanding" && slug.current == $slug && isPublished == true][0] ${leagueLandingData}`;

// Powers generateStaticParams + the sitemap. Kept to a thin projection so the
// build does not download key art for every league just to list its URL.
export const leagueLandingSlugsQuery = groq`*[_type == "leagueLanding" && isPublished == true && defined(slug.current)]{
  "slug": slug.current,
  gameVersion,
  startsAt,
  _updatedAt
}`;

// The /leagues index. Everything the card needs and nothing else — no trailers,
// mechanics or FAQ, which are the heavy arrays on this document.
export const leagueLandingIndexQuery = groq`*[_type == "leagueLanding" && isPublished == true && defined(slug.current)] | order(coalesce(startsAt, "9999") desc) {
  _id,
  name,
  "slug": slug.current,
  gameVersion,
  version,
  tagline,
  startsAt,
  accentColor,
  keyArt{ alt, asset->{ _id, url, metadata{ lqip } } }
}`;
