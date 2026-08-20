/**
 * THARI Financial Application — Core Balance & Ledger Engine
 * Single Source of Truth for financial calculations, multi-wallet balance tracking,
 * multi-currency ledger calculation, transfer consistency, and mathematical audits.
 */

import { Transaction, Wallet, Currency } from '../types';
import { convertCurrency, DEFAULT_EXCHANGE_RATES } from '../constants';

export interface WalletBalanceSummary {
  walletId: string;
  walletName: string;
  currencyCode: string;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  transfersOut: number;
  transfersIn: number;
  adjustments: number;
  currentBalance: number;
}

export interface ConsolidatedFinancialPosition {
  netWorthInBase: number;
  totalIncomeInBase: number;
  totalExpenseInBase: number;
  netCashFlowInBase: number;
  internalTransfersInBase: number;
  savingsRate: number;
  isSingleCurrency: boolean;
  activeCurrencyCode: string;
  currencyBalances: Record<string, number>;
  expenseByCurrency: Record<string, number>;
  incomeByCurrency: Record<string, number>;
  transfersByCurrency: Record<string, number>;
  walletSummaries: Record<string, WalletBalanceSummary>;
}

/**
 * Filter active (non-deleted) transactions
 */
export function getActiveTransactions(transactions: Transaction[]): Transaction[] {
  return (transactions || []).filter(t => !t.isDeleted);
}

/**
 * Calculate precise balance for each wallet independently
 */
export function calculateWalletBalances(
  wallets: Wallet[],
  transactions: Transaction[]
): Record<string, WalletBalanceSummary> {
  const activeTxs = getActiveTransactions(transactions);
  const result: Record<string, WalletBalanceSummary> = {};

  (wallets || []).forEach(w => {
    result[w.id] = {
      walletId: w.id,
      walletName: w.name,
      currencyCode: w.currencyCode,
      openingBalance: Number(w.openingBalance) || 0,
      totalIncome: 0,
      totalExpense: 0,
      transfersOut: 0,
      transfersIn: 0,
      adjustments: 0,
      currentBalance: Number(w.openingBalance) || 0,
    };
  });

  activeTxs.forEach(tx => {
    const amount = Number(tx.amount) || 0;
    if (amount <= 0) return;

    // 1. Source wallet affected
    const sourceSummary = result[tx.walletId];
    if (sourceSummary) {
      if (tx.type === 'income') {
        sourceSummary.totalIncome += amount;
        sourceSummary.currentBalance += amount;
      } else if (tx.type === 'expense' || tx.type === 'transfer_to_goal') {
        sourceSummary.totalExpense += amount;
        sourceSummary.currentBalance -= amount;
      } else if (tx.type === 'transfer') {
        sourceSummary.transfersOut += amount;
        sourceSummary.currentBalance -= amount;
      } else if (tx.type === 'adjustment') {
        sourceSummary.adjustments += amount;
        sourceSummary.currentBalance += amount;
      }
    }

    // 2. Destination wallet affected (for internal transfers)
    if (tx.type === 'transfer' && tx.destinationWalletId) {
      const destSummary = result[tx.destinationWalletId];
      if (destSummary) {
        // Cross-currency transfer support: use destinationAmount if provided, otherwise tx.amount
        const receivedAmount = (tx.destinationAmount !== undefined && tx.destinationAmount !== null && tx.destinationAmount > 0)
          ? Number(tx.destinationAmount)
          : amount;
        destSummary.transfersIn += receivedAmount;
        destSummary.currentBalance += receivedAmount;
      }
    }
  });

  return result;
}

/**
 * Calculate multi-currency breakdowns and global consolidated figures.
 * Supports:
 * - Single Currency mode (pure currency calculations without mixing exchange rates)
 * - Multi-Currency mode (normalized valuation in base currency with transparent rate breakdowns)
 * - Wallet filtering
 */
