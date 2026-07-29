/**
 * Helpers puros de liga — vivem fora de `app/actions.ts` porque aquele arquivo
 * é `"use server"` (só pode exportar função async) e o seletor de liga, que é
 * client component, precisa da mesma regra de classificação.
 */

/**
 * Names treated as permanent (Standard / Hardcore / SSF / Ruthless variants)
 * — excluded from "current temp league" lookups so CTAs and smart defaults
 * never point at Standard. New temp leagues never collide here because GGG
 * names them after the league theme (Settlers, Necropolis, Ancestor, ...).
 */
export const PERMANENT_LEAGUE_PATTERNS = [
  /^Standard$/i,
  /^Hardcore$/i,
  /\bStandard$/i,
  /\bHardcore$/i,
  /^SSF\b/i,
  /^Ruthless\b/i,
];

export function isPermanentLeague(name: string): boolean {
  return PERMANENT_LEAGUE_PATTERNS.some((re) => re.test(name));
}

/**
 * Ordena com as permanentes primeiro e a temporária por último — no seletor
 * isso deixa a liga da vez sempre no card da direita, mesmo quando a ordem
 * vinda do banco muda a cada virada. `sort` é estável, então a ordem relativa
 * dentro de cada grupo é preservada.
 */
export function sortTempLeagueLast<T extends { name?: string | null }>(
  leagues: T[],
): T[] {
  return [...leagues].sort((a, b) => {
    const aPermanent = a?.name ? isPermanentLeague(a.name) : false;
    const bPermanent = b?.name ? isPermanentLeague(b.name) : false;
    if (aPermanent === bPermanent) return 0;
    return aPermanent ? -1 : 1;
  });
}
