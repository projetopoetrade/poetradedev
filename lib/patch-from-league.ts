import "server-only";
import { getLeagueLanding, getLeagueLandingIndex } from "@/lib/league-landing";
import type { GameVersion } from "@/types/league-landing";
import type { PatchData } from "@/types";

/**
 * Monta os dados de patch a partir da landing da liga publicada no Sanity.
 *
 * Antes esse conteúdo vivia chumbado em `messages/*.json`, sob
 * `PatchInfo.patches.<gameVersion>` — e envelhecia calado: em 28/07/2026 o site
 * ainda anunciava "Keepers of the Flame" (3.27) como patch atual, três ligas
 * depois. Agora a fonte é a mesma que alimenta `/leagues/[slug]`, então publicar
 * a landing da liga nova atualiza os dois lugares de uma vez.
 *
 * Sem doc publicado devolve `null`, e o componente mostra o estado vazio — que é
 * melhor do que anunciar uma liga encerrada como se fosse a atual.
 */
export async function getCurrentPatch(
  gameVersion: GameVersion,
  locale: string,
): Promise<PatchData | null> {
  try {
    // O índice já vem ordenado por `startsAt` desc e só traz publicados, então o
    // primeiro do jogo é a liga corrente. Ele é uma projeção enxuta de propósito
    // (sem mecânicas), por isso buscamos o documento completo em seguida.
    const index = await getLeagueLandingIndex(locale);
    const current = index.find((l) => l.gameVersion === gameVersion);
    if (!current) return null;

    const league = await getLeagueLanding(current.slug, locale);
    if (!league) return null;

    return {
      id: gameVersion,
      version: league.version || "",
      title: league.name,
      date: league.startsAt
        ? new Date(league.startsAt).toLocaleDateString(
            locale === "pt-br" ? "pt-BR" : "en-US",
            { day: "numeric", month: "long", year: "numeric" },
          )
        : "",
      description: league.intro || league.tagline || "",
      changes: (league.highlights || [])
        .map((h) => [h.label, h.value].filter(Boolean).join(": "))
        .filter(Boolean),
      features: (league.mechanics || [])
        .slice(0, 4)
        .map((m) => ({ title: m.title, description: m.summary }))
        .filter((f) => f.title),
    };
  } catch (error) {
    console.error("[getCurrentPatch] Falhou ao ler a landing da liga:", error);
    return null;
  }
}
