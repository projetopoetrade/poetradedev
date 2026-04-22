import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generatePobShortHash } from "@/lib/pob-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ShareResponse {
  id: string;
  pobbinKey: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pobCode } = body as { pobCode?: string };

    if (
      !pobCode ||
      typeof pobCode !== "string" ||
      pobCode.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "pobCode é obrigatório." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const trimmed = pobCode.trim();
    const pobHash = generatePobShortHash(trimmed);

    const existing = await supabase
      .from("pob_builds")
      .select("pob_hash, pobbin_key")
      .eq("pob_hash", pobHash)
      .maybeSingle();

    if (existing.data?.pob_hash) {
      const payload: ShareResponse = {
        id: existing.data.pob_hash,
        pobbinKey: (existing.data.pobbin_key as string | null) ?? null,
      };
      return NextResponse.json(payload);
    }

    const { data, error } = await supabase
      .from("pob_builds")
      .insert({ pob_code: trimmed, pob_hash: pobHash })
      .select("pob_hash, pobbin_key")
      .single();

    if (error) {
      console.error("[pob-viewer/share] insert error", error);
      return NextResponse.json(
        { error: "Erro ao salvar PoB para compartilhamento." },
        { status: 500 },
      );
    }

    const payload: ShareResponse = {
      id: data.pob_hash,
      pobbinKey: (data.pobbin_key as string | null) ?? null,
    };
    return NextResponse.json(payload);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar link compartilhável.";
    console.error("[pob-viewer/share]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("pob_builds")
      .select("pob_code, pobbin_key")
      .eq("pob_hash", id)
      .single();

    if (error) {
      console.error("[pob-viewer/share] select error", error);
      return NextResponse.json(
        { error: "Não foi possível encontrar o PoB para este id." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      pobCode: data.pob_code,
      pobbinKey: (data.pobbin_key as string | null) ?? null,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao buscar PoB compartilhado.";
    console.error("[pob-viewer/share]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
