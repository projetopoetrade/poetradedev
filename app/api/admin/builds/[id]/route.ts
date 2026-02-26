import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// PATCH — editar build existente
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Remove fields that shouldn't be updated directly
    const { id: _id, created_at, ...updateData } = body;

    const adminSupabase = createAdminClient();
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
