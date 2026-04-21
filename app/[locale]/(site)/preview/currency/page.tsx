import { PoeItemBlogCard } from "@/components/poe/PoeItemBlogCard";
import { ItemTooltip } from "@/components/poe/PoeItemTooltip";
import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { parseRawPoeItem } from "@/lib/poe-item-parser";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";
import type { PortableTextBlock } from "sanity";

/**
 * Developer sandbox for currency render — currencies (Divine, Chaos, Mirror,
 * Exalted, Awakened Sextant) end up flowing through the same rawText +
 * tooltip + icon pipeline as the unique items, but they exercise different
 * code paths in the engine (Item.classId === StackableCurrency, no
 * weapon/armour rows, single-line statText, icon coming from
 * Item.iconUrl populated by the ninja enrichment hook).
 *
 * Stages mirror /preview/item:
 *   0 — Always-visible tooltip (no hover/portal)
 *   1 — Inline PoeItemBlogCard (real hover/tap interaction)
 *   2 — Seeded Portable Text bypassing engine
 *   3 — Live flow: literal placeholder + bare mention promotion
 *   4 — Debug: resolved tree
 */

// ---------------------------------------------------------------------------
// Sample rawText — what ItemRawTextService emits for currencies today
// ---------------------------------------------------------------------------

const DIVINE_ORB_RAW = `Rarity: Currency
Divine Orb
--------
Stack Size: 1/10
--------
Right click this item then left click a magic, rare or unique item to reroll the values of the random modifiers on the item.
Shift click to unstack.`;

const CHAOS_ORB_RAW = `Rarity: Currency
Chaos Orb
--------
Stack Size: 1/20
--------
Right click this item then left click a rare item to reroll its modifiers.
Shift click to unstack.`;

const MIRROR_RAW = `Rarity: Currency
Mirror of Kalandra
--------
Stack Size: 1/10
--------
Creates a mirrored copy of an item.
Right click this item then left click a non-Mirrored, non-Corrupted equippable item to apply it.
Shift click to unstack.`;

const EXALTED_ORB_RAW = `Rarity: Currency
Exalted Orb
--------
Stack Size: 1/10
--------
Augments a rare item with a new random modifier.
Right click this item then left click a rare item to apply it.
Shift click to unstack.`;

const AWAKENED_SEXTANT_RAW = `Rarity: Currency
Awakened Sextant
--------
Stack Size: 1/10
--------
Can be used on a Watchstone socketed in the Atlas to add or replace a modifier on Maps within its range.
Right click this item then left click a Watchstone socketed in the Atlas to apply it.
Shift click to unstack.`;

// ---------------------------------------------------------------------------
// Stage 3 inputs — the two paths the live flow needs to handle
// ---------------------------------------------------------------------------

const FAKE_BLOG_BODY: PortableTextBlock[] = [
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
          "promotes whitelisted names to {{item:…}} placeholders before the fetch pass runs. " +
          "Awakened Sextant is another high-value currency that benefits from the inline render.",
        marks: [],
      },
    ],
    markDefs: [],
  },
];

