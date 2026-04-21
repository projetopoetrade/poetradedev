import Link from "next/link";
import type { PortableTextBlock } from "sanity";
import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { getEngineApiBase } from "@/lib/placeholders/engine";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";
import { OpenInPobButton } from "@/components/poe/OpenInPobButton";
import { fetchShowcaseSummary, generateProse } from "./actions";
import type {
  PobSummary,
  PobSummaryGearEntry,
  ProseResult,
} from "./types";

/**
 * `/preview/showcase` — the end-state demo that exercises every placeholder
 * and resolver shipped this session in a single scrollable "published build
 * guide" page.
 *
 * Everything the reader sees is produced from one real PoB URL:
 *
 *   1. Hero header:         class + ascendancy + level + main-skill {{item:}} tooltip
 *   2. Key stats card:      summary.stats + a {{price:...|divine}} callout
 *   3. Tree paragraph:      LLM prose with {{passive:Name}} citations
 *   4. Skills paragraph:    LLM prose with {{item:gem}} + support citations
 *   5. Gear gallery:        one card per gear slot, {{item:}} or {{pobitem:}}
 *   6. Wrap-up paragraph:   LLM prose citing skills + notables + a price
 *   7. Footer:              source PoB, token estimate, engine URLs
 *
 * LLM calls go to `/api/preview/prose` on the engine (new controller) with a
 * direct-OpenRouter fallback when that endpoint is not yet deployed. A
 * deterministic placeholder-laced paragraph is the last-resort fallback, so
 * the page always renders with live tooltips — no dead air.
 */

