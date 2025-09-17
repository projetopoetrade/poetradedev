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
  apiSource: 'openexchangerates' | 'frankfurter' | 'fallback'
}

// Fallback exchange rates in case API fails
const fallbackRates = {
  USD: 1,
  EUR: 0.93,
  GBP: 0.79,
  BRL: 5.60
}

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BRL: 'R$'
}

// Replace with your actual API key
const OPEN_EXCHANGE_RATES_APP_ID = process.env.NEXT_PUBLIC_OPEN_EXCHANGE_RATES_API_KEY || ''

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyType>('USD')
  const [exchangeRates, setExchangeRates] = useState(fallbackRates)
  const [isLoading, setIsLoading] = useState(false)
  const [apiSource, setApiSource] = useState<'openexchangerates' | 'frankfurter' | 'fallback'>('fallback')
  const [isMounted, setIsMounted] = useState(false)
  
  // Handle client-side initialization and load saved currency
  useEffect(() => {
    setIsMounted(true)
    const savedCurrency = localStorage.getItem('selectedCurrency') as CurrencyType
    if (savedCurrency && ['USD', 'EUR', 'GBP', 'BRL'].includes(savedCurrency)) {
      setCurrency(savedCurrency)
    }
  }, [])

  // Fetch exchange rates from API
  const fetchExchangeRates = async () => {
    if (!isMounted) return // Don't fetch during SSR

    try {
      setIsLoading(true)
      
      // First try OpenExchangeRates API (with user's API key)
      if (OPEN_EXCHANGE_RATES_APP_ID) {
        try {
          const response = await fetch(
            `https://openexchangerates.org/api/latest.json?app_id=${OPEN_EXCHANGE_RATES_APP_ID}&symbols=EUR,GBP,BRL`
          )
          
          if (!response.ok) {
            throw new Error('Failed to fetch from OpenExchangeRates')
          }
          
          const data = await response.json()
          
          if (!data.rates || !data.rates.EUR || !data.rates.GBP || !data.rates.BRL) {
            throw new Error('Invalid API response format from OpenExchangeRates')
          }
          
          setExchangeRates({
            USD: 1,
            EUR: data.rates.EUR,
            GBP: data.rates.GBP,
            BRL: data.rates.BRL
          })
          
          setApiSource('openexchangerates')
          return
        } catch (openExchangeError) {
          console.warn('OpenExchangeRates API failed, trying Frankfurter', openExchangeError)
        }
      }
      
      // Try Frankfurter API as fallback
      try {
        const response = await fetch(
          'https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,BRL'
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch from Frankfurter')
        }
        
        const data = await response.json()
        
        if (!data.rates || !data.rates.EUR || !data.rates.GBP || !data.rates.BRL) {
          throw new Error('Invalid API response format from Frankfurter')
        }
        
        setExchangeRates({
          USD: 1,
          EUR: data.rates.EUR,
          GBP: data.rates.GBP,
          BRL: data.rates.BRL
        })
        
        setApiSource('frankfurter')
        return
      } catch (frankfurterError) {
        console.error('Frankfurter API failed', frankfurterError)
        throw new Error('All currency APIs failed')
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
      setExchangeRates(fallbackRates)
      setApiSource('fallback')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch rates on mount and set up periodic refresh
  useEffect(() => {
    if (!isMounted) return // Don't fetch during SSR

    fetchExchangeRates()
    const intervalId = setInterval(fetchExchangeRates, 6 * 60 * 60 * 1000)
    return () => clearInterval(intervalId)
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