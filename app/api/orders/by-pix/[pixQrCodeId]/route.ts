import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pixQrCodeId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Por favor, faça login.' },
        { status: 401 }
      );
    }

    const { pixQrCodeId } = await params;

    if (!pixQrCodeId) {
      return NextResponse.json(
        { error: 'PIX QR Code ID é obrigatório.' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando pedido por PIX QR Code ID:', pixQrCodeId);

    // Buscar o pedido pelo pix_qrcode_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('pix_qrcode_id', pixQrCodeId)
      .eq('user_id', user.id) // Garantir que o usuário só veja seus próprios pedidos
      .single();

    if (orderError || !order) {
      console.error('❌ Erro ao buscar pedido:', orderError);
      return NextResponse.json(
        { error: 'Pedido não encontrado.' },
        { status: 404 }
      );
    }

    console.log('✅ Pedido encontrado:', {
      id: order.id,
      status: order.status,
      payment_status: order.payment_status,
      total_amount: order.total_amount,
      pix_qrcode_id: order.pix_qrcode_id,
    });

    // Garantir que total_amount seja um número
    const totalAmount = typeof order.total_amount === 'string' 
      ? parseFloat(order.total_amount) 
      : order.total_amount;

    console.log('💰 Total amount convertido:', totalAmount, 'Type:', typeof totalAmount);

    // Retornar os dados do pedido
    return NextResponse.json({
      id: order.id,
      character_name: order.character_name,
      email: order.email,
      total_amount: totalAmount,
      currency: order.currency || 'BRL',
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      items: order.items,
      observations: order.observations,
      created_at: order.created_at,
      updated_at: order.updated_at,
      paid_at: order.paid_at || null,
    });

  } catch (error) {
    console.error('❌ Erro ao buscar pedido:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { error: 'Erro ao buscar pedido.', details: errorMessage },
      { status: 500 }
    );
  }
}

