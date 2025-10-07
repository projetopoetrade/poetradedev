import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

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

export async function POST(request: NextRequest) {
  try {
    // 1) Validação do Secret na URL
    const webhookSecret = request.nextUrl.searchParams.get('webhookSecret');
    
    if (webhookSecret !== WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    // 2) Obter o corpo bruto para validação HMAC
    const rawBody = await request.text();
    const signature = request.headers.get('X-Webhook-Signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // 3) Validar assinatura HMAC
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 4) Processar o evento
    const event = JSON.parse(rawBody);
    
    // 5) Verificar se é o evento billing.paid
    if (event.event !== 'billing.paid') {
      console.log(`Evento ignorado: ${event.event}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 6) Processar pagamento confirmado
    const { payment, pixQrCode } = event.data;
    
    console.log('💰 Pagamento PIX confirmado:', {
      id: pixQrCode.id,
      amount: payment.amount / 100, // Converter de centavos para reais
      fee: payment.fee / 100,
      method: payment.method,
      status: pixQrCode.status,
      devMode: event.devMode
    });

    // TODO: Implementar sua lógica de negócio aqui
    await processarPagamento({
      pixQrCodeId: pixQrCode.id,
      amount: payment.amount,
      fee: payment.fee,
      status: pixQrCode.status,
      eventId: event.id,
      devMode: event.devMode
    });

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Processa o pagamento confirmado
 */
async function processarPagamento(data: {
  pixQrCodeId: string;
  amount: number;
  fee: number;
  status: string;
  eventId: string;
  devMode: boolean;
}) {
  // Exemplo de implementação:
  
  // 1) Verificar se o evento já foi processado (idempotência)
  // const jaProcessado = await db.webhookEvent.findUnique({
  //   where: { id: data.eventId }
  // });
  // if (jaProcessado) return;

  // 2) Atualizar status do pedido no banco de dados
  // await db.order.update({
  //   where: { pixQrCodeId: data.pixQrCodeId },
  //   data: { 
  //     status: 'PAID',
  //     paidAt: new Date(),
  //     amount: data.amount,
  //     fee: data.fee
  //   }
  // });

  // 3) Registrar o evento como processado
  // await db.webhookEvent.create({
  //   data: {
  //     id: data.eventId,
  //     type: 'billing.paid',
  //     processedAt: new Date()
  //   }
  // });

  // 4) Disparar ações pós-pagamento
  // await enviarEmailConfirmacao(data.pixQrCodeId);
  // await liberarAcessoProduto(data.pixQrCodeId);
  
  console.log('✅ Pagamento processado com sucesso');
}
