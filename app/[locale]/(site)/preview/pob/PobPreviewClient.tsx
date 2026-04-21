"use client";

import { useCallback, useMemo, useState } from "react";
import type { PortableTextBlock } from "sanity";
import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import {
  decodeAndResolve,
  fullDecode,
  type DecodeActionResult,
  type PobSummary,
  type PobSummaryGearEntry,
} from "./actions";

/**
 * Client-side UI for the PoB preview.
 *
 * Paste a PoB code / pobb.in / pastebin URL, hit Decode, and the server
 * action (see `./actions.ts`) calls `/pob/summary` on the engine, then
 * runs the resulting `summary.gear[]` and a synthetic blog paragraph
 * through the site's existing `resolveBlocks` placeholder resolver. The
 * resolved Portable Text trees come back pre-rendered so this component
 * only does layout + interactions (copy-to-clipboard, radio toggle).
 *
 * Four sections render on a successful decode:
 *   1. Build summary card — class/asc/level/main skill + key stats
 *   2. Gear gallery — `PoeItemBlogCard` inline per gear piece + flag chips
 *   3. Simulated blog post — paragraph built from decoded data, rendered
 *      through the same pipeline the blog uses
 *   4. Raw JSON + token estimate — debug toggle (summary vs full decode)
 */

// ---------------------------------------------------------------------------
// Types / helpers
// ---------------------------------------------------------------------------

interface Props {
  /** Full URL of the trimmed LLM summary endpoint (for display only). */
  summaryUrl: string;
  /** Full URL of the full decode endpoint (for display only). */
  decodeUrl: string;
  /** Whether the server-side tree layout probe succeeded on initial render. */
  engineReachable: boolean;
}

type ViewMode = "summary" | "full";

interface State {
  status: "idle" | "loading" | "error" | "ready";
  error: string | null;
  mode: ViewMode;
  /** Summary-mode payload (drives sections 1–4). */
  summary: PobSummary | null;
  gearBlocks: PortableTextBlock[] | null;
  blogBlocks: PortableTextBlock[] | null;
  gearCopyTokens: Array<{ token: string; kind: "pobitem" | "item" | "none" }> | null;
  /** Full-mode payload (drives section 4 only). */
  fullDecode: unknown | null;
}

const INITIAL_STATE: State = {
  status: "idle",
  error: null,
  mode: "summary",
  summary: null,
  gearBlocks: null,
  blogBlocks: null,
  gearCopyTokens: null,
  fullDecode: null,
};

const PLACEHOLDER_HINT = `Paste a Path of Building import code or a pobb.in / pastebin URL.

Examples:
  https://pobb.in/abcdef
  https://pastebin.com/raw/XYZ123
  <base64-encoded PoB export>

The engine decodes it, projects down to the LLM summary shape, then
runs every gear piece through the same {{item:...}} / {{pobitem:...}}
pipeline the blog uses.`;

/** Rough 4-chars-per-token heuristic — fine for an at-a-glance budget gauge. */
function estimateTokens(data: unknown): number {
  if (data == null) return 0;
  return Math.ceil(JSON.stringify(data).length / 4);
}

