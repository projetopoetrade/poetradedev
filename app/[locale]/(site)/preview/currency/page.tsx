import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";
import type { PortableTextBlock } from "sanity";

/**
 * Developer sandbox for currency render in blog posts.
 *
 * Currencies don't get a hover tooltip — their in-game stat block is just
 * "Right click to use", which is noise. The post-render is icon + linked
 * name (markDef `iconLink`) so the reader can recognise the currency
 * visually and click through to the product page.
 *
 * Stages:
 *   1 — Seeded Portable Text (icon hardcoded, bypasses engine)
 *   2 — Live flow: explicit {{item:…}} + bare mention promotion
 *   3 — Debug: resolved tree
 */

// Stable poe.ninja CDN URLs — used for the seeded stage so we can validate
// the icon path independently of the engine's iconUrl population.
const ICON_DIVINE =
  "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lNb2RWYWx1ZXMiLCJ3IjoxLCJoIjoxLCJzY2FsZSI6MX1d/e1a54ff97d/CurrencyModValues.png";
const ICON_MIRROR =
  "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lEdXBsaWNhdGUiLCJ3IjoxLCJoIjoxLCJzY2FsZSI6MX1d/7111e35254/CurrencyDuplicate.png";

// ---------------------------------------------------------------------------
// Stage 1 — seeded portable text
// ---------------------------------------------------------------------------

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
      { _key: "divine", _type: "iconLink", href: "/products/divine-orb", iconUrl: ICON_DIVINE, name: "Divine Orb" },
      { _key: "mirror", _type: "iconLink", href: "/products/mirror-of-kalandra", iconUrl: ICON_MIRROR, name: "Mirror of Kalandra" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Stage 2 — live flow (placeholder + bare mention promotion)
// ---------------------------------------------------------------------------

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
          "Mirror of Kalandra in passing should still pick up an icon and link — the resolver " +
          "promotes whitelisted names to inline item placeholders before the fetch pass runs. " +
          "Awakened Sextant is another high-value currency that benefits from the inline render.",
        marks: [],
      },
    ],
    markDefs: [],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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
            Currencies render as <code>icon + linked name</code> (no hover
            tooltip — their stat block is just &ldquo;Right click to use&rdquo;).
            Click takes the reader to the product page.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 1 — Seeded Portable Text (icons hardcoded)
          </h2>
          <p className="text-neutral-400 text-sm">
            Validates the <code>iconLink</code> mark handler renders inline
            with surrounding prose. Bypasses the engine — icons come from
            literal URLs in the markDef.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={SEEDED_BODY} />
          </article>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 2 — Live flow (placeholders + bare mentions)
          </h2>
          <p className="text-neutral-400 text-sm">
            Exercises both paths: explicit <code>{"{{item:Divine Orb}}"}</code>{" "}
            placeholders and bare &ldquo;Divine Orb&rdquo; mentions in prose.
            The resolver promotes whitelisted names then routes currency-class
            items to <code>iconLink</code> instead of the unique tooltip.
            Icons require <code>Item.iconUrl</code> populated by the engine —
            confirm the latest enrichment ran.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={liveResolved} />
          </article>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 3 — Debug
          </h2>
          <p className="text-neutral-400 text-sm">
            Inspect the markDefs the resolver injected. Currency hits show up
            as <code>iconLink</code>; engine misses fall back to plain{" "}
            <code>link</code>.
          </p>
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
                "(not set — items fall back to link chips)"}
            </code>
          </div>
          <div>
            Currency detection uses <code>classId</code> returned by the
            engine (<code>StackableCurrency</code>, <code>Currency</code>);
            uniques and rares keep the hover tooltip path.
          </div>
        </footer>
      </div>
    </main>
  );
}
