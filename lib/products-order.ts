import type { Product } from "@/lib/interface";

/**
 * Ordem da listagem de produtos: bloco de destaque no topo, em ordem manual, e o
 * resto por preço decrescente. Vive aqui porque a página `/products` precisa da
 * mesma ordem no JSON-LD (servidor) que o `ProductsClient` mostra na tela — se
 * cada um ordenasse do seu jeito, o schema.org descreveria uma página que não
 * existe.
 */

function byPriceDesc(a: Product, b: Product): number {
  const priceA = Number(a.price) || 0;
  const priceB = Number(b.price) || 0;
  if (priceB !== priceA) return priceB - priceA;
  // Desempate estável: sem isto, produtos de mesmo preço trocam de lugar entre
  // regenerações de página e o ISR serve uma ordem diferente a cada rebuild.
  return a.name.localeCompare(b.name);
}

function byFeaturedOrder(a: Product, b: Product): number {
  const orderA = a.featured_order ?? Number.POSITIVE_INFINITY;
  const orderB = b.featured_order ?? Number.POSITIVE_INFINITY;
  if (orderA !== orderB) return orderA - orderB;
  return byPriceDesc(a, b);
}

export function isFeatured(product: Product): boolean {
  return product.is_featured === true;
}

/**
 * Separa os dois blocos. Um produto destacado sai da grade normal — é o que o
 * operador pediu: se aparece no destaque, não aparece em outro lugar da lista.
 */
export function splitFeatured(products: Product[]): {
  featured: Product[];
  rest: Product[];
} {
  return {
    featured: products.filter(isFeatured).sort(byFeaturedOrder),
    rest: products.filter((p) => !isFeatured(p)).sort(byPriceDesc),
  };
}

/** Lista única, já na ordem em que a página renderiza. */
export function orderForListing(products: Product[]): Product[] {
  const { featured, rest } = splitFeatured(products);
  return [...featured, ...rest];
}
