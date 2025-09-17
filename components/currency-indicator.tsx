'use client'

import { useCurrency } from '@/lib/contexts/currency-context'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown, Loader2, RefreshCw, Globe, Info } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface CurrencyIndicatorProps {
  variant?: 'icon' | 'full'
}

export function CurrencyIndicator({ variant = 'icon' }: CurrencyIndicatorProps) {
  const { currency, setCurrency, isLoading, refreshRates, apiSource } = useCurrency()
  
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    BRL: 'R$'
  }
  
  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'BRL', label: 'BRL (R$)' }
  ]
  
  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent dropdown from closing
    await refreshRates()
  }
  
  const getApiSourceBadge = () => {
    switch (apiSource) {
      case 'openexchangerates':
        return (
          <Badge variant="secondary" className="ml-auto text-[10px] px-1 py-0">
            <Globe className="h-2.5 w-2.5 mr-1" />
            <span>OpenExchangeRates</span>
          </Badge>
        )
      case 'frankfurter':
        return (
          <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0">
            <Globe className="h-2.5 w-2.5 mr-1" />
            <span>Frankfurter</span>
          </Badge>
        )
      case 'fallback':
        return (
          <Badge variant="destructive" className="ml-auto text-[10px] px-1 py-0">
            <Info className="h-2.5 w-2.5 mr-1" />
            <span>Fallback</span>
          </Badge>
        )
      default:
        return null
    }
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-8 h-8 rounded-full p-0 text-foreground/80 hover:bg-accent hover:text-accent-foreground"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              currencySymbols[currency as keyof typeof currencySymbols]
            )}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 h-9 text-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <span className="font-medium">{currencySymbols[currency as keyof typeof currencySymbols]}</span>
            )}
            <span>{currency}</span>
            <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel className="flex items-center text-xs text-muted-foreground">
          <span>Currency</span>
          {getApiSourceBadge()}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {currencyOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setCurrency(option.value as 'USD' | 'EUR' | 'GBP' | 'BRL')}
            className="cursor-pointer flex justify-between items-center"
            disabled={isLoading}
          >
            {option.label}
            {currency === option.value && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuItem
                className="cursor-pointer justify-center text-xs text-muted-foreground"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh Rates</span>
                  </div>
                )}
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Get latest exchange rates</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 