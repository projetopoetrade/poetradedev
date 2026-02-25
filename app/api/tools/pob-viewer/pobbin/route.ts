import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/tools/pob-viewer/pobbin
 * Proxies a PoB code to pobb.in and returns the generated paste key.
 * Avoids CORS by making the request server-side.
 *
 * Body: { code: string }
 * Response: { key: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { code?: string };
    const code = body.code?.trim();

    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    // pobb.in requires URL-safe base64 (- and _ instead of + and /)
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

    // pobb.in returns the key as a plain JSON string, e.g. "np7lPXqlwFTi"
    const key = await res.json() as string;

    return NextResponse.json({ key });
  } catch (err) {
    console.error("[pobbin] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
