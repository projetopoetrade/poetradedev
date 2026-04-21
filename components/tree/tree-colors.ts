import type { PositionedNode } from "./tree-types";

/**
 * Classifies each passive into a colour bucket based on the stats it grants,
 * matching the in-game / pobb.in colour language:
 *
 *   red    — Strength, Life, Physical damage
 *   green  — Dexterity, Evasion, Attack/movement speed
 *   blue   — Intelligence, Mana, generic Spell damage
 *   cyan   — Cold damage, Energy Shield, Cold resist
 *   orange — Fire damage / Fire resist
 *   yellow — Lightning damage / Lightning resist
 *   purple — Chaos damage / Chaos resist / Curse
 *   pink   — Minion / Totem / Trap / Mine utility
 *   tan    — Armour / Block / Defensive notables that don't fit above
 *   gray   — no stat (jewel sockets, masteries, etc.)
 *
 * The classifier is intentionally simple — we pick the first stat that
 * matches a pattern, scoring is overkill for tree tooltips. A node with
 * mixed stats takes the colour of the dominant keyword in order.
 */

export type TreeColor =
  | "red"
  | "green"
  | "blue"
  | "cyan"
  | "orange"
  | "yellow"
  | "purple"
  | "pink"
  | "tan"
  | "gray"
  | "gold";

const COLOR_HEX: Record<TreeColor, string> = {
  red: "#e55555",
  green: "#65d370",
  blue: "#6aa7ff",
  cyan: "#57d4d6",
  orange: "#f08a2e",
  yellow: "#ead349",
  purple: "#c268e8",
  pink: "#e874b3",
  tan: "#c9b38a",
  gray: "#7e7e82",
  gold: "#f5c648",
};

const ACTIVE_HIGHLIGHT = "#f8d56b"; // warm yellow for allocated nodes

interface StatRule {
  color: TreeColor;
  patterns: RegExp[];
}

// Rules evaluated in order — first match wins. Specific terms go before
// generic ones so "Cold Damage" isn't captured by a bare "Damage" rule.
const RULES: StatRule[] = [
  { color: "cyan", patterns: [/cold\s+(damage|resist|penetration)/i, /energy\s+shield/i, /freeze/i] },
  { color: "orange", patterns: [/fire\s+(damage|resist|penetration)/i, /ignite/i, /burning/i] },
  { color: "yellow", patterns: [/lightning\s+(damage|resist|penetration)/i, /shock/i] },
  { color: "purple", patterns: [/chaos\s+(damage|resist)/i, /curse/i, /poison/i, /wither/i] },
  { color: "pink", patterns: [/minion/i, /totem/i, /trap/i, /mine\b/i, /ballista/i, /brand/i] },
  { color: "red", patterns: [/\bto\s+strength\b/i, /strength\b/i, /maximum\s+life/i, /life\s+regen/i, /physical\s+damage/i, /bleed/i, /warcry/i] },
  { color: "green", patterns: [/\bto\s+dexterity\b/i, /dexterity\b/i, /evasion/i, /attack\s+speed/i, /movement\s+speed/i, /projectile/i, /dodge/i] },
  { color: "blue", patterns: [/\bto\s+intelligence\b/i, /intelligence\b/i, /maximum\s+mana/i, /spell\s+damage/i, /cast\s+speed/i, /critical\s+strike/i] },
  { color: "tan", patterns: [/armour/i, /\bblock\b/i, /resistance/i, /reduced\s+damage\s+taken/i, /fortify/i, /guard/i] },
];

export function classifyColor(node: PositionedNode): TreeColor {
  // Jewel sockets / masteries / empty stat nodes → neutral gray
  if (node.kind === "jewel_socket" || node.kind === "mastery") return "gray";
  if (node.kind === "class_start") return "gray";
  if (!node.stats.length) return "gray";
  // Class-start attribute grants take the attribute colour
  const granted = node.raw;
  if (granted.grantedStrength) return "red";
  if (granted.grantedDexterity) return "green";
  if (granted.grantedIntelligence) return "blue";

  const hay = node.stats.join(" ");
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(hay))) return rule.color;
  }
  // Notables without a clear theme fall back to tan so they pop over smalls
  if (node.kind === "notable") return "tan";
  return "gray";
}

export function colorHex(color: TreeColor): string {
  return COLOR_HEX[color];
}

/**
 * Colour a node dot should take.
 *
 *  - allocated → warm gold (highlight path)
 *  - otherwise → muted gray (poe.ninja / pobb.in style: only the allocated
 *    path gets colour, so the eye follows the build). Colour-by-stat is
 *    still exposed via `classifyColor()` for filter UIs or future modes.
 */
const INACTIVE_FILL = "#4a4640";

export function nodeFill(node: PositionedNode, allocated: boolean): string {
  if (allocated) return ACTIVE_HIGHLIGHT;
  // jewel sockets keep a neutral lighter gray so they stand out as slots
  if (node.kind === "jewel_socket") return "#6c6864";
  return INACTIVE_FILL;
}

export const ACTIVE_COLOR = ACTIVE_HIGHLIGHT;
