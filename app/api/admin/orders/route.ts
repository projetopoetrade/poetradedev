import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET - Buscar todas as orders (admin)
export async function GET(req: Request) {
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
    // Por enquanto, qualquer usuário autenticado pode ver todas as orders (AJUSTAR EM PRODUÇÃO)

    // Usar admin client para buscar todas as orders (bypassa RLS)
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in admin orders GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar status de uma order (admin)
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

    const { orderId, status } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validar status
    const validStatuses = ['processing', 'waiting_delivery', 'completed', 'failed', 'canceled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Usar admin client para atualizar order (bypassa RLS)
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in admin orders PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

