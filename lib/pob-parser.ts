import { inflateSync } from "zlib";
import { DOMParser } from "@xmldom/xmldom";

// --- Types ---

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
  name: string; // display name: custom name for rare/unique, modified name for magic, base for normal
  baseName: string; // base type
  rarity: string;
  sockets?: string; // e.g. "R-G-B-R" or "R-G G-B" (space = separate group)
  quality?: number;
  itemLevel?: number;
  armour?: number;
  evasion?: number;
  energyShield?: number;
  physDamage?: [number, number]; // [min, max] physical damage
  eleDamage?: [number, number]; // [min, max] summed elemental damage (fire+cold+lightning)
  chaosDamage?: [number, number]; // [min, max] chaos damage
  critChance?: number; // critical strike chance (%)
  aps?: number; // attacks per second
  isEstimatedDps?: boolean; // true when DPS was estimated from base type (not from item tooltip)
  corrupted?: boolean;
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
  ItemSets: PobItemSet[];
  SkillSets: PobSkillSet[];
  Skills: PobSkillGroup[];
  TreeDetails: PobTreeDetails;
}

// --- Mod parsing ---

/** Returns true if a mod line applies given the active variant set.
 *  Lines with no {variant:N} tag always apply.
 *  Lines with {variant:N,M,...} apply only if at least one N is in activeVariants. */
function isModForActiveVariants(
  line: string,
  activeVariants: Set<number>,
): boolean {
  if (activeVariants.size === 0) return true;
  const m = line.match(/\{variant:([^}]+)\}/);
  if (!m) return true;
  return m[1]
    .split(",")
    .some((s) => activeVariants.has(parseInt(s.trim(), 10)));
}

function parseModLine(
  line: string,
  section: "implicit" | "explicit",
): ParsedMod {
  // Strip {range:N} annotations first
  const withoutRange = line.replace(/\{range:[^}]+\}/g, "").trim();

  // Detect type by presence of known tags anywhere in the line.
  // Isso cobre casos como:
  // {tags:...}{crafted}Hits can't be Evaded
  // {tags:...}{enchant}Some enchant text
  let type: ParsedMod["type"] = "normal";
  if (
    withoutRange.includes("{enchant}") ||
    (section === "implicit" &&
      (withoutRange.includes("{crafted}") ||
        withoutRange.includes("{unveiled_mod}")))
  ) {
    // Em implicits, mods marcados como crafted/unveiled se comportam visualmente
    // como "enchants" (primeiro bloco acima da linha), então marcamos como enchant.
    type = "enchant";
  } else if (
    section === "explicit" &&
    (withoutRange.includes("{crafted}") ||
      withoutRange.includes("{unveiled_mod}"))
  ) {
    // Mods de bancada / unveiled nos explicits continuam como "crafted"
    // para podermos colorir em branco, mantendo a ordem original.
    type = "crafted";
  } else if (withoutRange.includes("{fractured}")) {
    type = "fractured";
  } else if (withoutRange.includes("{scourge}")) {
    type = "scourge";
  }

  // Remove all brace tags (including {crafted}, {enchant}, {tags:...}, etc.)
  const text = withoutRange.replace(/\{[^}]+\}/g, "").trim();
  return { text, type };
}

// ─── Weapon base type stats ──────────────────────────────────────────────────
// NOTA: Esta tabela foi removida porque os valores eram imprecisos.
// O DPS de weapons só é calculado quando o item foi exportado do jogo
// (contém as linhas "Physical Damage:", "Attacks per Second:", etc.).
// Itens criados manualmente no PoB ("New Item") não têm esses valores.
//
// Para gerar uma tabela precisa, execute:
//   node scripts/generate-weapon-bases.mjs
// (requer dados do poedb.tw ou extração do .ggpk)
// ─────────────────────────────────────────────────────────────────────────────

