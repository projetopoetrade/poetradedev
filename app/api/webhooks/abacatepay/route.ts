import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAdminClient } from '@/utils/supabase/admin';

// Chave pública HMAC da AbacatePay
const ABACATEPAY_PUBLIC_KEY = 
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

const WEBHOOK_SECRET = process.env.ABACATEPAY_WEBHOOK_SECRET!;

/**
 * Verifica a assinatura HMAC do webhook
 */
function verifySignature(rawBody: string, signatureFromHeader: string): boolean {
  const bodyBuffer = Buffer.from(rawBody, 'utf8');
  const expectedSig = crypto
    .createHmac('sha256', ABACATEPAY_PUBLIC_KEY)
    .update(bodyBuffer)
    .digest('base64');

  const A = Buffer.from(expectedSig);
  const B = Buffer.from(signatureFromHeader);

  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

/**
 * Helper para atualizar pedido via API
 */
async function updateOrder(
  baseUrl: string,
  orderId: string,
  options: {
    status?: string;
    payment_status?: string;
    payment_data?: any;
    paid_at?: string;
  }
) {
  console.log(`Updating order ${orderId} via API`);

  const updateEndpoint = `${baseUrl}/api/orders/update`;

  const requestBody: any = { orderId };

  if (options.status) {
    requestBody.status = options.status;
    console.log(`Setting order status to: ${options.status}`);
  }

  if (options.payment_status) {
    requestBody.payment_status = options.payment_status;
    console.log(`Setting payment status to: ${options.payment_status}`);
  }

  if (options.payment_data) {
    requestBody.payment_data = options.payment_data;
    console.log('Including payment data');
  }

  console.log('Request payload:', JSON.stringify(requestBody));

  const response = await fetch(updateEndpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  let responseData;
  try {
    responseData = await response.json();
    console.log(`API response status: ${response.status}, data:`, responseData);
  } catch (e) {
    const text = await response.text();
    console.log(`API response status: ${response.status}, text:`, text);
    responseData = { text };
  }

  if (!response.ok) {
    console.error('Failed to update order:', responseData);
    throw new Error(`Failed to update order: API returned ${response.status}`);
  }

  console.log(`Order ${orderId} successfully updated`);
  return responseData;
}

/**
 * Processa o evento billing.paid
 */
async function handleBillingPaid(event: any, baseUrl: string) {
  const { payment, pixQrCode } = event.data;
  
  console.log('Payment succeeded event received');
  console.log('💰 Payment details:', {
    pixQrCodeId: pixQrCode.id,
    amount: payment.amount / 100,
    fee: payment.fee / 100,
    method: payment.method,
    status: pixQrCode.status,
    devMode: event.devMode,
  });

  // Usar admin client pois webhooks não têm contexto de usuário autenticado
  const supabase = createAdminClient();

  // Buscar pedido pelo pix_qrcode_id
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('pix_qrcode_id', pixQrCode.id)
    .single();

  if (fetchError || !order) {
    console.error('Order not found:', {
      pixQrCodeId: pixQrCode.id,
      error: fetchError
    });
    throw new Error(`No order found for PIX QR Code: ${pixQrCode.id}`);
  }

  console.log(`Processing PIX payment: ${pixQrCode.id} for order: ${order.id}`);

  // Verificar idempotência
  if (order.status === 'waiting_delivery' || order.payment_status === 'succeeded') {
    console.log('Order already processed:', order.id);
    return { alreadyProcessed: true };
  }

  // Preparar payment_data (similar ao paymentIntent do Stripe)
  const paidAtTimestamp = new Date().toISOString();
  console.log('🕐 Generating paid_at timestamp:', paidAtTimestamp);
  
  const paymentData = {
    id: pixQrCode.id,
    amount: payment.amount,
    fee: payment.fee,
    method: payment.method,
    status: pixQrCode.status,
    kind: pixQrCode.kind,
    event_id: event.id,
    dev_mode: event.devMode,
    created: Math.floor(new Date().getTime() / 1000),
    paid_at: paidAtTimestamp,
  };

  console.log('📦 Payment data prepared:', JSON.stringify(paymentData, null, 2));

  // Atualizar pedido via API com payment_data
  console.log('🔄 Calling updateOrder with paid_at:', paidAtTimestamp);
  const result = await updateOrder(baseUrl, order.id, {
    status: 'waiting_delivery',
    payment_status: 'succeeded',
    payment_data: paymentData,
    paid_at: paidAtTimestamp,
  });

  // Enviar email de confirmação
  try {
    const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId: order.id }),
    });

    if (!emailResponse.ok) {
      console.error('Failed to send confirmation email:', await emailResponse.text());
    } else {
      console.log('Confirmation email sent successfully');
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Não falhar o webhook por erro no email
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    // Validar método HTTP
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Obter o corpo bruto
    const rawBody = await request.text();
    
    if (!rawBody) {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }

    // Validação do Secret na URL
    const webhookSecret = request.nextUrl.searchParams.get('webhookSecret');
    
    if (webhookSecret !== WEBHOOK_SECRET) {
      console.error('Invalid webhook secret');
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    // Validar assinatura HMAC
    const signature = request.headers.get('X-Webhook-Signature');

    if (!signature) {
      console.error('Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    if (!verifySignature(rawBody, signature)) {
      console.error('Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse do evento
    const event = JSON.parse(rawBody);
    
    console.log(`Webhook event received: ${event.event} (${event.id})`);

    // Validar configuração
    if (!process.env.ABACATEPAY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Obter base URL para chamadas de API
    const baseUrl = new URL(request.url).origin;

    // Processar apenas billing.paid
    let result;
    if (event.event === 'billing.paid') {
      result = await handleBillingPaid(event, baseUrl);
    } else {
      console.log(`Unhandled event type: ${event.event}`);
    }

    console.log('Webhook processed successfully');
    return NextResponse.json({ 
      received: true, 
      processed: !!result 
    });

  } catch (error) {
    console.error('Webhook error:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}
