import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { CurrencyTooltip } from "@/components/poe/PoeCurrencyTooltip";
import { fetchItemRaw } from "@/lib/placeholders/fetch-items";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";
import type { PortableTextBlock } from "sanity";

/**
 * Developer sandbox for scarab render in blog posts.
 *
 * Scarabs use the same minimal CurrencyTooltip layout as currencies —
 * detection is via classId === 'MapFragment'. Prices for scarabs are
 * exposed via the same {{price:...}} placeholder used for currencies,
 * since poe.ninja's Scarab category provides chaos/divine values.
 *
 * All scarabs in this page are real entries verified to be present in
 * both the engine PG (description + iconUrl) and the ninja Scarab
 * category (chaos/divine pricing).
 */

const SCARAB_NAMES = [
  "Horned Scarab of Preservation",
  "Ambush Scarab of Containment",
  "Cartography Scarab of Risk",
  "Bestiary Scarab",
  "Domination Scarab of Terrors",
];

const LIVE_BODY: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "ph1",
    style: "h3",
    children: [{ _type: "span", _key: "phs1", text: "Scarab placeholders + live prices", marks: [] }],
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
          "For boss-rush juicing, slot {{item:Horned Scarab of Preservation}} (currently {{price:Horned Scarab of Preservation|chaos}}) " +
          "with {{item:Ambush Scarab of Containment}} for additional strongbox loot. " +
          "Bestiary farmers want {{item:Bestiary Scarab}} ({{price:Bestiary Scarab|chaos}}) to guarantee Einhar spawns. " +
          "More expensive setups slot {{item:Horned Scarab of Bloodlines}}, while crafting strategies revolve around " +
          "{{item:Cartography Scarab of Risk}} ({{price:Cartography Scarab of Risk|chaos}}).",
        marks: [],
      },
    ],
    markDefs: [],
  },
];

export const dynamic = "force-dynamic";

export default async function ScarabPreviewPage() {
  // Stage 0: pull each scarab from the engine in parallel so the standalone
  // tooltip uses the same iconUrl + description the production blog renders.
  const scarabs = await Promise.all(
    SCARAB_NAMES.map(async (name) => ({ name, data: await fetchItemRaw(name) })),
  );

  const liveResolved = await resolveBlocks(LIVE_BODY, { locale: "en", league: "Mirage" });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        <header>
          <h1 className="text-4xl font-bold mb-2">Scarab render preview</h1>
          <p className="text-neutral-400">
            All scarabs on this page are real entries fetched from the engine
            (icon + description) and priced via poe.ninja&apos;s Scarab
            category. Same minimal tooltip layout as currencies (
            <code>classId === &quot;MapFragment&quot;</code>).
          </p>
        </header>

        {/* Stage 0 — standalone tooltips, data from engine */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 0 — Tooltip standalone (real engine data)
          </h2>
          <p className="text-neutral-400 text-sm">
            Each tooltip is rendered with <code>rawText</code> +{" "}
            <code>iconUrl</code> straight from{" "}
            <code>GET /api/items/:name/raw</code>. If a tooltip is missing,
            the engine PG doesn&apos;t have that scarab.
          </p>
          <div className="flex flex-wrap items-start gap-8 p-6 bg-neutral-900 rounded-lg">
            {scarabs.map(({ name, data }) =>
              data ? (
                <CurrencyTooltip
                  key={name}
                  name={data.name}
                  description={data.rawText}
                  iconUrl={data.iconUrl}
                />
              ) : (
                <div key={name} className="text-neutral-500 text-sm border border-red-900/40 rounded p-4">
                  <p className="text-red-400">404 — {name}</p>
                  <p className="text-xs mt-1">Item missing from engine PG</p>
                </div>
              ),
            )}
          </div>
        </section>

        {/* Stage 1 — live blog flow with placeholders + inline prices */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 1 — Live blog flow
          </h2>
          <p className="text-neutral-400 text-sm">
            Real <code>{"{{item:Scarab Name}}"}</code> placeholders mixed with{" "}
            <code>{"{{price:Scarab Name|chaos}}"}</code> for live pricing.
            Same flow used for currencies.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={liveResolved} />
          </article>
        </section>

        {/* Stage 2 — debug */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 2 — Debug
          </h2>
          <pre className="text-xs bg-black rounded-lg p-4 overflow-auto max-h-96 font-mono">
            {JSON.stringify(liveResolved, null, 2)}
          </pre>
        </section>

        <footer className="text-neutral-500 text-xs border-t border-neutral-800 pt-6">
          <p>
            <strong>Pricing source:</strong> ninja Scarab category cached in{" "}
            <code>NinjaSnapshot</code>. <code>{"{{price:...}}"}</code> picks
            up chaos/divine values automatically — same as Divine Orb,
            Headhunter, and other tradeable items.
          </p>
        </footer>
      </div>
    </main>
  );
}
