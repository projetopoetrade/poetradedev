import Image from "next/image";

/**
 * Tooltip variant for skill gems, mirroring the in-game layout:
 *
 *   ┌─ Name (cyan / green / red by attr) ──┐
 *   │ TAGS, IN, SMALL, CAPS                │
 *   │ Level: 20                            │
 *   │ Cost: 41 Mana                        │
 *   │ Cast Time: 0.80 sec                  │
 *   │ ...                                  │
 *   │ Requires Level 70, Int 155            │
 *   │ Description text in light blue       │
 *   │ Stat lines in light blue             │
 *   │ ─── separator ───                    │
 *   │      [centered gem icon]             │
 *   └──────────────────────────────────────┘
 *
 * Cores baseadas no in-game:
 *   Strength → red, Dexterity → green, Intelligence → cyan
 *   Awakened/Vaal/Support → distinct shades
 */
export interface GemTooltipProps {
  name: string;
  /** Engine clipboard rawText. Parsed into sections by the helper below. */
  rawText: string;
  iconUrl: string | null;
  /** Optional override — when present overrides the inferred attribute color. */
  primaryAttribute?: "Strength" | "Dexterity" | "Intelligence" | null;
  /** True for awakened gems → adds the unique gold tint. */
  isAwakened?: boolean;
  /** True for vaal gems → green-tinted header. */
  isVaal?: boolean;
}

const ATTR_HEADER_COLOR: Record<string, string> = {
  Strength: "#e87474",
  Dexterity: "#7ce074",
  Intelligence: "#7ec3ff",
};

const DEFAULT_HEADER_COLOR = "#7ec3ff";
const TAG_COLOR = "#c8a35a";
const PROP_LABEL_COLOR = "#9c8559";
const VALUE_COLOR = "#ffffff";
const STAT_COLOR = "#7ec3ff";
const REQUIRED_COLOR = "#9c8559";