/** Copy arbitrary text to clipboard with a best-effort fallback. */
async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy fallback.
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PobPreviewClient({ summaryUrl, decodeUrl, engineReachable }: Props) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<State>(INITIAL_STATE);

  const handleDecode = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Paste a PoB code or pobb.in / pastebin URL first.",
      }));
      return;
    }

    setState((prev) => ({
      ...INITIAL_STATE,
      status: "loading",
      mode: prev.mode,
    }));

    // Always fetch the summary (sections 1-3 need it). Kick off the full
    // decode only when the user is currently viewing the full-JSON panel, so
    // we don't double-hit the engine on every Decode click.
    const shouldFetchFull = state.mode === "full";
    const [summaryRes, fullRes] = await Promise.all([
      decodeAndResolve(trimmed),
      shouldFetchFull ? fullDecode(trimmed) : Promise.resolve<DecodeActionResult | null>(null),
    ]);

    if (!summaryRes.ok) {
      setState((prev) => ({
        ...INITIAL_STATE,
        status: "error",
        error: summaryRes.error ?? "Unknown error.",
        mode: prev.mode,
      }));
      return;
    }

    setState((prev) => ({
      status: "ready",
      error: null,
      mode: prev.mode,
      summary: summaryRes.summary ?? null,
      gearBlocks: summaryRes.gearBlocks ?? null,
      blogBlocks: summaryRes.blogBlocks ?? null,
      gearCopyTokens: summaryRes.gearCopyTokens ?? null,
      fullDecode: fullRes?.ok ? (fullRes.full ?? null) : null,
    }));
  }, [code, state.mode]);

  const handleModeChange = useCallback(
    async (nextMode: ViewMode) => {
      // Toggle the mode immediately; if the user swings to full-mode after a
      // successful decode and we haven't fetched the full blob yet, lazily
      // pull it so the JSON panel reflects the selection.
      setState((prev) => ({ ...prev, mode: nextMode }));
      if (
        nextMode === "full" &&
        state.status === "ready" &&
        state.fullDecode == null &&
        code.trim()
      ) {
        const res = await fullDecode(code.trim());
        if (res.ok) {
          setState((prev) => ({ ...prev, fullDecode: res.full ?? null }));
        }
      }
    },
    [code, state.status, state.fullDecode],
  );

  const jsonForPanel = useMemo<unknown>(() => {
    if (state.mode === "full") return state.fullDecode;
    return state.summary;
  }, [state.mode, state.summary, state.fullDecode]);

  const tokenEstimate = useMemo(() => estimateTokens(jsonForPanel), [jsonForPanel]);

  return (
    <div className="space-y-6">
      {/* Input + controls ─────────────────────────────────────────────── */}
      <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <label
          htmlFor="pob-code"
          className="block text-xs uppercase tracking-wider text-neutral-500"
        >
          PoB code or URL
        </label>
        <textarea
          id="pob-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={PLACEHOLDER_HINT}
          className="block w-full min-h-[140px] resize-y rounded-md border border-neutral-800 bg-black px-3 py-2 font-mono text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
          <span className="uppercase tracking-wider text-neutral-500">JSON panel</span>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="pob-mode"
              value="summary"
              checked={state.mode === "summary"}
              onChange={() => handleModeChange("summary")}
            />
            <span>LLM summary</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="pob-mode"
              value="full"
              checked={state.mode === "full"}
              onChange={() => handleModeChange("full")}
            />
            <span>Full decode</span>
          </label>
          <button
            type="button"
            onClick={handleDecode}
            disabled={state.status === "loading" || !engineReachable}
            className="ml-auto rounded-md border border-neutral-700 bg-neutral-900 px-4 py-1.5 text-xs font-medium text-neutral-100 hover:bg-neutral-800 disabled:opacity-60"
          >
            {state.status === "loading" ? "Decoding…" : "Decode"}
          </button>
        </div>
        {!engineReachable && (
          <p className="text-xs text-amber-300">
            Engine did not respond to the tree-layout probe at render time.
            The decode buttons stay disabled until the engine is reachable.
          </p>
        )}
        <div className="grid gap-1 text-[11px] text-neutral-500 sm:grid-cols-2">
          <div>
            summary: <span className="font-mono text-neutral-400">{summaryUrl}</span>
          </div>
          <div>
            decode: <span className="font-mono text-neutral-400">{decodeUrl}</span>
          </div>
        </div>
      </div>

      {/* Error ──────────────────────────────────────────────────────── */}
      {state.status === "error" && state.error && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
          {state.error}
        </div>
      )}

      {/* Ready ──────────────────────────────────────────────────────── */}
      {state.status === "ready" && state.summary && (
        <>
          {/* Section 1 — always visible (summary mode only) */}
          {state.mode === "summary" && <BuildSummaryCard summary={state.summary} />}

          {/* Sections 2 + 3 — side-by-side on desktop, stacked on mobile */}
          {state.mode === "summary" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <GearGallery
                gear={state.summary.gear ?? []}
                resolvedBlocks={state.gearBlocks ?? []}
                copyTokens={state.gearCopyTokens ?? []}
              />
              <SimulatedBlog blocks={state.blogBlocks ?? []} />
            </div>
          )}

          {/* Section 4 — raw JSON + token estimate */}
          <JsonPanel
            data={jsonForPanel}
            mode={state.mode}
            tokenEstimate={tokenEstimate}
          />
        </>
      )}
    </div>
  );
}

