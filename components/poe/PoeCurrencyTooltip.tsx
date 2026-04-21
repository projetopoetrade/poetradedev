import Image from "next/image";
import { POE_COLORS } from "@/components/poe/poe-colors";

/**
 * Tooltip variant for items where the rare-item stat layout doesn't apply
 * (currency, fragments, scarabs reduced to "right click to use" prose).
 *
 * Layout:
 *   ┌─ Name (header) ──────────┐
 *   │ Description text         │
 *   │      [centered icon]     │
 *   │ price · listings (optional)
 *   └──────────────────────────┘
 *
 * Inspired by maxroll.gg's currency tooltip — header reads as the item
 * name, body carries the in-game blurb, footer shows live market data.
 */
export interface CurrencyTooltipProps {
  name: string;
  /** Raw clipboard rawText. Sections after the header become description. */
  description: string;
  iconUrl: string | null;
  priceInfo?: {
    chaosValue: number;
    divineValue: number;
    listingCount: number | null;
  } | null;
}

export function CurrencyTooltip({
  name,
  description,
  iconUrl,
  priceInfo,
}: CurrencyTooltipProps) {
  const lines = extractDescriptionLines(description);
  const showPrice = priceInfo && (priceInfo.chaosValue > 0 || priceInfo.divineValue > 0);
  const nameColor = `hsl(${POE_COLORS.rarity.Currency})`;

  return (
    <div className="not-prose w-[min(360px,90vw)] overflow-hidden rounded shadow-xl bg-black/85 font-fontin text-[13px] leading-snug">
      {/* Header */}
      <div
        className="px-4 py-1.5 text-center border-b border-slate-700/60"
        style={{
          background: "linear-gradient(to bottom, rgba(60,40,20,0.85), rgba(20,12,6,0.95))",
        }}
      >
        <p
          className="font-semibold tracking-wide text-[15px]"
          style={{ color: nameColor }}
        >
          {name}
        </p>
      </div>

      {/* Body — description + centered icon */}
      <div className="px-4 py-3 flex flex-col items-center gap-3 text-center">
        {lines.length > 0 && (
          <div className="space-y-1 text-slate-300">
            {lines.map((line, i) => (
              <p key={i} className="leading-snug">{line}</p>
            ))}
          </div>
        )}
        {iconUrl && (
          <div className="relative w-[48px] h-[48px] mt-1">
            <Image
              src={iconUrl}
              alt={name}
              fill
              sizes="48px"
              unoptimized
              className="object-contain"
            />
          </div>
        )}
      </div>

      {/* Footer — live price */}
      {showPrice && (
        <div className="px-4 py-2 border-t border-slate-700/60 bg-black/40 flex items-center justify-center gap-3 text-[12px] text-slate-300">
          {priceInfo!.divineValue >= 1 && (
            <span>
              <span className="text-amber-300 font-semibold">
                {formatDivine(priceInfo!.divineValue)}
              </span>{" "}
              div
            </span>
          )}
          <span>
            <span className="text-amber-300 font-semibold">
              {formatChaos(priceInfo!.chaosValue)}
            </span>{" "}
            chaos
          </span>
          {priceInfo!.listingCount != null && priceInfo!.listingCount > 0 && (
            <span className="text-slate-500">·</span>
          )}
          {priceInfo!.listingCount != null && priceInfo!.listingCount > 0 && (
            <span className="text-slate-400">{priceInfo!.listingCount} listed</span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pulls the human-facing description out of the engine's clipboard rawText.
 * Skips the header (Rarity + name lines), Stack Size markers, and section
 * dividers; keeps the prose lines that explain how the item is used.
 */
function extractDescriptionLines(rawText: string): string[] {
  if (!rawText) return [];
  const sections = rawText.split(/\n-{3,}\n/);
  const lines: string[] = [];
  for (const section of sections) {
    for (const line of section.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith("Rarity:")) continue;
      if (t.startsWith("Stack Size:")) continue;
      if (t.startsWith("Requirements:")) continue;
      // Skip standalone "Level: 1" rows that come from the requirements block.
      if (/^(Level|Str|Dex|Int):\s*\d+/i.test(t)) continue;
      // Skip the bare item name — that's already the header.
      if (lines.length === 0 && /^[A-Z]/.test(t) && !/[.?!]$/.test(t) && t.split(" ").length < 6) {
        // A short title-cased line at the very top is usually the item name.
        continue;
      }
      lines.push(t);
    }
  }
  // De-dup adjacent identical lines (rare but safe).
  return lines.filter((l, i) => l !== lines[i - 1]);
}

function formatDivine(divine: number): string {
  if (divine >= 100) return Math.round(divine).toLocaleString();
  if (divine >= 10) return divine.toFixed(0);
  return divine.toFixed(1);
}

function formatChaos(chaos: number): string {
  return Math.round(chaos).toLocaleString();
}
