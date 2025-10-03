import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

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

    // TODO: Adicionar verificação de role admin aqui
    // Por exemplo: verificar se user tem role 'admin' em uma tabela user_roles
    // Por enquanto, qualquer usuário autenticado pode deletar (AJUSTAR EM PRODUÇÃO)

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in league deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

