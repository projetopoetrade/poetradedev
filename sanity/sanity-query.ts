import { groq } from "next-sanity";
const postData = `{
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

export const postQuery = groq`*[_type == "post" && language == $language] ${postData}`;

export const postQueryBySlug = groq`*[_type == "post" && slug.current == $slug && language == $language][0] ${postData}`;

export const postQueryByTag = groq`*[_type == "post" && $slug in tags[]->slug.current && language == $language] ${postData}`;

export const postQueryByAuthor = groq`*[_type == "post" && author->slug.current == $slug && language == $language] ${postData}`;

export const postQueryByCategory = groq`*[_type == "post" && category->slug.current == $slug && language == $language] ${postData}`;

export const postQueryByCategoryAndGameVersion = groq`*[_type == "post" && category->slug.current == $categorySlug && category->language == $language && gameVersion == $gameVersion && language == $language] ${postData}`;

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


