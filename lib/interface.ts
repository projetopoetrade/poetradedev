export interface Product {
  id?: number,
  name: string,
  category: string,
  description: string,
  slug: string,
  body?: any, // Portable Text content from Sanity
  alt?: string,
  price: number,
  in_stock?: boolean, // true = available, false = out of stock (blocks purchases)
  is_listed?: boolean, // true = shown in the store listing, false = hidden but still accessible directly for SEO
  imgUrl: string,
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2',
  league: string,
  difficulty: string,
  seoTitle?: any,
  metaDescription?: any,
  updatedAt?: string
}
export type PageProps = Promise<{
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
  league: string;
  difficulty: string;
}>

export interface Build {
  id: string;
  title: string;
  slug: string;
  description?: string;
  game_version: 'path-of-exile-1' | 'path-of-exile-2';
  league?: string;
  class: string;
  ascendancy: string;
  main_skill?: string;
  tags: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  budget?: 'cheap' | 'medium' | 'expensive';
  pob_code: string;
  pob_hash?: string;
  image_url?: string;
  video_url?: string;
  guide_content?: string;
  seo_title?: string;
  seo_description?: string;
  is_published: boolean;
  author?: string;
  created_at: string;
  updated_at: string;
}
