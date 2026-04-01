import { NextResponse } from 'next/server'

// Cache rates for 24 hours (86400 seconds)
export const revalidate = 86400

const fallbackRates = {
  USD: 1,
  EUR: 0.93,
  GBP: 0.79,
  BRL: 5.60,
}

export async function GET() {
  try {
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,BRL',
      { next: { revalidate: 86400 } }
    )

    if (!response.ok) {
      throw new Error('Frankfurter API failed')
    }

    const data = await response.json()

    if (!data.rates?.EUR || !data.rates?.GBP || !data.rates?.BRL) {
      throw new Error('Invalid response from Frankfurter')
    }

    return NextResponse.json({
      rates: {
        USD: 1,
        EUR: data.rates.EUR,
        GBP: data.rates.GBP,
        BRL: data.rates.BRL,
      },
      source: 'frankfurter',
      date: data.date,
    })
  } catch (error) {
    console.error('Exchange rates fetch failed, using fallback:', error)

    return NextResponse.json({
      rates: fallbackRates,
      source: 'fallback',
      date: new Date().toISOString().split('T')[0],
    })
  }
}
