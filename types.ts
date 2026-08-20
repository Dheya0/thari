
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment' | 'transfer_to_goal';

export type SyncState = 'LOCAL_ONLY' | 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';

export interface Account {
  id: string;
  name: string;
  type: 'personal' | 'business' | 'family' | 'project';
  description?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export interface Wallet {
  id: string;
  accountId?: string;
  name: string;
  currencyCode: string;
  color: string;
  type?: 'cash' | 'bank' | 'savings' | 'ewallet';
  openingBalance?: number;
  currentBalance?: number;
  status?: 'active' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceiptAttachment {
  id: string;
  transactionId?: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string; // Base64 safe image / document
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId?: string;
  walletId: string;
  destinationWalletId?: string; // For transfers
  currency: string;
  destinationCurrency?: string; // Cross-currency transfer
  destinationAmount?: number;   // Amount in destination currency
  categoryId: string;
  type: TransactionType;
  amount: number;
  note: string;
  description?: string;
  date: string;
  time?: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  receipt?: ReceiptAttachment;
  isDeleted?: boolean;
  deletedAt?: string;
  deviceId?: string;
  syncStatus?: SyncState;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  recurrenceId?: string;
  occurrenceDate?: string;
}

export interface RecurringRule {
  id: string;
  accountId?: string;
  walletId: string;
  destinationWalletId?: string;
  type: 'income' | 'expense' | 'transfer';
  categoryId: string;
  amount: number;
  currency: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextOccurrence: string;
  lastGeneratedDate?: string;
  isActive: boolean;
  createdAt: string;
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
  id?: string;
  categoryId: string;
  amount: number;
  currencyCode?: string;
  period?: 'monthly' | 'weekly' | 'custom';
  startDate?: string;
  endDate?: string;
}

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  icon?: string;
  region?: string;
  decimalPlaces?: number;
  isActive?: boolean;
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AuditLog {
  id: string;
  action: 'transaction_created' | 'transaction_updated' | 'transaction_deleted' | 'transaction_restored' | 'wallet_created' | 'wallet_updated' | 'transfer_executed' | 'backup_created' | 'backup_restored';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface AppState {
  accounts: Account[];
  activeAccountId: string;
  userName: string;
  userEmail?: string;
  transactions: Transaction[];
  trashTransactions: Transaction[];
  recurringRules: RecurringRule[];
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
  auditLogs: AuditLog[];
  isDarkMode: boolean;
  pin: string | null;
  pinSalt?: string;
  isLocked: boolean;
  isBiometricEnabled?: boolean;
  isTravelMode: boolean;
  hasAcceptedTerms: boolean;
  showSeparateCurrencies: boolean; // Toggle for Travel Mode
  apiKey?: string; // User provided API Key for better security
  lastBackupDate?: string; // ISO date string of last backup taken
  autoLockTime?: 'instant' | '1min' | '5min' | 'never'; // Auto-lock timeout
  requireBiometricOnOpen?: boolean; // Require biometric / PIN on every app launch or background resume
  autoBackupFrequency?: 'on_open' | 'daily' | 'weekly' | 'disabled'; // Auto-backup frequency
  lastAutoBackupTime?: string; // ISO date string of last automatic backup
  syncStatus?: SyncState;
}
