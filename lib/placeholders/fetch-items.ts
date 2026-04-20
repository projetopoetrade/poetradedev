import 'server-only';
import { getEngineApiBase } from './engine';

/**
 * Server-side fetcher for engine-synthesised item rawText.
 *
 * The engine exposes `GET /api/items/:name/raw` which returns the Ctrl+C
 * clipboard format used by the site's `parseRawPoeItem`. When configured
 * via `ENGINE_PRICES_URL` (shared with the price mirror), a `{{item:Name}}`
 * placeholder is resolved into a Portable Text mark with a hover tooltip
 * identical to the in-game experience.
 */

export interface ItemRawData {
  rawText: string;
  iconUrl: string | null;
  name: string;
  baseName: string | null;
  rarity: string | null;
}

const REVALIDATE_SECONDS = 60 * 60; // 1h — item stat blocks barely change
const REQUEST_TIMEOUT_MS = 3000;

export async function fetchItemRaw(name: string): Promise<ItemRawData | null> {
  const engineBase = getEngineBase();
  if (!engineBase) return null;

  // engineBase already includes the `/items` segment — don't double it here.
  const url = `${engineBase}/${encodeURIComponent(name)}/raw`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as ItemRawData;
    if (!data?.rawText) return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchItemRawMany(
  names: string[],
): Promise<Record<string, ItemRawData>> {
  const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  if (!unique.length) return {};

  const entries = await Promise.all(
    unique.map(async (n) => [n, await fetchItemRaw(n)] as const),
  );
  const out: Record<string, ItemRawData> = {};
  for (const [n, data] of entries) {
    if (data) out[n.toLowerCase()] = data;
  }
  return out;
}

function getEngineBase(): string | null {
  const base = getEngineApiBase();
  return base ? `${base}/items` : null;
}
