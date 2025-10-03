import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

interface League {
  name: string;
  imageUrl: string;
  gameVersion: "path-of-exile-1" | "path-of-exile-2";
  description?: string;
}

export async function POST(req: Request) {
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
    // Por enquanto, qualquer usuário autenticado pode criar (AJUSTAR EM PRODUÇÃO)

    const league: League = await req.json();

    // Validação
    if (!league.name || !league.imageUrl || !league.gameVersion) {
      return NextResponse.json(
        { error: 'Name, imageUrl, and gameVersion are required' },
        { status: 400 }
      );
    }

    if (!["path-of-exile-1", "path-of-exile-2"].includes(league.gameVersion)) {
      return NextResponse.json(
        { error: 'Invalid game version' },
        { status: 400 }
      );
    }

    // Usar admin client para criar league (bypassa RLS)
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('leagues')
      .insert([league])
      .select();

    if (error) {
      console.error('Error creating league:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create league' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data returned after insert' },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error in league creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