export function calculateConsolidatedPosition(
  transactions: Transaction[],
  wallets: Wallet[],
  baseCurrencyCode: string = 'SAR',
  exchangeRates: Record<string, number> = DEFAULT_EXCHANGE_RATES,
  filterWalletId?: string | null,
  filterCurrencyCode?: string | null
): ConsolidatedFinancialPosition {
  let activeTxs = getActiveTransactions(transactions);

  // Apply wallet filtering if specified
  if (filterWalletId) {
    activeTxs = activeTxs.filter(
      t => t.walletId === filterWalletId || t.destinationWalletId === filterWalletId
    );
  }

  // Apply single currency filtering if specified
  const isSingleCurrency = Boolean(filterCurrencyCode && filterCurrencyCode !== 'ALL');
  if (isSingleCurrency && filterCurrencyCode) {
    activeTxs = activeTxs.filter(t => t.currency === filterCurrencyCode);
  }

  const activeWallets = filterWalletId 
    ? (wallets || []).filter(w => w.id === filterWalletId)
    : (wallets || []);

  const walletSummaries = calculateWalletBalances(activeWallets, activeTxs);

  const currencyBalances: Record<string, number> = {};
  const expenseByCurrency: Record<string, number> = {};
  const incomeByCurrency: Record<string, number> = {};
  const transfersByCurrency: Record<string, number> = {};

  // Initialize currency balances from relevant wallets
  activeWallets.forEach(w => {
    if (!currencyBalances[w.currencyCode]) {
      currencyBalances[w.currencyCode] = 0;
    }
  });

  // Aggregate current balance per currency directly from wallet summaries
  Object.values(walletSummaries).forEach(summary => {
    currencyBalances[summary.currencyCode] = (currencyBalances[summary.currencyCode] || 0) + summary.currentBalance;
  });

  // Calculate Inflows, Outflows, and Internal Transfers
  let totalIncomeInBase = 0;
  let totalExpenseInBase = 0;
  let internalTransfersInBase = 0;

  activeTxs.forEach(tx => {
    const amount = Number(tx.amount) || 0;
    if (amount <= 0) return;

    if (tx.type === 'income') {
      incomeByCurrency[tx.currency] = (incomeByCurrency[tx.currency] || 0) + amount;
      if (isSingleCurrency) {
        totalIncomeInBase += amount;
      } else {
        totalIncomeInBase += convertCurrency(amount, tx.currency, baseCurrencyCode, exchangeRates);
      }
    } else if (tx.type === 'expense' || tx.type === 'transfer_to_goal') {
      expenseByCurrency[tx.currency] = (expenseByCurrency[tx.currency] || 0) + amount;
      if (isSingleCurrency) {
        totalExpenseInBase += amount;
      } else {
        totalExpenseInBase += convertCurrency(amount, tx.currency, baseCurrencyCode, exchangeRates);
      }
    } else if (tx.type === 'transfer') {
      // Internal transfers are tracked separately and strictly NOT added to income or expense
      transfersByCurrency[tx.currency] = (transfersByCurrency[tx.currency] || 0) + amount;
      if (isSingleCurrency) {
        internalTransfersInBase += amount;
      } else {
        internalTransfersInBase += convertCurrency(amount, tx.currency, baseCurrencyCode, exchangeRates);
      }
    }
  });

  // Calculate Net Worth
  let netWorthInBase = 0;
  if (isSingleCurrency && filterCurrencyCode) {
    netWorthInBase = currencyBalances[filterCurrencyCode] || 0;
  } else {
    netWorthInBase = Object.entries(currencyBalances).reduce((sum, [code, amount]) => {
      return sum + convertCurrency(amount, code, baseCurrencyCode, exchangeRates);
    }, 0);
  }

  // Net Cash Flow strictly = Total Income - Total Expense (excluding transfers)
  const netCashFlowInBase = totalIncomeInBase - totalExpenseInBase;
  const savingsRate = totalIncomeInBase > 0 ? Math.max(0, (netCashFlowInBase / totalIncomeInBase) * 100) : 0;

  return {
    netWorthInBase,
    totalIncomeInBase,
    totalExpenseInBase,
    netCashFlowInBase,
    internalTransfersInBase,
    savingsRate,
    isSingleCurrency,
    activeCurrencyCode: isSingleCurrency && filterCurrencyCode ? filterCurrencyCode : baseCurrencyCode,
    currencyBalances,
    expenseByCurrency,
    incomeByCurrency,
    transfersByCurrency,
    walletSummaries,
  };
}

/**
 * Self-Testing Mathematical Audit Suite for the Balance Engine.
 * Verifies core accounting invariants (such as the 100k YER Income, 30k Expense, 20k Transfer scenario).
 */
