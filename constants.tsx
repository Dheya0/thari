
import React from 'react';
import { 
  Utensils, Car, Home, Receipt, Film, HeartPulse, GraduationCap, 
  Briefcase, Wallet, CreditCard, ShoppingBag, Gift, PiggyBank,
  Coffee, Zap, Bus, Plane, Smartphone, ShieldCheck
} from 'lucide-react';
import { Category, Currency } from './types';

export const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' },
  { code: 'YER', symbol: 'ر.ي', name: 'ريال يمني' },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي' },
  { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري' },
  { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي' },
];

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
