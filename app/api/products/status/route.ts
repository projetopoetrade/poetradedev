import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabase } from "@/utils/supabase/server";

/**
 * GET /api/products/status?name=Item+Name
 * Returns the availability status and slug for a product on Path of Trade.
 * Used by the Content Engine / Extension to decide whether to show a "Buy" button.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }

  try {
    const supabase = await createSupabase();

    // Query for the product. ilike handles case-insensitive name matching.
    // We prioritize listed items.
    const { data, error } = await supabase
      .from("products")
      .select("name, slug, gameVersion, in_stock, is_listed, league")
      .ilike("name", name)
      .eq("is_listed", true)
      .order("in_stock", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ exists: false });
    }

    const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net").replace(/\/$/, "");
    const pathBase = data.gameVersion === "path-of-exile-2"
      ? `/games/path-of-exile-2/products/${data.slug}`
      : `/products/${data.slug}`;

    return NextResponse.json({
      exists: true,
      name: data.name,
      slug: data.slug,
      gameVersion: data.gameVersion,
      in_stock: data.in_stock,
      is_listed: data.is_listed,
      league: data.league,
      urls: {
        en: `${SITE_URL}${pathBase}`,
        pt: `${SITE_URL}/pt-br${pathBase}`,
      }
    });
  } catch (error) {
    console.error("[api/products/status] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
