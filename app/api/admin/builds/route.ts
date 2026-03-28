import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, isAdmin } from "@/utils/supabase/admin";
import crypto from "crypto";

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

// GET — listar todas as builds (admin, incluindo não publicadas)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('builds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/builds GET] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch builds' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[admin/builds GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — criar nova build
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, slug, pob_code, class: poeClass, ascendancy, game_version } = body;

    if (!title || !slug || !pob_code || !poeClass || !ascendancy || !game_version) {
      return NextResponse.json({ error: 'Missing required fields: title, slug, pob_code, class, ascendancy, game_version' }, { status: 400 });
    }

    const trimmedPobCode = body.pob_code.trim();
    const pobHash = body.pob_hash || generateShortHash(trimmedPobCode);

    const adminSupabase = createAdminClient();

    // Assegura que o pob está gravado na tabela pob_builds, como no pobviewer
    const { data: existingPob } = await adminSupabase
      .from('pob_builds')
      .select('pob_hash')
      .eq('pob_hash', pobHash)
      .maybeSingle();

    if (!existingPob?.pob_hash) {
      const insertPobRes = await adminSupabase
        .from('pob_builds')
        .insert({ pob_code: trimmedPobCode, pob_hash: pobHash });

      if (insertPobRes.error) {
        console.error('[admin/builds POST] Failed to insert into pob_builds:', insertPobRes.error);
      }
    }

    const { data, error } = await adminSupabase
      .from('builds')
      .insert({
        title: body.title,
        slug: body.slug,
        description: body.description ?? null,
        game_version: body.game_version,
        league: body.league ?? null,
        class: body.class,
        ascendancy: body.ascendancy,
        main_skill: body.main_skill ?? null,
        tags: body.tags ?? [],
        difficulty: body.difficulty ?? null,
        budget: body.budget ?? null,
        pob_code: trimmedPobCode,
        pob_hash: pobHash,
        image_url: body.image_url ?? null,
        video_url: body.video_url ?? null,
        guide_content: body.guide_content ?? null,
        seo_title: body.seo_title ?? null,
        seo_description: body.seo_description ?? null,
        is_published: body.is_published ?? false,
        author: body.author ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('[admin/builds POST] Error:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A build with this slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create build' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[admin/builds POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
