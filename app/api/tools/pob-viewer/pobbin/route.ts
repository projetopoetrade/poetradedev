import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generatePobShortHash } from "@/lib/pob-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/tools/pob-viewer/pobbin
 * Proxies a PoB code to pobb.in and returns the generated paste key.
 * Avoids CORS by making the request server-side.
 *
 * Body: { code: string }
 * Response: { key: string }
 *
 * Side effect: writes the returned key back to `pob_builds.pobbin_key`
 * (keyed by the same SHA256→base62-10 hash that `share` uses) so future
 * "Open in PoB" clicks for the same PoB skip the upload round-trip.
 * If no row exists yet (caller hit /pobbin without /share first) the
 * UPDATE is a silent no-op — nothing to cache against.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim();

    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const urlSafeCode = code.replace(/\+/g, "-").replace(/\//g, "_");

    const res = await fetch("https://pobb.in/api/internal/paste/", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        "User-Agent": "pathoftrade.net/1.0",
      },
      body: JSON.stringify({
        as_user: false,
        content: urlSafeCode,
        title: "Build via pathoftrade.net",
        id: null,
        pinned: false,
        private: false,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[pobbin] pobb.in error:", res.status, errorText);
      return NextResponse.json(
        { error: "Failed to create pobb.in paste", detail: errorText },
        { status: 502 },
      );
    }

    const key = (await res.json()) as string;

    void persistPobbinKey(code, key).catch((err) => {
      console.warn("[pobbin] failed to cache pobbin_key:", (err as Error).message);
    });

    return NextResponse.json({ key });
  } catch (err) {
    console.error("[pobbin] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function persistPobbinKey(code: string, key: string): Promise<void> {
  const pobHash = generatePobShortHash(code);
  const supabase = await createClient();
  const { error } = await supabase
    .from("pob_builds")
    .update({ pobbin_key: key })
    .eq("pob_hash", pobHash);
  if (error) throw new Error(error.message);
}
