
export type TransactionType = 'income' | 'expense' | 'transfer_to_goal';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export interface Wallet {
  id: string;
  name: string;
  currencyCode: string;
  color: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  walletId?: string; // Linked wallet
  targetDate?: string; // When the user wants to reach this
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

export interface DebtInstallment {
  id: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
}

export interface Debt {
  id: string;
  personName: string;
  amount: number; // Total amount
  paidAmount: number; // Amount paid so far
  type: 'to_me' | 'on_me';
  createdAt: string; // Date the debt was created
  dueDate?: string;  // Expected repayment date (final)
  isPaid: boolean; // True only if fully paid
  note: string;
  currency: string;
  installments?: DebtInstallment[]; // Optional list of installments
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

export interface AppState {
  userName: string;
  transactions: Transaction[];
  subscriptions: Subscription[];
  chatHistory: ChatMessage[];
  categories: Category[];
  wallets: Wallet[];
  goals: Goal[];
  debts: Debt[];
  budgets: Budget[];
  currency: Currency;
  currencies: Currency[];
  exchangeRates: Record<string, number>; // Custom Exchange Rates (Base: SAR)
  isDarkMode: boolean;
  pin: string | null;
  isLocked: boolean;
  isTravelMode: boolean;
  hasAcceptedTerms: boolean;
  showSeparateCurrencies: boolean; // Toggle for Travel Mode
  apiKey?: string; // User provided API Key for better security
}