// ΓöÇΓöÇΓöÇ Weapon base type stats ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Source: poewiki.net Cargo API (weapons table, rarity=Normal)
// Generated by: node scripts/generate-weapon-bases.mjs
// Generated at: 2026-02-25T16:45:59.559Z
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const WEAPON_BASE_STATS: Record<string, { phys: [number, number]; aps: number; crit: number }> = {
  "Abyssal Axe": { phys: [81, 121], aps: 1.25, crit: 5 },
  "Abyssal Sceptre": { phys: [45, 67], aps: 1.25, crit: 7.3 },
  "Accumulator Wand": { phys: [27, 50], aps: 1.5, crit: 8.5 },
  "Alternating Sceptre": { phys: [41, 61], aps: 1.45, crit: 7.6 },
  "Ambusher": { phys: [19, 74], aps: 1.5, crit: 8.3 },
  "Anarchic Spiritblade": { phys: [34, 63], aps: 1.6, crit: 6.5 },
  "Ancestral Club": { phys: [48, 80], aps: 1.25, crit: 5 },
  "Ancient Sword": { phys: [18, 33], aps: 1.45, crit: 5 },
  "Antique Rapier": { phys: [12, 46], aps: 1.3, crit: 6.5 },
  "Apex Cleaver": { phys: [78, 121], aps: 1.35, crit: 5 },
  "Apex Rapier": { phys: [29, 67], aps: 1.4, crit: 5.7 },
  "Arming Axe": { phys: [14, 42], aps: 1.4, crit: 5 },
  "Assassin Bow": { phys: [43, 130], aps: 1.25, crit: 6.7 },
  "Assembler Wand": { phys: [15, 28], aps: 1.5, crit: 8.5 },
  "Auric Mace": { phys: [65, 82], aps: 1.2, crit: 5 },
  "Awl": { phys: [7, 23], aps: 1.55, crit: 7.5 },
  "Banishing Blade": { phys: [55, 102], aps: 1.4, crit: 6.5 },
  "Barbed Club": { phys: [33, 42], aps: 1.4, crit: 5 },
  "Baselard": { phys: [37, 53], aps: 1.3, crit: 5 },
  "Basket Rapier": { phys: [11, 25], aps: 1.55, crit: 5.5 },
  "Bastard Sword": { phys: [17, 29], aps: 1.45, crit: 5 },
  "Battered Foil": { phys: [11, 20], aps: 1.5, crit: 6 },
  "Battery Staff": { phys: [65, 120], aps: 1.25, crit: 7.5 },
  "Battle Hammer": { phys: [25, 59], aps: 1.4, crit: 5 },
  "Battle Sword": { phys: [38, 70], aps: 1.2, crit: 5 },
  "Behemoth Mace": { phys: [49, 74], aps: 1.35, crit: 5 },
  "Bladed Mace": { phys: [19, 32], aps: 1.4, crit: 5 },
  "Blasting Blade": { phys: [47, 87], aps: 1.4, crit: 6.5 },
  "Blasting Wand": { phys: [21, 39], aps: 1.6, crit: 8.5 },
  "Blinder": { phys: [12, 31], aps: 1.55, crit: 7.5 },
  "Blood Sceptre": { phys: [30, 55], aps: 1.4, crit: 7 },
  "Blunt Force Condenser": { phys: [39, 64], aps: 1.15, crit: 5 },
  "Boarding Axe": { phys: [11, 21], aps: 1.5, crit: 5 },
  "Bone Bow": { phys: [15, 45], aps: 1.4, crit: 6.5 },
  "Boom Mace": { phys: [39, 81], aps: 1.3, crit: 5 },
  "Boot Blade": { phys: [15, 59], aps: 1.4, crit: 8.5 },
  "Boot Knife": { phys: [8, 34], aps: 1.45, crit: 8.5 },
  "Brass Maul": { phys: [40, 60], aps: 1.2, crit: 5 },
  "Broad Axe": { phys: [19, 34], aps: 1.35, crit: 5 },
  "Broad Sword": { phys: [15, 21], aps: 1.45, crit: 5 },
  "Bronze Sceptre": { phys: [15, 29], aps: 1.1, crit: 7 },
  "Burnished Foil": { phys: [25, 46], aps: 1.4, crit: 6 },
  "Butcher Axe": { phys: [47, 87], aps: 1.3, crit: 5 },
  "Butcher Knife": { phys: [7, 62], aps: 1.4, crit: 8.5 },
  "Butcher Sword": { phys: [34, 79], aps: 1.3, crit: 5 },
  "Calling Wand": { phys: [13, 23], aps: 1.5, crit: 8 },
  "Capacity Rod": { phys: [39, 73], aps: 1.25, crit: 8.3 },
  "Capricious Spiritblade": { phys: [27, 51], aps: 1.6, crit: 6.5 },
  "Carnal Sceptre": { phys: [41, 95], aps: 1.2, crit: 7 },
  "Carved Wand": { phys: [9, 16], aps: 1.6, crit: 8 },
  "Carving Knife": { phys: [3, 26], aps: 1.45, crit: 8.5 },
  "Cat's Paw": { phys: [12, 22], aps: 1.6, crit: 7 },
  "Ceremonial Axe": { phys: [45, 83], aps: 1.2, crit: 5 },
  "Ceremonial Mace": { phys: [32, 40], aps: 1.2, crit: 5 },
  "Charan's Sword": { phys: [5, 11], aps: 1.45, crit: 5 },
  "Chest Splitter": { phys: [24, 71], aps: 1.4, crit: 5 },
  "Citadel Bow": { phys: [36, 144], aps: 1.25, crit: 6 },
  "Cleaver": { phys: [12, 35], aps: 1.3, crit: 5 },
  "Coiled Staff": { phys: [27, 57], aps: 1.3, crit: 7.7 },
  "Coiled Wand": { phys: [18, 55], aps: 1.45, crit: 8 },
  "Colossus Mallet": { phys: [65, 135], aps: 1.3, crit: 5.5 },
  "Composite Bow": { phys: [16, 34], aps: 1.3, crit: 6 },
  "Compound Bow": { phys: [37, 76], aps: 1.3, crit: 6 },
  "Congregator Wand": { phys: [23, 43], aps: 1.5, crit: 8.5 },
  "Convening Wand": { phys: [25, 47], aps: 1.5, crit: 8 },
  "Convoking Wand": { phys: [28, 52], aps: 1.5, crit: 8 },
  "Copper Kris": { phys: [10, 41], aps: 1.3, crit: 9 },
  "Copper Sword": { phys: [6, 14], aps: 1.5, crit: 5 },
  "Coronal Maul": { phys: [91, 136], aps: 1.2, crit: 5 },
  "Corroded Blade": { phys: [8, 16], aps: 1.45, crit: 5 },
  "Corsair Sword": { phys: [20, 80], aps: 1.55, crit: 5 },
  "Courtesan Sword": { phys: [29, 60], aps: 1.55, crit: 6 },
  "Crack Mace": { phys: [31, 64], aps: 1.3, crit: 5 },
  "Crescent Staff": { phys: [41, 85], aps: 1.2, crit: 7.5 },
  "Crude Bow": { phys: [5, 13], aps: 1.4, crit: 5 },
  "Crushing Force Magnifier": { phys: [62, 103], aps: 1.15, crit: 5 },
  "Crystal Sceptre": { phys: [35, 52], aps: 1.25, crit: 8 },
  "Crystal Wand": { phys: [24, 45], aps: 1.45, crit: 8 },
  "Curved Blade": { phys: [41, 68], aps: 1.35, crit: 6 },
  "Cutlass": { phys: [13, 53], aps: 1.55, crit: 5 },
  "Dagger Axe": { phys: [53, 83], aps: 1.2, crit: 5 },
  "Darkwood Sceptre": { phys: [11, 17], aps: 1.2, crit: 7 },
  "Death Bow": { phys: [28, 73], aps: 1.2, crit: 5 },
  "Decimation Bow": { phys: [44, 116], aps: 1.2, crit: 5 },
  "Decorative Axe": { phys: [27, 50], aps: 1.2, crit: 5 },
  "Decurve Bow": { phys: [24, 96], aps: 1.25, crit: 6 },
  "Demon Dagger": { phys: [24, 97], aps: 1.2, crit: 9 },
  "Demon's Horn": { phys: [31, 57], aps: 1.4, crit: 8 },
  "Despot Axe": { phys: [90, 122], aps: 1.4, crit: 5 },
  "Disapprobation Axe": { phys: [29, 60], aps: 1.3, crit: 5 },
  "Double Axe": { phys: [36, 60], aps: 1.25, crit: 5 },
  "Double Claw": { phys: [15, 44], aps: 1.5, crit: 7.5 },
  "Dragon Mace": { phys: [44, 66], aps: 1.35, crit: 5 },
  "Dragonbone Rapier": { phys: [19, 75], aps: 1.5, crit: 5.5 },
  "Dragoon Sword": { phys: [32, 66], aps: 1.5, crit: 6 },
  "Dread Maul": { phys: [77, 104], aps: 1.25, crit: 5 },
  "Dream Mace": { phys: [21, 43], aps: 1.4, crit: 5 },
  "Driftwood Club": { phys: [6, 8], aps: 1.45, crit: 5 },
  "Driftwood Maul": { phys: [10, 16], aps: 1.3, crit: 5 },
  "Driftwood Sceptre": { phys: [8, 11], aps: 1.2, crit: 7 },
  "Driftwood Wand": { phys: [5, 9], aps: 1.5, crit: 8.3 },
  "Dusk Blade": { phys: [19, 54], aps: 1.3, crit: 5 },
  "Eagle Claw": { phys: [17, 69], aps: 1.5, crit: 7.5 },
  "Eclipse Staff": { phys: [70, 145], aps: 1.2, crit: 7.5 },
  "Elder Sword": { phys: [36, 66], aps: 1.3, crit: 5 },
  "Elegant Foil": { phys: [18, 33], aps: 1.6, crit: 5.5 },
  "Elegant Sword": { phys: [20, 33], aps: 1.5, crit: 5 },
  "Energy Blade (One Handed Sword)": { phys: [0, 0], aps: 1.7, crit: 7 },
  "Energy Blade (Two Handed Sword)": { phys: [0, 0], aps: 1.6, crit: 7 },
  "Engraved Greatsword": { phys: [49, 102], aps: 1.3, crit: 5 },
  "Engraved Hatchet": { phys: [40, 71], aps: 1.35, crit: 5 },
  "Engraved Wand": { phys: [19, 36], aps: 1.6, crit: 8 },
  "Estoc": { phys: [21, 50], aps: 1.5, crit: 5.5 },
  "Etched Greatsword": { phys: [23, 48], aps: 1.4, crit: 5 },
  "Etched Hatchet": { phys: [26, 46], aps: 1.35, crit: 5 },
  "Eternal Sword": { phys: [41, 68], aps: 1.5, crit: 5 },
  "Eventuality Rod": { phys: [78, 144], aps: 1.25, crit: 8.3 },
  "Exquisite Blade": { phys: [67, 112], aps: 1.35, crit: 5.7 },
  "Eye Gouger": { phys: [26, 68], aps: 1.5, crit: 7.5 },
  "Ezomyte Axe": { phys: [87, 131], aps: 1.35, crit: 5.7 },
  "Ezomyte Blade": { phys: [62, 115], aps: 1.4, crit: 6.5 },
  "Ezomyte Dagger": { phys: [20, 79], aps: 1.4, crit: 8.5 },
  "Ezomyte Staff": { phys: [53, 160], aps: 1.25, crit: 8.5 },
  "Fancy Foil": { phys: [28, 51], aps: 1.6, crit: 5.5 },
  "Faun's Horn": { phys: [21, 38], aps: 1.4, crit: 8 },
  "Fickle Spiritblade": { phys: [18, 33], aps: 1.6, crit: 6.5 },
  "Fiend Dagger": { phys: [22, 87], aps: 1.2, crit: 9 },
  "Fishing Rod": { phys: [8, 15], aps: 1.2, crit: 5 },
  "Flanged Mace": { phys: [38, 63], aps: 1.3, crit: 5 },
  "Flare Mace": { phys: [20, 41], aps: 1.3, crit: 5 },
  "Flashfire Blade": { phys: [18, 73], aps: 1.45, crit: 8.5 },
  "Flaying Knife": { phys: [11, 45], aps: 1.4, crit: 8 },
  "Fleshripper": { phys: [97, 152], aps: 1.2, crit: 5 },
  "Flickerflame Blade": { phys: [12, 47], aps: 1.45, crit: 8.5 },
  "Footman Sword": { phys: [39, 65], aps: 1.45, crit: 5 },
  "Foul Staff": { phys: [65, 121], aps: 1.3, crit: 7.5 },
  "Foundry Bow": { phys: [13, 20], aps: 1.3, crit: 5.5 },
  "Fright Claw": { phys: [12, 46], aps: 1.5, crit: 7.5 },
  "Fright Maul": { phys: [46, 62], aps: 1.25, crit: 5 },
  "Gavel": { phys: [54, 101], aps: 1.15, crit: 5 },
  "Gemini Claw": { phys: [23, 68], aps: 1.5, crit: 7.5 },
  "Gemstone Sword": { phys: [39, 83], aps: 1.3, crit: 5 },
  "Gilded Axe": { phys: [43, 58], aps: 1.3, crit: 5 },
  "Gladius": { phys: [54, 78], aps: 1.3, crit: 5 },
  "Glass Shank": { phys: [6, 10], aps: 1.5, crit: 8 },
  "Gnarled Branch": { phys: [9, 19], aps: 1.3, crit: 7.5 },
  "Goat's Horn": { phys: [7, 13], aps: 1.4, crit: 8 },
  "Golden Blade": { phys: [3, 23], aps: 1.1, crit: 5 },
  "Golden Kris": { phys: [19, 75], aps: 1.2, crit: 9 },
  "Gouger": { phys: [15, 51], aps: 1.5, crit: 7.5 },
  "Graceful Sword": { phys: [34, 55], aps: 1.5, crit: 5 },
  "Grappler": { phys: [44, 94], aps: 1.15, crit: 5 },
  "Great Mallet": { phys: [43, 88], aps: 1.25, crit: 5 },
  "Great White Claw": { phys: [30, 78], aps: 1.3, crit: 8 },
  "Grinning Fetish": { phys: [24, 36], aps: 1.5, crit: 7 },
  "Grove Bow": { phys: [20, 61], aps: 1.5, crit: 5 },
  "Gut Ripper": { phys: [20, 53], aps: 1.5, crit: 7.5 },
  "Gutting Knife": { phys: [19, 76], aps: 1.4, crit: 9 },
  "Harbinger Bow": { phys: [50, 133], aps: 1.2, crit: 5 },
  "Harpy Rapier": { phys: [31, 72], aps: 1.4, crit: 5.7 },
  "Headman's Sword": { phys: [55, 128], aps: 1.3, crit: 5 },
  "Headsman Axe": { phys: [61, 92], aps: 1.3, crit: 5 },
  "Heathen Wand": { phys: [28, 52], aps: 1.45, crit: 8 },
  "Hedron Bow": { phys: [9, 13], aps: 1.3, crit: 5.5 },
  "Hellion's Paw": { phys: [29, 55], aps: 1.6, crit: 7 },
  "Highborn Bow": { phys: [24, 94], aps: 1.45, crit: 5 },
  "Highborn Staff": { phys: [48, 145], aps: 1.15, crit: 8.25 },
  "Highland Blade": { phys: [45, 84], aps: 1.35, crit: 5 },
  "Hollowpoint Dagger": { phys: [12, 46], aps: 1.4, crit: 8.8 },
  "Honed Cleaver": { phys: [60, 95], aps: 1.35, crit: 5 },
  "Hook Sword": { phys: [28, 60], aps: 1.15, crit: 5 },
  "Horned Sceptre": { phys: [27, 50], aps: 1.3, crit: 7 },
  "Imbued Wand": { phys: [27, 50], aps: 1.6, crit: 8 },
  "Imp Dagger": { phys: [15, 59], aps: 1.2, crit: 9 },
  "Impact Force Propagator": { phys: [81, 135], aps: 1.15, crit: 5 },
  "Imperial Bow": { phys: [29, 117], aps: 1.45, crit: 5 },
  "Imperial Claw": { phys: [25, 65], aps: 1.6, crit: 7 },
  "Imperial Maul": { phys: [102, 153], aps: 1.1, crit: 5 },
  "Imperial Skean": { phys: [18, 73], aps: 1.5, crit: 8.5 },
  "Imperial Staff": { phys: [57, 171], aps: 1.15, crit: 8.5 },
  "Infernal Axe": { phys: [51, 85], aps: 1.3, crit: 5 },
  "Infernal Blade": { phys: [21, 85], aps: 1.45, crit: 8.5 },
  "Infernal Sword": { phys: [62, 129], aps: 1.35, crit: 5 },
  "Iron Sceptre": { phys: [27, 40], aps: 1.1, crit: 7 },
  "Iron Staff": { phys: [14, 42], aps: 1.3, crit: 7.6 },
  "Ivory Bow": { phys: [29, 86], aps: 1.4, crit: 6.5 },
  "Jade Chopper": { phys: [19, 30], aps: 1.25, crit: 5 },
  "Jade Hatchet": { phys: [10, 15], aps: 1.45, crit: 5 },
  "Jagged Foil": { phys: [12, 29], aps: 1.6, crit: 5.5 },
  "Jagged Maul": { phys: [27, 49], aps: 1.3, crit: 5 },
  "Jasper Axe": { phys: [32, 50], aps: 1.3, crit: 5 },
  "Jasper Chopper": { phys: [58, 91], aps: 1.15, crit: 5 },
  "Jewelled Foil": { phys: [32, 60], aps: 1.6, crit: 5.5 },
  "Judgement Staff": { phys: [73, 136], aps: 1.3, crit: 8 },
  "Karui Axe": { phys: [49, 77], aps: 1.3, crit: 5 },
  "Karui Chopper": { phys: [121, 189], aps: 1.05, crit: 5 },
  "Karui Maul": { phys: [112, 168], aps: 1, crit: 5 },
  "Karui Sceptre": { phys: [37, 55], aps: 1.5, crit: 7 },
  "Keyblade": { phys: [1, 1], aps: 1.2, crit: 5 },
  "Kinetic Wand": { phys: [29, 54], aps: 1.6, crit: 8.5 },
  "Labrys": { phys: [74, 123], aps: 1.2, crit: 5 },
  "Lathi": { phys: [72, 120], aps: 1.3, crit: 7.5 },
  "Lead Sceptre": { phys: [38, 57], aps: 1.25, crit: 7 },
  "Legion Hammer": { phys: [35, 81], aps: 1.4, crit: 5 },
  "Legion Sword": { phys: [53, 98], aps: 1.2, crit: 5 },
  "Lion Sword": { phys: [69, 115], aps: 1.45, crit: 5 },
  "Lithe Blade": { phys: [63, 104], aps: 1.35, crit: 6 },
  "Long Bow": { phys: [8, 33], aps: 1.3, crit: 6 },
  "Long Staff": { phys: [24, 41], aps: 1.3, crit: 7.5 },
  "Longsword": { phys: [11, 26], aps: 1.4, crit: 5 },
  "Maelstr├╢m Staff": { phys: [71, 147], aps: 1.25, crit: 8.1 },
  "Malign Fangs": { phys: [20, 37], aps: 1.6, crit: 7 },
  "Mallet": { phys: [16, 33], aps: 1.3, crit: 5 },
  "Maltreatment Axe": { phys: [19, 39], aps: 1.3, crit: 5 },
  "Maraketh Bow": { phys: [61, 92], aps: 1.4, crit: 5.5 },
  "Meatgrinder": { phys: [74, 138], aps: 1.25, crit: 5 },
  "Midnight Blade": { phys: [35, 99], aps: 1.3, crit: 5 },
  "Military Staff": { phys: [38, 114], aps: 1.25, crit: 7.9 },
  "Moon Staff": { phys: [66, 138], aps: 1.2, crit: 7.5 },
  "Morning Star": { phys: [45, 68], aps: 1.25, crit: 5 },
  "Nailed Fist": { phys: [4, 11], aps: 1.6, crit: 7.3 },
  "Nightmare Mace": { phys: [38, 80], aps: 1.4, crit: 5 },
  "Noble Axe": { phys: [76, 103], aps: 1.3, crit: 5 },
  "Noble Claw": { phys: [21, 56], aps: 1.6, crit: 7 },
  "Ochre Sceptre": { phys: [24, 45], aps: 1.15, crit: 7 },
  "Omen Wand": { phys: [24, 45], aps: 1.5, crit: 8.7 },
  "Opal Sceptre": { phys: [49, 73], aps: 1.25, crit: 8 },
  "Opal Wand": { phys: [30, 56], aps: 1.45, crit: 8 },
  "Ornate Mace": { phys: [53, 67], aps: 1.2, crit: 5 },
  "Ornate Sword": { phys: [30, 50], aps: 1.4, crit: 5 },
  "Oscillating Sceptre": { phys: [23, 34], aps: 1.45, crit: 7.6 },
  "Pagan Wand": { phys: [20, 37], aps: 1.45, crit: 8 },
  "Pecoraro": { phys: [29, 69], aps: 1.5, crit: 5.5 },
  "Pernach": { phys: [49, 82], aps: 1.3, crit: 5 },
  "Petrified Club": { phys: [31, 51], aps: 1.25, crit: 5 },
  "Phantom Mace": { phys: [33, 69], aps: 1.4, crit: 5 },
  "Piledriver": { phys: [77, 115], aps: 1.35, crit: 5 },
  "Plated Maul": { phys: [72, 108], aps: 1.2, crit: 5 },
  "Platinum Kris": { phys: [24, 95], aps: 1.2, crit: 9 },
  "Platinum Sceptre": { phys: [51, 76], aps: 1.25, crit: 7 },
  "Pneumatic Dagger": { phys: [20, 79], aps: 1.4, crit: 8.8 },
  "Poignard": { phys: [13, 52], aps: 1.5, crit: 8.3 },
  "Poleaxe": { phys: [29, 43], aps: 1.3, crit: 5 },
  "Potentiality Rod": { phys: [61, 113], aps: 1.25, crit: 8.3 },
  "Prehistoric Claw": { phys: [26, 68], aps: 1.3, crit: 8 },
  "Pressurised Dagger": { phys: [18, 71], aps: 1.4, crit: 8.8 },
  "Prime Cleaver": { phys: [39, 61], aps: 1.35, crit: 5 },
  "Primeval Rapier": { phys: [18, 73], aps: 1.3, crit: 6.5 },
  "Primitive Staff": { phys: [10, 31], aps: 1.3, crit: 8 },
  "Primordial Staff": { phys: [55, 165], aps: 1.15, crit: 8 },
  "Profane Wand": { phys: [30, 56], aps: 1.45, crit: 8 },
  "Prong Dagger": { phys: [14, 54], aps: 1.35, crit: 8.5 },
  "Prophecy Wand": { phys: [26, 48], aps: 1.5, crit: 8.7 },
  "Psychotic Axe": { phys: [34, 71], aps: 1.3, crit: 5 },
  "Quarterstaff": { phys: [51, 86], aps: 1.3, crit: 7.5 },
  "Quartz Sceptre": { phys: [21, 32], aps: 1.1, crit: 8 },
  "Quartz Wand": { phys: [12, 23], aps: 1.45, crit: 8 },
  "Ranger Bow": { phys: [56, 117], aps: 1.3, crit: 6 },
  "Reaver Axe": { phys: [38, 114], aps: 1.2, crit: 5 },
  "Reaver Sword": { phys: [62, 104], aps: 1.5, crit: 5 },
  "Rebuking Blade": { phys: [30, 56], aps: 1.4, crit: 6.5 },
  "Reciprocation Staff": { phys: [55, 102], aps: 1.25, crit: 7.5 },
  "Recurve Bow": { phys: [15, 45], aps: 1.25, crit: 6.7 },
  "Reflex Bow": { phys: [37, 56], aps: 1.4, crit: 5.5 },
  "Ritual Sceptre": { phys: [21, 50], aps: 1.2, crit: 7 },
  "Rock Breaker": { phys: [37, 69], aps: 1.15, crit: 5 },
  "Royal Axe": { phys: [54, 100], aps: 1.2, crit: 5 },
  "Royal Bow": { phys: [14, 56], aps: 1.45, crit: 5 },
  "Royal Sceptre": { phys: [34, 80], aps: 1.2, crit: 7 },
  "Royal Skean": { phys: [16, 64], aps: 1.45, crit: 8.5 },
  "Royal Staff": { phys: [27, 81], aps: 1.15, crit: 8.5 },
  "Runic Hatchet": { phys: [44, 79], aps: 1.35, crit: 5 },
  "Rusted Hatchet": { phys: [6, 11], aps: 1.5, crit: 5 },
  "Rusted Spike": { phys: [5, 11], aps: 1.55, crit: 5.5 },
  "Rusted Sword": { phys: [4, 9], aps: 1.55, crit: 5 },
  "Sabre": { phys: [5, 22], aps: 1.55, crit: 5 },
  "Sage Wand": { phys: [17, 32], aps: 1.5, crit: 8.7 },
  "Sai": { phys: [22, 88], aps: 1.35, crit: 8.5 },
  "Sambar Sceptre": { phys: [42, 78], aps: 1.3, crit: 7 },
  "Sekhem": { phys: [30, 55], aps: 1.25, crit: 7 },
  "Serpentine Staff": { phys: [56, 117], aps: 1.25, crit: 7.8 },
  "Serrated Foil": { phys: [21, 49], aps: 1.6, crit: 5.5 },
  "Shadow Axe": { phys: [49, 73], aps: 1.25, crit: 5 },
  "Shadow Fangs": { phys: [13, 24], aps: 1.6, crit: 7 },
  "Shadow Sceptre": { phys: [29, 44], aps: 1.25, crit: 7.3 },
  "Sharktooth Claw": { phys: [6, 17], aps: 1.5, crit: 8 },
  "Short Bow": { phys: [6, 16], aps: 1.5, crit: 5 },
  "Siege Axe": { phys: [38, 70], aps: 1.5, crit: 5 },
  "Skean": { phys: [11, 43], aps: 1.45, crit: 8.5 },
  "Skinning Knife": { phys: [4, 17], aps: 1.45, crit: 8 },
  "Slaughter Knife": { phys: [10, 86], aps: 1.4, crit: 8.5 },
  "Sledgehammer": { phys: [25, 38], aps: 1.3, crit: 5 },
  "Smallsword": { phys: [19, 40], aps: 1.55, crit: 6 },
  "Sniper Bow": { phys: [32, 96], aps: 1.25, crit: 6.7 },
  "Solar Maul": { phys: [75, 113], aps: 1.25, crit: 5 },
  "Solarine Bow": { phys: [16, 24], aps: 1.3, crit: 5.5 },
  "Somatic Wand": { phys: [9, 18], aps: 1.6, crit: 8.5 },
  "Sparkling Claw": { phys: [14, 38], aps: 1.6, crit: 7 },
  "Spectral Axe": { phys: [29, 48], aps: 1.3, crit: 5 },
  "Spectral Sword": { phys: [31, 65], aps: 1.35, crit: 5 },
  "Spiked Club": { phys: [13, 16], aps: 1.45, crit: 5 },
  "Spine Bow": { phys: [38, 115], aps: 1.4, crit: 6.5 },
  "Spiny Maul": { phys: [55, 103], aps: 1.25, crit: 5 },
  "Spiraled Foil": { phys: [27, 64], aps: 1.6, crit: 5.5 },
  "Spiraled Wand": { phys: [11, 32], aps: 1.45, crit: 8 },
  "Stabilising Sceptre": { phys: [35, 52], aps: 1.45, crit: 7.6 },
  "Stag Sceptre": { phys: [39, 72], aps: 1.3, crit: 7 },
  "Steelhead": { phys: [54, 81], aps: 1.3, crit: 5 },
  "Steelwood Bow": { phys: [58, 86], aps: 1.4, crit: 5.5 },
  "Stiletto": { phys: [7, 27], aps: 1.5, crit: 8.3 },
  "Stone Axe": { phys: [12, 20], aps: 1.3, crit: 5 },
  "Stone Hammer": { phys: [15, 27], aps: 1.3, crit: 5 },
  "Sundering Axe": { phys: [74, 155], aps: 1.3, crit: 5 },
  "Talon Axe": { phys: [88, 138], aps: 1.2, crit: 5 },
  "Tempered Foil": { phys: [35, 65], aps: 1.4, crit: 6 },
  "Template:Sandbox/balaar/item acquisition/testcases": { phys: [12, 20], aps: 1.3, crit: 5 },
  "Tenderizer": { phys: [49, 62], aps: 1.4, crit: 5 },
  "Terror Claw": { phys: [18, 71], aps: 1.5, crit: 7.5 },
  "Terror Maul": { phys: [101, 137], aps: 1.15, crit: 6 },
  "Thicket Bow": { phys: [32, 96], aps: 1.5, crit: 5 },
  "Thorn Rapier": { phys: [19, 44], aps: 1.4, crit: 5.7 },
  "Thresher Claw": { phys: [20, 53], aps: 1.3, crit: 8 },
  "Throat Stabber": { phys: [21, 73], aps: 1.5, crit: 7.5 },
  "Tiger Hook": { phys: [37, 80], aps: 1.4, crit: 5 },
  "Tiger Sword": { phys: [54, 89], aps: 1.4, crit: 5 },
  "Tiger's Paw": { phys: [23, 43], aps: 1.6, crit: 7 },
  "Timber Axe": { phys: [48, 99], aps: 1.25, crit: 5 },
  "Timeworn Claw": { phys: [16, 43], aps: 1.3, crit: 8 },
  "Tomahawk": { phys: [25, 46], aps: 1.5, crit: 5 },
  "Tornado Wand": { phys: [22, 65], aps: 1.45, crit: 8 },
  "Totemic Maul": { phys: [57, 85], aps: 1.1, crit: 5 },
  "Transformer Staff": { phys: [36, 66], aps: 1.25, crit: 7.5 },
  "Tribal Club": { phys: [8, 13], aps: 1.4, crit: 5 },
  "Tribal Maul": { phys: [17, 25], aps: 1.25, crit: 5 },
  "Trisula": { phys: [19, 74], aps: 1.35, crit: 9 },
  "Twilight Blade": { phys: [30, 86], aps: 1.3, crit: 5 },
  "Twin Claw": { phys: [21, 64], aps: 1.5, crit: 7.5 },
  "Two-Handed Sword": { phys: [20, 38], aps: 1.4, crit: 5 },
  "Tyrant's Sekhem": { phys: [43, 80], aps: 1.25, crit: 7 },
  "User:Balaar/sandbox/testcases/fleshripper": { phys: [97, 152], aps: 1.2, crit: 5 },
  "User:Balaar/sandbox/testcases/stone axe": { phys: [12, 20], aps: 1.3, crit: 5 },
  "Vaal Axe": { phys: [104, 174], aps: 1.15, crit: 5 },
  "Vaal Blade": { phys: [46, 86], aps: 1.3, crit: 5 },
  "Vaal Claw": { phys: [29, 76], aps: 1.3, crit: 8 },
  "Vaal Greatsword": { phys: [68, 142], aps: 1.3, crit: 5 },
  "Vaal Hatchet": { phys: [30, 90], aps: 1.4, crit: 5 },
  "Vaal Rapier": { phys: [22, 87], aps: 1.3, crit: 6.5 },
  "Vaal Sceptre": { phys: [37, 70], aps: 1.4, crit: 7 },
  "Variscite Blade": { phys: [25, 53], aps: 1.3, crit: 5 },
  "Vile Staff": { phys: [41, 76], aps: 1.3, crit: 7.5 },
  "Void Axe": { phys: [96, 144], aps: 1.25, crit: 6 },
  "Void Fangs": { phys: [22, 41], aps: 1.6, crit: 7 },
  "Void Sceptre": { phys: [50, 76], aps: 1.25, crit: 7.3 },
  "War Axe": { phys: [35, 65], aps: 1.3, crit: 5 },
  "War Hammer": { phys: [13, 31], aps: 1.45, crit: 5 },
  "War Sword": { phys: [16, 30], aps: 1.4, crit: 5 },
  "Whalebone Rapier": { phys: [4, 17], aps: 1.6, crit: 5.5 },
  "Woodful Staff": { phys: [34, 102], aps: 1.15, crit: 8 },
  "Woodsplitter": { phys: [19, 39], aps: 1.3, crit: 5 },
  "Wraith Axe": { phys: [45, 75], aps: 1.3, crit: 5 },
  "Wraith Sword": { phys: [52, 109], aps: 1.35, crit: 5 },
  "Wrist Chopper": { phys: [26, 79], aps: 1.2, crit: 5 },
  "Wyrm Mace": { phys: [28, 42], aps: 1.35, crit: 5 },
  "Wyrmbone Rapier": { phys: [13, 51], aps: 1.5, crit: 5.5 },
};

