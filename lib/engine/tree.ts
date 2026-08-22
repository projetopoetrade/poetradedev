import 'server-only';
import { getEngineApiBase } from '@/lib/placeholders/engine';

/**
 * Server-side fetcher for the engine's tree layout pointer.
 *
 * The response intentionally does NOT contain the full node list — those
 * come from the GGG `data.json` (linked via `dataJsonUrl`) which the
 * client fetches directly from GitHub raw (CDN-cached, gzipped). The
 * engine's role here is to tell the frontend which patch is active and
 * where to find the matching assets.
 *
 * Tooltip content per node is fetched separately via `/api/passives/:name/raw`.
 */

export interface TreeLayoutPointer {
  patch: string;
  game: 'poe1' | 'poe2';
  repo: string;
  commitSha: string | null;
  fetchedAt: string;
  nodeCount: number;
  /**
   * Engine-hosted trimmed tree data — preferred. Omits sprites/extraImages
   * so the payload drops from ~6.7MB to ~1.5MB (gzip ~400KB). Patch-
   * immutable, HTTP cache set to 1 year.
   */
  treeDataUrl: string;
  /** GitHub raw fallback (full GGG data.json, ~6.7MB). */
  dataJsonUrl: string;
  assetBaseUrl: string;
  extents: {
    minX: number | null;
    minY: number | null;
    maxX: number | null;
    maxY: number | null;
  };
  imageZoomLevels: number[] | null;
}

const REVALIDATE_SECONDS = 6 * 60 * 60; // 6h — dado de patch, muda na virada de liga
const REQUEST_TIMEOUT_MS = 3000;

export async function fetchTreeLayout(
  opts: { patch?: string; game?: 'poe1' | 'poe2' } = {},
): Promise<TreeLayoutPointer | null> {
  const base = getEngineApiBase();
  if (!base) return null;

  const params = new URLSearchParams();
  if (opts.patch) params.set('patch', opts.patch);
  if (opts.game) params.set('game', opts.game);
  const qs = params.toString();
  const url = `${base}/tree/layout${qs ? `?${qs}` : ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS, tags: ['engine-tree'] },
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as TreeLayoutPointer;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
