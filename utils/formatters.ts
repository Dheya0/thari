/**
 * THARI Financial Application — Unified Formatters Engine (Single Source of Truth)
 * Eliminates all duplicate formatting functions across components and views.
 */

import { DEFAULT_CURRENCIES } from '../constants';
import { roundToCurrency } from './mathPrecision';

export interface FormatCurrencyOptions {
  showSymbol?: boolean;
  symbolPosition?: 'prefix' | 'suffix' | 'auto';
  decimalPlaces?: number;
  useGrouping?: boolean;
  locale?: string;
}

/**
 * Maps known currency codes to localized display symbols
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  SAR: 'ر.س',
  YER_SANAA: 'ر.ي (صنعاء)',
  YER_ADEN: 'ر.ي (عدن)',
  YER: 'ر.ي',
  USD: '$',
  EUR: '€',
  AED: 'د.إ',
  KWD: 'د.ك',
  OMR: 'ر.ع',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  JOD: 'د.أ',
  GBP: '£',
  EGP: 'ج.م',
  INR: '₹',
};

/**
 * Get currency symbol by currency code
 */
export function getCurrencySymbol(code: string): string {
  if (!code) return 'ر.س';
  if (CURRENCY_SYMBOLS[code]) return CURRENCY_SYMBOLS[code];
  const found = DEFAULT_CURRENCIES.find(c => c.code === code);
  return found ? found.symbol : code;
}

/**
 * Universal Currency & Number Formatter
 * Complies with strict DRY principle.
 */
export function formatMoney(
  amount: number | string | null | undefined,
  currencyCode = 'SAR',
  options: FormatCurrencyOptions = {}
): string {
  const {
    showSymbol = true,
    decimalPlaces,
    useGrouping = true,
    locale = 'en-US'
  } = options;

  const num = Number(amount) || 0;
  
  // Determine standard decimal places for currency
  let decimals = decimalPlaces;
  if (decimals === undefined) {
    if (currencyCode === 'YER_SANAA' || currencyCode === 'YER_ADEN' || currencyCode === 'YER') {
      // Yemeni Riyal typically has no fractional piasters in practical cash
      decimals = Math.abs(num) < 1000 && num % 1 !== 0 ? 2 : 0;
    } else if (currencyCode === 'KWD' || currencyCode === 'BHD' || currencyCode === 'OMR') {
      decimals = 3;
    } else {
      decimals = num % 1 === 0 ? 0 : 2;
    }
  }

  const rounded = roundToCurrency(num, decimals);
  const formattedNumber = rounded.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping
  });

  if (!showSymbol) {
    return formattedNumber;
  }

  const symbol = getCurrencySymbol(currencyCode);
  return `${formattedNumber} ${symbol}`;
}

/**
 * Compact Number Formatter for badges & widgets (e.g. 1.2M, 45K)
 */
export function formatCompactNumber(amount: number | string, locale = 'en-US'): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  }).format(num);
}

/**
 * Format standard date according to Arabic / Islamic locale
 */
export function formatAppDate(dateString: string, includeTime = false): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    
    const datePart = d.toLocaleDateString('ar-SA-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    if (!includeTime) return datePart;

    const timePart = d.toLocaleTimeString('ar-SA-u-nu-latn', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `${datePart} ${timePart}`;
  } catch {
    return dateString;
  }
}
