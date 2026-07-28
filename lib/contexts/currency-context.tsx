'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type CurrencyType = 'USD' | 'EUR' | 'GBP' | 'BRL'

interface CurrencyContextType {
  currency: CurrencyType
  setCurrency: (currency: CurrencyType) => void
  formatPrice: (price: number) => string
  formatPriceWithoutSymbol: (price: number) => string
  convertPrice: (price: number) => number
  priceToCents: (price: number) => number
  isLoading: boolean
  refreshRates: () => Promise<void>
  apiSource: 'frankfurter' | 'fallback'
}

// Último recurso, só se `/api/exchange-rates` não responder.
//
// Precisa espelhar `FALLBACK_RATES` de `lib/pricing/exchange-rates.ts`: aquele
// decide quanto o cliente PAGA e este decide o que ele VÊ. Divergir entre os dois
// é mostrar um preço e cobrar outro. O valor antigo aqui (R$5,60) estava 10%
// acima do mercado (R$5,09 em 28/07/2026).
const fallbackRates = {
  USD: 1,
  EUR: 0.8788,
  GBP: 0.7519,
  BRL: 5.0919
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyType>('USD')
  const [exchangeRates, setExchangeRates] = useState(fallbackRates)
  const [isLoading, setIsLoading] = useState(false)
  const [apiSource, setApiSource] = useState<'frankfurter' | 'fallback'>('fallback')
  const [isMounted, setIsMounted] = useState(false)

  // Handle client-side initialization and load saved currency
  useEffect(() => {
    setIsMounted(true)
    const savedCurrency = localStorage.getItem('selectedCurrency') as CurrencyType
    if (savedCurrency && ['USD', 'EUR', 'GBP', 'BRL'].includes(savedCurrency)) {
      setCurrency(savedCurrency)
    }
  }, [])

  // Fetch exchange rates from our server-cached endpoint (1 external call/day)
  const fetchExchangeRates = async () => {
    if (!isMounted) return

    try {
      setIsLoading(true)

      const response = await fetch('/api/exchange-rates')

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates')
      }

      const data = await response.json()

      setExchangeRates(data.rates)
      setApiSource(data.source)
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
      setExchangeRates(fallbackRates)
      setApiSource('fallback')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch rates on mount
  useEffect(() => {
    if (!isMounted) return
    fetchExchangeRates()
  }, [isMounted])
  
  // Save currency preference to localStorage when it changes
  useEffect(() => {
    if (!isMounted) return // Don't save during SSR
    localStorage.setItem('selectedCurrency', currency)
  }, [currency, isMounted])
  
  const convertPrice = (priceInUSD: number): number => {
    if (currency === 'USD') return priceInUSD
    
    const rate = exchangeRates[currency]
    if (!rate) {
      console.error('No exchange rate found for currency:', currency)
      return priceInUSD
    }

    return Number((priceInUSD * rate).toFixed(2))
  }
  
  const formatPrice = (price: number): string => {
    if (!isMounted) return `$${price.toFixed(2)}` // Default format during SSR

    const locale = {
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'BRL': 'pt-BR'
    }[currency] || 'en-US'

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatPriceWithoutSymbol = (price: number): string => {
    if (!isMounted) return price.toFixed(2) // Default format during SSR

    const locale = {
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'BRL': 'pt-BR'
    }[currency] || 'en-US'

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }
  
  const priceToCents = (price: number): number => {
    return Math.round(price * 100)
  }
  
  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatPrice,
      formatPriceWithoutSymbol,
      convertPrice,
      priceToCents,
      isLoading,
      refreshRates: fetchExchangeRates,
      apiSource
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
} 