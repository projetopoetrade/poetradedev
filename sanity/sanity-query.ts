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

export const postQueryBySlug = groq`*[_type == "post" && slug.current == $slug && language == $language][0] ${postData}`;

export const postQueryByTag = groq`*[_type == "post" && $slug in tags[]->slug.current && language == $language] ${postData}`;

export const postQueryByAuthor = groq`*[_type == "post" && author->slug.current == $slug && language == $language] ${postData}`;

export const postQueryByCategory = groq`*[_type == "post" && category->slug.current == $slug && language == $language] ${postData}`;

export const postQueryByCategoryAndGameVersion = groq`*[_type == "post" && category->slug.current == $categorySlug && gameVersion == $gameVersion && language == $language] | order(publishedAt desc) ${postData}`;

export const leagueBySlugQuery = groq`*[_type == "league" && slug.current == $slug][0]{
  title,
  "slug": slug.current,
  subtitle,
  gameVersion,
  patchVersion,
  status,
  launchDate,
  endDate,
  datePublished,
  bannerImage{ asset->{ url } },
  prelaunchTeaser,
  prelaunchMediaUrls,
  gggPosts[]{ title, url, date, summary },
  tldr{ title, items[]{ text, type } },
  mechanics{
    title,
    description,
    points[]{ title, description },
    tradeImpact{ title, points }
  },
  patchNotes{
    title,
    subtitle,
    officialUrl,
    officialText,
    categories[]{ title, changes }
  },
  starters{
    title,
    subtitle,
    tierS{ title, description },
    tierA{ title, description },
    builds[]{
      name,
      "class": class,
      tier,
      difficulty,
      description,
      pros,
      cons,
      guideUrl,
      guides[]{ title, url, author, variant },
      author
    }
  },
  ctaLink,
  seoTitle,
  seoDescription,
  _updatedAt
}`;

export const allLeaguesQuery = groq`*[_type == "league" && defined(slug.current)] | order(launchDate desc){
  "slug": slug.current,
  title,
  status,
  gameVersion,
  launchDate,
  _updatedAt
}`;

export const liveLeagueQuery = groq`*[_type == "league" && status == "live"] | order(launchDate desc)[0]{
  title,
  "slug": slug.current,
  gameVersion
}`;

export const productQuery = `*[_type == "product"]{
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
