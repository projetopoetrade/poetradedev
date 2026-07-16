import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PoeHeading, FONTIN, SITE } from "./poe-ui";
import { MoverBoard, UP, DOWN, formatChaos } from "./economy-charts";
import type { PriceRow, Mover } from "@/lib/league-hub-mock";

interface PriceTrackerProps {
  prices: PriceRow[];
  gainers: Mover[];
  losers: Mover[];
  accentColor: string;
  /** e.g. "updated 8 min ago" — kept as a prop so it can be made real later. */
  updatedLabel: string;
}

/**
 * The live economy board — the signature of the post-launch hub. A currency
 * ticker that says, at a glance, that the league is running and this store is
 * plugged into its market. Labels are English placeholders pending i18n; data
 * is mock (see lib/league-hub-mock.ts) pending a poe.ninja wire-up.
 */
export function PriceTracker({ prices, gainers, losers, accentColor, updatedLabel }: PriceTrackerProps) {
  if (prices.length === 0) return null;

  return (
    <section id="economy" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PoeHeading as="h2" className="text-2xl sm:text-3xl">
            Live economy
          </PoeHeading>
          <p className="mt-2 text-sm" style={{ color: SITE.muted }}>
            Currency prices, moving with the market.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs" style={{ color: SITE.muted }}>
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: accentColor }}
            />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          </span>
          via poe.ninja · {updatedLabel}
        </span>
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {prices.map((p) => {
          const dir = p.changePct > 0 ? "up" : p.changePct < 0 ? "down" : "flat";
          const trendColor = dir === "up" ? UP : dir === "down" ? DOWN : SITE.muted;
          const TrendIcon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;

          return (
            <div
              key={p.name}
              className="rounded-lg border bg-card p-4"
              style={{ borderColor: p.hot ? `${accentColor}40` : SITE.border }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium" style={{ color: SITE.muted }}>
                  {p.name}
                </span>
                {p.hot && (
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: accentColor, backgroundColor: `${accentColor}1f` }}
                  >
                    League
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span
                  className="text-2xl font-semibold tabular-nums"
                  style={{ fontFamily: FONTIN, color: SITE.fg }}
                >
                  {formatChaos(p.chaos)}
                </span>
                <span className="text-[11px]" style={{ color: SITE.muted }}>
                  chaos
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-1 text-xs tabular-nums" style={{ color: trendColor }}>
                <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {dir === "flat" ? "0%" : `${p.changePct > 0 ? "+" : ""}${p.changePct}%`}
                <span className="text-[10px]" style={{ color: SITE.muted }}>
                  24h
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {(gainers.length > 0 || losers.length > 0) && (
        <div className="mt-12">
          <h3 className="text-sm font-semibold" style={{ color: SITE.fg }}>
            Biggest 24h swings
          </h3>
          <p className="mb-5 mt-1 text-sm" style={{ color: SITE.muted }}>
            What is climbing and what is crashing right now.
          </p>
          <MoverBoard gainers={gainers} losers={losers} />
        </div>
      )}
    </section>
  );
}

export default PriceTracker;
