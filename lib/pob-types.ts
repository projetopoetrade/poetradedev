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
