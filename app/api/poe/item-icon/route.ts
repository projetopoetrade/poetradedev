import { NextRequest, NextResponse } from "next/server";
import { getItemIconMap } from "@/lib/poe-ninja-icon-map";

// GET /api/poe/item-icon?name=Headhunter&baseName=Leather%20Belt
// Retorna a URL do ícone vinda do poe.ninja (ou null).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();
  const baseName = searchParams.get("baseName")?.trim();

  if (!name && !baseName) {
    return NextResponse.json(
      { iconUrl: null, error: "Missing name or baseName parameter" },
      { status: 400 },
    );
  }

  try {
    const map = await getItemIconMap();

    const candidates: string[] = [];
    if (name) candidates.push(name.toLowerCase());
    if (baseName) candidates.push(baseName.toLowerCase());

    let iconUrl: string | null = null;
    for (const key of candidates) {
      const found = map.get(key);
      if (found) {
        iconUrl = found;
        break;
      }
    }

    return NextResponse.json({ iconUrl });
  } catch (err) {
    console.error("[/api/poe/item-icon] unexpected error:", err);
    return NextResponse.json({ iconUrl: null }, { status: 500 });
  }
}

