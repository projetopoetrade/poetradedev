import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { CurrencyTooltip } from "@/components/poe/PoeCurrencyTooltip";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";
import type { PortableTextBlock } from "sanity";

/**
 * Developer sandbox for currency render in blog posts.
 *
 * Currencies use a dedicated tooltip variant (centered icon, optional
 * price footer) instead of the rare-item layout, since their stat block
 * is a one-liner like "Right click this item then left click...".
 *
 * Stages:
 *   0 — CurrencyTooltip rendered directly (always visible, no portal/fetch)
 *   1 — Seeded Portable Text with poeItem markDef (isCurrency=true)
 *   2 — Live flow: explicit {{item:…}} + bare mention promotion
 *   3 — Debug: resolved tree
 */

const ICON_DIVINE =
  "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lNb2RWYWx1ZXMiLCJ3IjoxLCJoIjoxLCJzY2FsZSI6MX1d/e1a54ff97d/CurrencyModValues.png";
const ICON_MIRROR =
  "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lEdXBsaWNhdGUiLCJ3IjoxLCJoIjoxLCJzY2FsZSI6MX1d/7111e35254/CurrencyDuplicate.png";

const DIVINE_ORB_RAW = `Rarity: Currency
Divine Orb
--------
Stack Size: 1/10
--------
Right click this item then left click a magic, rare or unique item to reroll the values of the random modifiers on the item.
Shift click to unstack.`;

const MIRROR_RAW = `Rarity: Currency
Mirror of Kalandra
--------
Stack Size: 1/10
--------
Creates a mirrored copy of an item.
Right click this item then left click a non-Mirrored, non-Corrupted equippable item to apply it.
Shift click to unstack.`;

const SEEDED_BODY: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "sb1",
    style: "h3",
    children: [{ _type: "span", _key: "ss1", text: "Seeded portable text", marks: [] }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "sb2",
    style: "normal",
    children: [
      { _type: "span", _key: "ss2a", text: "Pricing in ", marks: [] },
      { _type: "span", _key: "ss2b", text: "Divine Orb", marks: ["divine"] },
      { _type: "span", _key: "ss2c", text: " is the league standard once supply stabilises; outliers like ", marks: [] },
      { _type: "span", _key: "ss2d", text: "Mirror of Kalandra", marks: ["mirror"] },
      { _type: "span", _key: "ss2e", text: " sit far above the divine ladder.", marks: [] },
    ],
    markDefs: [
      {
        _key: "divine",
        _type: "poeItem",
        rawText: DIVINE_ORB_RAW,
        iconUrl: ICON_DIVINE,
        itemName: "Divine Orb",
        isCurrency: true,
        priceInfo: { chaosValue: 312, divineValue: 1, listingCount: 39 },
      },
      {
        _key: "mirror",
        _type: "poeItem",
        rawText: MIRROR_RAW,
        iconUrl: ICON_MIRROR,
        itemName: "Mirror of Kalandra",
        isCurrency: true,
        priceInfo: { chaosValue: 368721, divineValue: 1182, listingCount: 13 },
      },
    ],
  },
];

const LIVE_BODY: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "ph1",
    style: "h3",
    children: [{ _type: "span", _key: "phs1", text: "Explicit placeholders", marks: [] }],
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
          "End-game economy revolves around {{item:Divine Orb}} (currently {{price:Divine Orb|chaos}}) and " +
          "{{item:Mirror of Kalandra}} ({{price:Mirror of Kalandra|divine}}). " +
          "Most rare crafting consumes {{item:Chaos Orb}} and {{item:Exalted Orb}} as raw inputs.",
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "im1",
    style: "h3",
    children: [{ _type: "span", _key: "ims1", text: "Bare mention promotion", marks: [] }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "im2",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "ims2",
        text:
          "Even when the LLM forgets to wrap the name, sentences mentioning Divine Orb or " +
          "Mirror of Kalandra in passing should still pick up an icon and tooltip — the resolver " +
          "promotes whitelisted names to inline item placeholders before the fetch pass runs. " +
          "Awakened Sextant is another high-value currency that benefits from the inline render.",
        marks: [],
      },
    ],
    markDefs: [],
  },
];

export const dynamic = "force-dynamic";

export default async function CurrencyPreviewPage() {
  const liveResolved = await resolveBlocks(LIVE_BODY, {
    locale: "en",
    league: "Mirage",
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        <header>
          <h1 className="text-4xl font-bold mb-2">Currency render preview</h1>
          <p className="text-neutral-400">
            Currencies render with the dedicated <code>CurrencyTooltip</code>{" "}
            (centered icon, optional price footer). Hover the inline link to
            open the tooltip.
          </p>
        </header>

        {/* Stage 0 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 0 — <code>CurrencyTooltip</code> always visible
          </h2>
          <p className="text-neutral-400 text-sm">
            Tooltip rendered directly. Validates the layout in isolation.
          </p>
          <div className="flex flex-wrap items-start gap-8 p-6 bg-neutral-900 rounded-lg">
            <CurrencyTooltip
              name="Divine Orb"
              description={DIVINE_ORB_RAW}
              iconUrl={ICON_DIVINE}
              priceInfo={{ chaosValue: 312, divineValue: 1, listingCount: 39 }}
            />
            <CurrencyTooltip
              name="Mirror of Kalandra"
              description={MIRROR_RAW}
              iconUrl={ICON_MIRROR}
              priceInfo={{ chaosValue: 368721, divineValue: 1182, listingCount: 13 }}
            />
            <CurrencyTooltip
              name="Mirror of Kalandra (no price)"
              description={MIRROR_RAW}
              iconUrl={ICON_MIRROR}
              priceInfo={null}
            />
          </div>
        </section>

        {/* Stage 1 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 1 — Seeded Portable Text
          </h2>
          <p className="text-neutral-400 text-sm">
            <code>poeItem</code> markDef with <code>isCurrency=true</code> +
            hardcoded prices. Validates the inline icon-name + hover tooltip
            integration without any engine fetch.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={SEEDED_BODY} />
          </article>
        </section>

        {/* Stage 2 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 2 — Live flow (placeholders + bare mentions)
          </h2>
          <p className="text-neutral-400 text-sm">
            Real engine fetches. Currencies the engine knows about should
            pick up icon + tooltip with live prices. Items poe.ninja
            doesn&apos;t track (Chaos Orb, Awakened Sextant) fall through to
            wiki Special:Filepath for the icon and may have null prices.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={liveResolved} />
          </article>
        </section>

        {/* Stage 3 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 3 — Debug
          </h2>
          <pre className="text-xs bg-black rounded-lg p-4 overflow-auto max-h-96 font-mono">
            {JSON.stringify(liveResolved, null, 2)}
          </pre>
        </section>

        <footer className="text-neutral-500 text-xs border-t border-neutral-800 pt-6 space-y-1">
          <div>
            Engine configured at:{" "}
            <code className="text-amber-400">
              {process.env.ENGINE_API_URL ||
                process.env.ENGINE_PRICES_URL ||
                "(not set)"}
            </code>
          </div>
          <div>
            Currency detection uses <code>classId</code> returned by the
            engine. Icons fall through three layers: <code>Item.iconUrl</code>{" "}
            (ninja-enriched), inline mention, then wiki{" "}
            <code>Special:Filepath</code> for items not in ninja.
          </div>
        </footer>
      </div>
    </main>
  );
}
