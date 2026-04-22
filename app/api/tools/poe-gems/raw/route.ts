import { NextRequest, NextResponse } from "next/server";
import { fetchItemRaw } from "@/lib/placeholders/fetch-items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/tools/poe-gems/raw
 *
 * Server-side batch fetcher for engine-synthesised gem rawText. Lets the
 * PoB viewer hand back the in-game-style tooltip that the blog/preview
 * already uses, with stat lines (Mana Cost, Effectiveness, Damage Mult,
 * etc) calculated for the exact level + quality the user has in their
 * build — not the engine's level-20 default.
 *
 * Body: { gems: [{ name, level?, quality? }] }
 * Response: { [`${name}@${level}/${quality}`]: { rawText, primaryAttribute, isAwakened, isVaal } }
 *
 * Misses are simply absent from the response (no entry) — caller falls
 * back to whatever lighter tooltip it already had.
 */

interface GemRequest {
  name?: string;
  level?: number;
  quality?: number;
}

interface GemRawEntry {
  rawText: string;
  primaryAttribute?: "Strength" | "Dexterity" | "Intelligence" | null;
  isAwakened?: boolean;
  isVaal?: boolean;
}

const MAX_GEMS = 200;

function makeKey(name: string, level?: number, quality?: number): string {
  return `${name}@${level ?? ""}/${quality ?? ""}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { gems?: GemRequest[] };
    const gems = body.gems ?? [];
    if (!gems.length) return NextResponse.json({});

    const dedup = new Map<string, { name: string; level?: number; quality?: number }>();
    for (const g of gems) {
      const name = g.name?.trim();
      if (!name) continue;
      const k = makeKey(name, g.level, g.quality);
      if (!dedup.has(k)) {
        dedup.set(k, { name, level: g.level, quality: g.quality });
      }
      if (dedup.size >= MAX_GEMS) break;
    }

    const entries = await Promise.all(
      Array.from(dedup.entries()).map(async ([k, g]) => {
        const data = await fetchItemRaw(g.name, { level: g.level, quality: g.quality });
        if (!data?.rawText) return [k, null] as const;
        const entry: GemRawEntry = {
          rawText: data.rawText,
          primaryAttribute: data.gemInfo?.primaryAttribute ?? null,
          isAwakened: data.gemInfo?.isAwakened,
          isVaal: data.gemInfo?.isVaal,
        };
        return [k, entry] as const;
      }),
    );

    const result: Record<string, GemRawEntry> = {};
    for (const [k, entry] of entries) {
      if (entry) result[k] = entry;
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[poe-gems/raw]", (err as Error).message);
    return NextResponse.json({}, { status: 500 });
  }
}
