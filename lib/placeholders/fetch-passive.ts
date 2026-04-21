import 'server-only';
import { getEngineApiBase } from './engine';

/**
 * Server-side fetcher for engine-persisted passive skill node tooltips.
 *
 * The content engine exposes `GET /api/passives/:name/raw` which returns a
 * Ctrl+C-shaped `rawText` block ("Rarity: Notable\n<Name>\n--------\n<stats>")
 * plus metadata. A `{{passive:Name}}` placeholder resolves into the same
 * `PoeItemBlogCard` mark used by `{{item:…}}` and `{{pobitem:…}}`. The engine
 * synthesises "Rarity: Passive" so `parseRawPoeItem` still yields a PobItem
 * with the stats as implicits — the rendered tooltip reuses `ItemTooltip`
 * verbatim. No custom branch in the tooltip component is required for MVP.
 */

export type PassiveKind =
  | 'notable'
  | 'keystone'
  | 'ascendancy'
  | 'mastery'
  | 'jewel_socket'
  | 'small';

export interface PassiveRawData {
  rawText: string;
  name: string;
  kind: PassiveKind;
  iconUrl: string | null;
  ascendancyClass: string | null;
  isAtlasPassive: boolean;
  patchVersion: string;
}

// Passive tooltips are tied to the passive tree export for a given patch and
// barely change within a league — 1h revalidate keeps the blog responsive
// to engine redeploys without hammering the endpoint.
const REVALIDATE_SECONDS = 60 * 60;
const REQUEST_TIMEOUT_MS = 3000;

export async function fetchPassiveRaw(name: string): Promise<PassiveRawData | null> {
  const engineBase = getEngineBase();
  if (!engineBase) return null;

  const trimmed = name?.trim();
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
    const data = (await res.json()) as PassiveRawData;
    if (!data?.rawText) return null;
    return { ...data, iconUrl: rewriteLocalPassiveIcon(data.iconUrl) };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Rewrites passive-icon URLs whose host is `pathoftrade.net` to a path
 * relative to the current origin. The production site hosts WebP icons at
 * `public/images/passives/` and the engine returns absolute URLs pointing at
 * that origin — but pathoftrade.net sits behind a Cloudflare bot challenge
 * that 403s any request without a prior challenge-passed session cookie.
 * Preview deploys (`preview-xxx.vercel.app`) don't carry that cookie, so
 * server-to-server image optimisation AND browser `<img>` loads both fail.
 *
 * Rewriting to the same-origin path `/images/passives/<file>.webp` makes
 * the browser load the icon from the deploy that's actually serving the
 * page (which always ships the WebPs via `public/images/passives/`),
 * bypassing Cloudflare entirely.
 *
 * Non-pathoftrade URLs and non-passive paths are returned unchanged.
 */
function rewriteLocalPassiveIcon(raw: string | null): string | null {
  if (!raw) return raw;
  const m = raw.match(
    /^https?:\/\/(?:www\.)?pathoftrade\.net(\/images\/passives\/[^?#]+)$/i,
  );
  if (!m) return raw;
  return m[1];
}

export async function fetchPassiveRawMany(
  names: string[],
): Promise<Map<string, PassiveRawData>> {
  const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  const out = new Map<string, PassiveRawData>();
  if (!unique.length) return out;

  const entries = await Promise.all(
    unique.map(async (n) => [n, await fetchPassiveRaw(n)] as const),
  );
  for (const [n, data] of entries) {
    if (data) out.set(n.toLowerCase(), data);
  }
  return out;
}

function getEngineBase(): string | null {
  const base = getEngineApiBase();
  return base ? `${base}/passives` : null;
}
