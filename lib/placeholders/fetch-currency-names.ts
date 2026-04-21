import 'server-only';
import { getEngineApiBase } from './engine';

/**
 * Server-side fetcher for the engine's currency-name catalog.
 *
 * The list powers `promoteInlineMentions` in `resolve-blocks.ts` — any bare
 * "Divine Orb" / "Horned Scarab of Preservation" / etc. in prose gets
 * rewritten to `{{item:Name}}` before the resolver walks the block, so the
 * downstream item-card flow produces a live tooltip.
 *
 * Previously this list was a hard-coded ~30-name whitelist. The engine now
 * serves the full set from Postgres (every `classId IN (StackableCurrency,
 * MapFragment)` with `isTempLeague = true`), so this module is the single
 * point of truth at render time.
 *
 * Cache strategy: Next.js fetch revalidation (`revalidate: 3600`). The list
 * changes only on wiki crawl + engine redeploy — an hour of staleness is
 * fine.
 */

export interface CurrencyNamesResult {
  names: string[];
}

const REVALIDATE_SECONDS = 60 * 60; // 1h
const REQUEST_TIMEOUT_MS = 3000;

/**
 * Minimal built-in fallback. Kept short on purpose: when the engine is
 * unreachable we still promote the top ~30 mentions the old hard-coded
 * whitelist covered, so prose degrades gracefully rather than leaving
 * "Divine Orb" unlinked. Do NOT grow this list — extend the DB instead.
 */
const FALLBACK_CURRENCY_NAMES: readonly string[] = Object.freeze([
  'Mirror of Kalandra',
  'Divine Orb',
  'Exalted Orb',
  'Chaos Orb',
  'Awakened Sextant',
  'Orb of Annulment',
  'Orb of Alchemy',
  'Orb of Fusing',
  'Orb of Scouring',
  'Orb of Regret',
  'Orb of Chance',
  'Vaal Orb',
  'Regal Orb',
  'Blessed Orb',
  "Cartographer's Chisel",
  "Gemcutter's Prism",
  'Eternal Orb',
  "Jeweller's Orb",
  'Orb of Transmutation',
  'Orb of Augmentation',
  'Chromatic Orb',
  "Hinekora's Lock",
  'Mirror Shard',
  'Exalted Shard',
  'Ancient Orb',
  "Harbinger's Orb",
  'Veiled Chaos Orb',
  'Sacrifice at Dawn',
  'Sacrifice at Dusk',
  'Sacrifice at Midnight',
  'Sacrifice at Noon',
  'Mortal Grief',
  'Mortal Hope',
  'Mortal Rage',
  'Mortal Ignorance',
]);

/**
 * Fetches the temp-league-valid currency/fragment/scarab name list from the
 * engine. Returns the fallback on any failure path so the caller can build
 * its regex unconditionally. Never throws.
 */
export async function fetchCurrencyNames(): Promise<readonly string[]> {
  const engineBase = getEngineApiBase();
  if (!engineBase) return FALLBACK_CURRENCY_NAMES;

  const url = `${engineBase}/items/currencies`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return FALLBACK_CURRENCY_NAMES;
    const data = (await res.json()) as CurrencyNamesResult;
    const names = Array.isArray(data?.names) ? data.names.filter(Boolean) : [];
    if (!names.length) return FALLBACK_CURRENCY_NAMES;
    return names;
  } catch {
    return FALLBACK_CURRENCY_NAMES;
  } finally {
    clearTimeout(timer);
  }
}