export function GemTooltip({
  name,
  rawText,
  iconUrl,
  primaryAttribute,
  isAwakened,
  isVaal,
}: GemTooltipProps) {
  const parsed = parseGemRaw(rawText);
  const headerColor = isAwakened
    ? "#cf996a"
    : isVaal
      ? "#7ce074"
      : (primaryAttribute && ATTR_HEADER_COLOR[primaryAttribute]) ||
        DEFAULT_HEADER_COLOR;

  return (
    <div className="not-prose w-[min(420px,92vw)] overflow-hidden rounded shadow-xl bg-black/85 font-fontin text-[13px] leading-snug">
      {/* Header */}
      <div
        className="px-4 py-1.5 text-center border-b border-slate-700/60"
        style={{
          // Neutral dark gradient — earlier blue tint clashed with the
          // attribute-coloured name. Plain dark slate lets the header
          // text stand out cleanly regardless of the gem's primary attr.
          background:
            "linear-gradient(to bottom, rgba(28,30,38,0.95), rgba(10,12,18,0.95))",
        }}
      >
        <p
          className="font-semibold tracking-wide text-[15px]"
          style={{ color: headerColor }}
        >
          {name}
        </p>
      </div>

      <div className="px-4 py-3 text-center space-y-2">
        {parsed.tags && (
          <p
            className="uppercase tracking-wider text-[11px]"
            style={{ color: TAG_COLOR }}
          >
            {parsed.tags}
          </p>
        )}

        {parsed.properties.length > 0 && (
          <div className="space-y-0.5 pt-1">
            {parsed.properties.map((line, i) => {
              const m = line.match(/^([^:]+):\s*(.*)$/);
              if (!m) {
                return (
                  <p key={i} style={{ color: VALUE_COLOR }}>
                    {line}
                  </p>
                );
              }
              return (
                <p key={i}>
                  <span style={{ color: PROP_LABEL_COLOR }}>{m[1]}: </span>
                  <span style={{ color: VALUE_COLOR }}>{m[2]}</span>
                </p>
              );
            })}
          </div>
        )}

        {parsed.requirements && (
          <p
            className="pt-1"
            style={{ color: REQUIRED_COLOR }}
          >
            {parsed.requirements}
          </p>
        )}

        {parsed.description.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-700/40">
            {parsed.description.map((line, i) => (
              <p key={i} className="leading-snug text-slate-300">
                {line}
              </p>
            ))}
          </div>
        )}

        {parsed.statLines.length > 0 && (
          <div className="space-y-0.5 pt-2 border-t border-slate-700/40">
            {parsed.statLines.map((line, i) => (
              <p key={i} style={{ color: STAT_COLOR }} className="leading-snug">
                {line}
              </p>
            ))}
          </div>
        )}

        {parsed.qualityBonus.length > 0 && (
          <div className="pt-2 border-t border-slate-700/40 space-y-1">
            <p
              className="font-semibold tracking-wide text-[12px]"
              style={{ color: PROP_LABEL_COLOR }}
            >
              Additional Effects From Quality:
            </p>
            {parsed.qualityBonus.map((line, i) => (
              <p
                key={i}
                style={{ color: STAT_COLOR }}
                className="leading-snug"
              >
                {line}
              </p>
            ))}
          </div>
        )}

        {parsed.footerNote.length > 0 && (
          <div className="pt-2 italic text-slate-500 text-[12px] space-y-0.5">
            {parsed.footerNote.map((line, i) => (
              <p key={i} className="leading-snug">{line}</p>
            ))}
          </div>
        )}

        {parsed.statusFlags.length > 0 && (
          <div className="pt-2 space-y-0.5">
            {parsed.statusFlags.map((flag, i) => (
              <p
                key={i}
                className="font-semibold tracking-wide leading-snug"
                style={{ color: STATUS_RED }}
              >
                {flag}
              </p>
            ))}
          </div>
        )}

        {iconUrl && (
          <>
            <div className="flex items-center justify-center pt-2">
              <div className="flex-1 h-px bg-slate-600/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mx-2" />
              <div className="flex-1 h-px bg-slate-600/50" />
            </div>
            <div className="flex justify-center pt-1">
              <div className="relative w-[56px] h-[56px]">
                <Image
                  src={iconUrl}
                  alt={name}
                  fill
                  sizes="56px"
                  unoptimized
                  className="object-contain"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Raw parser — extracts the gem-shaped sections out of the engine rawText
// ---------------------------------------------------------------------------

interface ParsedGem {
  tags: string | null;
  properties: string[];
  requirements: string | null;
  statLines: string[];
  qualityBonus: string[];
  description: string[];
  /** Footer block "Place into an item socket of the right colour..." */
  footerNote: string[];
  /** Single-word status flags rendered red right before the icon. */
  statusFlags: string[];
}

const QUALITY_HEADER = 'Additional Effects From Quality:';
const SOCKET_FOOTER_PREFIX = 'Place into an item socket';
const STATUS_FLAGS = new Set(['Corrupted', 'Mirrored', 'Replica', 'Split']);
const STATUS_RED = '#d92020';

const PROPERTY_KEYS = new Set([
  "level",
  "quality",
  "mana cost",
  "mana reserved",
  "life cost",
  "cast time",
  "attack time",
  "critical strike chance",
  "effectiveness of added damage",
  "damage multiplier",
  "radius",
  "duration",
  "cooldown time",
]);

function parseGemRaw(rawText: string): ParsedGem {
  const out: ParsedGem = {
    tags: null,
    properties: [],
    requirements: null,
    statLines: [],
    qualityBonus: [],
    description: [],
    footerNote: [],
    statusFlags: [],
  };
  if (!rawText) return out;

  const sections = rawText.split(/\n-{3,}\n/);
  // sections[0] = header (Rarity + name) — skip
  for (let i = 1; i < sections.length; i++) {
    const lines = sections[i]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    // Single-word status flags ("Corrupted", "Mirrored", etc) — engine puts
    // these in their own section at the very end. Render in red.
    if (lines.every((l) => STATUS_FLAGS.has(l))) {
      out.statusFlags.push(...lines);
      continue;
    }

    // Quality bonus block: starts with the engine's exact header line.
    if (lines[0] === QUALITY_HEADER) {
      out.qualityBonus.push(...lines.slice(1));
      continue;
    }

    // Standard socket-gem footer: hardcoded by the engine for any gem.
    if (lines[0].startsWith(SOCKET_FOOTER_PREFIX)) {
      out.footerNote.push(...lines);
      continue;
    }

    // Tag section: a single line of comma-separated CamelCase tokens,
    // typically like "Spell, AoE, Fire, Duration". Strict check so
    // descriptions ("Creates a magical brand which can attach..." — also
    // a single line with commas) don't get misclassified as tags.
    if (
      lines.length === 1 &&
      lines[0].includes(",") &&
      !lines[0].endsWith(".") &&
      lines[0]
        .split(",")
        .every((part) => /^[A-Z][A-Za-z0-9]*$/.test(part.trim()))
    ) {
      out.tags = lines[0];
      continue;
    }

    // Requirements block: starts with "Requirements:" header, followed by lines
    if (lines[0] === "Requirements:") {
      const reqs: string[] = [];
      if (lines.length > 1) {
        for (const l of lines.slice(1)) {
          const m = l.match(/^(\w+):\s*(.+)$/);
          if (m) reqs.push(`${m[2]} ${m[1]}`);
        }
      }
      out.requirements =
        reqs.length > 0 ? `Requires ${reqs.join(", ")}` : "Requirements:";
      continue;
    }

    // Property section: every line matches `Label: value` and the label
    // is one of the known gem properties.
    const isPropSection =
      lines.length > 0 &&
      lines.every((l) => {
        const m = l.match(/^([^:]+):/);
        return m && PROPERTY_KEYS.has(m[1].trim().toLowerCase());
      });
    if (isPropSection) {
      out.properties.push(...lines);
      continue;
    }

    // Description vs stat lines: simple heuristic — lines without a leading
    // number tend to be description prose; the rest is in-engine stat text.
    // The engine ordering is: skill stats first, then description last.
    const looksLikeStats = lines.some((l) =>
      /^(Deals|Adds|\d|\+|-|Causes|Has|Increases|Reduces|Activates|Recovers)/i.test(l),
    );
    if (looksLikeStats && out.statLines.length === 0) {
      out.statLines.push(...lines);
    } else {
      out.description.push(...lines);
    }
  }

  return out;
}
