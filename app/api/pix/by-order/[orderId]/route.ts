import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
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

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID é obrigatório.' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando QR code PIX para pedido:', orderId);

    // Buscar o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id) // Garantir que o usuário só veja seus próprios pedidos
      .single();

    if (orderError || !order) {
      console.error('❌ Erro ao buscar pedido:', orderError);
      return NextResponse.json(
        { error: 'Pedido não encontrado.' },
        { status: 404 }
      );
    }

    // Verificar se o pedido tem PIX
    if (!order.pix_qrcode_id) {
      return NextResponse.json(
        { error: 'Este pedido não possui PIX associado.' },
        { status: 404 }
      );
    }

    // Verificar se o pagamento já foi confirmado
    if (order.payment_status === 'succeeded' || order.status === 'waiting_delivery') {
      return NextResponse.json(
        { 
          error: 'Pagamento já confirmado.',
          paymentConfirmed: true,
        },
        { status: 400 }
      );
    }

    console.log('✅ Pedido encontrado com PIX:', {
      orderId: order.id,
      pixQrCodeId: order.pix_qrcode_id,
      status: order.status,
      payment_status: order.payment_status,
      hasPaymentUrl: !!order.payment_url,
      hasPaymentData: !!order.payment_data,
    });

    // Buscar dados do PIX que foram salvos quando foi criado
    // O QR code e o código copia-e-cola só existem no momento da criação
    const paymentUrl = order.payment_url; // Código PIX "Copia e Cola" (brCode)
    
    // Buscar payment_data que pode conter o QR code
    let qrCodeBase64 = '';
    let expiresAt = '';
    let customerData = null;
    
    // Se houver payment_data (quando foi criado via PIX)
    if (order.payment_data && typeof order.payment_data === 'object') {
      console.log('📦 Payment Data encontrado:', order.payment_data);
      qrCodeBase64 = order.payment_data.qrCodeBase64 || order.payment_data.brCodeBase64 || '';
      expiresAt = order.payment_data.expiresAt || '';
      customerData = order.payment_data.customer || null;
    }

    // Se não tiver expiresAt no payment_data, buscar da AbacatePay
    if (!expiresAt) {
      console.log('🔍 Buscando dados atualizados da AbacatePay...');
      
      const apiKey = process.env.ABACATEPAY_API_KEY;
      if (!apiKey) {
        console.error('❌ A chave da API da AbacatePay não está configurada.');
        return NextResponse.json(
          { error: 'Erro interno de configuração do servidor.' },
          { status: 500 }
        );
      }

      // Buscar status atual do PIX na AbacatePay
      const response = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${order.pix_qrcode_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const responseData = await response.json();

      if (response.ok && responseData.data) {
        expiresAt = responseData.data.expiresAt;
        console.log('✅ ExpiresAt obtido da AbacatePay:', expiresAt);
      }
    }

    // Verificar se o PIX está expirado
    const now = new Date().getTime();
    const expiry = expiresAt ? new Date(expiresAt).getTime() : 0;
    const isExpired = expiry > 0 && now > expiry;

    // Garantir que amount é um número válido (em centavos)
    const amount = Math.round(order.total_amount * 100);

    // Garantir que o QR code está no formato correto (data URL)
    if (qrCodeBase64 && !qrCodeBase64.startsWith('data:')) {
      qrCodeBase64 = `data:image/png;base64,${qrCodeBase64}`;
    }

    console.log('📷 Dados finais do PIX:', {
      hasQrCode: !!qrCodeBase64,
      qrCodeLength: qrCodeBase64.length,
      hasCopyPaste: !!paymentUrl,
      copyPasteLength: paymentUrl?.length,
      amount: amount,
      isExpired: isExpired,
      expiresAt: expiresAt,
    });

    // Retornar dados do PIX para o frontend
    return NextResponse.json({
      id: order.pix_qrcode_id,
      status: order.status,
      amount: amount,
      qrCode: qrCodeBase64,
      copyPaste: paymentUrl || '',
      expiresAt: expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos default
      isExpired: isExpired,
      orderId: order.id,
      customer: customerData,
    });

  } catch (error) {
    console.error('❌ Erro ao buscar PIX:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { error: 'Erro ao buscar dados do PIX.', details: errorMessage },
      { status: 500 }
    );
  }
}

