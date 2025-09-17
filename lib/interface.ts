export interface Product {
  id?: number,
  name: string,
  category: string,
  description: string,
  slug: string,
  body?: any, // Portable Text content from Sanity
  alt?: string,
  price: number,
  imgUrl: string,
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2',
  league: string,
  difficulty: string,
  updatedAt?: string
}
export type PageProps = Promise< {
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
  league: string;
  difficulty: string;
}>
