import { NextResponse } from 'next/server'
import { getExchangeRates } from '@/lib/pricing/exchange-rates'

// Cache rates for 24 hours (86400 seconds)
export const revalidate = 86400

/**
 * Taxas exibidas no front. A busca vive em `lib/pricing/exchange-rates` porque o
 * checkout do Pix precisa da MESMA taxa para calcular quanto cobrar — se as duas
 * pontas usassem fontes diferentes, o usuário veria um preço e pagaria outro.
 */
export async function GET() {
  const { rates, source } = await getExchangeRates()

  return NextResponse.json({
    rates,
    source,
    date: new Date().toISOString().split('T')[0],
  })
}
