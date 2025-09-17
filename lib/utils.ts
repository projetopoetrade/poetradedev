import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = 'USD', locale: string = 'en-US') {
  // Default to USD if currency is missing or invalid
  const currencyCode = currency ? currency.toUpperCase() : 'USD';
  
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(price);
  } catch (error) {
    // Fallback to basic formatting if there's an error with the currency code
    console.error(`Error formatting price with currency ${currencyCode}:`, error);
    return `${currencyCode} ${price.toFixed(2)}`;
  }
}

