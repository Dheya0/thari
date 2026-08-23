import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  ChevronLeft, 
  ArrowUp, 
  ArrowDown, 
  Wallet as WalletIcon,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Wallet, Transaction, Category, Currency, Debt } from '../types';
import { convertCurrency, DEFAULT_EXCHANGE_RATES } from '../constants';
import { calculateDateBasedGrowth } from '../services/balanceEngine';
import CurrencyLandscape from './CurrencyLandscape';

interface ElegantDashboardProps {
  userName: string;
  netWorth: number;
  availableBalance: number;
  debtsOwedToMe: number;
  debtsIOwe: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  currency: Currency;
  currencies: Currency[];
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  debts: Debt[];
  exchangeRates: Record<string, number>;
  selectedWalletId: string | null;
  onSelectWallet: (id: string | null) => void;
  onChangeCurrency: (currency: Currency) => void;
  onOpenNewTransaction: (type?: 'expense' | 'income' | 'transfer' | 'adjustment') => void;
  onOpenDebts: () => void;
  onOpenAllTransactions: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

// Format numbers in elegant institutional Arabic style (e.g. 1.2M, 500K or 2,486,500)
export const formatFinancialNumber = (num: number, useCompact: boolean = false): string => {
  const safeNum = Math.abs(num || 0);
  if (useCompact) {
    if (safeNum >= 1_000_000) {
      const val = safeNum / 1_000_000;
      return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'M';
    }
    if (safeNum >= 10_000) {
      const val = safeNum / 1_000;
      return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(0)) + 'K';
    }
  }
  return Math.round(safeNum).toLocaleString('en-US');
};

export const getGreeting = (): { text: string; sub: string } => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: 'صباح الخير', sub: 'نظرة عامة على مركزك المالي وسلامة تدفقاتك' };
  } else if (hour >= 12 && hour < 17) {
    return { text: 'طاب يومك', sub: 'نظرة عامة على أداء المحافظ ومستجدات اليوم' };
  } else if (hour >= 17 && hour < 22) {
    return { text: 'مساء الخير', sub: 'ملخص الحركة المالية وحصاد اليوم' };
  } else {
    return { text: 'مساء النور', sub: 'ملخص استقرار الأصول والالتزامات المالية' };
  }
};

