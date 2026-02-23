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
