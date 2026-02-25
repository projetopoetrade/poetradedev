import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tools/pob-viewer/raw?id={hash}
 *
 * Returns the raw PoB code (base64-encoded XML) as plain text.
 * Path of Building Community fetches this URL when you open a pob:// link.
 *
 * Usage: pob://yourdomain.com/api/tools/pob-viewer/raw?id=XXXXXXXXXX
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("id is required", { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pob_builds")
    .select("pob_code")
    .eq("pob_hash", id)
    .single();

  if (error || !data) {
    return new NextResponse("Build not found", { status: 404 });
  }

  return new NextResponse(data.pob_code, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
