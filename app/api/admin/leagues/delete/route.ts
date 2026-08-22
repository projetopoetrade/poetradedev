import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, isAdmin } from "@/utils/supabase/admin";
import { bustDbCache } from "@/lib/revalidate-db";
import { DB_TAGS } from "@/lib/cache-tags";

export async function DELETE(req: Request) {
  try {
    // Verificar autenticação do usuário
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get('id');

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Usar admin client para deletar league (bypassa RLS)
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('leagues')
      .delete()
      .eq('id', leagueId);

    if (error) {
      console.error('Error deleting league:', error);
      return NextResponse.json(
        { error: 'Failed to delete league' },
        { status: 500 }
      );
    }

    // Produtos também: a liga sai da listagem junto com o catálogo dela.
    bustDbCache(DB_TAGS.leagues, DB_TAGS.products);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in league deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

