export interface Product {
  id?: number,
  name: string,
  category: string,
  description: string,
  slug: string, // slug com liga; chave compartilhada com Sanity/histórico de preço
  url_slug?: string, // slug canônico curto (sem liga), usado na URL/sitemap
  body?: any, // Portable Text content from Sanity
  alt?: string,
  price: number, // USD efetivo — derivado de price_divine, salvo se price_locked
  price_divine?: number | null, // valor do item em divines (CX oficial ou poe.ninja)
  price_locked?: boolean, // true = preço editado à mão; o recálculo não encosta
  price_source?: 'cx' | 'ninja' | 'manual' | null, // quem precificou no último recálculo
  min_quantity?: number, // menor pedido possível — calibrado para valer ~1 divine
  metadata_id?: string | null, // caminho de metadata da GGG; chave no Currency Exchange
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
  league_slug?: string;
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
