import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * GET /api/orders/find-order/[id]
 * Busca um pedido específico pelo ID usando privilégios administrativos
 * 
 * ATENÇÃO: Esta rota usa o cliente admin e bypassa RLS!
 * Certifique-se de validar permissões adequadamente.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório.' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando pedido com admin:', {
      orderId: id,
    });

    // Buscar o pedido específico (sem restrição de user_id pois é admin)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) {
      console.error('❌ Erro ao buscar pedido:', orderError);
      
      if (orderError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Pedido não encontrado ou você não tem permissão para acessá-lo.' },
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

    console.log('✅ Pedido encontrado com admin:', {
      orderId: order.id,
      userId: order.user_id,
      status: order.status,
      paymentStatus: order.payment_status,
      totalAmount: order.total_amount,
      currency: order.currency,
    });

    return NextResponse.json({
      success: true,
      order: order,
    });

  } catch (error) {
    console.error('❌ Erro ao processar requisição:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor ao buscar pedido.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

