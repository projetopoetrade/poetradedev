"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import type { PositionedNode } from "./tree-types";

/**
 * Floating tooltip anchored to cursor position. In-game-inspired palette:
 *  - Notable: orange-ish header
 *  - Keystone: pronounced orange + italic flavour
 *  - Ascendancy: cyan accent
 *  - Mastery: amber choices bulleted
 *  - Small: neutral
 */

interface Props {
  node: PositionedNode | null;
  screenX: number;
  screenY: number;
  selectedMasteries?: Map<string, string[]>;
}

export function PassivePortalTooltip({ node, screenX, screenY, selectedMasteries }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !node) return null;

  const headerClass = headerClassFor(node);
  const kindLabel = labelFor(node);

  // Flip to the other side of the cursor if near right/bottom edge
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
  const flipX = screenX > vw - 320;
  const flipY = screenY > vh - 260;
  const style: React.CSSProperties = {
    left: flipX ? screenX - 320 : screenX + 16,
    top: flipY ? screenY - 16 : screenY + 16,
  };

  const masteryEffects = node.raw.masteryEffects ?? [];
  const selectedStats = selectedMasteries?.get(node.name);

  // When this mastery is allocated, show only the stats that match the selection
  const displayEffects =
    selectedStats && selectedStats.length > 0
      ? masteryEffects.filter(
          (eff: any) =>
            eff.stats.length === selectedStats.length &&
            eff.stats.every((s: string, i: number) => s === selectedStats[i]),
        )
      : masteryEffects;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[100] w-[300px] rounded border border-neutral-700 bg-neutral-950/95 p-3 text-sm shadow-2xl backdrop-blur"
      style={style}
      role="tooltip"
    >
      <div className="mb-1 text-[10px] uppercase tracking-widest text-neutral-500">
        {kindLabel}
      </div>
      <div className={`mb-2 font-semibold ${headerClass}`}>{node.name}</div>
      {node.ascendancyName && (
        <div className="mb-2 text-xs text-cyan-300">Ascendancy — {node.ascendancyName}</div>
      )}
      {node.stats.length > 0 && (
        <ul className="mb-2 space-y-0.5 text-[13px] text-blue-300">
          {node.stats.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
      {displayEffects.length > 0 && (
        <div className="mb-2 space-y-1.5 border-t border-neutral-800 pt-2">
          {displayEffects.map((eff: any, i: number) => (
            <div key={i} className="text-xs">
              {(eff.stats ?? []).map((s: string, j: number) => (
                <div key={j} className="text-amber-300">
                  • {s}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {node.flavourText && (
        <div className="mt-2 whitespace-pre-line border-t border-neutral-800 pt-2 text-xs italic text-neutral-400">
          {node.flavourText}
        </div>
      )}
      {node.raw.recipe && node.raw.recipe.length > 0 && (
        <div className="mt-2 border-t border-neutral-800 pt-2 text-[11px] text-neutral-500">
          Oil recipe: {node.raw.recipe.join(" · ")}
        </div>
      )}
    </div>,
    document.body,
  );
}

function headerClassFor(node: PositionedNode): string {
  if (node.kind === "keystone") return "text-orange-400 text-base tracking-wide";
  if (node.kind === "notable") return "text-orange-300";
  if (node.kind === "ascendancy") return "text-cyan-300";
  if (node.kind === "mastery") return "text-amber-300";
  if (node.kind === "jewel_socket") return "text-emerald-300";
  return "text-neutral-200";
}

function labelFor(node: PositionedNode): string {
  switch (node.kind) {
    case "keystone":
      return "Keystone";
    case "notable":
      return "Notable";
    case "ascendancy":
      return "Ascendancy passive";
    case "mastery":
      return "Mastery";
    case "jewel_socket":
      return "Jewel socket";
    case "class_start":
      return "Class start";
    default:
      return "Passive";
  }
}
