import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface AbacatePayCheckResponse {
  data: {
    id: string;
    status: string;
    amount: number;
    expiresAt: string;
    devMode: boolean;
    [key: string]: any;
  };
  error?: string;
}

export async function GET(req: NextRequest) {
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

    // Obter o ID do PIX dos parâmetros da URL
    const searchParams = req.nextUrl.searchParams;
    const pixId = searchParams.get('id');

    if (!pixId) {
      return NextResponse.json(
        { error: 'ID do PIX é obrigatório.' },
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

    console.log('🔍 Verificando status do PIX:', pixId);

    // Chamar API da AbacatePay para verificar status
    const response = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${pixId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const responseData: AbacatePayCheckResponse = await response.json();

    if (!response.ok || responseData.error) {
      console.error('❌ Erro ao verificar PIX:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData.error,
        data: responseData,
      });

      return NextResponse.json(
        {
          error: responseData.error || 'Falha ao verificar status do PIX.',
          details: responseData,
        },
        { status: response.status }
      );
    }

    const pixStatus = responseData.data;

    console.log('✅ Status do PIX obtido:', {
      id: pixStatus.id,
      status: pixStatus.status,
      amount: pixStatus.amount,
      expiresAt: pixStatus.expiresAt,
      devMode: pixStatus.devMode,
    });

    console.log('📦 Resposta completa da API Abacatepay:', JSON.stringify(responseData, null, 2));

    return NextResponse.json({
      id: pixStatus.id,
      status: pixStatus.status,
      amount: pixStatus.amount,
      expiresAt: pixStatus.expiresAt,
      devMode: pixStatus.devMode,
      rawData: pixStatus, // Retornar dados completos para debug
    });

  } catch (error) {
    console.error('❌ Erro ao verificar PIX:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { error: 'Erro ao verificar status do PIX.', details: errorMessage },
      { status: 500 }
    );
  }
}

