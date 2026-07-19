import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/poe/base-icon?name=Warlock+Gloves
 *
 * Returns a wiki CDN URL for the base item's inventory icon.
 * Used by the PoB Viewer as a fallback for rare/magic items that
 * don't have an iconUrl from the engine (only uniques get one).
 *
 * Uses the metadata_id + inventory_icon stored in Supabase items
 * table (populated from poewiki Cargo API by scripts/seed-base-items.js).
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();

  if (!name) {
    return NextResponse.json(
      { iconUrl: null, error: "Missing name parameter" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("items")
      .select("name, metadata_id, inventory_icon")
      .eq("name", name)
      .limit(1)
      .single();

    if (error || !data) {
      // Not in our table — construct wiki URL from name directly
      const fileName = name.replace(/['"]/g, "").replace(/ /g, "_") + "_inventory_icon.png";
      return NextResponse.json({
        iconUrl: `https://www.poewiki.net/wiki/Special:FilePath/${fileName}`,
      });
    }

    const iconFile = data.inventory_icon;
    if (!iconFile) {
      // Has row but no inventory_icon — construct from name
      const fileName = name.replace(/['"]/g, "").replace(/ /g, "_") + "_inventory_icon.png";
      return NextResponse.json({
        iconUrl: `https://www.poewiki.net/wiki/Special:FilePath/${fileName}`,
      });
    }

    const fileName = (iconFile as string)
      .replace(/^File:/, "")
      .replace(/ /g, "_");
    return NextResponse.json({
      iconUrl: `https://www.poewiki.net/wiki/Special:FilePath/${fileName}`,
    });
  } catch (err) {
    console.error("[/api/poe/base-icon]", err);
    return NextResponse.json({ iconUrl: null }, { status: 500 });
  }
}