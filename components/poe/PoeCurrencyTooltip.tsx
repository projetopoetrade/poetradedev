import Image from "next/image";
import { POE_COLORS } from "@/components/poe/poe-colors";

/**
 * Minimal tooltip variant for currency-class items, mirroring poe.ninja:
 *
 *   ┌─ Name (tan, dark header) ──┐
 *   │ Effect headline (blue)     │
 *   │ Use instructions (grey)    │
 *   │ ─── separator ───          │
 *   │      [centered icon]       │
 *   └────────────────────────────┘
 *
 * No price block — live prices belong inline in prose via the
 * `{{price:Item|chaos}}` / `{{price:Item|divine}}` placeholders.
 */
export interface CurrencyTooltipProps {
  name: string;
  /** Engine clipboard rawText. Header / Stack Size / Requirements stripped. */
  description: string;
  iconUrl: string | null;
}

export function CurrencyTooltip({
  name,
  description,
  iconUrl,
}: CurrencyTooltipProps) {
  const lines = extractDescriptionLines(description, name);
  const nameColor = `hsl(${POE_COLORS.rarity.Currency})`;
  // Headline = first line of the in-game blurb (the "effect"). Renders
  // in implicit-mod blue so it pops the same way it does in-game.
  const headline = lines[0];
  const detail = lines.slice(1);
  const headlineColor = `hsl(${POE_COLORS.mod.normal})`;

  return (
    <div className="not-prose w-[min(360px,90vw)] overflow-hidden rounded shadow-xl bg-black/85 font-fontin text-[13px] leading-snug">
      {/* Header */}
      <div
        className="px-4 py-1.5 text-center border-b border-slate-700/60"
        style={{
          background:
            "linear-gradient(to bottom, rgba(60,40,20,0.9), rgba(20,12,6,0.95))",
        }}
      >
        <p
          className="font-semibold tracking-wide text-[15px]"
          style={{ color: nameColor }}
        >
          {name}
        </p>
      </div>

      {/* Body */}
      <div className="px-4 py-3 text-center space-y-2">
        {headline && (
          <p
            className="leading-snug font-medium"
            style={{ color: headlineColor }}
          >
            {headline}
          </p>
        )}
        {detail.length > 0 && (
          <div className="space-y-1 text-slate-300">
            {detail.map((line, i) => (
              <p key={i} className="leading-snug">{line}</p>
            ))}
          </div>
        )}
        {iconUrl && (
          <>
            <div className="flex items-center justify-center pt-1">
              <div className="flex-1 h-px bg-slate-600/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mx-2" />
              <div className="flex-1 h-px bg-slate-600/50" />
            </div>
            <div className="flex justify-center pt-1">
              <div className="relative w-[52px] h-[52px]">
                <Image
                  src={iconUrl}
                  alt={name}
                  fill
                  sizes="52px"
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
// Helpers
// ---------------------------------------------------------------------------

function extractDescriptionLines(rawText: string, itemName: string): string[] {
  if (!rawText) return [];
  const sections = rawText.split(/\n-{3,}\n/);
  const out: string[] = [];
  const nameLower = itemName.trim().toLowerCase();
  for (const section of sections) {
    for (const line of section.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith("Rarity:")) continue;
      if (t.startsWith("Stack Size:")) continue;
      if (t.startsWith("Requirements:")) continue;
      if (/^(Level|Str|Dex|Int):\s*\d+/i.test(t)) continue;
      // Drop lines that just repeat the item name (header echo).
      if (t.toLowerCase() === nameLower) continue;
      out.push(t);
    }
  }
  return out.filter((l, i) => l !== out[i - 1]);
}
