/**
 * THARI Financial Application — Core Balance & Ledger Engine
 * Single Source of Truth for financial calculations, multi-wallet balance tracking,
 * multi-currency ledger calculation, cross-currency spending, transfer consistency, and mathematical audits.
 */

import { Transaction, Wallet, Currency, Debt } from '../types';
import { convertCurrency, DEFAULT_EXCHANGE_RATES } from '../constants';
export * from './coreLedger';

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
 * Calculate precise balance for each wallet independently.
 * Accurately converts transaction amounts to the wallet's native currency
 * when a transaction is recorded in a different currency (e.g. spending $100 from a Yemeni wallet).
 */
export function calculateWalletBalances(
  wallets: Wallet[],
  transactions: Transaction[],
  exchangeRates: Record<string, number> = DEFAULT_EXCHANGE_RATES
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

    // 1. Source wallet deduction / credit
    const sourceSummary = result[tx.walletId];
    if (sourceSummary) {
      const walletCurrency = sourceSummary.currencyCode;
      const txCurrency = tx.currency || walletCurrency;

      // Accurately convert the transaction amount to the wallet's native currency
      const amountInWalletCurrency = (txCurrency === walletCurrency)
        ? amount
        : convertCurrency(amount, txCurrency, walletCurrency, exchangeRates);

      if (tx.type === 'income') {
        sourceSummary.totalIncome += amountInWalletCurrency;
        sourceSummary.currentBalance += amountInWalletCurrency;
      } else if (tx.type === 'expense' || tx.type === 'transfer_to_goal') {
        sourceSummary.totalExpense += amountInWalletCurrency;
        sourceSummary.currentBalance -= amountInWalletCurrency;
      } else if (tx.type === 'transfer') {
        sourceSummary.transfersOut += amountInWalletCurrency;
        sourceSummary.currentBalance -= amountInWalletCurrency;
      } else if (tx.type === 'adjustment') {
        sourceSummary.adjustments += amountInWalletCurrency;
        sourceSummary.currentBalance += amountInWalletCurrency;
      }
    }

    // 2. Destination wallet credit (for internal transfers)
    if (tx.type === 'transfer' && tx.destinationWalletId) {
      const destSummary = result[tx.destinationWalletId];
      if (destSummary) {
        const destCurrency = destSummary.currencyCode;
        const txCurrency = tx.currency || destCurrency;

        // Use destinationAmount if explicitly provided; otherwise convert using exchange rates
        const receivedAmount = (tx.destinationAmount !== undefined && tx.destinationAmount !== null && tx.destinationAmount > 0)
          ? Number(tx.destinationAmount)
          : (txCurrency === destCurrency ? amount : convertCurrency(amount, txCurrency, destCurrency, exchangeRates));

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
 * - Lifetime Cumulative Balance vs Period Flow separation for 100% accurate Net Worth
 */
export function calculateConsolidatedPosition(
  transactions: Transaction[],
  wallets: Wallet[],
  baseCurrencyCode: string = 'SAR',
  exchangeRates: Record<string, number> = DEFAULT_EXCHANGE_RATES,
  filterWalletId?: string | null,
  filterCurrencyCode?: string | null,
  allTransactionsForBalance?: Transaction[]
): ConsolidatedFinancialPosition {
  let periodTxs = getActiveTransactions(transactions);
  const lifetimeTxs = getActiveTransactions(allTransactionsForBalance || transactions);

  // Apply wallet filtering if specified
  if (filterWalletId) {
    periodTxs = periodTxs.filter(
      t => t.walletId === filterWalletId || t.destinationWalletId === filterWalletId
    );
  }

  // Apply single currency filtering if specified
  const isSingleCurrency = Boolean(filterCurrencyCode && filterCurrencyCode !== 'ALL');
  if (isSingleCurrency && filterCurrencyCode) {
    periodTxs = periodTxs.filter(t => t.currency === filterCurrencyCode);
  }

  const activeWallets = filterWalletId 
    ? (wallets || []).filter(w => w.id === filterWalletId)
    : (wallets || []);

  // Calculate true lifetime cumulative balances for active wallets
  const walletSummaries = calculateWalletBalances(activeWallets, lifetimeTxs, exchangeRates);

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

  // Calculate Inflows, Outflows, and Internal Transfers for the given period
  let totalIncomeInBase = 0;
  let totalExpenseInBase = 0;
  let internalTransfersInBase = 0;

  periodTxs.forEach(tx => {
    const amount = Number(tx.amount) || 0;
    if (amount <= 0) return;
    const txCurr = tx.currency || baseCurrencyCode;

    if (tx.type === 'income') {
      incomeByCurrency[txCurr] = (incomeByCurrency[txCurr] || 0) + amount;
      totalIncomeInBase += convertCurrency(amount, txCurr, baseCurrencyCode, exchangeRates);
    } else if (tx.type === 'expense' || tx.type === 'transfer_to_goal') {
      expenseByCurrency[txCurr] = (expenseByCurrency[txCurr] || 0) + amount;
      totalExpenseInBase += convertCurrency(amount, txCurr, baseCurrencyCode, exchangeRates);
    } else if (tx.type === 'transfer') {
      // Internal transfers are tracked separately and strictly NOT added to income or expense
      transfersByCurrency[txCurr] = (transfersByCurrency[txCurr] || 0) + amount;
      internalTransfersInBase += convertCurrency(amount, txCurr, baseCurrencyCode, exchangeRates);
    }
  });

  // Calculate Net Worth: valuation of all active wallets converted to base currency
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
 * Verifies core accounting invariants and cross-currency spending accuracy.
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

  // Scenario 1: Standard Invariant (Income 100k, Expense 30k, Transfer 20k)
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

  // Scenario 2: Cross-Currency Expense from Yemeni Wallet ($100 USD spent from YER_ADEN wallet)
  // Rate: 1 USD = 3.75 SAR, 1 SAR = 430 YER_ADEN => 1 USD = 1612.5 YER_ADEN
  // 100 USD = 161,250 YER_ADEN. Opening: 500,000 YER_ADEN. Expected Remaining: 338,750 YER_ADEN.
  const crossWallets: Wallet[] = [
    { id: 'w-yer-main', name: 'محفظة يمنية', currencyCode: 'YER_ADEN', color: '#10b981', openingBalance: 500000 },
  ];
  const crossTx: Transaction[] = [
    {
      id: 'tx-cross-1',
      walletId: 'w-yer-main',
      type: 'expense',
      amount: 100,
      currency: 'USD',
      categoryId: '1',
      date: '2026-08-05',
      note: 'Online USD Expense from Yemeni Wallet',
      frequency: 'once',
    }
  ];

  const crossBalances = calculateWalletBalances(crossWallets, crossTx, DEFAULT_EXCHANGE_RATES);
  const expectedRemaining = 500000 - 161250; // 338,750
  const crossExpensePassed = Math.abs(crossBalances['w-yer-main'].currentBalance - expectedRemaining) < 0.01;
  testResults.push({
    testName: 'Cross-Currency Expense ($100 USD from Yemeni Wallet)',
    passed: crossExpensePassed,
    details: `100 USD expense from 500k YER wallet should leave 338,750 YER (1 USD = 1612.5 YER)`,
    expected: expectedRemaining,
    actual: crossBalances['w-yer-main'].currentBalance,
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
