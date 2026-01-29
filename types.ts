
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Wallet {
  id: string;
  name: string;
  currencyCode: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  walletId: string;
  note: string;
  date: string;
  currency: string;
  frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  period: 'monthly' | 'yearly';
  categoryId: string;
  nextBillingDate: string;
  isActive: boolean;
}

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  type: 'to_me' | 'on_me';
  dueDate?: string;
  isPaid: boolean;
  note: string;
  currency: string;
}

export interface Budget {
  categoryId: string;
  amount: number;
}

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface WealthScoreData {
  score: number;
  label: string;
  color: string;
  tips: string[];
}

export type AppState = {
  userName: string;
  transactions: Transaction[];
  subscriptions: Subscription[];
  chatHistory: ChatMessage[];
  categories: Category[];
  wallets: Wallet[];
  debts: Debt[];
  budgets: Budget[];
  currency: Currency;
  currencies: Currency[];
  isDarkMode: boolean;
  pin: string | null;
  isLocked: boolean;
  hasAcceptedTerms: boolean;
};
