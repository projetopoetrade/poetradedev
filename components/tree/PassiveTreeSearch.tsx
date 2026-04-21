"use client";

import { useMemo, useState } from "react";
import type { PassiveKind, PositionedNode } from "./tree-types";

/**
 * Search input + kind-filter pills. Matches run over name and all stat
 * lines, case-insensitive. Emits the set of matching node IDs so the
 * viewer can desaturate the rest.
 *
 * Also surfaces a top-5 result list below the input so the user can
 * click-to-center (not wired in the viewer yet — emits `onFocus` with the
 * picked node so the preview page can re-position the camera).
 */

interface Props {
  nodes: PositionedNode[];
  onHighlight: (ids: Set<number>) => void;
  onFocus?: (node: PositionedNode) => void;
}

const KIND_FILTERS: Array<{ key: PassiveKind; label: string }> = [
  { key: "notable", label: "Notables" },
  { key: "keystone", label: "Keystones" },
  { key: "mastery", label: "Masteries" },
  { key: "ascendancy", label: "Ascendancy" },
  { key: "jewel_socket", label: "Jewel sockets" },
];

export function PassiveTreeSearch({ nodes, onHighlight, onFocus }: Props) {
  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<Set<PassiveKind>>(() => new Set());

  // Matching pipeline: narrow by kind filter first, then by text.
  const { matches, topResults } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const kindFilter = kinds.size > 0 ? kinds : null;

    // Skip entirely-empty queries to avoid highlighting all 3k+ nodes.
    if (!q && !kindFilter) return { matches: new Set<number>(), topResults: [] as PositionedNode[] };

    const ids = new Set<number>();
    const hits: PositionedNode[] = [];
    for (const n of nodes) {
      if (kindFilter && !kindFilter.has(n.kind)) continue;
      if (q) {
        const hay = `${n.name} ${n.stats.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      ids.add(n.id);
      if (hits.length < 10) hits.push(n);
    }
    return { matches: ids, topResults: hits };
  }, [nodes, query, kinds]);

  // Propagate highlights up. Memoized matches prevent unnecessary render loops.
  useMemo(() => onHighlight(matches), [matches, onHighlight]);

  const toggleKind = (k: PassiveKind) => {
    const next = new Set(kinds);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setKinds(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or stat (e.g. 'bleed', 'Lethality')..."
          className="flex-1 min-w-[260px] rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
        />
        {KIND_FILTERS.map(({ key, label }) => {
          const active = kinds.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleKind(key)}
              className={`rounded border px-2.5 py-1 text-xs transition-colors ${
                active
                  ? "border-amber-500 bg-amber-500/10 text-amber-300"
                  : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {topResults.length > 0 && query && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {topResults.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onFocus?.(n)}
              className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-neutral-300 hover:border-neutral-600 hover:text-white"
            >
              <span className={kindColor(n.kind)}>{n.name}</span>
            </button>
          ))}
        </div>
      )}
      {query && matches.size === 0 && (
        <div className="text-xs text-neutral-500">No matches in the active patch.</div>
      )}
      {matches.size > 0 && (
        <div className="text-xs text-neutral-500">
          {matches.size} {matches.size === 1 ? "match" : "matches"} highlighted
        </div>
      )}
    </div>
  );
}

function kindColor(kind: PassiveKind): string {
  switch (kind) {
    case "keystone":
      return "text-orange-400";
    case "notable":
      return "text-orange-300";
    case "ascendancy":
      return "text-cyan-300";
    case "mastery":
      return "text-amber-300";
    default:
      return "text-neutral-300";
  }
}