// ─────────────────────────────────────────────────────────────────────────────

const NON_MOD_LINES = new Set([
  "Corrupted",
  "Mirrored",
  "Synthesised Item",
  "Unidentified",
  "Split",
  "Historic",
]);

// --- Item name normalization ---
//
// PoB adiciona metadados entre colchetes em alguns itens únicos.
// Ex: "Lethal Pride [16062; 2; Wind Dancer]" → "Lethal Pride"
//     "Glorious Vanity [11908; 1; Xibaqua]"  → "Glorious Vanity"
// Removemos esse sufixo para que o lookup por nome (poe.ninja, mapeamentos locais) funcione.
function normalizeItemName(name: string): string {
  return name.replace(/\s*\[.*?\]\s*$/, "").trim();
}

// --- Flask / Tincture base type normalization ---
//
// PoB pode exportar flasks em formatos diferentes. Para pegar ícones via poe.ninja,
// precisamos bater o "base type" exatamente (ex.: "Eternal Life Flask", "Gold Flask").
// A lista abaixo é a union dos base types (48) fornecida pelo usuário.
const FLASK_BASE_TYPES = [
  // Life
  "Small Life Flask",
  "Medium Life Flask",
  "Large Life Flask",
  "Greater Life Flask",
  "Grand Life Flask",
  "Giant Life Flask",
  "Colossal Life Flask",
  "Sacred Life Flask",
  "Hallowed Life Flask",
  "Sanctified Life Flask",
  "Divine Life Flask",
  "Eternal Life Flask",
  // Mana
  "Small Mana Flask",
  "Medium Mana Flask",
  "Large Mana Flask",
  "Greater Mana Flask",
  "Grand Mana Flask",
  "Giant Mana Flask",
  "Colossal Mana Flask",
  "Sacred Mana Flask",
  "Hallowed Mana Flask",
  "Sanctified Mana Flask",
  "Divine Mana Flask",
  "Eternal Mana Flask",
  // Hybrid
  "Small Hybrid Flask",
  "Medium Hybrid Flask",
  "Large Hybrid Flask",
  "Colossal Hybrid Flask",
  "Sacred Hybrid Flask",
  "Hallowed Hybrid Flask",
  // Utility
  "Diamond Flask",
  "Ruby Flask",
  "Sapphire Flask",
  "Topaz Flask",
  "Granite Flask",
  "Quicksilver Flask",
  "Amethyst Flask",
  "Quartz Flask",
  "Jade Flask",
  "Basalt Flask",
  "Aquamarine Flask",
  "Stibnite Flask",
  "Sulphur Flask",
  "Silver Flask",
  "Bismuth Flask",
  "Gold Flask",
  "Corundum Flask",
  "Iron Flask",
] as const;

