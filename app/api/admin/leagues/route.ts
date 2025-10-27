import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET - Buscar ligas por versão do jogo (admin)
export async function GET(req: NextRequest) {
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
    // Por enquanto, qualquer usuário autenticado pode ver as ligas

    // Obter gameVersion dos query params
    const { searchParams } = new URL(req.url);
    const gameVersion = searchParams.get('gameVersion');

    if (!gameVersion) {
      return NextResponse.json(
        { error: 'gameVersion parameter is required' },
        { status: 400 }
      );
    }

    if (!["path-of-exile-1", "path-of-exile-2"].includes(gameVersion)) {
      return NextResponse.json(
        { error: 'Invalid game version' },
        { status: 400 }
      );
    }

    // Usar admin client para buscar ligas (bypassa RLS)
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('leagues')
      .select('id, name, gameVersion, isActive')
      .eq('gameVersion', gameVersion)
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching leagues:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leagues' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in admin leagues GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
