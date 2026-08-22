import { revalidatePath, revalidateTag } from "next/cache";
import type { DbTag } from "./cache-tags";

/**
 * Derruba o Data Cache das leituras do Supabase depois de uma mutação.
 *
 * É o par de `unstable_cache(..., { tags })` em `app/actions.ts`: sem esta
 * chamada nas rotas admin, o cache só venceria pelo TTL de `DB_CACHE_TTL`
 * (horas), e editar um preço no painel não apareceria no site.
 *
 * Também invalida o sitemap: criar/despublicar produto, liga ou build muda o
 * conjunto de URLs, não só o conteúdo delas.
 */
export function bustDbCache(...tags: DbTag[]) {
  for (const tag of tags) revalidateTag(tag);
  revalidatePath("/sitemap.xml");
}
