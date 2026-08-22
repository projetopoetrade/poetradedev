/**
 * Tags do Data Cache para o que vive no **Supabase**.
 *
 * O lado Sanity já é invalidado por evento: `sanityFetch` (sanity/sanity-utils)
 * marca toda query com o `_type` do documento e o webhook em `/api/revalidate`
 * chama `revalidateTag(_type)` na publicação. O Supabase não tinha equivalente —
 * a única coisa que mantinha preço/liga/build frescos era o `revalidate = 300`
 * de página, e é ele que gerava o volume de ISR Writes (cada bot que passava
 * numa página vencida disparava uma regravação).
 *
 * Com estas tags a leitura passa a ser invalidada por **mutação** (as rotas
 * admin chamam `revalidateTag`), e o `revalidate` de página vira só uma rede de
 * segurança de horas em vez de minutos.
 */
export const DB_TAGS = {
  products: "db-products",
  leagues: "db-leagues",
  builds: "db-builds",
} as const;

export type DbTag = (typeof DB_TAGS)[keyof typeof DB_TAGS];

export const DB_TAG_VALUES = Object.values(DB_TAGS) as DbTag[];

export const isDbTag = (tag: string): tag is DbTag =>
  (DB_TAG_VALUES as string[]).includes(tag);

/**
 * TTL do Data Cache. É a rede de segurança para escritas que acontecem **fora**
 * do Next (ex.: um job do poetrade-content mexendo em `products.price` direto no
 * Postgres, sem passar por `/api/admin/products/*`). Preço é dinheiro, então o
 * piso dele é mais curto que o do conteúdo editorial.
 */
export const DB_CACHE_TTL = {
  products: 21_600, // 6 h
  leagues: 86_400, // 24 h
  builds: 86_400, // 24 h
} as const;
