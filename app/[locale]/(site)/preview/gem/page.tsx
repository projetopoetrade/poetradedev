import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { GemTooltip } from "@/components/poe/PoeGemTooltip";
import { fetchItemRaw } from "@/lib/placeholders/fetch-items";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";
import type { PortableTextBlock } from "sanity";

/**
 * Developer sandbox for skill gem render in blog posts.
 *
 * Gems route to a dedicated GemTooltip variant: header coloured by
 * primary attribute (Int=cyan, Dex=green, Str=red), small-caps tag row,
 * per-level property block (mana cost, cast time, crit, effectiveness,
 * radius, duration, cooldown), attribute/level requirements, skill stats
 * and description. The engine endpoint accepts `?level=X&quality=Y`.
 */

const GEMS: Array<{ name: string; level: number; quality: number }> = [
  { name: "Lightning Arrow", level: 20, quality: 20 },
  { name: "Vaal Cyclone", level: 20, quality: 20 },
  { name: "Penance Brand", level: 20, quality: 20 },
  { name: "Awakened Spell Echo Support", level: 5, quality: 20 },
];

const LIVE_BODY: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "ph1",
    style: "h3",
    children: [{ _type: "span", _key: "phs1", text: "Gem placeholders", marks: [] }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "ph2",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "phs2",
        text:
          "League starters typically settle on {{item:Lightning Arrow}} for Deadeye or " +
          "{{item:Penance Brand}} for Inquisitor. Melee builds lean on " +
          "{{item:Vaal Cyclone}} for its explosive clear potential. " +
          "Endgame scaling relies on {{item:Awakened Spell Echo Support}} priced " +
          "around {{price:Awakened Spell Echo Support|chaos}}.",
        marks: [],
      },
    ],
    markDefs: [],
  },
];

export const dynamic = "force-dynamic";

export default async function GemPreviewPage() {
  // Stage 0 pulls each gem with its level/quality so the tooltip
  // properties reflect realistic endgame values.
  const gems = await Promise.all(
    GEMS.map(async (g) => ({
      ...g,
      data: await fetchItemRaw(g.name, { level: g.level, quality: g.quality }),
    })),
  );

  // Stage 1 — same gem, two modes side-by-side: range (default, no level)
  // vs specific level=20+quality=20. Demonstrates how passing `?level=X`
  // collapses ranges to resolved single values.
  const compareName = "Penance Brand";
  const [rangeData, levelData] = await Promise.all([
    fetchItemRaw(compareName),
    fetchItemRaw(compareName, { level: 20, quality: 20 }),
  ]);

  const liveResolved = await resolveBlocks(LIVE_BODY, { locale: "en", league: "Mirage" });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        <header>
          <h1 className="text-4xl font-bold mb-2">Skill gem render preview</h1>
          <p className="text-neutral-400">
            Gems render with the dedicated <code>GemTooltip</code> variant:
            header coloured by primary attribute, tags, properties per
            level/quality, requirements, skill stats, description. Engine
            endpoint accepts <code>?level=X&amp;quality=Y</code>.
          </p>
        </header>

        {/* Stage 0 — standalone tooltips, data from engine */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 0 — Tooltip standalone (real engine data)
          </h2>
          <p className="text-neutral-400 text-sm">
            Each gem fetched at its configured level/quality. Missing SkillLevel
            rows fall back to the closest available level on the engine side.
          </p>
          <div className="flex flex-wrap items-start gap-6 p-6 bg-neutral-900 rounded-lg">
            {gems.map(({ name, level, quality, data }) =>
              data ? (
                <div key={name} className="space-y-1">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">
                    {name} — level {level}, +{quality}% quality
                  </p>
                  <GemTooltip
                    name={data.name}
                    rawText={data.rawText}
                    iconUrl={data.iconUrl}
                    primaryAttribute={data.gemInfo?.primaryAttribute ?? null}
                    isAwakened={data.gemInfo?.isAwakened ?? false}
                    isVaal={data.gemInfo?.isVaal ?? false}
                  />
                </div>
              ) : (
                <div
                  key={name}
                  className="text-neutral-500 text-sm border border-red-900/40 rounded p-4"
                >
                  <p className="text-red-400">404 — {name}</p>
                  <p className="text-xs mt-1">Gem missing from engine PG</p>
                </div>
              ),
            )}
          </div>
        </section>

        {/* Stage 1 — range vs specific level side-by-side */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 1 — Range vs specific level
          </h2>
          <p className="text-neutral-400 text-sm">
            Default request (no <code>?level=</code>) renders properties as{" "}
            <code>(min-max)</code> ranges, matching the in-game tooltip for an
            unlevelled gem. Passing <code>?level=20&amp;quality=20</code>{" "}
            resolves every range to a single value.
          </p>
          <div className="flex flex-wrap items-start gap-6 p-6 bg-neutral-900 rounded-lg">
            {rangeData ? (
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  {compareName} — range mode (no level)
                </p>
                <GemTooltip
                  name={rangeData.name}
                  rawText={rangeData.rawText}
                  iconUrl={rangeData.iconUrl}
                  primaryAttribute={rangeData.gemInfo?.primaryAttribute ?? null}
                  isAwakened={rangeData.gemInfo?.isAwakened ?? false}
                  isVaal={rangeData.gemInfo?.isVaal ?? false}
                />
              </div>
            ) : null}
            {levelData ? (
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  {compareName} — level 20, +20% quality
                </p>
                <GemTooltip
                  name={levelData.name}
                  rawText={levelData.rawText}
                  iconUrl={levelData.iconUrl}
                  primaryAttribute={levelData.gemInfo?.primaryAttribute ?? null}
                  isAwakened={levelData.gemInfo?.isAwakened ?? false}
                  isVaal={levelData.gemInfo?.isVaal ?? false}
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* Stage 2 — live blog flow with placeholders + inline prices */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 2 — Live blog flow
          </h2>
          <p className="text-neutral-400 text-sm">
            Real <code>{"{{item:Gem Name}}"}</code> placeholders. Inline prices
            work the same way as currencies / scarabs because gems are in the
            ninja SkillGem category.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={liveResolved} />
          </article>
        </section>

        {/* Stage 3 — debug */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 3 — Debug
          </h2>
          <pre className="text-xs bg-black rounded-lg p-4 overflow-auto max-h-96 font-mono">
            {JSON.stringify(liveResolved, null, 2)}
          </pre>
        </section>

        <footer className="text-neutral-500 text-xs border-t border-neutral-800 pt-6 space-y-1">
          <p>
            <strong>Level/quality:</strong> the blog resolver uses the engine
            default (level 20, quality 0). For custom values in the preview
            only, call <code>fetchItemRaw(name, {"{ level, quality }"})</code>{" "}
            explicitly.
          </p>
          <p>
            <strong>Detection:</strong>{" "}
            <code>classId === &quot;Active Skill Gem&quot;</code> or{" "}
            <code>&quot;Support Skill Gem&quot;</code>.
          </p>
        </footer>
      </div>
    </main>
  );
}
