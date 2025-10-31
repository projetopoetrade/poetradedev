import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/orders/by-pix/[id]
 * Retorna o pedido do usuário autenticado associado ao PIX (pix_qrcode_id).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Validar usuário autenticado (aplica RLS)
    const { data: authData, error: userError } = await supabase.auth.getUser();
    if (userError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params; // id do QRCode PIX
    if (!id) {
      return NextResponse.json({ error: 'PIX id é obrigatório.' }, { status: 400 });
    }

    // Buscar o pedido do próprio usuário com esse pix_qrcode_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('pix_qrcode_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (orderError) {
      // PGRST116 = no rows
      if ((orderError as any).code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Pedido não encontrado para este PIX.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Erro ao buscar pedido.', details: orderError.message },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: message },
      { status: 500 }
    );
  }
}