const FLASK_BASE_TYPES_LOWER_LONGEST_FIRST = [...FLASK_BASE_TYPES]
  .map((s) => s.toLowerCase())
  .sort((a, b) => b.length - a.length);

function detectFlaskBaseTypeFromName(name: string): string | null {
  const n = name.toLowerCase().trim();
  if (!n) return null;

  // Match por substring com fronteiras simples. Como as bases todas terminam em "flask",
  // isso evita falso positivo e mantém o custo baixo (48 itens).
  for (const base of FLASK_BASE_TYPES_LOWER_LONGEST_FIRST) {
    const idx = n.indexOf(base);
    if (idx === -1) continue;

    const before = idx === 0 ? " " : n[idx - 1];
    const afterIdx = idx + base.length;
    const after = afterIdx >= n.length ? " " : n[afterIdx];

    const okBefore =
      before === " " || before === '"' || before === "'" || before === "(";
    const okAfter =
      after === " " ||
      after === '"' ||
      after === "'" ||
      after === ")" ||
      after === "," ||
      after === ".";

    if (okBefore && okAfter) return base;
  }

  return null;
}

function toTitleCaseBaseType(lowerBase: string): string {
  // `lowerBase` vem de FLASK_BASE_TYPES_LOWER_LONGEST_FIRST; retornamos o casing original.
  const found = FLASK_BASE_TYPES.find((b) => b.toLowerCase() === lowerBase);
  return found ?? lowerBase;
}

