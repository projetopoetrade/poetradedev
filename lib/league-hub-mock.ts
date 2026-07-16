import type { Mechanic } from "@/types/league-landing";

/**
 * MOCK data for previewing the post-launch league hub (`?preview=live`).
 *
 * None of this is wired to Supabase or poe.ninja yet — it exists so the live
 * state can be seen and iterated on before launch. The shapes below mirror what
 * the real fetches return, so swapping in production data is a straight
 * substitution. See docs/LEAGUE_PAGES.md §Pendências for the real sources and
 * their traps (getProductsWithParams throws on error; poe.ninja id is the short
 * name via leagues.poe_ninja_name; getBuilds uses cookies and breaks ISR).
 */

/** One currency row, as poe.ninja's overview returns it (value in chaos). */
export interface PriceRow {
  name: string;
  /** 24h change, percent. Positive = up. */
  changePct: number;
  /** Value in Chaos Orbs. */
  chaos: number;
  /** The league's signature item — gets the accent treatment. */
  hot?: boolean;
}

/** One buyable currency listing (price in USD; the site converts on render). */
export interface CurrencyProduct {
  id: string;
  name: string;
  unit: string;
  priceUsd: number;
  popular?: boolean;
}

/** One curated build (editorial — never scraped; poe.ninja builds API is off-limits). */
export interface HubBuild {
  id: string;
  name: string;
  ascendancy: string;
  skill: string;
  tags: string[];
  budget: string;
}

export const MOCK_PRICES: PriceRow[] = [
  { name: "Mirror of Kalandra", chaos: 148000, changePct: 0.6 },
  { name: "Divine Orb", chaos: 182, changePct: 2.4 },
  { name: "Allflame Ember", chaos: 51, changePct: 18.3, hot: true },
  { name: "Fracturing Orb", chaos: 220, changePct: 6.7 },
  { name: "Awakened Multistrike", chaos: 94, changePct: -4.1 },
  { name: "Orb of Annulment", chaos: 9, changePct: 3.5 },
  { name: "Exalted Orb", chaos: 11, changePct: -1.8 },
  { name: "Chaos Orb", chaos: 1, changePct: 0 },
];

export const MOCK_PRODUCTS: CurrencyProduct[] = [
  { id: "divine", name: "Divine Orb", unit: "per orb", priceUsd: 0.42, popular: true },
  { id: "chaos", name: "Chaos Orb", unit: "per 100", priceUsd: 0.55 },
  { id: "exalted", name: "Exalted Orb", unit: "per 100", priceUsd: 4.1 },
  { id: "allflame", name: "Allflame Ember Pack", unit: "×50 assorted", priceUsd: 6.9 },
  { id: "mirror", name: "Mirror of Kalandra", unit: "per mirror", priceUsd: 320 },
  { id: "starter", name: "League Starter Kit", unit: "curated bundle", priceUsd: 12 },
];

export const MOCK_BUILDS: HubBuild[] = [
  {
    id: "boneshatter-jugg",
    name: "Boneshatter Juggernaut",
    ascendancy: "Juggernaut",
    skill: "Boneshatter",
    tags: ["League start", "Tanky", "Melee"],
    budget: "1–5 div",
  },
  {
    id: "la-deadeye",
    name: "Lightning Arrow Deadeye",
    ascendancy: "Deadeye",
    skill: "Lightning Arrow",
    tags: ["Clear speed", "Ranged"],
    budget: "5–15 div",
  },
  {
    id: "rf-chieftain",
    name: "Righteous Fire Chieftain",
    ascendancy: "Chieftain",
    skill: "Righteous Fire",
    tags: ["League start", "Facetank"],
    budget: "< 1 div",
  },
  {
    id: "spark-hiero",
    name: "Spark Archmage Hierophant",
    ascendancy: "Hierophant",
    skill: "Spark",
    tags: ["Bossing", "Endgame"],
    budget: "15+ div",
  },
];

/** A currency with a price history, for the hero economy charts. */
export interface CurrencySeries {
  name: string;
  /** Current value in Chaos Orbs. */
  chaos: number;
  /** Change over the window the spark covers, percent. */
  changePct: number;
  /** Price history, oldest → newest (~2 weeks of daily points). */
  spark: number[];
  /** The league's signature item — accent treatment. */
  hot?: boolean;
}

/** A ranked mover for the gainers/losers slide. */
export interface Mover {
  name: string;
  changePct: number;
  spark: number[];
}

export const MOCK_CURRENCY_SERIES: CurrencySeries[] = [
  {
    name: "Divine Orb",
    chaos: 182,
    changePct: 12.4,
    spark: [158, 161, 159, 164, 167, 166, 170, 174, 172, 177, 180, 179, 182],
  },
  {
    name: "Allflame Ember",
    chaos: 51,
    changePct: 41.0,
    hot: true,
    spark: [29, 32, 31, 36, 40, 39, 44, 43, 47, 49, 50, 50, 51],
  },
  {
    name: "Mirror of Kalandra",
    chaos: 148000,
    changePct: 3.1,
    spark: [143000, 144000, 143500, 145000, 146000, 145500, 147000, 146500, 147500, 148000],
  },
];

export const MOCK_GAINERS: Mover[] = [
  { name: "Allflame Ember", changePct: 41.0, spark: [29, 34, 40, 44, 47, 50, 51] },
  { name: "Fracturing Orb", changePct: 22.8, spark: [180, 188, 196, 205, 210, 216, 220] },
  { name: "Hinekora's Lock", changePct: 15.3, spark: [62, 64, 67, 69, 71, 73, 74] },
  { name: "Orb of Annulment", changePct: 9.6, spark: [8, 8.2, 8.5, 8.7, 8.9, 9, 9.2] },
];

export const MOCK_LOSERS: Mover[] = [
  { name: "Awakened Multistrike", changePct: -18.2, spark: [120, 114, 108, 104, 100, 97, 94] },
  { name: "Exalted Orb", changePct: -12.4, spark: [14, 13.4, 12.9, 12.4, 12, 11.4, 11] },
  { name: "Mageblood", changePct: -8.1, spark: [98, 96, 94, 92, 91, 90, 89] },
  { name: "Bottled Faith", changePct: -5.4, spark: [74, 73, 72, 71.5, 71, 70.5, 70] },
];

/** Mechanics stand-in so the (real, empty) section looks populated in preview. */
export const MOCK_MECHANICS: Mechanic[] = [
  {
    title: "The Allflame Wells",
    summary:
      "Scattered through every area, Allflame Wells let you seed a monster pack with a chosen theme — a breach horde, an essence-locked rare, a rotation of your own choosing — then reap the amplified rewards.",
    bullets: [
      "Seed packs with themed modifiers",
      "Stacking reward multipliers",
      "Drops the new Allflame Ember currency",
    ],
  },
  {
    title: "Risen Curse Bosses",
    summary:
      "Clear enough themed packs and an ancient cursed boss rises in the area. Put it down to unlock the league's crafting bench and its exclusive uniques.",
    bullets: [
      "Area-scaling encounter",
      "Unlocks league crafting",
      "Exclusive drops",
    ],
  },
];
