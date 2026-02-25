import type { PobItem, ParsedMod } from "@/lib/pob-parser";

/**
 * Parser para o formato de texto bruto de itens do Path of Exile.
 * Aceita o clipboard gerado pelo jogo ao pressionar Ctrl+C sobre um item.
 *
 * Formato esperado:
 *   Rarity: <rarity>
 *   <name>
 *   <base type>          (somente para Unique/Rare)
 *   --------
 *   <seções de propriedades e mods separadas por -------->
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROPERTY_PATTERN =
  /^(Item Level|Quality|Sockets|Requirements|Level|Str|Dex|Int|Armour|Evasion Rating|Energy Shield|Ward|Block Chance|Critical Strike Chance|Attacks per Second|Physical Damage|Elemental Damage|Fire Damage|Cold Damage|Lightning Damage|Chaos Damage|Weapon Range|Stack Size|Map Tier|Item Quantity|Item Rarity|Monster Pack Size|Flask Charges|Duration|Mana Recovered|Life Recovered|Charges per use|Capacity|Grants)[\s:]/i;

const FOOTER_KEYWORDS = new Set([
  "Corrupted",
  "Synthesised Item",
  "Fractured Item",
  "Mirrored",
  "Split",
  "Unidentified",
  "Veiled",
]);

const INFLUENCE_MAP: Record<string, string> = {
  "Shaper Item": "shaper",
  "Elder Item": "elder",
  "Crusader Item": "crusader",
  "Redeemer Item": "redeemer",
  "Hunter Item": "hunter",
  "Warlord Item": "warlord",
  "Searing Exarch Item": "searing",
  "Eater of Worlds Item": "eater",
};

function parseMod(text: string): { mod: ParsedMod; wasImplicit: boolean } {
  const wasImplicit = /\(implicit\)/i.test(text);
  const isEnchant = /\(enchant\)/i.test(text);
  const isCrafted = /\(crafted\)/i.test(text);
  const isFractured = /\(fractured\)/i.test(text);
  const isScourge = /\(scourge\)/i.test(text);

  const cleanText = text
    .replace(/\s*\((implicit|enchant|crafted|fractured|scourge)\)\s*$/i, "")
    .trim();

  let type: ParsedMod["type"] = "normal";
  if (isEnchant) type = "enchant";
  else if (isCrafted) type = "crafted";
  else if (isFractured) type = "fractured";
  else if (isScourge) type = "scourge";

  return { mod: { text: cleanText, type }, wasImplicit };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseRawPoeItem(raw: string): PobItem | null {
  if (!raw?.trim()) return null;

  // Normalize line endings and split into sections
  const sections = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/^--------\s*$/m)
    .map((s) =>
      s
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .filter((s) => s.length > 0);

  if (!sections[0]?.length) return null;

  // ── Parse header ────────────────────────────────────────────────────────────
  const header = sections[0];
  const rarityLine = header.find((l) => l.startsWith("Rarity:"));
  if (!rarityLine) return null;

  const rarity = rarityLine.replace("Rarity:", "").trim();
  const nonRarityLines = header.filter((l) => !l.startsWith("Rarity:"));

  let name = "";
  let baseName = "";

  if (rarity === "Unique" || rarity === "Rare") {
    name = nonRarityLines[0] ?? "";
    baseName = nonRarityLines[1] ?? name;
  } else {
    // Magic or Normal: single name line (no separate base)
    name = nonRarityLines[0] ?? "";
    baseName = name;
  }

  // ── Scan remaining sections ──────────────────────────────────────────────────
  let itemLevel: number | undefined;
  let quality: number | undefined;
  let sockets: string | undefined;
  let corrupted = false;
  let fractured = false;
  const influences: string[] = [];
  const modSections: string[][] = [];

  for (const section of sections.slice(1)) {
    // Detect footer/influence section
    const footerLines = section.filter(
      (l) => FOOTER_KEYWORDS.has(l) || INFLUENCE_MAP[l],
    );

    if (footerLines.length > 0) {
      if (section.includes("Corrupted")) corrupted = true;
      if (section.includes("Fractured Item")) fractured = true;
      for (const l of section) {
        if (INFLUENCE_MAP[l]) influences.push(INFLUENCE_MAP[l]);
      }
      continue;
    }

    // Separate property lines from mod lines within the section
    const modLines: string[] = [];
    for (const line of section) {
      if (line.startsWith("Item Level:")) {
        const n = parseInt(line.replace("Item Level:", "").trim());
        if (!isNaN(n)) itemLevel = n;
      } else if (line.startsWith("Quality:")) {
        const m = line.match(/\+?(\d+)%/);
        if (m) quality = parseInt(m[1]);
      } else if (line.startsWith("Sockets:")) {
        sockets = line.replace("Sockets:", "").trim();
      } else if (!PROPERTY_PATTERN.test(line)) {
        modLines.push(line);
      }
      // Lines matching PROPERTY_PATTERN (Requirements, Armour, etc.) are ignored
    }

    if (modLines.length > 0) {
      modSections.push(modLines);
    }
  }

  // ── Classify mod sections into implicits / explicits ─────────────────────────
  //
  // Rules:
  //  - 0 mod sections → no mods
  //  - 1 mod section  → lines tagged "(implicit)" go to implicits, rest to explicits
  //  - 2+ mod sections → first section = implicits, the rest = explicits
  //
  const implicits: ParsedMod[] = [];
  const explicits: ParsedMod[] = [];

  if (modSections.length === 1) {
    for (const line of modSections[0]) {
      const { mod, wasImplicit } = parseMod(line);
      if (wasImplicit || /\(enchant\)/i.test(line)) {
        implicits.push(mod);
      } else {
        explicits.push(mod);
      }
    }
  } else if (modSections.length >= 2) {
    for (const line of modSections[0]) {
      implicits.push(parseMod(line).mod);
    }
    for (const section of modSections.slice(1)) {
      for (const line of section) {
        explicits.push(parseMod(line).mod);
      }
    }
  }

  return {
    slot: "",
    name,
    baseName,
    rarity,
    itemLevel,
    quality,
    sockets,
    corrupted,
    fractured,
    influences: influences.length > 0 ? influences : undefined,
    implicits,
    explicits,
  };
}