// Tinctures (PoE2) — lista de bases fornecida pelo usuário.
const TINCTURE_BASE_TYPES = [
  "Prismatic Tincture",
  "Rosethorn Tincture",
  "Ironwood Tincture",
  "Ashbark Tincture",
  "Borealwood Tincture",
  "Fulgurite Tincture",
  "Poisonberry Tincture",
  "Blood Sap Tincture",
  "Oakbranch Tincture",
  "Sporebloom Tincture",
] as const;

const TINCTURE_BASE_TYPES_LOWER_LONGEST_FIRST = [...TINCTURE_BASE_TYPES]
  .map((s) => s.toLowerCase())
  .sort((a, b) => b.length - a.length);

function detectTinctureBaseTypeFromName(name: string): string | null {
  const n = name.toLowerCase().trim();
  if (!n) return null;

  for (const base of TINCTURE_BASE_TYPES_LOWER_LONGEST_FIRST) {
    const idx = n.indexOf(base);
    if (idx === -1) continue;

    const before = idx === 0 ? " " : n[idx - 1];
    const afterIdx = idx + base.length;
    const after = afterIdx >= n.length ? " " : n[afterIdx];

    const okBefore =
      before === " " || before === '"' || before === "'" || before === "(";
    const okAfter =
      after === " " ||
      after === '"' ||
      after === "'" ||
      after === ")" ||
      after === "," ||
      after === ".";

    if (okBefore && okAfter) return base;
  }

  return null;
}

