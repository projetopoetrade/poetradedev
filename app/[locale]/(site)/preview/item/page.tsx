import { PoeItemBlogCard } from "@/components/poe/PoeItemBlogCard";
import { ItemTooltip } from "@/components/poe/PoeItemTooltip";
import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { parseRawPoeItem } from "@/lib/poe-item-parser";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";
import type { PortableTextBlock } from "sanity";

/**
 * Developer sandbox for the `{{item:…}}` placeholder pipeline.
 *
 * The page renders in four stages — from "visual only, no interaction needed"
 * down to "real fetch against the production engine" — so you can isolate
 * which layer broke if something goes wrong.
 */

// ---------------------------------------------------------------------------
// Sample rawText — what the engine's ItemRawTextService would emit
// ---------------------------------------------------------------------------

const MAGEBLOOD_RAW = `Rarity: Unique
Mageblood
Heavy Belt
--------
Requirements:
Level: 68
--------
+(25-35) to Strength (implicit)
--------
+(80-100) to maximum Life
+(25-35) to all Attributes
4% increased maximum Life
Magic Utility Flasks cannot be used
Magic Utility Flasks on you always apply their Flask Effect`;

const HEADHUNTER_RAW = `Rarity: Unique
Headhunter
Leather Belt
--------
Requirements:
Level: 40
--------
+(25-40) to maximum Life (implicit)
--------
+(40-55) to Strength
+(40-55) to Dexterity
+(50-60) to maximum Life
+(45-65)% to all Elemental Resistances
Extra gore
When you Kill a Rare monster, you gain its Modifiers for 60 seconds`;

const SHAVS_RAW = `Rarity: Unique
Shavronne's Wrappings
Occultist's Vestment
--------
Quality: +20%
Energy Shield: 800
--------
Requirements:
Level: 62
Int: 180
--------
+(30-50) to maximum Energy Shield
150% increased Energy Shield
+(30-40)% to Lightning Resistance
Reflects 1 to 250 Lightning Damage to Attackers
Chaos Damage does not bypass Energy Shield`;

// --- Rare items with rolled mods (the bread-and-butter of endgame gearing) ---

const RARE_WEAPON_RAW = `Rarity: Rare
Beast Bite
Jewelled Foil
--------
Quality: +20%
Physical Damage: 48-135
Critical Strike Chance: 6.70%
Attacks per Second: 1.64
Weapon Range: 11 metres
--------
Requirements:
Level: 70
Dex: 212
Int: 56
--------
+25% to Global Critical Strike Multiplier (implicit)
--------
35% increased Global Accuracy Rating
Adds 10 to 18 Physical Damage
Adds 20 to 40 Fire Damage
17% increased Critical Strike Chance
+125 to maximum Life
25% increased Critical Strike Chance with One Handed Melee Weapons
Corrupted`;

const RARE_ARMOUR_RAW = `Rarity: Rare
Entropy Keep
Astral Plate
--------
Quality: +20%
Armour: 1220
--------
Requirements:
Level: 67
Str: 108
--------
+1 to Level of Socketed Gems (implicit)
--------
+32 to Intelligence
72% increased Armour
+115 to maximum Life
+33% to Fire Resistance
+41% to Cold Resistance
+35% to Lightning Resistance
12% of Damage taken Recouped as Life`;

// ---------------------------------------------------------------------------
// Fake Portable Text — literal placeholder tokens
// ---------------------------------------------------------------------------

const FAKE_BLOG_BODY: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "b1",
    style: "h3",
    children: [{ _type: "span", _key: "s1", text: "Endgame belts tier list", marks: [] }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "b2",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "s2",
        text: "For builds that clear juiced maps comfortably, {{item:Mageblood}} is the premier choice — permanent flask effect from three magic utility flasks is a straight-up build multiplier. Expect to pay around {{price:Mageblood|divine}} divines at league start, dropping as supply catches up.",
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "b3",
    style: "normal",
    children: [
      {
        _type: "span",
        _key: "s3",
        text: "If you want raw clear speed instead of defensive uptime, {{item:Headhunter}} remains king — rare monster buff stacking turns juiced map packs into a playable slideshow. Compare both against {{link:Stygian Vise}} if you're budget-constrained.",
        marks: [],
      },
    ],
    markDefs: [],
  },
];

