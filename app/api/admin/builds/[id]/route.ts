import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, isAdmin } from "@/utils/supabase/admin";
import { generatePobShortHash } from "@/lib/pob-hash";

// PATCH — editar build existente
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Remove fields that shouldn't be updated directly
    const { id: _id, created_at, ...updateData } = body;

    const adminSupabase = createAdminClient();

    // Se o pob_code mudou, regenera o pob_hash e garante o registro em pob_builds
    // (mesmo contrato do POST) para que o link curto /tools/pob-viewer?id=<hash>
    // sempre resolva e nunca caia no fallback ?code= (que estoura a URL → 414).
    if (typeof updateData.pob_code === "string" && updateData.pob_code.trim()) {
      const trimmedPobCode = updateData.pob_code.trim();
      const pobHash = generatePobShortHash(trimmedPobCode);
      updateData.pob_code = trimmedPobCode;
      updateData.pob_hash = pobHash;

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
          console.error('[admin/builds PATCH] Failed to insert into pob_builds:', insertPobRes.error);
        }
      }
    }

    const { data, error } = await adminSupabase
      .from('builds')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[admin/builds PATCH] Error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Build not found' }, { status: 404 });
      }
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A build with this slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update build' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[admin/builds PATCH] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — remover build
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('builds')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/builds DELETE] Error:', error);
      return NextResponse.json({ error: 'Failed to delete build' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/builds DELETE] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
