
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

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  type: 'to_me' | 'on_me'; // to_me: someone owes me, on_me: i owe someone
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

export type AppState = {
  userName: string;
  transactions: Transaction[];
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