// ===========================================================================
// Section 1 — Build summary card
// ===========================================================================

function BuildSummaryCard({ summary }: { summary: PobSummary }) {
  const header = [summary.class, summary.ascendancy].filter(Boolean).join(" / ");
  const level = summary.level ? `Lvl ${summary.level}` : null;
  const stats = summary.stats ?? {};

  const rows: Array<[string, string | null | undefined]> = [
    ["Main skill", summary.mainSkill ?? null],
    ["Supports", summary.supports?.length ? summary.supports.join(", ") : null],
    ["Total DPS", stats.totalDps],
    ["EHP", stats.ehp],
    ["Life", stats.life],
    ["Energy Shield", stats.energyShield],
    ["Resists (F/C/L/Ch)", stats.resists],
    ["Move speed", stats.movementSpeed],
  ];
  const present = rows.filter(([, v]) => v != null && v !== "");

  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-wider text-neutral-500">
        Section 1 — Build summary
      </h2>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white">
              {header || "Unknown class"}
            </h3>
            {summary.notes && (
              <p className="max-w-[52ch] text-sm text-neutral-400">{summary.notes}</p>
            )}
          </div>
          {level && (
            <span className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 font-mono text-sm text-amber-300">
              {level}
            </span>
          )}
        </div>
        {present.length > 0 ? (
          <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {present.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between border-b border-neutral-800/60 py-1 text-sm last:border-b-0"
              >
                <dt className="text-neutral-400">{k}</dt>
                <dd className="ml-4 text-right font-mono text-neutral-100">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">
            Engine returned no summary stats for this build.
          </p>
        )}
      </div>
    </section>
  );
}

// ===========================================================================
// Section 2 — Gear gallery
// ===========================================================================