const SHOWCASE_POB_URL = "https://pobb.in/mt8Dgu1nxC2G";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ShowcasePreviewPage() {
  const engineBase = getEngineApiBase();
  if (!engineBase) {
    return <EngineMissing />;
  }

  const summaryRes = await fetchShowcaseSummary(SHOWCASE_POB_URL);
  if (!summaryRes.ok || !summaryRes.summary) {
    return <SummaryError error={summaryRes.error ?? "Unknown error"} />;
  }
  const summary = summaryRes.summary;

  // Fire the three LLM prose sections in parallel — independent of one another
  // and independent of gear-block resolution. The slowest call still caps the
  // whole page at one round-trip of LLM latency.
  const [treeProse, skillsProse, wrapupProse] = await Promise.all([
    generateProse(summary, "tree"),
    generateProse(summary, "skills"),
    generateProse(summary, "wrapup"),
  ]);

  // Compose Portable Text for every LLM section and the hero's main skill +
  // stats caption, then run them through the site's real resolver so the
  // tooltips render identically to a production blog post.
  const treeBlocks = paragraphBlocks("tree", treeProse.text);
  const skillsBlocks = paragraphBlocks("skills", skillsProse.text);
  const wrapupBlocks = paragraphBlocks("wrapup", wrapupProse.text);
  const heroBlocks = heroBlock(summary);
  const statsCaptionBlocks = statsCaptionBlock(summary);
  const gearBlocks = gearGalleryBlocks(summary);

  // Resolve all Portable Text trees together — one fetch wave for every
  // item / pobitem / passive / price mentioned across the whole page.
  const [
    resolvedTree,
    resolvedSkills,
    resolvedWrapup,
    resolvedHero,
    resolvedStatsCaption,
    resolvedGear,
  ] = await Promise.all([
    resolveBlocks(treeBlocks, { locale: "en", league: "Mirage" }),
    resolveBlocks(skillsBlocks, { locale: "en", league: "Mirage" }),
    resolveBlocks(wrapupBlocks, { locale: "en", league: "Mirage" }),
    resolveBlocks(heroBlocks, { locale: "en", league: "Mirage" }),
    resolveBlocks(statsCaptionBlocks, { locale: "en", league: "Mirage" }),
    resolveBlocks(gearBlocks, { locale: "en", league: "Mirage" }),
  ]);

  const fullResolvedTree: PortableTextBlock[] = [
    ...resolvedHero,
    ...resolvedStatsCaption,
    ...resolvedTree,
    ...resolvedSkills,
    ...resolvedGear,
    ...resolvedWrapup,
  ];
  const tokenEstimate = estimateTokens(fullResolvedTree);
  const placeholderCount = countResolvedPlaceholders(fullResolvedTree);

  const header = [summary.class, summary.ascendancy].filter(Boolean).join(" — ");

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <article className="mx-auto max-w-4xl px-6 py-16 space-y-14">
        {/* 1 — Hero header */}
        <header className="space-y-4 border-b border-neutral-800 pb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-500/80">
            Build guide · AI-generated demo
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            {header || "Unknown class"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {summary.level != null && (
              <span className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1 font-mono text-amber-300">
                Level {summary.level}
              </span>
            )}
            {summary.mainSkill && (
              <span className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1 text-neutral-200">
                Main skill:{" "}
                <span className="font-semibold">
                  <InlineResolved blocks={resolvedHero} />
                </span>
              </span>
            )}
          </div>
          <p className="max-w-prose text-sm text-neutral-400">
            Decoded build snapshot from a real PoB import. Every passive,
            unique, rare, price and skill gem below is a live tooltip — hover
            to verify the resolver is doing its job.
          </p>
        </header>

        {/* 2 — Key stats card */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Key stats</h2>
          <KeyStatsGrid summary={summary} />
          <div className="prose prose-invert prose-sm max-w-none text-neutral-400">
            <BlockContentRenderer value={resolvedStatsCaption} />
          </div>
        </section>

        {/* 3 — Tree highlights */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Tree highlights</h2>
          <article className="prose prose-invert prose-lg max-w-none">
            <BlockContentRenderer value={resolvedTree} />
          </article>
          <KeystoneChips tree={summary.tree} />
          <SourceBadge source={treeProse.source} model={treeProse.model} />
        </section>

        {/* 4 — Main skill setup */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Main skill setup</h2>
          <article className="prose prose-invert prose-lg max-w-none">
            <BlockContentRenderer value={resolvedSkills} />
          </article>
          <SourceBadge source={skillsProse.source} model={skillsProse.model} />
        </section>

        {/* 5 — Gear gallery */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Gear gallery</h2>
          <p className="text-sm text-neutral-400">
            Every slot, every roll. Canonical uniques resolve via{" "}
            <code>{"{{item:Name}}"}</code>, rares and corrupted/enchanted
            uniques use <code>{"{{pobitem:id}}"}</code> snapshots captured at
            decode time.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(summary.gear ?? []).map((g, i) => (
              <GearCard
                key={`${g.slot}-${g.name}-${i}`}
                entry={g}
                block={resolvedGear[i]}
              />
            ))}
          </div>
        </section>

        {/* 6 — Narrative wrap-up */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Verdict</h2>
          <article className="prose prose-invert prose-lg max-w-none">
            <BlockContentRenderer value={resolvedWrapup} />
          </article>
          <SourceBadge source={wrapupProse.source} model={wrapupProse.model} />
        </section>

        {/* 7 — Footer */}
        <footer className="space-y-2 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span>Source:</span>
            {/* Primary link routes to our in-house PoB viewer
                (`/tools/pob-viewer`) which decodes via the engine and
                renders the build inline — no external page jump. */}
            <Link
              href={`/tools/pob-viewer?pob=${encodeURIComponent(SHOWCASE_POB_URL)}`}
              className="text-amber-500 underline underline-offset-2 hover:text-amber-400"
            >
              View build in PoB Viewer
            </Link>
            <span>·</span>
            {/* Launches the user's local Path of Building desktop install
                via the `pob://pobbin/<key>` protocol handler. Falls back to
                copying the pobb.in URL to the clipboard so it can be
                pasted into PoB manually. */}
            <OpenInPobButton pobbUrl={SHOWCASE_POB_URL} />
            <span>·</span>
            <Link
              href={SHOWCASE_POB_URL}
              className="text-neutral-400 underline underline-offset-2 hover:text-neutral-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              view on pobb.in
            </Link>
          </div>
          <div>
            Composed Portable Text ≈{" "}
            <span className="font-mono text-neutral-300">
              {tokenEstimate.toLocaleString("en-US")}
            </span>{" "}
            tokens · Placeholders resolved:{" "}
            <span className="font-mono text-neutral-300">
              {placeholderCount}
            </span>
          </div>
          <div>
            Engine:{" "}
            <code className="text-neutral-400">{engineBase}</code>
          </div>
          <div>
            Prose sources — tree: <code>{treeProse.source}</code>, skills:{" "}
            <code>{skillsProse.source}</code>, wrap-up:{" "}
            <code>{wrapupProse.source}</code>
          </div>
        </footer>
      </article>
    </main>
  );
}

// ===========================================================================
// Hero — inline resolved main-skill span (renders the gem tooltip inline)
// ===========================================================================

function InlineResolved({ blocks }: { blocks: PortableTextBlock[] }) {
  // The hero composes exactly one block with one placeholder. We render it
  // in-place so the main-skill chip in the header shows the real tooltip.
  if (!blocks.length) return null;
  return <BlockContentRenderer value={blocks} />;
}

// ===========================================================================
// Stats grid
// ===========================================================================

function KeyStatsGrid({ summary }: { summary: PobSummary }) {
  const stats = summary.stats ?? {};
  const cells: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Total DPS", value: stats.totalDps },
    { label: "EHP", value: stats.ehp },
    { label: "Life", value: stats.life },
    { label: "Energy Shield", value: stats.energyShield },
    { label: "Resists (F/C/L/Ch)", value: stats.resists },
    { label: "Move speed", value: stats.movementSpeed },
  ];
  const present = cells.filter((c) => !!c.value);
  if (!present.length) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5 text-sm text-neutral-500">
        No stats decoded from the build.
      </div>
    );
  }
  return (
    <div className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-5 sm:grid-cols-2 md:grid-cols-3">
      {present.map((c) => (
        <div key={c.label} className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            {c.label}
          </p>
          <p className="font-mono text-base text-neutral-100">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ===========================================================================
// Keystone chips (static, not LLM-generated) — pure metadata badges
// ===========================================================================

function KeystoneChips({ tree }: { tree: PobSummary["tree"] }) {
  const keystones = tree?.keystones ?? [];
  const jewels = tree?.jewels ?? [];
  if (!keystones.length && !jewels.length) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {keystones.map((k) => (
        <span
          key={`ks-${k}`}
          className="rounded border border-amber-900 bg-amber-950/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300"
        >
          {k}
        </span>
      ))}
      {jewels.slice(0, 5).map((j, i) => (
        <span
          key={`jw-${j}-${i}`}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[11px] uppercase tracking-wider text-neutral-300"
        >
          {j}
        </span>
      ))}
    </div>
  );
}

// ===========================================================================
// Gear card
// ===========================================================================

function GearCard({
  entry,
  block,
}: {
  entry: PobSummaryGearEntry;
  block: PortableTextBlock | undefined;
}) {
  const badges = (entry.explicits ?? []).slice(0, 3);
  return (
    <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          {entry.slot}
        </span>
        <FlagChips entry={entry} />
      </div>
      <div className="min-h-[2rem] text-[15px]">
        {block ? (
          <BlockContentRenderer value={[block]} />
        ) : (
          <span className="font-semibold text-neutral-200">{entry.name}</span>
        )}
      </div>
      {badges.length > 0 && (
        <ul className="space-y-1 text-xs text-neutral-400">
          {badges.map((b, i) => (
            <li
              key={`${entry.slot}-badge-${i}`}
              className="truncate"
              title={b}
            >
              • {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FlagChips({ entry }: { entry: PobSummaryGearEntry }) {
  const chips: Array<{ label: string; tone: string }> = [];
  if (entry.corrupted)
    chips.push({
      label: "Corrupted",
      tone: "bg-red-950/60 text-red-300 border-red-900",
    });
  if (entry.mirrored)
    chips.push({
      label: "Mirrored",
      tone: "bg-purple-950/60 text-purple-300 border-purple-900",
    });
  if (entry.fractured)
    chips.push({
      label: "Fractured",
      tone: "bg-amber-950/60 text-amber-300 border-amber-900",
    });
  if (entry.split)
    chips.push({
      label: "Split",
      tone: "bg-sky-950/60 text-sky-300 border-sky-900",
    });
  if (entry.itemLevel != null)
    chips.push({
      label: `iLvl ${entry.itemLevel}`,
      tone: "bg-neutral-800/80 text-neutral-300 border-neutral-700",
    });
  for (const inf of entry.influences ?? []) {
    chips.push({
      label: inf,
      tone: "bg-neutral-800/80 text-neutral-300 border-neutral-700",
    });
  }
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c, i) => (
        <span
          key={`flag-${c.label}-${i}`}
          className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${c.tone}`}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}

// ===========================================================================
// Prose source badge
// ===========================================================================

function SourceBadge({
  source,
  model,
}: {
  source: ProseResult["source"];
  model: string | null;
}) {
  const label = (() => {
    switch (source) {
      case "engine":
        return `Generated by engine LLM${model ? ` (${model})` : ""}`;
      case "openrouter-direct":
        return `Generated by OpenRouter direct${model ? ` (${model})` : ""}`;
      case "fallback":
        return "Deterministic fallback (LLM unavailable)";
    }
  })();
  const tone =
    source === "fallback"
      ? "border-amber-900 bg-amber-950/30 text-amber-300"
      : "border-neutral-800 bg-neutral-900/60 text-neutral-500";
  return (
    <p className={`inline-flex rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${tone}`}>
      {label}
    </p>
  );
}

// ===========================================================================
// Portable Text composition helpers
// ===========================================================================

function paragraphBlocks(key: string, text: string): PortableTextBlock[] {
  return [
    {
      _type: "block",
      _key: `${key}-p`,
      style: "normal",
      markDefs: [],
      children: [
        { _type: "span", _key: `${key}-s`, text, marks: [] },
      ],
    } as PortableTextBlock,
  ];
}

function heroBlock(summary: PobSummary): PortableTextBlock[] {
  // The hero renders the main-skill tooltip inline next to the level chip.
  // If there's no main skill, the block collapses to an empty span that the
  // hero component skips.
  const skill = summary.mainSkill ?? "";
  const text = skill ? `{{item:${skill}}}` : "";
  return [
    {
      _type: "block",
      _key: "hero",
      style: "normal",
      markDefs: [],
      children: [
        { _type: "span", _key: "hero-s", text, marks: [] },
      ],
    } as PortableTextBlock,
  ];
}

function statsCaptionBlock(summary: PobSummary): PortableTextBlock[] {
  // Picks a chase canonical unique from the build (Mageblood, Headhunter,
  // etc.) and calls out its price. Falls back to a generic caption if no
  // canonical chase unique is present.
  const chase = (summary.gear ?? []).find(
    (g) => g.isUnique && g.canonical && !!g.name,
  );
  const text = chase
    ? // {{price:X|divine}} already resolves to "1.4 div" — do NOT append "div"
      // or the rendered output reads "around 1.4 div div".
      `Core chase item for this build: {{item:${chase.name}}} (around {{price:${chase.name}|divine}}).`
    : "Core chase items are in the gear section below — hover any piece for its live tooltip.";
  return [
    {
      _type: "block",
      _key: "stats-caption",
      style: "normal",
      markDefs: [],
      children: [
        { _type: "span", _key: "stats-caption-s", text, marks: [] },
      ],
    } as PortableTextBlock,
  ];
}

function gearGalleryBlocks(summary: PobSummary): PortableTextBlock[] {
  // One block per gear slot. Canonical uniques get `{{item:Name}}`; everything
  // else goes through the `{{pobitem:id}}` path so the tooltip carries the
  // exact decoded mods, not a catalogue entry. Non-canonical unique WITHOUT
  // an id falls through to the name only — rare, but defensive.
  const gear = summary.gear ?? [];
  return gear.map((g, i) => {
    const text = gearPlaceholderText(g);
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
}

function gearPlaceholderText(g: PobSummaryGearEntry): string {
  if (g.canonical && g.name) return `{{item:${g.name}}}`;
  if (g.id) return `{{pobitem:${g.id}}}`;
  return g.name;
}

// ---------------------------------------------------------------------------
// Small telemetry helpers for the footer
// ---------------------------------------------------------------------------

/** 4-chars-per-token heuristic — same rule-of-thumb as /preview/pob. */
function estimateTokens(data: unknown): number {
  if (data == null) return 0;
  return Math.ceil(JSON.stringify(data).length / 4);
}

/** Counts `poeItem` + `link` marks — i.e. every placeholder the resolver converted. */
function countResolvedPlaceholders(blocks: PortableTextBlock[]): number {
  let count = 0;
  for (const b of blocks) {
    const anyB = b as unknown as {
      markDefs?: Array<{ _type?: string }>;
    };
    for (const m of anyB.markDefs ?? []) {
      if (m?._type === "poeItem" || m?._type === "link") count++;
    }
  }
  return count;
}

// ===========================================================================
// Error states
// ===========================================================================

function EngineMissing() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-6">
        <h1 className="text-3xl font-bold">Showcase preview</h1>
        <div className="rounded-lg border border-amber-900 bg-amber-950/30 p-6 text-sm text-amber-200">
          Engine not configured. Set <code>ENGINE_API_URL</code> to a running
          content engine, e.g. <code>http://localhost:3000/api</code>.
        </div>
      </div>
    </main>
  );
}

function SummaryError({ error }: { error: string }) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-6">
        <h1 className="text-3xl font-bold">Showcase preview</h1>
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-6 text-sm text-red-300">
          Failed to decode {SHOWCASE_POB_URL}: {error}
        </div>
      </div>
    </main>
  );
}
