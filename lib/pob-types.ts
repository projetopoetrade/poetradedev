/**
 * Public types for PoB build data.
 *
 * The decoder itself lives in the engine (`PobDecoderService` in
 * path-of-trade-content/packages/api/src/modules/knowledge/pob-decoder.service.ts).
 * The site only ever consumes the JSON response — these are the shape
 * declarations used to type that response across components and routes.
 *
 * If you change a field here, mirror it in the engine source and bump
 * any consumers in step.
 */

export interface ParsedMod {
  text: string;
  type: "normal" | "crafted" | "fractured" | "enchant" | "scourge";
}

export interface PobGem {
  name: string;
  level: number;
  quality: number;
  is_support: boolean;
}

export interface PobSkillGroup {
  slot: string;
  gems: PobGem[];
}

export interface PobSkillSet {
  id: string;
  title: string;
  skills: PobSkillGroup[];
}

export interface PobItem {
  slot: string;
  name: string;
  baseName: string;
  rarity: string;
  sockets?: string;
  quality?: number;
  itemLevel?: number;
  armour?: number;
  evasion?: number;
  energyShield?: number;
  physDamage?: [number, number];
  eleDamage?: [number, number];
  chaosDamage?: [number, number];
  critChance?: number;
  aps?: number;
  isEstimatedDps?: boolean;
  requiredLevel?: number;
  requiredStr?: number;
  requiredDex?: number;
  requiredInt?: number;
  corrupted?: boolean;
  mirrored?: boolean;
  split?: boolean;
  fractured?: boolean;
  influences?: string[];
  implicits: ParsedMod[];
  explicits: ParsedMod[];
  iconUrl?: string;
}

export interface PobItemSet {
  title: string;
  items: PobItem[];
}

export interface PobKeystone {
  name: string;
  iconUrl?: string;
}

export interface PobMasterySelection {
  masteryName: string;
  iconUrl?: string;
  stats: string[];
}

export interface PobSocketedJewel {
  nodeId: number;
  name: string;
  baseName?: string;
  rarity: string;
  isCluster: boolean;
  implicits: string[];
  explicits: string[];
  iconUrl?: string;
}

export interface PobTreeSpec {
  title: string;
  nodes: number[];
  keystones: PobKeystone[];
  masteries: PobMasterySelection[];
  socketedJewels: PobSocketedJewel[];
}

export interface PobTreeDetails {
  Keystones: PobKeystone[];
  Masteries: PobMasterySelection[];
  NodesCount: number;
  Specs: PobTreeSpec[];
  ActiveSpecIndex: number;
}

export interface PobBuildData {
  BuildInfo: { Class: string; Ascendancy: string; Level: string };
  Stats: Record<string, string>;
  Notes?: string;
  ItemSets: PobItemSet[];
  SkillSets: PobSkillSet[];
  Skills: PobSkillGroup[];
  TreeDetails: PobTreeDetails;
}

// ─── PobSummary ──────────────────────────────────────────────────────────────
//
// Trimmed projection of PobBuildData used by the engine's `/pob/summary`
// endpoint (~400 tokens vs ~2-5k of the full decode). Sourced from the
// engine's `PobSummary` in
// `poetrade-content/packages/api/src/modules/knowledge/pob/types.ts` — keep
// the two shapes in lockstep when fields change.

export interface PobSummaryStats {
  totalDps?: string;
  ehp?: string;
  life?: string;
  energyShield?: string;
  /** Formatted `${fire}/${cold}/${lightning}/${chaos}` — `%` signs stripped. */
  resists?: string;
  movementSpeed?: string;
}

export interface PobSummaryTree {
  nodesTotal: number;
  keystones: string[];
  /** Resolved via PassiveSkill WHERE id IN nodes AND isNotable=true. */
  notablesAllocated: string[];
  masteries: Array<{ name: string; choice: string }>;
  /** Unique jewels + cluster jewels; rares/magic rolls dropped. */
  jewels: string[];
}

export interface PobSummaryGearEntry {
  slot: string;
  name: string;
  isUnique: boolean;
  canonical: boolean;
  id?: string;
  explicits?: string[];
  implicits?: string[];
  enchant?: string;
  influences?: string[];
  itemLevel?: number;
  corrupted?: true;
  mirrored?: true;
  fractured?: true;
  split?: true;
}

export interface PobSummaryFlaskEntry {
  slot: string;
  baseType: string;
  isUnique: boolean;
  name?: string;
  suffix?: string;
}

export interface PobAlternateLoadout {
  id: string;
  title: string;
  gear?: PobSummaryGearEntry[];
  tree?: PobSummaryTree;
  mainSkill?: string | null;
  supports?: string[];
  auras?: string[];
  heralds?: string[];
  curses?: string[];
  banners?: string[];
  triggers?: string[];
  movement?: string[];
}

export interface PobSummary {
  class: string;
  ascendancy: string;
  level: number;
  notes?: string;
  stats: PobSummaryStats;
  mainSkill: string | null;
  supports: string[];
  auras?: string[];
  heralds?: string[];
  curses?: string[];
  banners?: string[];
  triggers?: string[];
  movement?: string[];
  tree: PobSummaryTree;
  alternateLoadouts?: PobAlternateLoadout[];
  gear: PobSummaryGearEntry[];
  flasks?: PobSummaryFlaskEntry[];
}
