import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/tools/pob-viewer/share
// Body: { pobCode: string }
// Returns: { id: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pobCode } = body as { pobCode?: string };

    if (!pobCode || typeof pobCode !== "string" || pobCode.trim().length === 0) {
      return NextResponse.json(
        { error: "pobCode é obrigatório." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const trimmed = pobCode.trim();

    // 1) Verifica se já existe um registro com o mesmo pob_code
    const existing = await supabase
      .from("pob_builds")
      .select("id")
      .eq("pob_code", trimmed)
      .maybeSingle();

    if (existing.data?.id) {
      return NextResponse.json({ id: existing.data.id });
    }

    // 2) Se não existir, cria um novo
    const { data, error } = await supabase
      .from("pob_builds")
      .insert({ pob_code: trimmed })
      .select("id")
      .single();

    if (error) {
      console.error("[pob-viewer/share] insert error", error);
      return NextResponse.json(
        { error: "Erro ao salvar PoB para compartilhamento." },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data.id });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar link compartilhável.";
    console.error("[pob-viewer/share]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/tools/pob-viewer/share?id=<uuid>
// Returns: { pobCode: string }
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("pob_builds")
      .select("pob_code")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[pob-viewer/share] select error", error);
      return NextResponse.json(
        { error: "Não foi possível encontrar o PoB para este id." },
        { status: 404 },
      );
    }

    return NextResponse.json({ pobCode: data.pob_code });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao buscar PoB compartilhado.";
    console.error("[pob-viewer/share]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