function GearGallery({
  gear,
  resolvedBlocks,
  copyTokens,
}: {
  gear: PobSummaryGearEntry[];
  resolvedBlocks: PortableTextBlock[];
  copyTokens: Array<{ token: string; kind: "pobitem" | "item" | "none" }>;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-wider text-neutral-500">
        Section 2 — Gear gallery
      </h2>
      {gear.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5 text-sm text-neutral-500">
          No gear in the active item set.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {gear.map((g, i) => {
            const block = resolvedBlocks[i];
            const copy = copyTokens[i] ?? { token: "", kind: "none" };
            return (
              <GearCard
                key={`${g.slot}-${g.name}-${i}`}
                entry={g}
                block={block}
                copy={copy}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function GearCard({
  entry,
  block,
  copy,
}: {
  entry: PobSummaryGearEntry;
  block: PortableTextBlock | undefined;
  copy: { token: string; kind: "pobitem" | "item" | "none" };
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!copy.token) return;
    const ok = await copyToClipboard(copy.token);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [copy.token]);

  // Only warn when we ASKED for a placeholder (copy.kind !== "none") but the
  // resolver couldn't inject the poeItem mark — that means the engine was
  // unreachable or the snapshot id expired. If no placeholder was ever
  // requested (non-canonical unique without id), silently show the name.
  const attemptedResolution = copy.kind !== "none";
  const renderFallback = attemptedResolution && !blockHasPoeItemMark(block);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          {entry.slot}
        </span>
        {copy.kind !== "none" && (
          <button
            type="button"
            onClick={handleCopy}
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 font-mono text-[10px] text-neutral-300 hover:border-amber-600/60 hover:text-amber-300"
            title={copy.token}
          >
            {copied
              ? "Copied!"
              : copy.kind === "pobitem"
                ? "Copy {{pobitem:id}}"
                : "Copy {{item:Name}}"}
          </button>
        )}
      </div>

      <div className="min-h-[2rem] text-[15px]">
        {block ? (
          <BlockContentRenderer value={[block]} />
        ) : (
          <span className="font-semibold text-neutral-200">{entry.name}</span>
        )}
      </div>

      {renderFallback && (
        <p className="text-[11px] text-amber-300/80">
          Placeholder did not resolve — rendering name only. Engine may be
          unreachable or the snapshot id expired.
        </p>
      )}

      <FlagChips entry={entry} />
    </div>
  );
}

function FlagChips({ entry }: { entry: PobSummaryGearEntry }) {
  const chips: Array<{ label: string; tone: string }> = [];
  if (entry.corrupted) chips.push({ label: "Corrupted", tone: "bg-red-950/60 text-red-300 border-red-900" });
  if (entry.mirrored) chips.push({ label: "Mirrored", tone: "bg-purple-950/60 text-purple-300 border-purple-900" });
  if (entry.fractured) chips.push({ label: "Fractured", tone: "bg-amber-950/60 text-amber-300 border-amber-900" });
  if (entry.split) chips.push({ label: "Split", tone: "bg-sky-950/60 text-sky-300 border-sky-900" });
  if (entry.influences?.length) {
    for (const inf of entry.influences) {
      chips.push({
        label: inf,
        tone: "bg-neutral-800/80 text-neutral-300 border-neutral-700",
      });
    }
  }
  if (entry.itemLevel != null) {
    chips.push({
      label: `iLvl ${entry.itemLevel}`,
      tone: "bg-neutral-800/80 text-neutral-300 border-neutral-700",
    });
  }
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c, i) => (
        <span
          key={`${c.label}-${i}`}
          className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${c.tone}`}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}

/** Walk the block tree looking for a span carrying a `poeItem` mark. */
function blockHasPoeItemMark(block: PortableTextBlock | undefined): boolean {
  if (!block) return false;
  const b = block as unknown as {
    markDefs?: Array<{ _key?: string; _type?: string }>;
    children?: Array<{ marks?: string[] }>;
  };
  const itemKeys = new Set(
    (b.markDefs ?? [])
      .filter((m) => m?._type === "poeItem" && m._key)
      .map((m) => m._key as string),
  );
  if (itemKeys.size === 0) return false;
  return (b.children ?? []).some((child) =>
    (child.marks ?? []).some((m) => itemKeys.has(m)),
  );
}

// ===========================================================================
// Section 3 — Simulated blog post
// ===========================================================================

function SimulatedBlog({ blocks }: { blocks: PortableTextBlock[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-wider text-neutral-500">
        Section 3 — Simulated blog post
      </h2>
      <article className="prose prose-invert prose-lg max-w-none rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
        {blocks.length ? (
          <BlockContentRenderer value={blocks} />
        ) : (
          <p className="text-sm text-neutral-500">No excerpt generated.</p>
        )}
      </article>
      <p className="text-[11px] text-neutral-500">
        This paragraph is composed server-side from the decoded summary, then
        run through <code>resolveBlocks()</code> — the same pipeline every
        blog post uses. Hovering any item renders the same tooltip the
        production site ships.
      </p>
    </section>
  );
}

// ===========================================================================
// Section 4 — Raw JSON + token estimate
// ===========================================================================

function JsonPanel({
  data,
  mode,
  tokenEstimate,
}: {
  data: unknown;
  mode: ViewMode;
  tokenEstimate: number;
}) {
  const [copied, setCopied] = useState(false);

  const payload = useMemo(
    () => (data == null ? "" : JSON.stringify(data, null, 2)),
    [data],
  );

  const handleCopy = useCallback(async () => {
    if (!payload) return;
    const ok = await copyToClipboard(payload);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [payload]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
        <span className="text-xs uppercase tracking-wider text-neutral-500">
          Section 4 — Raw JSON (
          <span className="font-mono text-neutral-200">
            {mode === "summary" ? "summary" : "full decode"}
          </span>
          )
        </span>
        <div className="flex items-center gap-4">
          <span>
            Token estimate:{" "}
            <span className="font-mono text-neutral-200">
              ~{tokenEstimate.toLocaleString("en-US")}
            </span>
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!payload}
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-900 disabled:opacity-60"
          >
            {copied ? "Copied!" : "Copy summary"}
          </button>
        </div>
      </div>
      {payload ? (
        <pre className="max-h-[640px] overflow-auto rounded-lg border border-neutral-800 bg-black p-4 font-mono text-xs text-neutral-200">
          {payload}
        </pre>
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-black p-4 text-xs text-neutral-500">
          {mode === "full"
            ? "Full decode not fetched yet — switch to this mode to pull it."
            : "No data."}
        </div>
      )}
    </section>
  );
}