function parseItemText(rawLines: string[]): Omit<PobItem, "slot" | "iconUrl"> {
  if (!rawLines.length) {
    return {
      name: "",
      baseName: "",
      rarity: "Normal",
      implicits: [],
      explicits: [],
    };
  }

  let rarity: string = "Normal";
  let idx = 0;
  let name = "";
  let baseName = "";

  if ((rawLines[0] || "").startsWith("Rarity:")) {
    // Formato completo com cabeçalho "Rarity: X"
    const rarityRaw = (rawLines[0] || "").replace("Rarity:", "").trim();
    rarity =
      ["Unique", "Rare", "Magic", "Normal"].find(
        (r) => rarityRaw.toLowerCase() === r.toLowerCase(),
      ) || "Normal";

    idx = 1;

    if (rarity === "Unique" || rarity === "Rare") {
      name = normalizeItemName(rawLines[idx++] || "");
      baseName = rawLines[idx++] || "";
    } else if (rarity === "Magic") {
      // Em muitos exports novos do PoB, itens mágicos seguem:
      //   linha 0: "Rarity: Magic"
      //   linha 1: nome mágico (ex: "Bountiful Eternal Life Flask")
      //   linha 2: base type (ex: "Eternal Life Flask")
      // Quando a segunda linha existir, usamos como baseName para bater com poe.ninja.
      name = normalizeItemName(rawLines[idx++] || "");
      baseName = rawLines[idx++] || name;
    } else {
      // Normal
      name = normalizeItemName(rawLines[idx++] || "");
      baseName = name;
    }

    // Mesmo no formato completo, algumas flasks/tinctures podem vir sem base type separado
    // (ou com base inesperada). Se detectar um base type conhecido no nome, preferimos ele.
    const detectedFlask = detectFlaskBaseTypeFromName(name);
    const detectedTincture = detectTinctureBaseTypeFromName(name);
    if (detectedTincture) {
      baseName = detectedTincture;
    } else if (detectedFlask) {
      baseName = toTitleCaseBaseType(detectedFlask);
    }
  } else {
    // Formato "compacto" sem linha de raridade no topo, como:
    //   Bountiful Eternal Life Flask
    //   Crafted: true
    //   Prefix: ...
    //   Suffix: ...
    // Ou, para itens criados no PoB, duas linhas antes dos metadados:
    //   New Item
    //   Viridian Jewel
    //   Crafted: true
    //   ...
    name = normalizeItemName(rawLines[0] || "");
    baseName = name;
    idx = 1;

    // Se rawLines[1] não é um par key-value (não contém ':'), é o base type separado.
    // Ex: "New Item" + "Viridian Jewel", "New Item" + "Large Cluster Jewel"
    if (rawLines[1] && !rawLines[1].includes(":")) {
      baseName = rawLines[1];
      idx = 2;
    }

    // Heurística simples de raridade: se tiver Prefix/Suffix diferente de None,
    // tratamos como Magic; senão deixamos como Normal.
    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (line.startsWith("Prefix:") && !line.endsWith("None")) {
        rarity = "Magic";
        break;
      }
      if (line.startsWith("Suffix:") && !line.endsWith("None")) {
        rarity = "Magic";
        break;
      }
    }

    // Para flasks/tinctures no formato compacto, extraímos o base type do nome completo.
    // Ex.: "Bountiful Eternal Life Flask" -> "Eternal Life Flask"
    //      "Gold Flask of the Antelope"   -> "Gold Flask"
    //      "Horticultural Prismatic Tincture of Overpowering" -> "Prismatic Tincture"
    // Nota: detecta no `name` (rawLines[0]) pois o base type de flasks está no nome completo.
    const detectedTincture = detectTinctureBaseTypeFromName(name);
    const detectedFlask = detectFlaskBaseTypeFromName(name);
    if (detectedTincture) {
      baseName = detectedTincture;
    } else if (detectedFlask) {
      baseName = toTitleCaseBaseType(detectedFlask);
    }
  }

  let sockets: string | undefined;
  let quality: number | undefined;
  let itemLevel: number | undefined;
  let armour: number | undefined;
  let evasion: number | undefined;
  let energyShield: number | undefined;
  let physDamage: [number, number] | undefined;
  let eleDamage: [number, number] | undefined;
  let chaosDamage: [number, number] | undefined;
  let critChance: number | undefined;
  let aps: number | undefined;
  let corrupted = false;
  let fractured = false;
  const influences: string[] = [];
  let implicitsCount = 0;
  let selectedVariant: number | undefined;
  let selectedAltVariant: number | undefined;
  let selectedAltVariantTwo: number | undefined;

  // Scan header lines until "Implicits:"
  while (idx < rawLines.length) {
    const line = rawLines[idx];
    if (line.startsWith("Implicits:")) {
      implicitsCount = Math.max(
        0,
        parseInt(line.split(":")[1]?.trim() || "0", 10),
      );
      idx++;
      break;
    }
    if (line.startsWith("Sockets:")) {
      sockets = line.replace("Sockets:", "").trim();
    } else if (line.startsWith("Item Level:")) {
      itemLevel =
        parseInt(line.replace("Item Level:", "").trim(), 10) || undefined;
    } else if (line.startsWith("Quality:")) {
      const m = line.match(/\+?(\d+)/);
      quality = m ? parseInt(m[1], 10) : undefined;
    } else if (/^Armour:/i.test(line)) {
      const m = line.match(/(\d+)/);
      if (m) armour = parseInt(m[1], 10);
    } else if (/^Evasion(?: Rating)?:/i.test(line)) {
      const m = line.match(/(\d+)/);
      if (m) evasion = parseInt(m[1], 10);
    } else if (
      /^Energy(?: Shield)?:/i.test(line) ||
      /^EnergyShield:/i.test(line)
    ) {
      const m = line.match(/(\d+)/);
      if (m) energyShield = parseInt(m[1], 10);
    } else if (/^Physical Damage:/i.test(line)) {
      const m = line.match(/(\d+)-(\d+)/);
      if (m) physDamage = [parseInt(m[1], 10), parseInt(m[2], 10)];
    } else if (/^Elemental Damage:/i.test(line)) {
      // Formato: "Elemental Damage: 20-40 (Fire), 10-30 (Cold), 5-15 (Lightning)"
      // Soma todos os pares X-Y encontrados na linha
      const pairs = [...line.matchAll(/(\d+)-(\d+)/g)];
      if (pairs.length > 0) {
        const eleMin = pairs.reduce((s, p) => s + parseInt(p[1], 10), 0);
        const eleMax = pairs.reduce((s, p) => s + parseInt(p[2], 10), 0);
        eleDamage = [eleMin, eleMax];
      }
    } else if (/^Chaos Damage:/i.test(line)) {
      const m = line.match(/(\d+)-(\d+)/);
      if (m) chaosDamage = [parseInt(m[1], 10), parseInt(m[2], 10)];
    } else if (/^Critical Strike Chance:/i.test(line)) {
      const m = line.match(/([\d.]+)/);
      if (m) critChance = parseFloat(m[1]);
    } else if (/^Attacks per Second:/i.test(line)) {
      const m = line.match(/([\d.]+)/);
      if (m) aps = parseFloat(m[1]);
    } else if (line === "Corrupted") {
      corrupted = true;
    } else if (line === "Fractured Item") {
      fractured = true;
    } else if (line.startsWith("Selected Alt Variant Two:")) {
      const v = parseInt(line.split(":")[1]?.trim() || "", 10);
      if (!isNaN(v)) selectedAltVariantTwo = v;
    } else if (line.startsWith("Selected Alt Variant:")) {
      const v = parseInt(line.split(":")[1]?.trim() || "", 10);
      if (!isNaN(v)) selectedAltVariant = v;
    } else if (line.startsWith("Selected Variant:")) {
      const v = parseInt(line.split(":")[1]?.trim() || "", 10);
      if (!isNaN(v)) selectedVariant = v;
    } else if (line.endsWith(" Item")) {
      const lower = line.toLowerCase();
      if (lower === "shaper item") influences.push("shaper");
      else if (lower === "elder item") influences.push("elder");
      else if (lower === "crusader item") influences.push("crusader");
      else if (lower === "redeemer item") influences.push("redeemer");
      else if (lower === "hunter item") influences.push("hunter");
      else if (lower === "warlord item") influences.push("warlord");
      else if (lower === "searing exarch item") influences.push("searing");
      else if (lower === "eater of worlds item") influences.push("eater");
    }
    idx++;
  }

  // Build active variant set from selected variants
  const activeVariants = new Set<number>();
  if (selectedVariant !== undefined) activeVariants.add(selectedVariant);
  if (selectedAltVariant !== undefined) activeVariants.add(selectedAltVariant);
  if (selectedAltVariantTwo !== undefined)
    activeVariants.add(selectedAltVariantTwo);

  // Parse implicits (exactly implicitsCount lines)
  const implicits: ParsedMod[] = [];
  for (let i = 0; i < implicitsCount && idx < rawLines.length; i++) {
    const line = rawLines[idx++];
    if (line && isModForActiveVariants(line, activeVariants)) {
      implicits.push(parseModLine(line, "implicit"));
    }
  }

  // Parse explicits (remaining lines)
  const explicits: ParsedMod[] = [];
  while (idx < rawLines.length) {
    const line = rawLines[idx++];
    if (!line) continue;
    if (line === "Corrupted") {
      corrupted = true;
      continue;
    }
    if (line === "Fractured Item") {
      fractured = true;
      continue;
    }
    if (line.endsWith(" Item")) {
      const lower = line.toLowerCase();
      if (lower === "shaper item") influences.push("shaper");
      else if (lower === "elder item") influences.push("elder");
      else if (lower === "crusader item") influences.push("crusader");
      else if (lower === "redeemer item") influences.push("redeemer");
      else if (lower === "hunter item") influences.push("hunter");
      else if (lower === "warlord item") influences.push("warlord");
      else if (lower === "searing exarch item") influences.push("searing");
      else if (lower === "eater of worlds item") influences.push("eater");
      continue;
    }
    if (NON_MOD_LINES.has(line)) continue;
    if (line.startsWith("Note:")) continue;
    if (!isModForActiveVariants(line, activeVariants)) continue;
    explicits.push(parseModLine(line, "explicit"));
  }

  // ── Fallback para itens no formato compacto do PoB (New Item / crafted) ──
  // Quando as linhas de propriedade calculada (Physical Damage, APS, Crit)
  // não existem no texto, tentamos calcular a partir da tabela de base types.
  if (!physDamage && !aps && !critChance) {
    const baseStats = WEAPON_BASE_STATS[baseName];
    if (baseStats) {
      // Qualidade aumenta o dano físico em quality% (Quality: 20 → +20%)
      const qualMult = 1 + (quality ?? 0) / 100;

      // Coleta mod lines das explicits + implicits para extrair % de modificadores
      const allModTexts = [
        ...implicits.map((m) => m.text),
        ...explicits.map((m) => m.text),
      ];

      let physIncrease = 0;
      let apsIncrease  = 0;
      let critIncrease = 0;
      let flatPhysMin  = 0;
      let flatPhysMax  = 0;

      for (const text of allModTexts) {
        const t = text.toLowerCase();

        const physPct = t.match(/(\d+)%\s+increased\s+physical\s+damage/);
        if (physPct) physIncrease += parseInt(physPct[1], 10);

        const apsPct = t.match(/(\d+)%\s+increased\s+attack\s+speed/);
        if (apsPct) apsIncrease += parseInt(apsPct[1], 10);

        const critPct = t.match(/(\d+)%\s+increased\s+critical\s+strike\s+chance/);
        if (critPct) critIncrease += parseInt(critPct[1], 10);

        const flatPhys = t.match(/adds\s+(\d+)\s+to\s+(\d+)\s+physical\s+damage/);
        if (flatPhys) {
          flatPhysMin += parseInt(flatPhys[1], 10);
          flatPhysMax += parseInt(flatPhys[2], 10);
        }
      }

      const physMult = qualMult * (1 + physIncrease / 100);
      const calcMin  = Math.round(baseStats.phys[0] * physMult) + flatPhysMin;
      const calcMax  = Math.round(baseStats.phys[1] * physMult) + flatPhysMax;
      physDamage = [calcMin, calcMax];
      aps        = parseFloat((baseStats.aps * (1 + apsIncrease / 100)).toFixed(2));
      critChance = parseFloat((baseStats.crit * (1 + critIncrease / 100)).toFixed(2));

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[pob-parser] Base type fallback for "${baseName}":`,
          { qualMult, physIncrease, apsIncrease, critIncrease,
            flatPhysMin, flatPhysMax, physDamage, aps, critChance },
        );
      }
    }
  }
  // ── Elemental damage a partir de mods (quando não há linha "Elemental Damage:") ──
  // Itens importados do jogo via PoB às vezes exportam os danos elementais como
  // mods explícitos ("Adds X to Y Fire/Cold/Lightning Damage") em vez de uma linha
  // de propriedade calculada. Somamos todos eles para obter o eleDamage total.
  if (!eleDamage) {
    const allModTexts = [
      ...implicits.map((m) => m.text),
      ...explicits.map((m) => m.text),
    ];
    let eleMin = 0;
    let eleMax = 0;
    for (const text of allModTexts) {
      const t = text.toLowerCase();
      // "Adds X to Y Fire/Cold/Lightning/Chaos Damage" (local — on weapon)
      // "Adds X to Y Fire/Cold/Lightning Damage to Attacks" also qualifies
      const fireM = t.match(/adds\s+(\d+)\s+to\s+(\d+)\s+fire\s+damage/);
      if (fireM) { eleMin += parseInt(fireM[1], 10); eleMax += parseInt(fireM[2], 10); }
      const coldM = t.match(/adds\s+(\d+)\s+to\s+(\d+)\s+cold\s+damage/);
      if (coldM) { eleMin += parseInt(coldM[1], 10); eleMax += parseInt(coldM[2], 10); }
      const lightM = t.match(/adds\s+(\d+)\s+to\s+(\d+)\s+lightning\s+damage/);
      if (lightM) { eleMin += parseInt(lightM[1], 10); eleMax += parseInt(lightM[2], 10); }
    }
    if (eleMin > 0 || eleMax > 0) {
      eleDamage = [eleMin, eleMax];
    }
  }

  // Chaos damage a partir de mods quando não há linha "Chaos Damage:"
  if (!chaosDamage) {
    const allModTexts = [
      ...implicits.map((m) => m.text),
      ...explicits.map((m) => m.text),
    ];
    let chaosMin = 0;
    let chaosMax = 0;
    for (const text of allModTexts) {
      const t = text.toLowerCase();
      const chaosM = t.match(/adds\s+(\d+)\s+to\s+(\d+)\s+chaos\s+damage/);
      if (chaosM) { chaosMin += parseInt(chaosM[1], 10); chaosMax += parseInt(chaosM[2], 10); }
    }
    if (chaosMin > 0 || chaosMax > 0) {
      chaosDamage = [chaosMin, chaosMax];
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  // true quando o DPS foi estimado via tabela de base type (não lido do item)
  const isEstimatedDps = !!(
    physDamage &&
    !rawLines.some((l) => /^Physical Damage:/i.test(l))
  );

  return {
    name,
    baseName,
    rarity,
    sockets,
    quality,
    itemLevel,
    armour,
    evasion,
    energyShield,
    physDamage,
    eleDamage,
    chaosDamage,
    critChance,
    aps,
    isEstimatedDps,
    corrupted,
    fractured,
    influences,
    implicits,
    explicits,
  };
}

// --- Skilltree cache ---

interface SkilltreeNode {
  name: string;
  icon?: string;
  isKeystone?: boolean;
  isMastery?: boolean;
  masteryEffects?: Array<{ effect: number; stats: string[] }>;
}

let cachedSkilltree: Record<string, SkilltreeNode> | null = null;

async function getOfficialSkilltree() {
  if (cachedSkilltree) return cachedSkilltree;
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/grindinggear/skilltree-export/master/data.json",
      { headers: { "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)" } },
    );
    if (!res.ok) return {};
    const data = await res.json();
    cachedSkilltree = data.nodes || {};
    return cachedSkilltree!;
  } catch {
    return {};
  }
}

// --- Item icon cache (poe.ninja Standard league — uniques + base types) ---

let itemIconMap: Map<string, string> | null = null;
let iconCacheExpiry = 0;

// Unique types + BaseType covers equipment, flasks, jewels
const ICON_FETCH_TYPES = [
  "UniqueWeapon",
  "UniqueArmour",
  "UniqueAccessory",
  "UniqueFlask",
  "UniqueJewel",
  "BaseType",
];

export async function getItemIconMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (itemIconMap && now < iconCacheExpiry) return itemIconMap;

  const map = new Map<string, string>();
  await Promise.all(
    ICON_FETCH_TYPES.map(async (type) => {
      try {
        const res = await fetch(
          `https://poe.ninja/api/data/itemoverview?league=Standard&type=${type}`,
          { headers: { "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)" } },
        );
        if (!res.ok) return;
        const data = await res.json();
        for (const item of data.lines || []) {
          if (item.name && item.icon) {
            map.set((item.name as string).toLowerCase(), item.icon as string);
          }
        }
      } catch {
        /* ignore icon fetch errors */
      }
    }),
  );

  itemIconMap = map;
  iconCacheExpiry = now + 24 * 60 * 60 * 1000; // 24h TTL
  return map;
}

