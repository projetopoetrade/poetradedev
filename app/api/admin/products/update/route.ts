import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(req: Request) {
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
    // Por enquanto, qualquer usuário autenticado pode atualizar (AJUSTAR EM PRODUÇÃO)

    const { productId, price } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!price || isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }

    // Usar admin client para atualizar produto (bypassa RLS)
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('products')
      .update({ price })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in product update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

