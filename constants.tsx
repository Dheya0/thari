
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
  { code: 'YER_ADEN', symbol: 'ر.ي (عدن)', name: 'ريال يمني - عدن' },
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
// القيم الافتراضية (يمكن للمستخدم تعديلها من الإعدادات)
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  SAR: 1.00,          // Base

  // العملات العالمية
  USD: 3.75,          
  EUR: 4.10,
  AED: 1.02,
  KWD: 12.20,
  OMR: 9.74,
  QAR: 1.03,
  BHD: 9.95,
  JOD: 5.29,
  GBP: 4.80,
  EGP: 0.08, // تقريبي
  INR: 0.045,

  // الريال اليمني (قيم تقريبية للمساعدة، التعديل متاح في الإعدادات)
  // المنطق: إذا كان 1 ريال سعودي = 140 يمني
  // فإن قيمة 1 يمني بالريال السعودي = 1 / 140
  YER_SANAA: 1 / 140.0, 
  
  // إذا كان 1 ريال سعودي = 430 يمني (عدن)
  YER_ADEN: 1 / 430.0,
  
  // Legacy support just in case
  YER: 1 / 430.0,
};

// Helper to convert amounts accurately using provided rates
export const convertCurrency = (
  amount: number, 
  fromCode: string, 
  toCode: string, 
  customRates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number => {
  if (fromCode === toCode) return amount;
  
  // تطبيع الكود القديم إن وجد
  const normalizedFrom = fromCode === 'YER' ? 'YER_ADEN' : fromCode;
  const normalizedTo = toCode === 'YER' ? 'YER_ADEN' : toCode;

  // Get rates relative to SAR
  const fromRate = customRates[normalizedFrom] || DEFAULT_EXCHANGE_RATES[normalizedFrom] || 0;
  const toRate = customRates[normalizedTo] || DEFAULT_EXCHANGE_RATES[normalizedTo] || 0;

  if (fromRate === 0 || toRate === 0) return amount;

  // Step 1: Convert 'from' currency to SAR
  const amountInSAR = amount * fromRate;

  // Step 2: Convert SAR to 'to' currency
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