// --- URL fetch ---

async function fetchPobFromUrl(url: string): Promise<string> {
  url = url.trim();
  try {
    if (url.includes("pobb.in")) {
      if (!url.includes("/pob/")) url = url.replace("pobb.in/", "pobb.in/pob/");
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      return await res.text();
    }
    if (url.includes("pastebin.com")) {
      if (!url.includes("/raw/"))
        url = url.replace("pastebin.com/", "pastebin.com/raw/");
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      return await res.text();
    }
  } catch {
    return "";
  }
  return url;
}

// --- Main exports ---

export async function decodePobCode(pobCode: string): Promise<PobBuildData> {
  if (pobCode.trim().startsWith("http")) {
    const fetched = await fetchPobFromUrl(pobCode.trim());
    if (!fetched)
      throw new Error("Não foi possível baixar o PoB da URL fornecida.");
    pobCode = fetched;
  }

  pobCode = pobCode.trim().replace(/-/g, "+").replace(/_/g, "/");
  const missing = pobCode.length % 4;
  if (missing) pobCode += "=".repeat(4 - missing);

  const xmlBuffer = inflateSync(Buffer.from(pobCode, "base64"));
  return parsePobXml(xmlBuffer.toString("utf-8"));
}

export async function parsePobXml(xmlString: string): Promise<PobBuildData> {
  const doc = new DOMParser().parseFromString(xmlString, "text/xml");

  const result: PobBuildData = {
    BuildInfo: { Class: "", Ascendancy: "", Level: "" },
    Stats: {},
    ItemSets: [],
    SkillSets: [],
    Skills: [],
    TreeDetails: {
      Keystones: [],
      Masteries: [],
      NodesCount: 0,
      Specs: [],
      ActiveSpecIndex: 0,
    },
  };

  // --- 1. BuildInfo + Stats ---
  const buildNode = doc.getElementsByTagName("Build")[0];
  if (buildNode) {
    result.BuildInfo = {
      Class: buildNode.getAttribute("className") || "",
      Ascendancy: buildNode.getAttribute("ascendClassName") || "",
      Level: buildNode.getAttribute("level") || "",
    };

    const statsKeys: Record<string, string> = {
      TotalDPS: "Total DPS",
      TotalEHP: "Effective Hit Pool",
      Life: "Life",
      EnergyShield: "Energy Shield",
      FireResist: "Fire Resist",
      ColdResist: "Cold Resist",
      LightningResist: "Lightning Resist",
      ChaosResist: "Chaos Resist",
      EffectiveMovementSpeedMod: "Movement Speed",
    };

    const statNodes = buildNode.getElementsByTagName("PlayerStat");
    for (let i = 0; i < statNodes.length; i++) {
      const stat = statNodes[i];
      const statName = stat.getAttribute("stat") || "";
      if (statName in statsKeys) {
        const val = parseFloat(stat.getAttribute("value") || "0");
        let formatted: string;
        if (val > 1000) {
          formatted = val.toLocaleString("en-US", { maximumFractionDigits: 0 });
        } else if (statName.endsWith("Resist")) {
          formatted = `${Math.round(val)}%`;
        } else if (statName === "EffectiveMovementSpeedMod") {
          formatted = `${val.toFixed(2)}x`;
        } else {
          formatted = val.toLocaleString("en-US", { maximumFractionDigits: 0 });
        }
        result.Stats[statsKeys[statName]] = formatted;
      }
    }
  }

  // --- 2. Items ---
  const itemsNode = doc.getElementsByTagName("Items")[0];
  const rawItemMap: Record<string, string[]> = {};

  // Fetch icon map upfront — needed by both Items (equipment) and Tree (socketed jewels)
  const iconMap = await getItemIconMap();

  if (itemsNode) {
    const itemNodes = itemsNode.getElementsByTagName("Item");
    for (let i = 0; i < itemNodes.length; i++) {
      const item = itemNodes[i];
      const id = item.getAttribute("id") || "";
      const rawText = item.textContent || "";
      rawItemMap[id] = rawText
        .trim()
        .split("\n")
        .map((l: string) => l.trim())
        .filter(Boolean);
    }

    const itemSetNodes = itemsNode.getElementsByTagName("ItemSet");
    for (let i = 0; i < itemSetNodes.length; i++) {
      const itemSet = itemSetNodes[i];
      const iset: PobItemSet = {
        title: itemSet.getAttribute("title") || "Default",
        items: [],
      };
      const slotNodes = itemSet.getElementsByTagName("Slot");
      for (let j = 0; j < slotNodes.length; j++) {
        const slot = slotNodes[j];
        const idRef = slot.getAttribute("itemId") || "";
        if (idRef && rawItemMap[idRef]) {
          // ── Weapon raw-lines debug ────────────────────────────────────────
          if (process.env.NODE_ENV !== "production") {
            const slotName = slot.getAttribute("name") || "";
            if (slotName === "Weapon 1" || slotName === "Weapon 2") {
              console.log(
                `[pob-parser] RAW LINES for "${slotName}" (id=${idRef}):`,
                rawItemMap[idRef],
              );
            }
          }
          // ─────────────────────────────────────────────────────────────────
          const parsed = parseItemText(rawItemMap[idRef]);
          // Unique: look up by item name; others: look up by base type name.
          // Para flasks, garantimos que o base type usado é um dos 48 conhecidos.
          const detectedFlaskBaseLower = detectFlaskBaseTypeFromName(
            parsed.baseName || parsed.name,
          );

          const lookupCandidates: string[] = [];
          if (parsed.rarity === "Unique") {
            lookupCandidates.push(parsed.name.toLowerCase());
          } else if (detectedFlaskBaseLower) {
            lookupCandidates.push(
              toTitleCaseBaseType(detectedFlaskBaseLower).toLowerCase(),
            );
          } else {
            lookupCandidates.push(parsed.baseName.toLowerCase());
          }

          // Último fallback: para casos em que o item vem “compacto” e não temos baseName
          // correto, tentamos detectar via name diretamente.
          const detectedFromNameLower = detectFlaskBaseTypeFromName(
            parsed.name,
          );
          if (detectedFromNameLower) {
            const key = toTitleCaseBaseType(
              detectedFromNameLower,
            ).toLowerCase();
            if (!lookupCandidates.includes(key)) lookupCandidates.push(key);
          }

          let iconUrl: string | undefined;
          for (const key of lookupCandidates) {
            iconUrl = iconMap.get(key);
            if (iconUrl) break;
          }

          iset.items.push({
            ...parsed,
            slot: slot.getAttribute("name") || "",
            iconUrl,
          });
        }
      }
      result.ItemSets.push(iset);
    }
  }

  // --- 3. Skills ---
  const skillsNode = doc.getElementsByTagName("Skills")[0];
  if (skillsNode) {
    const activeSkillSetId = skillsNode.getAttribute("activeSkillSet") || "1";
    const skillSetNodes = skillsNode.getElementsByTagName("SkillSet");
    const parseSkillElementsToGroups = (
      skillElements: Element[],
    ): PobSkillGroup[] => {
      const groups: PobSkillGroup[] = [];
      for (const skill of skillElements) {
        if (
          skill.getAttribute("source") ||
          skill.getAttribute("enabled") === "false"
        )
          continue;

        const slot =
          (skill as Element).getAttribute("slot") || "Unspecified Slot";
        const gems: PobGem[] = [];

        const gemNodes = (skill as Element).getElementsByTagName("Gem");
        for (let gi = 0; gi < gemNodes.length; gi++) {
          const gem = gemNodes[gi];
          const gemName = gem.getAttribute("nameSpec") || "";
          if (!gemName) continue;
          const skillId = gem.getAttribute("skillId") || "";
          const isSupport =
            gemName.includes("Support") ||
            skillId.startsWith("Support") ||
            skillId.endsWith("Support");
          gems.push({
            name: gemName,
            level: parseInt(gem.getAttribute("level") || "1", 10),
            quality: parseInt(gem.getAttribute("quality") || "0", 10),
            is_support: isSupport,
          });
        }

        if (gems.length > 0) groups.push({ slot, gems });
      }
      return groups;
    };

    if (skillSetNodes.length > 0) {
      // Parseia TODOS os skill sets para permitir trocar junto com o loadout.
      for (let i = 0; i < skillSetNodes.length; i++) {
        const set = skillSetNodes[i];
        const id = set.getAttribute("id") || "";
        const title = set.getAttribute("title") || `Skill Set ${id || "?"}`;
        const skills = parseSkillElementsToGroups(
          Array.from(set.getElementsByTagName("Skill")) as Element[],
        );
        result.SkillSets.push({
          id: id || String(result.SkillSets.length + 1),
          title,
          skills,
        });
      }
    } else {
      // Sem <SkillSet>: skills ficam diretamente sob <Skills>.
      const skills = parseSkillElementsToGroups(
        Array.from(skillsNode.getElementsByTagName("Skill")) as Element[],
      );
      result.SkillSets.push({ id: activeSkillSetId, title: "Default", skills });
    }

    // Mantém compatibilidade: `Skills` continua sendo o set ativo (ou o primeiro).
    const activeSet =
      result.SkillSets.find((s) => s.id === activeSkillSetId) ??
      result.SkillSets[0];
    result.Skills = activeSet?.skills ?? [];
  }

  // --- 4. Tree / Keystones / Masteries / Jewels ---
  const treeNode = doc.getElementsByTagName("Tree")[0];
  if (treeNode) {
    const activeSpecAttr = parseInt(
      treeNode.getAttribute("activeSpec") || "1",
      10,
    );
    const activeSpecIndex = Math.max(0, activeSpecAttr - 1);

    // First pass: collect raw data from each Spec element
    interface RawSpecData {
      title: string;
      nodes: number[];
      rawMasteryEffects: number[]; // just effectIds, Lua format {id1,id2,...}
      rawSockets: Array<{ nodeId: number; itemId: string }>;
    }

    const rawSpecsData: RawSpecData[] = [];
    const specElements = treeNode.getElementsByTagName("Spec");
    for (let i = 0; i < specElements.length; i++) {
      const spec = specElements[i];
      const nodesStr = spec.getAttribute("nodes") || "";
      const nodes = nodesStr
        .split(",")
        .filter(Boolean)
        .map((id) => parseInt(id, 10))
        .filter((n) => !isNaN(n));
      const title =
        spec.getAttribute("title") ||
        (specElements.length === 1 ? "Passive Tree" : `Tree ${i + 1}`);

      // Mastery effects: stored as Lua set attribute {effectId1,effectId2,...}
      const rawMasteryEffects: number[] = [];
      const masteryEffectsStr = spec.getAttribute("masteryEffects") || "";
      if (masteryEffectsStr && masteryEffectsStr !== "{}") {
        const inner = masteryEffectsStr.replace(/[{}]/g, "").trim();
        if (inner) {
          for (const part of inner.split(",")) {
            const effectId = parseInt(part.trim(), 10);
            if (!isNaN(effectId) && effectId > 0)
              rawMasteryEffects.push(effectId);
          }
        }
      }

      // Socketed jewels: which items are socketed in jewel sockets of this tree
      const rawSockets: Array<{ nodeId: number; itemId: string }> = [];
      const sockElements = spec.getElementsByTagName("Socket");
      for (let j = 0; j < sockElements.length; j++) {
        const sock = sockElements[j];
        const nodeId = parseInt(sock.getAttribute("nodeId") || "0", 10);
        const itemId = sock.getAttribute("itemId") || "";
        if (nodeId && itemId) rawSockets.push({ nodeId, itemId });
      }

      rawSpecsData.push({ title, nodes, rawMasteryEffects, rawSockets });
    }

    // Second pass: resolve names/effects using skilltree data (fetched once, cached)
    const skilltree = await getOfficialSkilltree();
    const hasTree = Object.keys(skilltree).length > 0;

    const specs: PobTreeSpec[] = rawSpecsData.map((raw) => {
      const keystones: string[] = [];
      const masteries: PobMasterySelection[] = [];
      const socketedJewels: PobSocketedJewel[] = [];

      if (hasTree) {
        for (const nid of raw.nodes) {
          const nd = skilltree[String(nid)];
          if (nd?.isKeystone) {
            const iconUrl = nd.icon
              ? `https://web.poecdn.com/image/${nd.icon}.png`
              : undefined;
            keystones.push({ name: nd.name, iconUrl });
          }
        }
        for (const effectId of raw.rawMasteryEffects) {
          let masteryName = `Mastery ${effectId}`;
          let stats: string[] = [];
          let iconUrl: string | undefined;
          for (const node of Object.values(skilltree)) {
            if (!node.isMastery || !node.masteryEffects) continue;
            const effect = node.masteryEffects.find(
              (e) => e.effect === effectId,
            );
            if (effect) {
              masteryName = node.name;
              stats = effect.stats;
              iconUrl = node.icon
                ? `https://web.poecdn.com/image/${node.icon}.png`
                : undefined;
              break;
            }
          }
          masteries.push({ masteryName, iconUrl, stats });
        }
      }

      for (const { nodeId, itemId } of raw.rawSockets) {
        const itemLines = rawItemMap[String(itemId)];
        if (!itemLines?.length) continue;
        const parsed = parseItemText(itemLines);
        if (!parsed.name) continue;
        const lowerName = (
          parsed.name +
          " " +
          (parsed.baseName ?? "")
        ).toLowerCase();
        const isCluster = lowerName.includes("cluster jewel");
        const implicits = parsed.implicits.map((m) => m.text);
        const explicits = parsed.explicits.map((m) => m.text);
        // Para jewels únicos (Watcher's Eye, Forbidden Flame, etc.) busca a URL do poe.ninja CDN.
        // Jewels comuns (Cobalt, Crimson, etc.) ficam com imagem local via GEM_JEWEL_IMAGE_MAP no cliente.
        const iconUrl =
          parsed.rarity === "Unique"
            ? iconMap.get(parsed.name.toLowerCase())
            : undefined;
        const jewelBaseName =
          parsed.baseName !== parsed.name ? parsed.baseName : undefined;
        socketedJewels.push({
          nodeId,
          name: parsed.name,
          baseName: jewelBaseName,
          rarity: parsed.rarity,
          isCluster,
          implicits,
          explicits,
          iconUrl,
        });
      }

      return {
        title: raw.title,
        nodes: raw.nodes,
        keystones,
        masteries,
        socketedJewels,
      };
    });

    result.TreeDetails.Specs = specs;
    result.TreeDetails.ActiveSpecIndex = Math.min(
      activeSpecIndex,
      Math.max(0, specs.length - 1),
    );

    const activeSpec = specs[result.TreeDetails.ActiveSpecIndex];
    if (activeSpec) {
      result.TreeDetails.NodesCount = activeSpec.nodes.length;
      result.TreeDetails.Keystones = activeSpec.keystones;
      result.TreeDetails.Masteries = activeSpec.masteries;
    }
  }

  return result;
}