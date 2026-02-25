import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function toBase62(buffer: Buffer): string {
  let num = BigInt("0x" + buffer.toString("hex"));
  let result = "";
  const zero = BigInt(0);
  const sixtyTwo = BigInt(62);
  while (num > zero) {
    result = BASE62_CHARS[Number(num % sixtyTwo)] + result;
    num = num / sixtyTwo;
  }
  return result;
}

function generateShortHash(pobCode: string): string {
  const hash = crypto.createHash("sha256").update(pobCode).digest();
  return toBase62(hash).slice(0, 10);
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
    const pobHash = generateShortHash(trimmed);

    const existing = await supabase
      .from("pob_builds")
      .select("pob_hash")
      .eq("pob_hash", pobHash)
      .maybeSingle();

    if (existing.data?.pob_hash) {
      return NextResponse.json({ id: existing.data.pob_hash });
    }

    const { data, error } = await supabase
      .from("pob_builds")
      .insert({ pob_code: trimmed, pob_hash: pobHash })
      .select("pob_hash")
      .single();

    if (error) {
      console.error("[pob-viewer/share] insert error", error);
      return NextResponse.json(
        { error: "Erro ao salvar PoB para compartilhamento." },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data.pob_hash });
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
      .select("pob_code")
      .eq("pob_hash", id)
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
