/**
 * Leitura do Currency Exchange oficial da GGG.
 *
 * Endpoint público, SEM autenticação (a doc de developer confirma e foi
 * verificado ao vivo): cada chamada devolve o digest de UMA hora fechada, com
 * todos os mercados que tiveram negociação naquela hora, de todas as ligas.
 *
 * Vantagem sobre o poe.ninja: traz volume negociado e uma BANDA de razão
 * (lowest/highest) em vez de um ponto único, e é fonte primária.
 *
 * Limitação que dita o desenho: como o digest só inclui mercados COM atividade
 * na hora, uma amostra de 1 hora subestima itens de baixo volume. Por isso
 * agregamos uma janela de várias horas.
 */

const CX_BASE = "https://web.poecdn.com/api/currency-exchange";

// Chaos e Divine são os hubs do grafo — quase todo par passa por um dos dois.
export const CHAOS_ID = "Metadata/Items/Currency/CurrencyRerollRare";
export const DIVINE_ID = "Metadata/Items/Currency/CurrencyModValues";

// A hora corrente ainda não fechou e devolve 404; começamos da anterior.
const HOUR = 3600;

type CxMarket = {
  league?: string;
  market_pair?: [string, string];
  volume_traded?: Record<string, number>;
  lowest_ratio?: Record<string, number>;
  highest_ratio?: Record<string, number>;
};

type PairStats = { rates: number[]; volume: number };

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Média das pontas da banda: quantos B valem 1 A nesta observação. */
function midRate(market: CxMarket, from: string, to: string): number | null {
  const lo = market.lowest_ratio;
  const hi = market.highest_ratio;
  if (!lo || !hi) return null;
  const rates: number[] = [];
  for (const side of [lo, hi]) {
    const a = side[from];
    const b = side[to];
    if (typeof a === "number" && typeof b === "number" && a > 0) rates.push(b / a);
  }
  if (rates.length === 0) return null;
  return rates.reduce((sum, r) => sum + r, 0) / rates.length;
}

function pairKey(a: string, b: string): string {
  return `${a}|${b}`;
}

async function fetchHour(hour: number, signal?: AbortSignal): Promise<CxMarket[]> {
  const res = await fetch(`${CX_BASE}/${hour}`, {
    headers: { "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)" },
    signal,
    cache: "no-store",
  });
  // 404 é esperado em horas sem digest publicado; não é erro operacional.
  if (!res.ok) return [];
  const payload = (await res.json()) as { markets?: CxMarket[] };
  return payload.markets || [];
}

/**
 * Agrega uma janela de horas em razões por par.
 * Chave: `${de}|${para}` -> quantos "para" valem 1 "de".
 *
 * Usa MEDIANA entre as horas, não média ponderada por volume. O motivo é
 * concreto: `lowest_ratio` é o extremo da hora, não um preço típico, e um único
 * fill absurdo o arrasta junto. Numa amostra real de 28/07 a hora das 09:00 UTC
 * trouxe `lowest` de 15 chaos por divine (contra ~115 nas horas vizinhas), e a
 * média ponderada devolveu 75 chaos/divine — 35% abaixo do mercado. Com mediana
 * o mesmo dado dá 111,8, contra 116,8 do poe.ninja.
 *
 * O volume continua sendo acumulado, mas como filtro de liquidez, não como peso.
 */
async function collectRates(
  league: string,
  hours: number,
): Promise<{ rates: Map<string, number>; volume: Map<string, number> }> {
  const now = Math.floor(Date.now() / 1000);
  const latest = now - (now % HOUR) - HOUR;

  const digests = await Promise.all(
    Array.from({ length: hours }, (_, k) => fetchHour(latest - HOUR * k).catch(() => [])),
  );

  const stats = new Map<string, PairStats>();
  for (const markets of digests) {
    for (const market of markets) {
      if (market.league !== league) continue;
      const pair = market.market_pair;
      if (!pair || pair.length !== 2) continue;

      const [a, b] = pair;
      const volumes = market.volume_traded || {};

      for (const [from, to] of [
        [a, b],
        [b, a],
      ] as const) {
        const rate = midRate(market, from, to);
        if (rate == null || !Number.isFinite(rate) || rate <= 0) continue;
        const key = pairKey(from, to);
        const prev = stats.get(key) || { rates: [], volume: 0 };
        prev.rates.push(rate);
        prev.volume += volumes[from] || 0;
        stats.set(key, prev);
      }
    }
  }

  const rates = new Map<string, number>();
  const volume = new Map<string, number>();
  // `forEach` em vez de `for...of`: o tsconfig do projeto não tem
  // downlevelIteration, então iterar Map/Set direto não compila.
  stats.forEach((stat, key) => {
    if (stat.rates.length === 0) return;
    rates.set(key, median(stat.rates));
    volume.set(key, stat.volume);
  });
  return { rates, volume };
}

export type CxDivineValues = {
  /** metadata_id -> valor do item em divines. */
  values: Map<string, number>;
  /** Quantos chaos valem 1 divine na janela — útil para conferência. */
  chaosPerDivine: number | null;
  hours: number;
  markets: number;
};

/**
 * Valor de cada moeda da liga expresso em DIVINES.
 *
 * Prefere o par direto item↔divine; sem ele, passa por chaos (item→chaos→divine),
 * que é o caminho da esmagadora maioria dos mercados.
 */
export async function getCxDivineValues(
  league: string,
  hours = 6,
  minVolume = 0,
): Promise<CxDivineValues> {
  const { rates, volume } = await collectRates(league, hours);

  const divinePerChaos = rates.get(pairKey(CHAOS_ID, DIVINE_ID)) ?? null;
  const values = new Map<string, number>();

  // O divine vale 1 divine — âncora trivial, mas evita caso especial adiante.
  values.set(DIVINE_ID, 1);

  const seen = new Set<string>();
  rates.forEach((_rate, key) => {
    seen.add(key.split("|")[0]);
  });

  for (const id of Array.from(seen)) {
    if (id === DIVINE_ID) continue;

    // Par direto com divine é preferível: uma conversão a menos, um erro a menos.
    const directKey = pairKey(id, DIVINE_ID);
    const direct = rates.get(directKey);
    if (direct && direct > 0 && (volume.get(directKey) || 0) >= minVolume) {
      values.set(id, direct);
      continue;
    }

    const chaosKey = pairKey(id, CHAOS_ID);
    const inChaos = rates.get(chaosKey);
    if (
      inChaos &&
      inChaos > 0 &&
      divinePerChaos &&
      divinePerChaos > 0 &&
      (volume.get(chaosKey) || 0) >= minVolume
    ) {
      values.set(id, inChaos * divinePerChaos);
    }
  }

  return {
    values,
    chaosPerDivine: divinePerChaos ? 1 / divinePerChaos : null,
    hours,
    markets: seen.size,
  };
}
