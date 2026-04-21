import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { CurrencyTooltip } from "@/components/poe/PoeCurrencyTooltip";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";
import type { PortableTextBlock } from "sanity";

/**
 * Developer sandbox for scarab render in blog posts.
 *
 * Scarabs share the minimal CurrencyTooltip layout because their stat
 * block is essentially the same shape — a one-liner effect ("A Unique
 * Map will drop from the Final Map Boss") plus an icon. Routed via
 * isMinimalTooltipItem (classId === 'MapFragment').
 */

const SCARAB_CARTO_RAW = `Rarity: Normal
Cartography Scarab of Singularity
--------
Requirements:
Level: 1
--------
A Unique Map will drop from the Final Map Boss`;

const SCARAB_BESTIARY_RAW = `Rarity: Normal
Bestiary Scarab
--------
Requirements:
Level: 1
--------
Areas contain 2 additional Red Beasts`;

const SCARAB_HARBINGER_RAW = `Rarity: Normal
Harbinger Scarab of Discernment
--------
Requirements:
Level: 1
--------
Harbingers in Area drop double the amount of Currency Shards
Harbingers in Area drop Currency Shards from their final piece`;

// Real wiki Special:Filepath URL — engine returns this when ninja doesn't
// track the item (scarabs sit at the boundary; some are tracked, some not).
const ICON_CARTO =
  "https://www.poewiki.net/wiki/Special:Filepath/Cartography_Scarab_of_Singularity_inventory_icon.png";
const ICON_BESTIARY =
  "https://www.poewiki.net/wiki/Special:Filepath/Bestiary_Scarab_inventory_icon.png";
const ICON_HARBINGER =
  "https://www.poewiki.net/wiki/Special:Filepath/Harbinger_Scarab_of_Discernment_inventory_icon.png";

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
      { _type: "span", _key: "ss2a", text: "When farming uniques on a specific tier, slot a ", marks: [] },
      { _type: "span", _key: "ss2b", text: "Cartography Scarab of Singularity", marks: ["carto"] },
      { _type: "span", _key: "ss2c", text: " to guarantee the boss drop. Stack with a ", marks: [] },
      { _type: "span", _key: "ss2d", text: "Harbinger Scarab of Discernment", marks: ["harb"] },
      { _type: "span", _key: "ss2e", text: " on Harbinger maps for currency shard farming.", marks: [] },
    ],
    markDefs: [
      { _key: "carto", _type: "poeItem", rawText: SCARAB_CARTO_RAW, iconUrl: ICON_CARTO, itemName: "Cartography Scarab of Singularity", isCurrency: true },
      { _key: "harb", _type: "poeItem", rawText: SCARAB_HARBINGER_RAW, iconUrl: ICON_HARBINGER, itemName: "Harbinger Scarab of Discernment", isCurrency: true },
    ],
  },
];

const LIVE_BODY: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "ph1",
    style: "h3",
    children: [{ _type: "span", _key: "phs1", text: "Live engine fetch", marks: [] }],
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
          "Endgame scarab strategy: pair {{item:Cartography Scarab of Singularity}} with " +
          "{{item:Bestiary Scarab}} for unique drops alongside red beasts. " +
          "Currency-focused runs swap in {{item:Harbinger Scarab of Discernment}}.",
        marks: [],
      },
    ],
    markDefs: [],
  },
];

export const dynamic = "force-dynamic";

export default async function ScarabPreviewPage() {
  const liveResolved = await resolveBlocks(LIVE_BODY, { locale: "en", league: "Mirage" });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        <header>
          <h1 className="text-4xl font-bold mb-2">Scarab render preview</h1>
          <p className="text-neutral-400">
            Scarabs route through the same minimal tooltip variant as currencies:
            description in implicit-blue + centered icon. Detection is via{" "}
            <code>classId === &quot;MapFragment&quot;</code>.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 0 — Tooltip standalone
          </h2>
          <div className="flex flex-wrap items-start gap-8 p-6 bg-neutral-900 rounded-lg">
            <CurrencyTooltip name="Cartography Scarab of Singularity" description={SCARAB_CARTO_RAW} iconUrl={ICON_CARTO} />
            <CurrencyTooltip name="Bestiary Scarab" description={SCARAB_BESTIARY_RAW} iconUrl={ICON_BESTIARY} />
            <CurrencyTooltip name="Harbinger Scarab of Discernment" description={SCARAB_HARBINGER_RAW} iconUrl={ICON_HARBINGER} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 1 — Seeded Portable Text
          </h2>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={SEEDED_BODY} />
          </article>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 2 — Live engine flow
          </h2>
          <p className="text-neutral-400 text-sm">
            Real <code>{"{{item:Scarab Name}}"}</code> placeholders. Items the
            engine doesn&apos;t have fall back to amber link chips. Some
            scarabs may not be in the wiki crawler database yet — check{" "}
            <code>SELECT * FROM items WHERE class_id=&apos;MapFragment&apos;</code>.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={liveResolved} />
          </article>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 3 — Debug
          </h2>
          <pre className="text-xs bg-black rounded-lg p-4 overflow-auto max-h-96 font-mono">
            {JSON.stringify(liveResolved, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
