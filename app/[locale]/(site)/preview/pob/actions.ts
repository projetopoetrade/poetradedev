"use server";

import { getEngineApiBase } from "@/lib/placeholders/engine";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";
import type { PortableTextBlock } from "sanity";

/**
 * Server actions for the `/preview/pob` sandbox.
 *
 * The heavy lifting — hitting the engine's `/pob/summary` endpoint, then
 * running the decoded summary through the placeholder resolver — runs on
 * the server so the `server-only` `resolveBlocks` pipeline (which fetches
 * `/items/:name/raw` and `/pob/items/:id/raw` under the hood) can execute
 * without exposing those URLs to the browser.
 *
 * The client component calls `decodeAndResolve` with a raw PoB code / URL
 * and receives back the typed summary plus three pre-resolved Portable
 * Text trees: one per gear piece for the gallery, one for the simulated
 * blog paragraph, and the raw decode JSON + decode errors.
 */

// ---------------------------------------------------------------------------
// Types — mirror the engine's PobSummary shape. Keep this subset loose
// (Partial) so the page keeps rendering when the engine drops fields.
// ---------------------------------------------------------------------------

export interface PobSummaryGearEntry {
  slot: string;
  name: string;
  isUnique: boolean;
  canonical: boolean;
  id?: string;
  explicits?: string[];
  implicits?: string[];
  enchant?: string;
  influences?: string[];
  itemLevel?: number;
  corrupted?: boolean;
  mirrored?: boolean;
  fractured?: boolean;
  split?: boolean;
}

export interface PobSummary {
  class?: string;
  ascendancy?: string;
  level?: number;
  notes?: string;
  stats?: {
    totalDps?: string;
    ehp?: string;
    life?: string;
    energyShield?: string;
    resists?: string;
    movementSpeed?: string;
  };
  mainSkill?: string | null;
  supports?: string[];
  tree?: {
    nodesTotal?: number;
    keystones?: string[];
    notablesAllocated?: string[];
    masteries?: Array<{ name: string; choice: string }>;
    jewels?: string[];
  };
  gear?: PobSummaryGearEntry[];
}

export interface DecodeActionResult {
  ok: boolean;
  error?: string;
  /** Full summary JSON returned by the engine. */
  summary?: PobSummary;
  /** Raw decoded JSON when mode==='full' — pass-through for the JSON panel. */
  full?: unknown;
  /**
   * Pre-resolved Portable Text tree, one block per gear piece. Maps 1:1
   * with `summary.gear[]`; indexes align. Falls back to a plain-text
   * block when the placeholder couldn't be resolved.
   */
  gearBlocks?: PortableTextBlock[];
  /** Pre-resolved Portable Text tree for the simulated blog paragraph. */
  blogBlocks?: PortableTextBlock[];
  /** The placeholder token each gear card's "Copy" button should copy. */
  gearCopyTokens?: Array<{ token: string; kind: "pobitem" | "item" | "none" }>;
}

// ---------------------------------------------------------------------------
// Action — summary mode
// ---------------------------------------------------------------------------

export async function decodeAndResolve(code: string): Promise<DecodeActionResult> {
  const trimmed = code?.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a PoB code or pobb.in / pastebin URL first." };
  }

  const engineBase = getEngineApiBase();
  if (!engineBase) {
    return { ok: false, error: "Engine not configured. Set ENGINE_API_URL." };
  }

  // 1. Hit the summary endpoint. We always resolve against the summary shape
  //    because sections 1-3 need the trimmed gear[] payload. Full-decode
  //    fetching lives in a separate action below.
  let summary: PobSummary;
  try {
    const res = await fetch(`${engineBase}/pob/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed }),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      const msg = body?.message ?? body?.error ?? `HTTP ${res.status} ${res.statusText}`;
      return { ok: false, error: msg };
    }
    summary = (await res.json()) as PobSummary;
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  const gear = Array.isArray(summary.gear) ? summary.gear : [];

  // 2. Build a Portable Text block for every gear entry. Each block has a
  //    single `{{item:Name}}` or `{{pobitem:id}}` placeholder — the resolver
  //    walks the tree and injects the `poeItem` mark that `PoeItemBlogCard`
  //    renders as a tooltip card.
  const gearBlocks: PortableTextBlock[] = gear.map((g, i) => {
    const token = gearPlaceholderToken(g);
    const text = token ?? g.name;
    return {
      _type: "block",
      _key: `gear-${i}`,
      style: "normal",
      markDefs: [],
      children: [
        { _type: "span", _key: `gear-${i}-s`, text, marks: [] },
      ],
    } as PortableTextBlock;
  });

  // 3. Build the copy-token list the client surfaces under each card.
  const gearCopyTokens = gear.map((g) => {
    if (g.id) return { token: `{{pobitem:${g.id}}}`, kind: "pobitem" as const };
    if (g.canonical && g.name) return { token: `{{item:${g.name}}}`, kind: "item" as const };
    return { token: "", kind: "none" as const };
  });

  // 4. Compose the simulated blog paragraph from the decoded build. Picks a
  //    unique belt, a non-unique body/helmet/glove, two keystones, and the
  //    main skill so every `{{...}}` kind (item / pobitem / passive) shows up.
  const blogBlocks = await buildSimulatedPost(summary);

  // 5. Finally run both trees through the resolver in parallel.
  const [resolvedGear, resolvedBlog] = await Promise.all([
    resolveBlocks(gearBlocks, { locale: "en", league: "Mirage" }),
    resolveBlocks(blogBlocks, { locale: "en", league: "Mirage" }),
  ]);

  return {
    ok: true,
    summary,
    gearBlocks: resolvedGear,
    blogBlocks: resolvedBlog,
    gearCopyTokens,
  };
}

// ---------------------------------------------------------------------------
// Action — full decode mode. The full-mode toggle in the UI only drives the
// JSON panel (sections 1-3 are summary-only), so this action is a plain
// pass-through of the engine response.
// ---------------------------------------------------------------------------

export async function fullDecode(code: string): Promise<DecodeActionResult> {
  const trimmed = code?.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a PoB code or pobb.in / pastebin URL first." };
  }
  const engineBase = getEngineApiBase();
  if (!engineBase) {
    return { ok: false, error: "Engine not configured. Set ENGINE_API_URL." };
  }
  try {
    const res = await fetch(`${engineBase}/pob/decode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed }),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      const msg = body?.message ?? body?.error ?? `HTTP ${res.status} ${res.statusText}`;
      return { ok: false, error: msg };
    }
    return { ok: true, full: (await res.json()) as unknown };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gearPlaceholderToken(g: PobSummaryGearEntry): string | null {
  if (g.id) return `{{pobitem:${g.id}}}`;
  if (g.canonical && g.name) return `{{item:${g.name}}}`;
  return null;
}

