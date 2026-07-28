/**
 * Fallback de preço: poe.ninja.
 *
 * Cobre o que o Currency Exchange in-game não aceita — Scouting Reports,
 * Catalysts, Engineer's Orb, Veiled Scarab, os orbes Zana e afins. Numa medição
 * de 28/07 o CX resolvia 93 dos 115 produtos do catálogo e o poe.ninja 99; a
 * união é maior que qualquer uma das duas sozinha, por isso a cascata.
 *
 * Consulta a API ao vivo em vez de ler `currency_price_history`. A tabela
 * depende do cron `price-snapshot-hourly`, que está parado desde 03/07/2026 —
 * amarrar a precificação nela deixaria o recálculo refém de um job quebrado.
 */

const NINJA_BASE = "https://poe.ninja/poe1/api/economy/exchange";

type NinjaLine = { id?: string; primaryValue?: number };
type NinjaItem = { id?: string; name?: string };

export type NinjaDivineValues = {
  /** Nome do item -> valor em divines. */
  values: Map<string, number>;
  chaosPerDivine: number | null;
};

/**
 * Valor de cada moeda da liga em DIVINES, indexado por NOME.
 *
 * O poe.ninja não expõe caminho de metadata (o campo `image` embute o asset,
 * mas só para as ~100 moedas que ele lista), então aqui a chave é o nome
 * mesmo — e é por isso que o CX vem primeiro na cascata: lá a chave é estável.
 */
export async function getNinjaDivineValues(league: string): Promise<NinjaDivineValues> {
  const url = `${NINJA_BASE}/current/overview?league=${encodeURIComponent(league)}&type=Currency`;
  const res = await fetch(url, {
    headers: { "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)" },
    cache: "no-store",
  });

  const empty: NinjaDivineValues = { values: new Map(), chaosPerDivine: null };
  if (!res.ok) return empty;

  const payload = (await res.json()) as { lines?: NinjaLine[]; items?: NinjaItem[] };
  const lines = payload.lines || [];

  // Liga inexistente devolve HTTP 200 com `lines` vazio, não erro — por isso a
  // checagem de tamanho em vez de confiar no status.
  if (lines.length === 0) return empty;

  const nameById = new Map<string, string>();
  for (const item of payload.items || []) {
    if (item.id && item.name) nameById.set(item.id, item.name);
  }

  const divineInChaos = lines.find((l) => l.id === "divine")?.primaryValue ?? 0;
  if (divineInChaos <= 0) return empty;

  const values = new Map<string, number>();
  for (const line of lines) {
    if (!line.id || typeof line.primaryValue !== "number") continue;
    const name = nameById.get(line.id) || line.id;
    values.set(name, line.primaryValue / divineInChaos);
  }

  return { values, chaosPerDivine: divineInChaos };
}
