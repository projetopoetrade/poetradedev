import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildAbsoluteUrl(pathOrUrl: string): string {
  try {
    const url = new URL(pathOrUrl, process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net");
    return url.toString();
  } catch {
    return `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
  }
}

export function getHreflangAlternates(pathsByLocale: Record<string, string>) {
  const entries = Object.entries(pathsByLocale);
  const languages: Record<string, string> = {};
  for (const [locale, path] of entries) {
    languages[locale] = buildAbsoluteUrl(path);
  }
  return { languages };
}

export function buildCanonical(pathOrUrl: string) {
  return buildAbsoluteUrl(pathOrUrl);
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

