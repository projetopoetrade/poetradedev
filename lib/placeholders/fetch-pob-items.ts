import 'server-only';
import { getEngineApiBase } from './engine';

/**
 * Server-side fetcher for engine-persisted PoB item snapshots.
 *
 * The content engine exposes `GET /api/pob/items/:id/raw` which returns the
 * Ctrl+C clipboard format + metadata, mirroring `/api/items/:name/raw`. A
 * `{{pobitem:id}}` placeholder resolves into the same `PoeItemBlogCard`
 * tooltip as `{{item:Name}}` — same renderer, same parser. The distinction
 * is purely about provenance: snapshots capture the exact decoded mods of
 * a specific build's item (rare rolls, enchants, corrupted implicits),
 * while canonical items are looked up by name from the Item table.
 */

export interface PobItemRawData {
  rawText: string;
  iconUrl: string | null;
  name: string;
  baseName: string | null;
  rarity: string | null;
  classId: string | null;
}

// PoB snapshot items change only when the engine is redeployed, but they
// do GC under the TTL cron — 1h revalidate is cheap enough that a
// rendered blog post recovers quickly if the ID gets recycled.
const REVALIDATE_SECONDS = 60 * 60;
const REQUEST_TIMEOUT_MS = 3000;

export async function fetchPobItemRaw(id: string): Promise<PobItemRawData | null> {
  const engineBase = getEngineBase();
  if (!engineBase) return null;

  const trimmed = id?.trim();
  if (!trimmed) return null;

  const url = `${engineBase}/${encodeURIComponent(trimmed)}/raw`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as PobItemRawData;
    if (!data?.rawText) return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPobItemRawMany(
  ids: string[],
): Promise<Record<string, PobItemRawData>> {
  const unique = Array.from(new Set(ids.map((n) => n.trim()).filter(Boolean)));
  if (!unique.length) return {};

  const entries = await Promise.all(
    unique.map(async (id) => [id, await fetchPobItemRaw(id)] as const),
  );
  const out: Record<string, PobItemRawData> = {};
  for (const [id, data] of entries) {
    if (data) out[id] = data;
  }
  return out;
}

function getEngineBase(): string | null {
  const base = getEngineApiBase();
  return base ? `${base}/pob/items` : null;
}