export const ElegantDashboard: React.FC<ElegantDashboardProps> = ({
  userName,
  netWorth,
  availableBalance,
  debtsOwedToMe,
  debtsIOwe,
  monthlyIncome,
  monthlyExpense,
  monthlyNet,
  currency,
  currencies,
  wallets,
  transactions,
  categories,
  debts,
  exchangeRates,
  selectedWalletId,
  onSelectWallet,
  onChangeCurrency,
  onOpenNewTransaction,
  onOpenDebts,
  onOpenAllTransactions,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const greeting = getGreeting();

  // Growth percentage calculation based on actual transaction dates & periods
  const growthInfo = useMemo(() => {
    return calculateDateBasedGrowth(transactions, currency.code, exchangeRates);
  }, [transactions, currency.code, exchangeRates]);

  // Compute currency balances across all wallets
  const currencyBalances = useMemo(() => {
    const map: Record<string, number> = {};
    wallets.forEach(w => {
      let balance = 0;
      transactions.forEach(t => {
        if (t.isDeleted) return;
        const amt = Number(t.amount) || 0;
        const conv = Number(t.convertedAmountInWalletCurrency) || amt;

        if (t.walletId === w.id) {
          if (t.type === 'income') balance += conv;
          else if (t.type === 'expense') balance -= conv;
          else if (t.type === 'transfer') balance -= amt;
          else if (t.type === 'adjustment') balance = amt;
        } else if (t.destinationWalletId === w.id && t.type === 'transfer') {
          const destAmt = Number(t.destinationAmount) || amt;
          balance += destAmt;
        }
      });
      map[w.currencyCode] = (map[w.currencyCode] || 0) + balance;
    });
    return map;
  }, [wallets, transactions]);

  // Compute individual wallet balances in their native currencies & in base currency
  const walletRows = useMemo(() => {
    return wallets.map(wallet => {
      // Calculate native balance for this wallet
      let balance = 0;
      transactions.forEach(t => {
        if (t.isDeleted) return;
        const amt = Number(t.amount) || 0;
        const conv = Number(t.convertedAmountInWalletCurrency) || amt;

        if (t.walletId === wallet.id) {
          if (t.type === 'income') balance += conv;
          else if (t.type === 'expense') balance -= conv;
          else if (t.type === 'transfer') balance -= amt;
          else if (t.type === 'adjustment') balance = amt;
        } else if (t.destinationWalletId === wallet.id && t.type === 'transfer') {
          const destAmt = Number(t.destinationAmount) || amt;
          balance += destAmt;
        }
      });

      // Wallet currency object
      const walletCurr = currencies.find(c => c.code === wallet.currencyCode) || {
        code: wallet.currencyCode,
        symbol: wallet.currencyCode,
        name: wallet.currencyCode
      };

      // Convert to selected base currency for display share
      const inBase = convertCurrency(balance, wallet.currencyCode, currency.code, exchangeRates);

      return {
        ...wallet,
        nativeBalance: balance,
        balanceInBase: inBase,
        currencyObj: walletCurr,
      };
    });
  }, [wallets, transactions, currencies, currency, exchangeRates]);

  // Latest 5 clean transactions (excluding deleted)
  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => !t.isDeleted)
      .filter(t => !selectedWalletId || t.walletId === selectedWalletId || t.destinationWalletId === selectedWalletId)
      .slice(0, 5);
  }, [transactions, selectedWalletId]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-10 pb-12 font-sans selection:bg-[#D9B978]/20">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER: QUIET GREETING & STATUS
      ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1 border-b border-white/[0.04] pb-5">
        <div>
          <span className="text-xs font-medium tracking-wide text-[#D9B978] mb-1 block">
            {greeting.text}، {userName || 'مستخدم ثري'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F4F1EA]">
            المركز المالي الشامل
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date())}
          </span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. WEALTH HERO: THE MONUMENTAL NUMBER & TRIAD METRICS
      ───────────────────────────────────────────────────────────── */}
      <motion.section 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-b from-[#171D24] to-[#11161C] border border-white/[0.06] shadow-[0_25px_80px_rgba(0,0,0,0.28)] space-y-6"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              صافي ثروتك
            </span>
            {growthInfo.rate !== 0 && (
              <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                growthInfo.rate > 0 
                  ? 'text-[#8EB9A7] bg-[#8EB9A7]/10' 
                  : 'text-[#C98387] bg-[#C98387]/10'
              }`}>
                {growthInfo.rate > 0 ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />}
                <span dir="ltr">{Math.abs(growthInfo.rate)}%</span>
                <span className="text-[10px] font-normal opacity-80">{growthInfo.comparisonText}</span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-[#F4F1EA] font-numeric">
              {formatFinancialNumber(netWorth)}
            </span>
            <span className="text-lg sm:text-2xl font-normal text-[#D9B978]">
              {currency.symbol}
            </span>
          </div>
        </div>

        {/* Triad Balance Metrics: Available, Receivable (Owed to me), Payable (I owe) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-5 border-t border-white/[0.06]">
          
          {/* Available Cash */}
          <div className="space-y-1">
            <span className="text-[11px] sm:text-xs font-normal text-slate-400 block">
              متاح الآن
            </span>
            <p className="text-base sm:text-xl font-medium text-[#F4F1EA] font-numeric tracking-tight">
              {formatFinancialNumber(availableBalance)}
              <span className="text-[10px] sm:text-xs text-slate-400 mr-1 font-normal">{currency.symbol}</span>
            </p>
          </div>

          {/* Owed to me (Receivable) */}
          <button 
            onClick={onOpenDebts}
            className="text-right space-y-1 group transition-colors"
          >
            <span className="text-[11px] sm:text-xs font-normal text-slate-400 group-hover:text-[#8EB9A7] transition-colors block">
              لك عند الآخرين
            </span>
            <p className="text-base sm:text-xl font-medium text-[#8EB9A7] font-numeric tracking-tight">
              {formatFinancialNumber(debtsOwedToMe)}
              <span className="text-[10px] sm:text-xs text-[#8EB9A7]/70 mr-1 font-normal">{currency.symbol}</span>
            </p>
          </button>

          {/* I owe (Payable) */}
          <button 
            onClick={onOpenDebts}
            className="text-right space-y-1 group transition-colors"
          >
            <span className="text-[11px] sm:text-xs font-normal text-slate-400 group-hover:text-[#C98387] transition-colors block">
              عليك للآخرين
            </span>
            <p className="text-base sm:text-xl font-medium text-[#C98387] font-numeric tracking-tight">
              {formatFinancialNumber(debtsIOwe)}
              <span className="text-[10px] sm:text-xs text-[#C98387]/70 mr-1 font-normal">{currency.symbol}</span>
            </p>
          </button>

        </div>
      </motion.section>

      {/* ─────────────────────────────────────────────────────────────
          3. CURRENCY LANDSCAPE: HORIZONTAL PERSPECTIVE
      ───────────────────────────────────────────────────────────── */}
      <section>
        <CurrencyLandscape 
          currencies={currencies}
          selectedCurrency={currency}
          onSelectCurrency={onChangeCurrency}
          currencyBalances={currencyBalances}
          wallets={wallets}
          exchangeRates={exchangeRates}
          baseCurrencyCode={currency.code}
        />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. ACTION BAR: CLEAN DIRECT TRIGGERS
      ───────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <button
          onClick={() => onOpenNewTransaction('expense')}
          className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl bg-[#171D24]/80 hover:bg-[#C98387]/15 border border-white/[0.06] hover:border-[#C98387]/30 text-white/90 hover:text-[#C98387] transition-all duration-200 group text-xs sm:text-sm font-medium shadow-sm"
        >
          <div className="w-6 h-6 rounded-full bg-[#C98387]/15 flex items-center justify-center text-[#C98387] group-hover:scale-110 transition-transform">
            <ArrowDownLeft size={14} strokeWidth={2.2} />
          </div>
          <span>صرف</span>
        </button>

        <button
          onClick={() => onOpenNewTransaction('income')}
          className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl bg-[#171D24]/80 hover:bg-[#8EB9A7]/15 border border-white/[0.06] hover:border-[#8EB9A7]/30 text-white/90 hover:text-[#8EB9A7] transition-all duration-200 group text-xs sm:text-sm font-medium shadow-sm"
        >
          <div className="w-6 h-6 rounded-full bg-[#8EB9A7]/15 flex items-center justify-center text-[#8EB9A7] group-hover:scale-110 transition-transform">
            <ArrowUpRight size={14} strokeWidth={2.2} />
          </div>
          <span>إيداع</span>
        </button>

        <button
          onClick={() => onOpenNewTransaction('transfer')}
          className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl bg-[#171D24]/80 hover:bg-[#759BC8]/15 border border-white/[0.06] hover:border-[#759BC8]/30 text-white/90 hover:text-[#759BC8] transition-all duration-200 group text-xs sm:text-sm font-medium shadow-sm"
        >
          <div className="w-6 h-6 rounded-full bg-[#759BC8]/15 flex items-center justify-center text-[#759BC8] group-hover:scale-110 transition-transform">
            <ArrowLeftRight size={14} strokeWidth={2.2} />
          </div>
          <span>تحويل</span>
        </button>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. WALLETS (محافظك): TYPOGRAPHIC LIST / ROWS
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            محافظك
          </h2>
          {selectedWalletId && (
            <button
              onClick={() => onSelectWallet(null)}
              className="text-[11px] text-[#D9B978] hover:underline"
            >
              عرض كل المحافظ
            </button>
          )}
        </div>

        <div className="divide-y divide-white/[0.04] border-y border-white/[0.06]">
          {walletRows.map(w => {
            const isSelected = selectedWalletId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => onSelectWallet(isSelected ? null : w.id)}
                className={`w-full flex items-center justify-between py-3.5 px-2 hover:bg-white/[0.02] transition-colors rounded-xl text-right ${
                  isSelected ? 'bg-[#D9B978]/[0.06]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: w.color || '#D9B978' }} 
                  />
                  <div>
                    <span className="text-sm font-medium text-[#F4F1EA] block">
                      {w.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {w.currencyObj.name}
                    </span>
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-sm sm:text-base font-medium text-[#F4F1EA] font-numeric tracking-tight">
                    {formatFinancialNumber(w.nativeBalance, true)}
                    <span className="text-xs text-slate-400 mr-1.5 font-normal">
                      {w.currencyObj.symbol}
                    </span>
                  </div>
                  {w.currencyCode !== currency.code && (
                    <span className="text-[10px] text-slate-400 block font-numeric">
                      ≈ {formatFinancialNumber(w.balanceInBase, true)} {currency.symbol}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. THIS MONTH (هذا الشهر): CLEAN SUMMARY ROW
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            هذا الشهر
          </h2>
          <span className="text-[11px] text-slate-400">
            {new Intl.DateTimeFormat('ar', { month: 'long', year: 'numeric' }).format(new Date())}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 py-4 px-4 sm:px-6 rounded-2xl bg-[#171D24]/60 border border-white/[0.05]">
          {/* Monthly Income */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 block font-normal">الدخل</span>
            <div className="text-sm sm:text-base font-semibold text-[#8EB9A7] font-numeric tracking-tight">
              {formatFinancialNumber(monthlyIncome, true)}
              <span className="text-[10px] sm:text-xs text-[#8EB9A7]/80 mr-1 font-normal">{currency.symbol}</span>
            </div>
          </div>

          {/* Monthly Expense */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 block font-normal">المصروف</span>
            <div className="text-sm sm:text-base font-semibold text-[#C98387] font-numeric tracking-tight">
              {formatFinancialNumber(monthlyExpense, true)}
              <span className="text-[10px] sm:text-xs text-[#C98387]/80 mr-1 font-normal">{currency.symbol}</span>
            </div>
          </div>

          {/* Monthly Net */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 block font-normal">الصافي</span>
            <div className={`text-sm sm:text-base font-semibold font-numeric tracking-tight ${
              monthlyNet >= 0 ? 'text-[#D9B978]' : 'text-[#C98387]'
            }`}>
              {monthlyNet >= 0 ? '+' : ''}{formatFinancialNumber(monthlyNet, true)}
              <span className="text-[10px] sm:text-xs text-slate-400 mr-1 font-normal">{currency.symbol}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. RECENT 5 OPERATIONS (آخر 5 عمليات)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            آخر 5 عمليات
          </h2>
          <button
            onClick={onOpenAllTransactions}
            className="text-xs text-[#D9B978] hover:text-[#D9B978]/80 transition-colors flex items-center gap-1 font-medium"
          >
            <span>عرض الكل</span>
            <ChevronLeft size={13} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl">
            <p className="text-xs text-slate-400">لا توجد معاملات مسجلة بعد</p>
            <button
              onClick={() => onOpenNewTransaction('expense')}
              className="mt-2 text-xs font-medium text-[#D9B978] hover:underline"
            >
              تسجيل أول حركة مالية
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] border-y border-white/[0.06]">
            {recentTransactions.map(tx => {
              const category = categories.find(c => c.id === tx.categoryId);
              const wallet = wallets.find(w => w.id === tx.walletId);
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction(tx)}
                  className="flex items-center justify-between py-3.5 px-2 hover:bg-white/[0.02] transition-colors rounded-xl cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isIncome 
                        ? 'bg-[#8EB9A7]/15 text-[#8EB9A7]' 
                        : isExpense 
                        ? 'bg-[#C98387]/15 text-[#C98387]' 
                        : 'bg-[#759BC8]/15 text-[#759BC8]'
                    }`}>
                      {isIncome && <ArrowUpRight size={15} />}
                      {isExpense && <ArrowDownLeft size={15} />}
                      {isTransfer && <ArrowLeftRight size={15} />}
                    </div>

                    <div>
                      <span className="text-sm font-medium text-[#F4F1EA] group-hover:text-[#D9B978] transition-colors block">
                        {tx.note || category?.name || (isTransfer ? 'تحويل بين المحافظ' : 'عملية مالية')}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{wallet?.name || 'محفظة'}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left font-numeric">
                    <span className={`text-sm sm:text-base font-semibold ${
                      isIncome 
                        ? 'text-[#8EB9A7]' 
                        : isExpense 
                        ? 'text-[#F4F1EA]' 
                        : 'text-[#759BC8]'
                    }`}>
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatFinancialNumber(tx.amount)}
                    </span>
                    <span className="text-xs text-slate-400 mr-1 font-normal">
                      {tx.currency || currency.symbol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default ElegantDashboard;