// ---------------------------------------------------------------------------
// Seeded Portable Text — bypasses the engine, simulates a resolved tree.
// Useful when the engine's PG doesn't have the item yet (the live flow then
// falls back to link chips, hiding the interesting render path).
// ---------------------------------------------------------------------------

const SEEDED_RESOLVED_BODY: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "sb1",
    style: "h3",
    children: [{ _type: "span", _key: "ss1", text: "Endgame belts tier list", marks: [] }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "sb2",
    style: "normal",
    children: [
      { _type: "span", _key: "ss2a", text: "For builds that clear juiced maps comfortably, ", marks: [] },
      { _type: "span", _key: "ss2b", text: "Mageblood", marks: ["itemMage"] },
      { _type: "span", _key: "ss2c", text: " is the premier choice — permanent flask effect. Expect to pay around 110 div at league start.", marks: [] },
    ],
    markDefs: [
      { _key: "itemMage", _type: "poeItem", rawText: MAGEBLOOD_RAW, iconUrl: null, itemName: "Mageblood" },
    ],
  },
  {
    _type: "block",
    _key: "sb3",
    style: "normal",
    children: [
      { _type: "span", _key: "ss3a", text: "If you want raw clear speed instead of defensive uptime, ", marks: [] },
      { _type: "span", _key: "ss3b", text: "Headhunter", marks: ["itemHH"] },
      { _type: "span", _key: "ss3c", text: " remains king — rare monster buff stacking. Compare against ", marks: [] },
      { _type: "span", _key: "ss3d", text: "Stygian Vise", marks: ["lnkStygian"] },
      { _type: "span", _key: "ss3e", text: " if you're budget-constrained.", marks: [] },
    ],
    markDefs: [
      { _key: "itemHH", _type: "poeItem", rawText: HEADHUNTER_RAW, iconUrl: null, itemName: "Headhunter" },
      { _key: "lnkStygian", _type: "link", href: "/products/stygian-vise" },
    ],
  },
  {
    _type: "block",
    _key: "sb4",
    style: "h3",
    children: [{ _type: "span", _key: "ss4", text: "Rare gearing targets", marks: [] }],
    markDefs: [],
  },
  {
    _type: "block",
    _key: "sb5",
    style: "normal",
    children: [
      { _type: "span", _key: "ss5a", text: "For weapons you'll typically craft or buy a ", marks: [] },
      { _type: "span", _key: "ss5b", text: "rare foil", marks: ["itemWpn"] },
      { _type: "span", _key: "ss5c", text: " with ~1.5 aps, crit chance, and double elemental damage rolls. Target this stat block for a mid-budget crit-based clear weapon. On chest, a ", marks: [] },
      { _type: "span", _key: "ss5d", text: "well-rolled Astral Plate", marks: ["itemBody"] },
      { _type: "span", _key: "ss5e", text: " stacks life, armour and all three resists for a comfortable tank base.", marks: [] },
    ],
    markDefs: [
      { _key: "itemWpn", _type: "poeItem", rawText: RARE_WEAPON_RAW, iconUrl: null, itemName: "Beast Bite" },
      { _key: "itemBody", _type: "poeItem", rawText: RARE_ARMOUR_RAW, iconUrl: null, itemName: "Entropy Keep" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export default async function ItemPreviewPage() {
  const mageblood = parseRawPoeItem(MAGEBLOOD_RAW);
  const headhunter = parseRawPoeItem(HEADHUNTER_RAW);
  const shavs = parseRawPoeItem(SHAVS_RAW);
  const rareWeapon = parseRawPoeItem(RARE_WEAPON_RAW);
  const rareArmour = parseRawPoeItem(RARE_ARMOUR_RAW);

  const resolvedBody = await resolveBlocks(FAKE_BLOG_BODY, {
    locale: "en",
    league: "Mirage",
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        <header>
          <h1 className="text-4xl font-bold mb-2">Item render preview</h1>
          <p className="text-neutral-400">
            Four stages from &ldquo;always-visible render&rdquo; down to &ldquo;real engine fetch&rdquo;.
            If a later stage fails, compare with the earlier one to isolate the layer.
          </p>
        </header>

        {/* ───────────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 0 — <code>ItemTooltip</code> always visible (no hover needed)
          </h2>
          <p className="text-neutral-400 text-sm">
            The tooltip component rendered directly, bypassing Radix hover/popover logic.
            This is what the hover panel <em>contains</em>. If this looks right, the visual is fine —
            any hover issue is a Radix/pointer problem and not a data/parser problem.
          </p>
          <div className="flex flex-wrap gap-8 p-6 bg-neutral-900 rounded-lg">
            {mageblood && (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Unique — Mageblood</p>
                <ItemTooltip item={mageblood} />
              </div>
            )}
            {headhunter && (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Unique — Headhunter</p>
                <ItemTooltip item={headhunter} />
              </div>
            )}
            {shavs && (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Unique — Shavronne&apos;s</p>
                <ItemTooltip item={shavs} />
              </div>
            )}
            {rareWeapon && (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Rare — Weapon (corrupted)</p>
                <ItemTooltip item={rareWeapon} />
              </div>
            )}
            {rareArmour && (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Rare — Body armour</p>
                <ItemTooltip item={rareArmour} />
              </div>
            )}
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────── */}
        <section className="space-y-4 pt-[200px] -mt-[200px]">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 1 — <code>PoeItemBlogCard</code> inline (hover/tap to open)
          </h2>
          <p className="text-neutral-400 text-sm">
            This is the real inline component. On desktop hover. On touch devices
            (<code>pointer: coarse</code>) it switches to tap/click.
            <span className="block mt-1 text-amber-400/80">
              If hover doesn&apos;t trigger: your laptop may be reporting touch — try tapping the icon.
              The navbar may also be clipping the tooltip at page top; scroll so items sit mid-viewport.
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-10 p-10 bg-neutral-900 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 text-sm">Mageblood:</span>
              <PoeItemBlogCard value={{ _type: "poeItem", rawText: MAGEBLOOD_RAW }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 text-sm">Headhunter:</span>
              <PoeItemBlogCard value={{ _type: "poeItem", rawText: HEADHUNTER_RAW }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 text-sm">Shavronne&apos;s:</span>
              <PoeItemBlogCard value={{ _type: "poeItem", rawText: SHAVS_RAW }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 text-sm">Beast Bite (rare, corrupted):</span>
              <PoeItemBlogCard value={{ _type: "poeItem", rawText: RARE_WEAPON_RAW }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 text-sm">Entropy Keep (rare):</span>
              <PoeItemBlogCard value={{ _type: "poeItem", rawText: RARE_ARMOUR_RAW }} />
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 2 — Seeded Portable Text (bypasses engine)
          </h2>
          <p className="text-neutral-400 text-sm">
            Fake Portable Text tree where <code>poeItem</code> marks are hand-seeded with rawText.
            This proves the <code>blockContentComponents.marks.poeItem</code> handler works —
            no fetch, no placeholder parsing.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={SEEDED_RESOLVED_BODY} />
          </article>
        </section>

        {/* ───────────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 3 — Live flow: literal tokens → <code>resolveBlocks</code> → render
          </h2>
          <p className="text-neutral-400 text-sm">
            The full pipeline with real fetches. Prices come from the engine or poe.ninja fallback.
            Items come from <code>GET {"{ENGINE_API_URL}"}/items/:name/raw</code> — when the engine
            doesn&apos;t have the item yet, the resolver falls back to a <code>{"{{link:…}}"}</code> chip
            (so readers still land on the product page). That fallback is why Section 3 may show
            amber link chips instead of tooltips. Seed the engine DB or use Stage 2 as a design reference.
          </p>
          <article className="prose prose-invert prose-lg max-w-none bg-neutral-900 rounded-lg p-8">
            <BlockContentRenderer value={resolvedBody} />
          </article>
        </section>

        {/* ───────────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b border-neutral-800 pb-2">
            Stage 4 — Debug (Stage 3 output)
          </h2>
          <p className="text-neutral-400 text-sm">
            Inspect the markDefs injected by <code>resolveBlocks</code>.
            <code>poeItem</code> marks carry rawText + iconUrl; <code>link</code> marks carry hrefs.
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
                "(not set — prices via poe.ninja direct, items fall back to link chips)"}
            </code>
          </div>
          <div>
            Hover not firing? Your OS/browser may be reporting{" "}
            <code>pointer: coarse</code> — the inline card then switches to tap-to-open.
          </div>
        </footer>
      </div>
    </main>
  );
}
