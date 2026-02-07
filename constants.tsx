
import React from 'react';
import { 
  Utensils, Car, Home, Receipt, Film, HeartPulse, GraduationCap, 
  Briefcase, Wallet, CreditCard, ShoppingBag, Gift, PiggyBank,
  Coffee, Zap, Bus, Plane, Smartphone, ShieldCheck
} from 'lucide-react';
import { Category, Currency } from './types';

export const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' },
  { code: 'YER_SANAA', symbol: 'ر.ي (صنعاء)', name: 'ريال يمني - صنعاء' },
  { code: 'YER', symbol: 'ر.ي (عدن)', name: 'ريال يمني - عدن' },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي' },
  { code: 'EUR', symbol: '€', name: 'يورو' },
  { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي' },
  { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي' },
  { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري' },
  { code: 'OMR', symbol: 'ر.ع', name: 'ريال عماني' },
  { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري' },
  { code: 'JOD', symbol: 'د.أ', name: 'دينار أردني' },
  { code: 'BHD', symbol: 'د.ب', name: 'دينار بحريني' },
  { code: 'GBP', symbol: '£', name: 'جنيه إسترليني' },
  { code: 'INR', symbol: '₹', name: 'روبية هندية' },
];

// Exchange Rates Base: 1 Unit of Currency = X SAR (Saudi Riyal)
// جدول التحويل: قيمة الوحدة الواحدة من العملة مقابل الريال السعودي
export const CURRENCY_RATES_TO_SAR: Record<string, number> = {
  SAR: 1.00,          // Base Currency

  // Foreign Currencies (User Provided Rates against SAR)
  USD: 3.750000,
  AED: 1.020960,
  BHD: 9.946940,
  KWD: 12.203050,
  OMR: 9.740250,
  QAR: 1.029930,
  GBP: 5.105250,
  CHF: 4.837140,
  EUR: 4.432310,
  JOD: 5.290000,      // Approx standard
  EGP: 0.121000,      // Approx
  INR: 0.045000,      // Approx

  // Yemeni Rial (Sanaa)
  // User Data: 1 SAR = 140.10 YER_SANAA
  // Logic: Value of 1 YER_SANAA in SAR = 1 / 140.10
  YER_SANAA: 1 / 140.10, // ~ 0.0071377

  // Yemeni Rial (Aden)
  // Market Estimate: 1 SAR = ~440 YER (Aden) - distinct from Sanaa
  // Logic: Value of 1 YER in SAR = 1 / 440
  YER: 1 / 440.00,       // ~ 0.0022727
};

// Helper to convert amounts accurately
export const convertCurrency = (amount: number, fromCode: string, toCode: string): number => {
  if (fromCode === toCode) return amount;
  
  // Get rates relative to SAR
  const fromRate = CURRENCY_RATES_TO_SAR[fromCode] || 0;
  const toRate = CURRENCY_RATES_TO_SAR[toCode] || 0;

  if (fromRate === 0 || toRate === 0) return amount;

  // Step 1: Convert 'from' currency to SAR
  const amountInSAR = amount * fromRate;

  // Step 2: Convert SAR to 'to' currency
  // If Target is SAR, we are done.
  // If Target is Other, we divide by its rate to SAR.
  return amountInSAR / toRate;
};

export const INITIAL_CATEGORIES: Category[] = [
  // Expenses
  { id: '1', name: 'طعام', icon: 'Utensils', color: '#ef4444', type: 'expense' },
  { id: '2', name: 'مواصلات', icon: 'Car', color: '#f59e0b', type: 'expense' },
  { id: '3', name: 'سكن', icon: 'Home', color: '#3b82f6', type: 'expense' },
  { id: '4', name: 'فواتير', icon: 'Receipt', color: '#10b981', type: 'expense' },
  { id: '5', name: 'ترفيه', icon: 'Film', color: '#8b5cf6', type: 'expense' },
  { id: '6', name: 'صحة', icon: 'HeartPulse', color: '#ec4899', type: 'expense' },
  { id: '7', name: 'تعليم', icon: 'GraduationCap', color: '#6366f1', type: 'expense' },
  { id: '8', name: 'تسوق', icon: 'ShoppingBag', color: '#f43f5e', type: 'expense' },
  // Income
  { id: '9', name: 'راتب', icon: 'Wallet', color: '#10b981', type: 'income' },
  { id: '10', name: 'عمل حر', icon: 'Briefcase', color: '#06b6d4', type: 'income' },
  { id: '11', name: 'استثمار', icon: 'PiggyBank', color: '#84cc16', type: 'income' },
  { id: '12', name: 'هدية', icon: 'Gift', color: '#f97316', type: 'income' },
];

export const getIcon = (name: string, size = 20) => {
  const icons: Record<string, any> = {
    Utensils, Car, Home, Receipt, Film, HeartPulse, GraduationCap, 
    Briefcase, Wallet, CreditCard, ShoppingBag, Gift, PiggyBank,
    Coffee, Zap, Bus, Plane, Smartphone, ShieldCheck
  };
  const IconComp = icons[name] || Wallet;
  return <IconComp size={size} />;
};
