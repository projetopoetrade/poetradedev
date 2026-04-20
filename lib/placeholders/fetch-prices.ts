import 'server-only';
import { getEngineApiBase } from './engine';

/**
 * Server-side price fetcher for placeholder resolution.
 *
 * Prefers the Path of Trade content engine (`ENGINE_PRICES_URL`) — it mirrors
 * poe.ninja with a 30 min cache, normalises the shape, and does a batch
 * lookup in one request. Falls back to hitting poe.ninja directly (11
 * category endpoints in parallel) if the engine URL is not configured.
 *
 * Results are cached by Next.js `fetch` for 5 minutes to bound per-page cost
 * when many placeholders reference different items.
 */

export interface PriceEntry {
  name: string;
  chaos: number;
  divine: number;
  listingCount?: number;
  icon?: string | null;
  category?: string;
}

const POE1_CATEGORIES = [
  'Currency',
  'Fragment',
  'UniqueWeapon',
  'UniqueArmour',
  'UniqueAccessory',
  'UniqueFlask',
  'UniqueJewel',
  'DivinationCard',
  'SkillGem',
  'Essence',
  'Scarab',
] as const;

const REVALIDATE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 4000;

export async function fetchPrices(
  names: string[],
  league: string,
): Promise<Record<string, PriceEntry>> {
  const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  if (!unique.length) return {};

  const engineBase = getEngineApiBase();
  if (engineBase) {
    try {
      return await fetchFromEngine(`${engineBase}/ninja`, unique, league);
    } catch (err) {
      // fall through to direct
      console.warn('[placeholders] engine lookup failed, falling back to poe.ninja:', err);
    }
  }
  return fetchFromPoeNinjaDirect(unique, league);
}

// ---------------------------------------------------------------------------
// Engine path (single batched request)
// ---------------------------------------------------------------------------

async function fetchFromEngine(
  engineUrl: string,
  names: string[],
  league: string,
): Promise<Record<string, PriceEntry>> {
  const url = `${engineUrl}/lookup?names=${encodeURIComponent(names.join(','))}&league=${encodeURIComponent(league)}&game=poe1`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`engine ${res.status}`);
    const data = await res.json();
    const items = (data?.items ?? {}) as Record<string, any>;
    const out: Record<string, PriceEntry> = {};
    for (const [name, item] of Object.entries(items)) {
      out[name.toLowerCase()] = {
        name,
        chaos: Number(item?.chaosValue ?? 0),
        divine: Number(item?.divineValue ?? 0),
        listingCount: Number(item?.listingCount ?? 0),
        icon: item?.icon ?? null,
        category: item?.category,
      };
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Fallback path (11 poe.ninja calls in parallel)
// ---------------------------------------------------------------------------

async function fetchFromPoeNinjaDirect(
  names: string[],
  league: string,
): Promise<Record<string, PriceEntry>> {
  const needles = new Set(names.map((n) => n.toLowerCase()));
  const results: Record<string, PriceEntry> = {};

  await Promise.all(
    POE1_CATEGORIES.map(async (category) => {
      const endpoint = category === 'Currency' || category === 'Fragment'
        ? 'currencyoverview'
        : 'itemoverview';
      const url = `https://poe.ninja/api/data/${endpoint}?league=${encodeURIComponent(league)}&type=${category}`;

      try {
        const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
        if (!res.ok) return;
        const raw = await res.json();
        mergeMatches(raw, category, needles, results);
      } catch {
        /* swallow — one bad category shouldn't break the whole page */
      }
    }),
  );

  return results;
}

function mergeMatches(
  raw: any,
  category: string,
  needles: Set<string>,
  out: Record<string, PriceEntry>,
): void {
  const lines = Array.isArray(raw?.lines) ? raw.lines : [];
  const isCurrency = category === 'Currency' || category === 'Fragment';

  if (isCurrency) {
    const details: Record<string, { icon?: string }> = {};
    for (const d of raw?.currencyDetails ?? []) {
      if (d?.name) details[d.name] = { icon: d.icon };
    }
    const divine = lines.find((l: any) => l?.currencyTypeName === 'Divine Orb');
    const divineInChaos = Number(divine?.chaosEquivalent ?? 0);

    for (const line of lines) {
      const name = line?.currencyTypeName;
      if (!name || !needles.has(name.toLowerCase())) continue;
      const chaos = Number(line?.chaosEquivalent ?? 0);
      out[name.toLowerCase()] = {
        name,
        chaos,
        divine: divineInChaos > 0 ? chaos / divineInChaos : 0,
        listingCount: Number(line?.receive?.count ?? 0),
        icon: details[name]?.icon ?? null,
        category,
      };
    }
  } else {
    for (const line of lines) {
      const name = line?.name;
      if (!name || !needles.has(name.toLowerCase())) continue;
      out[name.toLowerCase()] = {
        name,
        chaos: Number(line?.chaosValue ?? 0),
        divine: Number(line?.divineValue ?? 0),
        listingCount: Number(line?.count ?? 0),
        icon: line?.icon ?? null,
        category,
      };
    }
  }
}