export function runBalanceEngineAudit(): {
  allPassed: boolean;
  testResults: {
    testName: string;
    passed: boolean;
    details: string;
    expected: any;
    actual: any;
  }[];
} {
  const testResults: {
    testName: string;
    passed: boolean;
    details: string;
    expected: any;
    actual: any;
  }[] = [];

  // Scenario: 
  // Wallet A (YER), Wallet B (YER)
  // Income 100,000 YER into Wallet A
  // Expense 30,000 YER from Wallet A
  // Transfer 20,000 YER from Wallet A to Wallet B
  const testWallets: Wallet[] = [
    { id: 'w-a', name: 'Wallet A', currencyCode: 'YER_ADEN', color: '#10b981', openingBalance: 0 },
    { id: 'w-b', name: 'Wallet B', currencyCode: 'YER_ADEN', color: '#3b82f6', openingBalance: 0 },
  ];

  const testTransactions: Transaction[] = [
    {
      id: 'tx-1',
      walletId: 'w-a',
      type: 'income',
      amount: 100000,
      currency: 'YER_ADEN',
      categoryId: '1',
      date: '2026-08-01',
      note: 'Salary',
      frequency: 'once',
    },
    {
      id: 'tx-2',
      walletId: 'w-a',
      type: 'expense',
      amount: 30000,
      currency: 'YER_ADEN',
      categoryId: '2',
      date: '2026-08-02',
      note: 'Groceries',
      frequency: 'once',
    },
    {
      id: 'tx-3',
      walletId: 'w-a',
      destinationWalletId: 'w-b',
      type: 'transfer',
      amount: 20000,
      currency: 'YER_ADEN',
      categoryId: '',
      date: '2026-08-03',
      note: 'Transfer A->B',
      frequency: 'once',
    },
  ];

  const walletBalances = calculateWalletBalances(testWallets, testTransactions);
  const position = calculateConsolidatedPosition(
    testTransactions,
    testWallets,
    'YER_ADEN',
    DEFAULT_EXCHANGE_RATES,
    null,
    'YER_ADEN'
  );

  // Check 1: Wallet A Balance = 100k - 30k - 20k = 50,000
  const walletAPassed = walletBalances['w-a']?.currentBalance === 50000;
  testResults.push({
    testName: 'Wallet A Balance (Income 100k - Exp 30k - TransferOut 20k)',
    passed: walletAPassed,
    details: `Wallet A Balance should be 50,000 YER`,
    expected: 50000,
    actual: walletBalances['w-a']?.currentBalance,
  });

  // Check 2: Wallet B Balance = +20k from transfer
  const walletBPassed = walletBalances['w-b']?.currentBalance === 20000;
  testResults.push({
    testName: 'Wallet B Balance (TransferIn +20k)',
    passed: walletBPassed,
    details: `Wallet B Balance should be 20,000 YER`,
    expected: 20000,
    actual: walletBalances['w-b']?.currentBalance,
  });

  // Check 3: Total Income = 100k
  const incomePassed = position.totalIncomeInBase === 100000;
  testResults.push({
    testName: 'Total Income Invariance',
    passed: incomePassed,
    details: `Total Income must be exactly 100,000 YER`,
    expected: 100000,
    actual: position.totalIncomeInBase,
  });

  // Check 4: Total Expense = 30k
  const expensePassed = position.totalExpenseInBase === 30000;
  testResults.push({
    testName: 'Total Expense Invariance (Transfers NOT counted as expense)',
    passed: expensePassed,
    details: `Total Expense must be exactly 30,000 YER`,
    expected: 30000,
    actual: position.totalExpenseInBase,
  });

  // Check 5: Internal Transfer = 20k
  const transferPassed = position.internalTransfersInBase === 20000;
  testResults.push({
    testName: 'Internal Transfer Tracking',
    passed: transferPassed,
    details: `Internal Transfers must be recognized as 20,000 YER`,
    expected: 20000,
    actual: position.internalTransfersInBase,
  });

  // Check 6: Net Cash Flow = 70k
  const netCashFlowPassed = position.netCashFlowInBase === 70000;
  testResults.push({
    testName: 'Net Cash Flow (Income 100k - Expense 30k)',
    passed: netCashFlowPassed,
    details: `Net Cash Flow must be exactly 70,000 YER`,
    expected: 70000,
    actual: position.netCashFlowInBase,
  });

  // Check 7: Net Worth = Wallet A + Wallet B = 50k + 20k = 70,000
  const netWorthPassed = position.netWorthInBase === 70000;
  testResults.push({
    testName: 'Net Worth Invariance',
    passed: netWorthPassed,
    details: `Consolidated Net Worth must equal 70,000 YER`,
    expected: 70000,
    actual: position.netWorthInBase,
  });

  const allPassed = testResults.every(r => r.passed);
  return { allPassed, testResults };
}

/**
 * Validate transaction integrity before saving
 */
export function validateTransactionData(tx: Partial<Transaction>): { isValid: boolean; error?: string } {
  if (!tx.amount || isNaN(tx.amount) || Number(tx.amount) <= 0) {
    return { isValid: false, error: 'يجب أن يكون المبلغ رقماً موجباً أكبر من صفر' };
  }
  if (!tx.walletId) {
    return { isValid: false, error: 'يرجى اختيار المحفظة' };
  }
  if (!tx.type) {
    return { isValid: false, error: 'يرجى تحديد نوع العملية' };
  }
  if (tx.type === 'transfer') {
    if (!tx.destinationWalletId) {
      return { isValid: false, error: 'يرجى تحديد المحفظة المستلمة للتحويل' };
    }
    if (tx.destinationWalletId === tx.walletId) {
      return { isValid: false, error: 'لا يمكن التحويل إلى نفس المحفظة المصدر' };
    }
  } else {
    if (!tx.categoryId) {
      return { isValid: false, error: 'يرجى تحديد تصنيف العملية' };
    }
  }
  if (!tx.date) {
    return { isValid: false, error: 'يرجى تحديد تاريخ العملية' };
  }
  return { isValid: true };
}
