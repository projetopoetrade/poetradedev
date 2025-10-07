// app/api/pix/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// --- Tipos da Requisição (o que o frontend envia) ---
interface Customer {
  name?: string;
  taxId: string; // CPF (AbacatePay usa taxId)
  cellphone: string;
  email: string;
}

interface CartItem {
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
  };
  quantity: number;
}

interface CreatePixRequest {
  amount: number;
  expiresIn?: number;
  description?: string;
  customer: Customer;
  characterName: string;
  observations?: string;
  items: CartItem[]; // Items do carrinho
  orderId?: string; // ID do pedido existente (opcional, para renovação de PIX)
}

// --- Tipos da Resposta (o que nossa API retorna) ---
interface ErrorResponse {
  error: string;
  details?: any;
}

// Tipo específico para a resposta de sucesso da AbacatePay
interface AbacatePayPixData {
  id: string;
  amount: number;
  status: string;
  devMode: boolean;
  brCode: string;           // Código PIX "Copia e Cola"
  brCodeBase64: string;     // QR Code em base64
  platformFee: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface AbacatePayResponse {
  data: AbacatePayPixData;
  error: null | string;
}

// Tipo que retornamos para o frontend (simplificado)
interface PixSuccessResponse {
  id: string;
  status: string;
  amount: number;
  qrCode: string;      // brCodeBase64
  copyPaste: string;   // brCode
  expiresAt: string;
  orderId: string;     // ID do pedido criado no banco
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Por favor, faça login.' },
        { status: 401 }
      );
    }

    const body = await req.json() as CreatePixRequest;
    const { amount, expiresIn = 900, description, customer, characterName, observations, items, orderId } = body;

    console.log('📝 Recebendo requisição PIX:', {
      userId: user.id,
      userEmail: user.email,
      amount,
      characterName,
      customer: {
        email: customer.email,
        taxId: customer.taxId,
        cellphone: customer.cellphone,
      }
    });

    // Validações
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'O valor deve ser maior que zero.' },
        { status: 400 }
      );
    }

    if (!customer || !customer.taxId || !customer.cellphone || !customer.email) {
      return NextResponse.json(
        { error: 'Dados do cliente incompletos (taxId/CPF, cellphone, email são obrigatórios).' },
        { status: 400 }
      );
    }

    if (!characterName) {
      return NextResponse.json(
        { error: 'Nome do personagem é obrigatório.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items do carrinho são obrigatórios.' },
        { status: 400 }
      );
    }

    // Verificar API Key
    const apiKey = process.env.ABACATEPAY_API_KEY;
    if (!apiKey) {
      console.error('❌ A chave da API da AbacatePay não está configurada.');
      return NextResponse.json(
        { error: 'Erro interno de configuração do servidor.' },
        { status: 500 }
      );
    }

    // Preparar dados para AbacatePay
    const abacatePayload = {
      amount,
      expiresIn,
      description: description || `Pedido - ${characterName}`,
      customer: {
        name: characterName, // Usando o nome do personagem como nome do cliente
        taxId: customer.taxId, // AbacatePay usa taxId ao invés de document
        cellphone: customer.cellphone,
        email: customer.email,
      },
      metadata: {
        userId: user.id,
        characterName: characterName,
        observations: observations || '',
      },
    };

    console.log('🚀 Enviando para AbacatePay:', {
      amount: abacatePayload.amount,
      expiresIn: abacatePayload.expiresIn,
      description: abacatePayload.description,
    });

    // Chamar API da AbacatePay
    const response = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(abacatePayload),
    });

    const responseData = await response.json() as AbacatePayResponse;

    if (!response.ok || responseData.error) {
      console.error('❌ Erro da AbacatePay:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData.error,
        data: responseData,
      });

      return NextResponse.json(
        {
          error: responseData.error || 'Falha ao criar o QRCode do PIX.',
          details: responseData,
        },
        { status: response.status }
      );
    }

    const pixData = responseData.data;

    console.log('✅ PIX criado com sucesso:', {
      id: pixData.id,
      status: pixData.status,
      amount: pixData.amount,
      expiresAt: pixData.expiresAt,
      devMode: pixData.devMode,
    });

    // Preparar payment_data com todas as informações do PIX
    const pixPaymentData = {
      id: pixData.id,
      amount: pixData.amount,
      status: pixData.status,
      brCode: pixData.brCode,
      brCodeBase64: pixData.brCodeBase64, // QR Code em base64
      qrCodeBase64: pixData.brCodeBase64, // Alias para facilitar
      expiresAt: pixData.expiresAt,
      createdAt: pixData.createdAt,
      devMode: pixData.devMode,
      customer: {
        taxId: customer.taxId,
        cellphone: customer.cellphone,
        email: customer.email,
      },
    };

    let order;

    // Se já existe um orderId, atualizar o pedido existente
    if (orderId) {
      console.log('🔄 Tentando atualizar pedido existente com novo PIX:', orderId);
      
      // Usar cliente admin para atualizar (bypassa RLS)
      const adminSupabase = createAdminClient();
      
      // Primeiro verificar se o pedido existe
      const { data: existingOrder, error: checkError } = await adminSupabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (checkError || !existingOrder) {
        console.warn('⚠️ Pedido não encontrado:', {
          orderId,
          error: checkError?.message,
        });
        console.log('💾 Criando novo pedido ao invés de atualizar...');
        // Se não encontrar, criar novo pedido abaixo
      } else {
        console.log('✅ Pedido encontrado, verificando proprietário:', {
          orderId: existingOrder.id,
          orderUserId: existingOrder.user_id,
          currentUserId: user.id,
        });

        // Verificar se o pedido pertence ao usuário atual
        if (existingOrder.user_id !== user.id) {
          console.error('❌ Pedido não pertence ao usuário atual!');
          return NextResponse.json(
            { error: 'Você não tem permissão para atualizar este pedido.' },
            { status: 403 }
          );
        }

        // Pedido encontrado e pertence ao usuário, atualizar com admin
        const { data: updatedOrder, error: updateError } = await adminSupabase
          .from('orders')
          .update({
            pix_qrcode_id: pixData.id,
            payment_url: pixData.brCode,
            payment_data: pixPaymentData,
          })
          .eq('id', orderId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Erro ao atualizar pedido:', updateError);
          return NextResponse.json(
            { 
              error: 'Falha ao atualizar pedido com novo PIX.',
              details: updateError.message 
            },
            { status: 500 }
          );
        }

        order = updatedOrder;
        console.log('✅ Pedido atualizado com sucesso:', {
          orderId: order.id,
          characterName: order.character_name,
          pixId: pixData.id,
          oldPixId: existingOrder.pix_qrcode_id,
        });
      }
    }

    // Se não conseguiu atualizar ou não tinha orderId, criar novo pedido
    if (!order) {
      // Criar novo pedido no banco de dados
      console.log('💾 Criando novo pedido no banco de dados...');
      const totalAmount = amount / 100; // Converter centavos para reais

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          character_name: characterName,
          email: customer.email,
          items: items,
          total_amount: totalAmount,
          currency: 'brl',
          status: 'pending',
          user_id: user.id,
          payment_method: 'pix',
          pix_qrcode_id: pixData.id, // ID do QRCode PIX da AbacatePay
          payment_url: pixData.brCode, // Código PIX "Copia e Cola"
          payment_data: pixPaymentData, // Dados completos do PIX incluindo QR code
          observations: observations || null,
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Erro ao criar pedido:', orderError);
        return NextResponse.json(
          { 
            error: 'Falha ao criar pedido no banco de dados.',
            details: orderError.message 
          },
          { status: 500 }
        );
      }

      order = newOrder;
      console.log('✅ Pedido criado com sucesso:', {
        orderId: order.id,
        characterName: order.character_name,
        totalAmount: order.total_amount,
        pixId: pixData.id,
      });
    }

    // Transformar para o formato que o frontend espera
    const successResponse: PixSuccessResponse = {
      id: pixData.id,
      status: pixData.status,
      amount: pixData.amount,
      qrCode: pixData.brCodeBase64,
      copyPaste: pixData.brCode,
      expiresAt: pixData.expiresAt,
      orderId: order.id,
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    console.error('❌ Erro ao processar requisição PIX:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor ao processar a requisição.',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}