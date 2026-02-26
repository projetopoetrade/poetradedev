import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET — listar todas as builds (admin, incluindo não publicadas)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const body = await req.json();
    const { title, slug, pob_code, class: poeClass, ascendancy, game_version } = body;

    if (!title || !slug || !pob_code || !poeClass || !ascendancy || !game_version) {
      return NextResponse.json({ error: 'Missing required fields: title, slug, pob_code, class, ascendancy, game_version' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
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
        pob_code: body.pob_code,
        pob_hash: body.pob_hash ?? null,
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
