import { TrendingUp, TrendingDown } from "lucide-react";
import { SITE } from "./poe-ui";
import type { Mover } from "@/lib/league-hub-mock";

// Semantic up/down, independent of the league accent.
export const UP = "#4ade80";
export const DOWN = "#f87171";

export function formatChaos(chaos: number): string {
  if (chaos >= 1000) return `${(chaos / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`;
  return chaos.toLocaleString("en-US");
}

/** Normalized [0..100] path from a series, with a little vertical padding. */
function toPath(data: number[]): { line: string; area: string } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 8;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = pad + (1 - (v - min) / range) * (100 - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
  const area = `${line} L100 100 L0 100 Z`;
  return { line, area };
}

/**
 * Full-width area chart for one series. Single hue; non-scaling stroke so the
 * 2px line stays 2px under the non-uniform viewBox stretch. `gradientId` must be
 * unique on the page (server-safe — no useId, so this renders in RSC).
 */
export function AreaChart({
  data,
  color,
  gradientId,
}: {
  data: number[];
  color: string;
  gradientId: string;
}) {
  const { line, area } = toPath(data);
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Tiny inline trend line. */
export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const { line } = toPath(data);
  return (
    <svg className="h-6 w-16 shrink-0" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function ChangeChip({ pct }: { pct: number }) {
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{ color: up ? UP : DOWN, backgroundColor: `${up ? UP : DOWN}1f` }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {up ? "+" : ""}
      {pct}%
    </span>
  );
}

function MoverList({ title, rows, up }: { title: string; rows: Mover[]; up: boolean }) {
  const color = up ? UP : DOWN;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color }}>
          {title}
        </span>
      </div>
      <ul>
        {rows.map((m) => (
          <li
            key={m.name}
            className="flex items-center gap-2.5 border-b py-2 last:border-b-0"
            style={{ borderColor: SITE.border }}
          >
            <span className="min-w-0 flex-1 truncate text-sm" style={{ color: SITE.fg }}>
              {m.name}
            </span>
            <Sparkline data={m.spark} color={color} />
            <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color }}>
              {m.changePct > 0 ? "+" : ""}
              {m.changePct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The gainers / losers board, shared by the Live economy section. */
export function MoverBoard({ gainers, losers }: { gainers: Mover[]; losers: Mover[] }) {
  if (gainers.length === 0 && losers.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
      <MoverList title="Gainers" rows={gainers} up />
      <MoverList title="Losers" rows={losers} up={false} />
    </div>
  );
}