const SEEDED_RESOLVED_BODY: PortableTextBlock[] = [
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
      { _key: "divine", _type: "poeItem", rawText: DIVINE_ORB_RAW, iconUrl: null, itemName: "Divine Orb" },
      { _key: "mirror", _type: "poeItem", rawText: MIRROR_RAW, iconUrl: null, itemName: "Mirror of Kalandra" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export default async function CurrencyPreviewPage() {
  const divine = parseRawPoeItem(DIVINE_ORB_RAW);
  const chaos = parseRawPoeItem(CHAOS_ORB_RAW);
  const mirror = parseRawPoeItem(MIRROR_RAW);
  const exalted = parseRawPoeItem(EXALTED_ORB_RAW);
  const sextant = parseRawPoeItem(AWAKENED_SEXTANT_RAW);

  const resolvedBody = await resolveBlocks(FAKE_BLOG_BODY, {
    locale: "en",
    league: "Mirage",
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        <header>
          <h1 className="text-4xl font-bold mb-2">Currency render preview</h1>
          <p className="text-neutral-400">
            Same staging strategy as <code>/preview/item</code>, but exercising
            currency-class items. Use it to verify the engine populates{" "}
            <code>iconUrl</code> via the ninja enrichment hook and that bare
            inline mentions get promoted to <code>{"{{item:…}}"}</code>.
          </p>
        </header>

        {/* ───────────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 0 — <code>ItemTooltip</code> always visible
          </h2>
          <p className="text-neutral-400 text-sm">
            Tooltip rendered directly. No hover, no portal, no fetch.
            Validates that <code>parseRawPoeItem</code> handles the
            currency-shape rawText (single-line stat text, &ldquo;Stack Size&rdquo;).
          </p>
          <div className="flex flex-wrap gap-8 p-6 bg-neutral-900 rounded-lg">
            {[
              { label: "Divine Orb", item: divine },
              { label: "Chaos Orb", item: chaos },
              { label: "Mirror of Kalandra", item: mirror },
              { label: "Exalted Orb", item: exalted },
              { label: "Awakened Sextant", item: sextant },
            ].map(({ label, item }) =>
              item ? (
                <div key={label} className="space-y-2">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
                  <ItemTooltip item={item} />
                </div>
              ) : null,
            )}
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────── */}
        <section className="space-y-4 pt-[200px] -mt-[200px]">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 1 — <code>PoeItemBlogCard</code> inline (hover/tap)
          </h2>
          <p className="text-neutral-400 text-sm">
            Real inline component with Radix portal. Hover on desktop,
            tap on touch.
          </p>
          <div className="flex flex-wrap items-center gap-10 p-10 bg-neutral-900 rounded-lg">
            <InlineLabel name="Divine Orb">
              <PoeItemBlogCard value={{ _type: "poeItem", rawText: DIVINE_ORB_RAW }} />
            </InlineLabel>
            <InlineLabel name="Chaos Orb">
              <PoeItemBlogCard value={{ _type: "poeItem", rawText: CHAOS_ORB_RAW }} />
            </InlineLabel>
            <InlineLabel name="Mirror of Kalandra">
              <PoeItemBlogCard value={{ _type: "poeItem", rawText: MIRROR_RAW }} />
            </InlineLabel>
            <InlineLabel name="Exalted Orb">
              <PoeItemBlogCard value={{ _type: "poeItem", rawText: EXALTED_ORB_RAW }} />
            </InlineLabel>
            <InlineLabel name="Awakened Sextant">
              <PoeItemBlogCard value={{ _type: "poeItem", rawText: AWAKENED_SEXTANT_RAW }} />
            </InlineLabel>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 2 — Seeded Portable Text
          </h2>
          <p className="text-neutral-400 text-sm">
            Hand-seeded markDefs. Proves the <code>poeItem</code> mark
            handler renders inline with surrounding prose.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={SEEDED_RESOLVED_BODY} />
          </article>
        </section>

        {/* ───────────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 3 — Live flow (placeholders + bare mentions)
          </h2>
          <p className="text-neutral-400 text-sm">
            Exercises both paths: explicit <code>{"{{item:Divine Orb}}"}</code>{" "}
            placeholders and bare mentions like &ldquo;Divine Orb&rdquo; in
            running prose. The resolver promotes whitelisted names to
            placeholders before fetching, so both end up at the same
            tooltip render. Icons require <code>Item.iconUrl</code> to be
            populated in the engine — confirm the latest snapshot ran.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={resolvedBody} />
          </article>
        </section>

        {/* ───────────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 4 — Debug
          </h2>
          <p className="text-neutral-400 text-sm">
            Inspect the markDefs the resolver injected. Bare mentions only
            show up here as <code>poeItem</code> marks if the engine
            returned data for them.
          </p>
          <pre className="text-xs bg-black rounded-lg p-4 overflow-auto max-h-96 font-mono">
            {JSON.stringify(resolvedBody, null, 2)}
          </pre>
        </section>

        <footer className="text-neutral-500 text-xs border-t border-neutral-800 pt-6 space-y-1">
          <div>
            Engine configured at:{" "}
            <code className="text-amber-400">
              {process.env.ENGINE_API_URL ||
                process.env.ENGINE_PRICES_URL ||
                "(not set — items fall back to link chips)"}
            </code>
          </div>
          <div>
            Currency rawText is synthesised by{" "}
            <code>ItemRawTextService</code>; iconUrl comes from{" "}
            <code>Item.iconUrl</code>, populated by{" "}
            <code>ItemIconEnrichmentService</code> after each ninja snapshot.
          </div>
        </footer>
      </div>
    </main>
  );
}

function InlineLabel({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-500 text-sm">{name}:</span>
      {children}
    </div>
  );
}
