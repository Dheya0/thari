
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  note: string;
  date: string;
  currency: string;
  frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
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
  budgets: Budget[];
  currency: Currency;
  currencies: Currency[];
  isDarkMode: boolean;
  pin: string | null;
  isLocked: boolean;
};