/**
 * Compose a realistic single-paragraph blog excerpt using placeholders
 * picked from the decoded build. Every kind of placeholder that `resolveBlocks`
 * handles gets at least one mention where the data allows — this is the
 * "money shot" preview that proves the LLM's output will render end-to-end.
 */
async function buildSimulatedPost(summary: PobSummary): Promise<PortableTextBlock[]> {
  const gear = Array.isArray(summary.gear) ? summary.gear : [];
  const keystones = summary.tree?.keystones ?? [];

  const beltUnique = gear.find(
    (g) => slotMatches(g.slot, ["belt"]) && g.isUnique && g.canonical && g.name,
  );
  const bodyPieceRare = gear.find(
    (g) =>
      slotMatches(g.slot, ["helmet", "body", "chest", "glove"]) &&
      !g.isUnique &&
      !!g.id,
  );

  const beltToken = beltUnique
    ? `{{item:${beltUnique.name}}}`
    : pickFallbackUniqueToken(gear);
  const rareToken = bodyPieceRare
    ? `{{pobitem:${bodyPieceRare.id}}}`
    : pickFallbackRareToken(gear);

  const keystone1 = keystones[0];
  const keystone2 = keystones[1];
  const mainSkill = summary.mainSkill || null;
  const cls = summary.class || "Build";
  const asc = summary.ascendancy ? ` ${summary.ascendancy}` : "";
  const level = summary.level ? ` at level ${summary.level}` : "";

  // Build the paragraph piece-by-piece so we only emit placeholders we can
  // actually resolve. Parts that have no data fall back to plain prose.
  const pieces: string[] = [];
  pieces.push(`This ${cls}${asc}${level} build`);
  if (beltToken) {
    pieces.push(` anchors around ${beltToken} for its defining unique effect`);
  } else {
    pieces.push(` anchors around a flexible belt slot`);
  }
  if (rareToken) {
    pieces.push(`, paired with a specific piece (${rareToken}) that rolled critical affixes for the build's scaling`);
  }
  pieces.push(`.`);
  if (keystone1 || keystone2) {
    const ks: string[] = [];
    if (keystone1) ks.push(`{{passive:${keystone1}}}`);
    if (keystone2) ks.push(`{{passive:${keystone2}}}`);
    pieces.push(` The tree commits to ${ks.join(" and ")}`);
    if (mainSkill) {
      pieces.push(`, and the main damage skill is {{item:${mainSkill}}}`);
    }
    pieces.push(`.`);
  } else if (mainSkill) {
    pieces.push(` The main damage skill is {{item:${mainSkill}}}.`);
  }

  const paragraph = pieces.join("");

  return [
    {
      _type: "block",
      _key: "sim-h",
      style: "h3",
      markDefs: [],
      children: [
        { _type: "span", _key: "sim-hs", text: "Sample blog excerpt", marks: [] },
      ],
    },
    {
      _type: "block",
      _key: "sim-p",
      style: "normal",
      markDefs: [],
      children: [
        { _type: "span", _key: "sim-ps", text: paragraph, marks: [] },
      ],
    },
  ] as PortableTextBlock[];
}

/** Case-insensitive slot match — PoB exports mix casing ("Body Armour" / "body"). */
function slotMatches(slot: string | undefined, needles: string[]): boolean {
  if (!slot) return false;
  const s = slot.toLowerCase();
  return needles.some((n) => s.includes(n));
}

function pickFallbackUniqueToken(gear: PobSummaryGearEntry[]): string | null {
  const unique = gear.find((g) => g.isUnique && g.canonical && g.name);
  return unique ? `{{item:${unique.name}}}` : null;
}

function pickFallbackRareToken(gear: PobSummaryGearEntry[]): string | null {
  const anyWithId = gear.find((g) => !!g.id);
  return anyWithId ? `{{pobitem:${anyWithId.id}}}` : null;
}
