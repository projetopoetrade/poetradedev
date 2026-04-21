import type { PortableTextBlock as _PortableTextBlock } from "sanity";

/**
 * Shared types for the `/preview/showcase` route.
 *
 * Lives in its own module (not `actions.ts`) because `"use server"` files
 * may only export async functions — Next.js strips non-function exports
 * at build time and the page can't import types from there.
 */

export type ShowcaseSection = "tree" | "gear" | "skills" | "wrapup";

export interface ProseResult {
  /** The plain-text paragraph with `{{...}}` placeholders embedded. */
  text: string;
  /** Where the paragraph came from — drives the transparency footer. */
  source: "engine" | "openrouter-direct" | "fallback";
  /** Model used when known (engine + openrouter-direct), null for fallback. */
  model: string | null;
  /** Hint surfaced in the footer when a call failed. */
  error?: string;
}

export interface SummaryActionResult {
  ok: boolean;
  error?: string;
  summary?: PobSummary;
}

// Re-declare the subset of `PobSummary` the showcase reads. Mirrors the
// engine's `PobSummary` shape 1:1 but lives in this folder so the page +
// server actions can share a single symbol without depending on the
// sibling `pob/actions.ts` (which also uses "use server" and therefore
// can't re-export types).
export interface PobSummaryGearEntry {
  slot: string;
  name: string;
  isUnique: boolean;
  canonical: boolean;
  id?: string;
  explicits?: string[];
  implicits?: string[];
  enchant?: string;
  influences?: string[];
  itemLevel?: number;
  corrupted?: boolean;
  mirrored?: boolean;
  fractured?: boolean;
  split?: boolean;
}

export interface PobSummary {
  class?: string;
  ascendancy?: string;
  level?: number;
  notes?: string;
  stats?: {
    totalDps?: string;
    ehp?: string;
    life?: string;
    energyShield?: string;
    resists?: string;
    movementSpeed?: string;
  };
  mainSkill?: string | null;
  supports?: string[];
  tree?: {
    nodesTotal?: number;
    keystones?: string[];
    notablesAllocated?: string[];
    masteries?: Array<{ name: string; choice: string }>;
    jewels?: string[];
  };
  gear?: PobSummaryGearEntry[];
}

// Re-export PortableTextBlock so the page's module can reference it through
// the showcase types module if it ever needs a narrower alias. Not strictly
// necessary today — but keeps the type surface of this folder self-contained.
export type PortableTextBlock = _PortableTextBlock;
