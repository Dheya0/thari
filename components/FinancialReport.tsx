import React, { useMemo } from 'react';
import { Transaction, Category, Currency, Wallet } from '../types';
import { convertCurrency, DEFAULT_CURRENCIES } from '../constants';

interface FinancialReportProps {
  transactions: Transaction[];
  categories: Category[];
  currency: Currency;
  userName: string;
  wallets: Wallet[];
  type: 'summary' | 'detailed';
  exchangeRates: Record<string, number>;
  filterWalletId?: string | null;
  filterCurrency?: string | null;
  isMergedReport?: boolean;
}

export const FinancialReport: React.FC<FinancialReportProps> = ({ 
  transactions, 
  categories, 
  currency, 
  userName, 
  wallets, 
  type, 
  exchangeRates, 
  filterWalletId, 
  filterCurrency,
  isMergedReport = true
}) => {
  // Filtering Logic
  let activeTransactions = filterWalletId 
    ? transactions.filter(t => t.walletId === filterWalletId) 
    : transactions;

  if (filterCurrency) {
    activeTransactions = activeTransactions.filter(t => t.currency === filterCurrency);
  }

  const activeWallet = filterWalletId ? wallets.find(w => w.id === filterWalletId) : null;

  // Calculate aggregates converted to the target reporting currency
  const totalIncome = activeTransactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates), 0);

  const totalExpense = activeTransactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates), 0);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netBalance / totalIncome) * 100)) : 0;
  const expenseRatio = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : (totalExpense > 0 ? 100 : 0);

  // Sorting
  const sortedTx = [...activeTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const incomeTxCount = activeTransactions.filter(t => t.type === 'income').length;
  const expenseTxCount = activeTransactions.filter(t => t.type === 'expense').length;

  const avgExpensePerTx = expenseTxCount > 0 ? Math.round(totalExpense / expenseTxCount) : 0;
  const avgIncomePerTx = incomeTxCount > 0 ? Math.round(totalIncome / incomeTxCount) : 0;

  // Per-Currency Breakdown (Separated currencies calculation)
  const currencyBreakdown = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    activeTransactions.forEach(t => {
      const code = t.currency || 'SAR';
      if (!map[code]) {
        map[code] = { income: 0, expense: 0, count: 0 };
      }
      map[code].count += 1;
      if (t.type === 'income') {
        map[code].income += t.amount;
      } else {
        map[code].expense += t.amount;
      }
    });

    return Object.entries(map).map(([code, data]) => {
      const net = data.income - data.expense;
      const convertedNet = convertCurrency(net, code, currency.code, exchangeRates);
      const currObj = DEFAULT_CURRENCIES.find(c => c.code === code);
      return {
        code,
        name: currObj?.name || code,
        symbol: currObj?.symbol || code,
        income: data.income,
        expense: data.expense,
        net,
        count: data.count,
        convertedNet
      };
    });
  }, [activeTransactions, currency.code, exchangeRates]);

  // Wallet balances
  const walletBalances = !filterWalletId ? wallets.map(w => {
    const rawBalance = transactions
      .filter(t => t.walletId === w.id)
      .reduce((s, t) => {
        // Convert the transaction amount to the WALLET's native currency
        const amountInWalletCurrency = convertCurrency(t.amount, t.currency || 'SAR', w.currencyCode, exchangeRates);
        return s + (t.type === 'income' ? amountInWalletCurrency : -amountInWalletCurrency);
      }, 0);
    
    // Then convert the wallet's total raw balance to the REPORT's target currency
    const convertedBalance = convertCurrency(rawBalance, w.currencyCode, currency.code, exchangeRates);
    return { ...w, rawBalance, balance: convertedBalance };
  }) : [];

  // Expense Categories Breakdown
  const categoryBreakdown = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const amount = activeTransactions
        .filter(t => t.categoryId === c.id && t.type === 'expense')
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates), 0);
      const count = activeTransactions.filter(t => t.categoryId === c.id && t.type === 'expense').length;
      return { ...c, amount, count };
    })
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Income Categories Breakdown
  const incomeBreakdown = categories
    .filter(c => c.type === 'income')
    .map(c => {
      const amount = activeTransactions
        .filter(t => t.categoryId === c.id && t.type === 'income')
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates), 0);
      const count = activeTransactions.filter(t => t.categoryId === c.id && t.type === 'income').length;
      return { ...c, amount, count };
    })
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Transactions to render in statement
  const displayTransactions = type === 'detailed' ? sortedTx : sortedTx.slice(0, 20);

  // Metadata strings
  const now = new Date();
  const dateFormattedHijriArabic = now.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const dateFormattedGregorian = now.toLocaleDateString('ar-SA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const reportTime = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const yearCode = now.getFullYear();
  const monthCode = String(now.getMonth() + 1).padStart(2, '0');
  const dayCode = String(now.getDate()).padStart(2, '0');
  const statementId = `THR-${yearCode}${monthCode}${dayCode}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (activeTransactions.length === 0) {
    return (
      <div id="printable-report" className="hidden print:flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600 p-12 dir-rtl font-sans">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-amber-400 font-black text-xl mb-4 border border-amber-500/30">
          ثـ
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-2">كشف حساب مالي مؤسسي</h1>
        <p className="text-xs text-slate-500 font-bold">لا توجد حركات مالية مسجلة {activeWallet ? `لمحفظة ${activeWallet.name}` : ''} حتى هذا التاريخ.</p>
      </div>
    );
  }

  return (
    <div id="printable-report" className="hidden print:block bg-white text-slate-900 p-0 min-h-screen w-full font-sans rtl dir-rtl antialiased selection:bg-amber-100">
      <div className="max-w-[210mm] mx-auto p-8 sm:p-10 print:p-10 bg-white relative overflow-hidden">
        
        {/* Top Institutional Header Accent Line */}
        <div className="h-2 bg-gradient-to-r from-slate-950 via-amber-500 to-slate-900 -mx-8 sm:-mx-10 print:-mx-10 -mt-8 sm:-mt-10 print:-mt-10 mb-8" />

        {/* Header: Institutional Branding & Formal Statement Info */}
        <div className="border-b-2 border-slate-900/90 pb-6 mb-7 break-avoid">
          <div className="flex justify-between items-start gap-6">
            
            {/* Right Side: Official Brand & Title */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center border-2 border-amber-500/40 shadow-sm shrink-0">
                <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none">
                  <defs>
                    <linearGradient id="gold-grad-statement" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                  <rect x="6" y="6" width="88" height="88" rx="22" fill="#090d16" stroke="url(#gold-grad-statement)" strokeWidth="2.5" />
                  <rect x="23" y="46" width="13" height="22" rx="6.5" fill="url(#gold-grad-statement)" />
                  <rect x="43.5" y="24" width="13" height="44" rx="6.5" fill="url(#gold-grad-statement)" />
                  <rect x="64" y="34" width="13" height="34" rx="6.5" fill="url(#gold-grad-statement)" />
                  <path d="M 23 80 Q 50 94 77 80" stroke="url(#gold-grad-statement)" strokeWidth="4.5" strokeLinecap="round" />
                </svg>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-none">مـنـظـومـة ثَـــري</h1>
                  <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded tracking-widest uppercase">
                    THARI EXECUTIVE
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-700">التقرير المالي وكشف الحساب المؤسسي المعتمد</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em]">
                  Official Institutional Financial Statement
                </p>
              </div>
            </div>

            {/* Left Side: Statement Number, Date, Verification Emblem */}
            <div className="flex items-center gap-4 text-left">
              {/* Document Identity Card */}
              <div className="bg-slate-950 text-white px-4 py-3 rounded-2xl border border-slate-800 shadow-sm min-w-[190px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                  <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider">رقم المستند المالي</span>
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">موثق</span>
                </div>
                <p className="text-xs font-mono font-black text-white tracking-wider">{statementId}</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{dateFormattedGregorian.split('،')[0]} • {reportTime}</p>
              </div>

              {/* Official Seal Emblem */}
              <div className="hidden sm:flex print:flex w-20 h-20 rounded-full border-2 border-dashed border-amber-600/70 p-1 items-center justify-center rotate-[-6deg] bg-amber-500/5 shrink-0">
                <div className="w-full h-full rounded-full border border-amber-600 flex flex-col items-center justify-center text-center p-1 bg-white shadow-inner">
                  <span className="text-[6.5px] font-black text-amber-700 tracking-wider uppercase">★ THARI ★</span>
                  <span className="text-[9px] font-black text-slate-950 my-0.5">معتمد رسمياً</span>
                  <span className="text-[6.5px] font-bold text-slate-500">نظام موحد</span>
                </div>
              </div>
            </div>

          </div>

          {/* Statement Banner Bar */}
          <div className="mt-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-xl p-3.5 flex flex-col sm:flex print:flex-row print:flex-row justify-between items-start sm:items-center print:items-center gap-3 border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <div>
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-0.5">
                  {type === 'detailed' ? 'كشف حساب تفصيلي لجميع القيود والمعاملات' : 'تقرير ملخص تنفيذي للمركز المالي'}
                </span>
                <h2 className="text-sm font-black text-white">
                  {activeWallet 
                    ? `محفظة العمليات: ${activeWallet.name} (${activeWallet.currencyCode})` 
                    : filterCurrency 
                      ? `كشف حساب مخصص لعملة: ${filterCurrency}`
                      : 'كشف حساب شامل ومدمج لكافة المحافظ والعملات'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {filterCurrency && (
                <span className="text-[10px] font-bold bg-slate-800 text-amber-300 px-3 py-1 rounded-lg border border-slate-700">
                  تصفية العملة: {filterCurrency}
                </span>
              )}
              <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-3 py-1 rounded-lg">
                عملة التقييم والمعادلة: {currency.name} ({currency.code})
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Matrix / Institutional Profile Card */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-4 mb-6 break-avoid shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-4 text-xs divide-x sm:divide-x-reverse print:divide-x-reverse divide-slate-200">
            
            <div className="pr-1 sm:pr-2 print:pr-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">صاحب الحساب / المالك</p>
              <p className="text-sm font-black text-slate-950 truncate">{userName || 'مستخدم ثري التنفيذي'}</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">حساب فردي موثق محلياً</p>
            </div>

            <div className="pr-3 sm:pr-4 print:pr-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">التاريخ الهجري والميلادي</p>
              <p className="text-xs font-bold text-slate-900">{dateFormattedGregorian}</p>
              <p className="text-[10px] font-bold text-amber-800 mt-0.5">{dateFormattedHijriArabic}</p>
            </div>

            <div className="pr-3 sm:pr-4 print:pr-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">نطاق الحساب والمحافظ</p>
              <p className="text-xs font-bold text-slate-900">{activeWallet ? activeWallet.name : `كافة المحافظ (${wallets.length} محفظة)`}</p>
              <p className="text-[10px] font-semibold text-slate-600 mt-0.5">إجمالي القيود: {activeTransactions.length} قيد</p>
            </div>

            <div className="pr-3 sm:pr-4 print:pr-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">المركز المالي الإجمالي</p>
              <div className="inline-flex items-center gap-1.5 bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg font-black text-[10px]">
                <span>{netBalance >= 0 ? 'فائض مالي إيجابي' : 'عجز تدفقات مرحلي'}</span>
                <span className="text-[9px] font-normal text-slate-300">({savingsRate}% وفر)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Institutional KPI Metrics (Executive Summary Deck) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-3.5 mb-6 break-avoid">
          
          {/* Total Inflow (Income) */}
          <div className="bg-white rounded-2xl p-4 border-2 border-emerald-500/40 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> إجمالي الواردات (المقبوضات)
              </span>
              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                {incomeTxCount} عملية
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-700 dir-ltr text-right tracking-tight">
              +{totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-bold text-emerald-900/70">{currency.symbol}</span>
            </p>
            <p className="text-[9px] text-slate-500 mt-1 font-medium">متوسط المقبوضات: {avgIncomePerTx.toLocaleString()} {currency.symbol} للعملية</p>
          </div>

          {/* Total Outflow (Expense) */}
          <div className="bg-white rounded-2xl p-4 border-2 border-rose-500/40 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> إجمالي المنصرفات (المصروفات)
              </span>
              <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                {expenseTxCount} عملية
              </span>
            </div>
            <p className="text-2xl font-black text-rose-700 dir-ltr text-right tracking-tight">
              -{totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-bold text-rose-900/70">{currency.symbol}</span>
            </p>
            <p className="text-[9px] text-slate-500 mt-1 font-medium">معدل الاستهلاك: {expenseRatio}% من إجمالي الواردات</p>
          </div>

          {/* Net Movement & Wealth Reserve */}
          <div className="bg-slate-950 text-white rounded-2xl p-4 border-2 border-amber-500/60 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> صافي الرصيد والحركة
              </span>
              <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
                {savingsRate}% وفر
              </span>
            </div>
            <p className={`text-2xl font-black dir-ltr text-right tracking-tight ${netBalance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-bold text-slate-300">{currency.symbol}</span>
            </p>
            <p className="text-[9px] text-slate-400 mt-1 font-medium">
              المركز المالي المحاسبي الموحد المعادل
            </p>
          </div>

        </div>

        {/* Multi-Currency Balances & Breakdown Table (فصل العملات في التقرير) */}
        {currencyBreakdown.length > 0 && (
          <div className="mb-6 break-avoid">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  تفصيل حركة وأرصدة العملات بشكل مستقل (فصل العملات)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {currencyBreakdown.length} عملة مسجلة
              </span>
            </div>

            <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-2xs">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px]">
                    <th className="py-2.5 px-3 text-right font-black">رمز واسم العملة</th>
                    <th className="py-2.5 px-3 text-left font-black">الواردات بالعملة (+)</th>
                    <th className="py-2.5 px-3 text-left font-black">المنصرفات بالعملة (-)</th>
                    <th className="py-2.5 px-3 text-left font-black">صافي الحركة بالعملة</th>
                    <th className="py-2.5 px-3 text-left font-black">المعادل بـ ({currency.code})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {currencyBreakdown.map((c, i) => (
                    <tr key={c.code} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 font-black text-[10px]">
                            {c.code}
                          </span>
                          <span className="text-slate-700 text-[11px]">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-left font-bold text-emerald-700 dir-ltr text-[11px]">
                        +{c.income.toLocaleString(undefined, { maximumFractionDigits: 2 })} {c.symbol}
                      </td>
                      <td className="py-2.5 px-3 text-left font-bold text-rose-700 dir-ltr text-[11px]">
                        -{c.expense.toLocaleString(undefined, { maximumFractionDigits: 2 })} {c.symbol}
                      </td>
                      <td className={`py-2.5 px-3 text-left font-black dir-ltr text-[11px] ${c.net >= 0 ? 'text-slate-950' : 'text-rose-700'}`}>
                        {c.net >= 0 ? '+' : ''}{c.net.toLocaleString(undefined, { maximumFractionDigits: 2 })} {c.symbol}
                      </td>
                      <td className="py-2.5 px-3 text-left font-black text-slate-950 dir-ltr text-[11px]">
                        {Math.round(c.convertedNet).toLocaleString()} <span className="text-[9px] font-bold text-amber-700">{currency.symbol}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Wallets Breakdown Matrix (فصل المحافظ في التقرير) */}
        {walletBalances.length > 1 && !filterWalletId && (
          <div className="mb-6 break-avoid">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-slate-900 rounded-full" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  توزيع الأرصدة والمحافظ المالية (فصل المحافظ)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {walletBalances.length} محافظ نقدية ومصرفية
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2.5">
              {walletBalances.map((w) => (
                <div key={w.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-900 truncate">{w.name}</span>
                    <span className="text-[8.5px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {w.currencyCode}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 dir-ltr text-right">
                      {w.rawBalance.toLocaleString(undefined, { maximumFractionDigits: 1 })} {w.currencyCode}
                    </p>
                    <p className="text-sm font-black text-slate-950 dir-ltr text-right mt-0.5">
                      ≈ {Math.round(w.balance).toLocaleString()} <span className="text-[9px] font-bold text-slate-500">{currency.symbol}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Analysis (Inflow and Outflow Breakdown side by side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 mb-6 break-avoid">
          
          {/* Top Expense Categories */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider">
                تحليل المصروفات حسب التصنيف
              </span>
              <span className="text-[9px] font-bold text-slate-500">{categoryBreakdown.length} بنود</span>
            </div>
            
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">لا توجد مصروفات مسجلة</p>
            ) : (
              <div className="space-y-2">
                {categoryBreakdown.slice(0, 5).map((cat) => {
                  const pct = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800 truncate max-w-[150px]">{cat.name} ({cat.count})</span>
                        <span className="text-slate-950 dir-ltr">{Math.round(cat.amount).toLocaleString()} {currency.symbol} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Income Categories */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                تحليل مصادر الدخل والواردات
              </span>
              <span className="text-[9px] font-bold text-slate-500">{incomeBreakdown.length} بنود</span>
            </div>
            
            {incomeBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">لا توجد مصادر دخل مسجلة</p>
            ) : (
              <div className="space-y-2">
                {incomeBreakdown.slice(0, 5).map((cat) => {
                  const pct = totalIncome > 0 ? Math.round((cat.amount / totalIncome) * 100) : 0;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800 truncate max-w-[150px]">{cat.name} ({cat.count})</span>
                        <span className="text-slate-950 dir-ltr">{Math.round(cat.amount).toLocaleString()} {currency.symbol} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Detailed Transactions Ledger Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2.5 break-avoid">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {type === 'detailed' ? 'جدول القيود المحاسبية والمعاملات المالية المسجلة' : 'ملخص أحدث القيود المسجلة (موجز تنفيذي)'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              تم إدراج {displayTransactions.length} من أصل {activeTransactions.length} قيد محاسبي
            </span>
          </div>

          <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-2xs">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-white break-avoid border-b border-slate-800 text-[10px]">
                  <th className="py-3 px-3 text-right font-black w-24">التاريخ</th>
                  <th className="py-3 px-3 text-right font-black w-28">التصنيف</th>
                  <th className="py-3 px-3 text-right font-black w-28">المحفظة</th>
                  <th className="py-3 px-3 text-right font-black">البيان / تفاصيل القيد</th>
                  <th className="py-3 px-3 text-center font-black w-20">العملة</th>
                  <th className="py-3 px-3 text-left font-black w-32">المبلغ بالعملة</th>
                  <th className="py-3 px-3.5 text-left font-black w-36">المعادل بـ ({currency.code})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayTransactions.map((t, i) => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  const wallet = wallets.find(w => w.id === t.walletId);
                  const convertedAmount = convertCurrency(t.amount, t.currency, currency.code, exchangeRates);
                  const isIncome = t.type === 'income';

                  return (
                    <tr 
                      key={t.id || i} 
                      className={`break-inside-avoid page-break-inside-avoid transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}
                    >
                      {/* Date */}
                      <td className="py-2.5 px-3 font-medium text-slate-600 text-[10.5px] whitespace-nowrap">
                        {t.date}
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat?.color || '#64748b' }} />
                          <span className="font-bold text-slate-900 truncate">{cat?.name || 'عام'}</span>
                        </div>
                      </td>

                      {/* Wallet */}
                      <td className="py-2.5 px-3 font-semibold text-slate-700 truncate max-w-[100px]">
                        {wallet?.name || '-'}
                      </td>

                      {/* Note / Statement Description */}
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[180px] truncate">
                        {t.note || <span className="text-slate-400 italic">بدون ملاحظات</span>}
                      </td>

                      {/* Currency Badge */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-mono font-bold text-[9.5px]">
                          {t.currency}
                        </span>
                      </td>

                      {/* Original Amount */}
                      <td className={`py-2.5 px-3 text-left font-bold dir-ltr whitespace-nowrap text-[11px] ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isIncome ? '+' : '-'}{t.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-[9px] font-semibold text-slate-500">{t.currency}</span>
                      </td>

                      {/* Converted Target Amount */}
                      <td className="py-2.5 px-3.5 text-left font-black text-slate-950 dir-ltr whitespace-nowrap text-[11px]">
                        {Math.round(convertedAmount).toLocaleString()} <span className="text-[9px] font-bold text-amber-700">{currency.symbol}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-400 break-avoid text-xs">
                  <td colSpan={5} className="py-3 px-3.5 text-right text-slate-900 font-black">
                    إجمالي صافي العمليات المعروضة في هذا الكشف ({displayTransactions.length} قيد)
                  </td>
                  <td colSpan={2} className="py-3 px-3.5 text-left text-slate-950 text-sm font-black dir-ltr">
                    {Math.round(displayTransactions.reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates) * (t.type === 'income' ? 1 : -1), 0)).toLocaleString()} <span className="text-xs text-amber-700 font-bold">{currency.symbol}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {type === 'summary' && activeTransactions.length > 20 && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl text-center border border-amber-200 break-avoid">
              <p className="text-[11px] text-amber-900 font-bold">
                تم عرض أحدث 20 حركة فقط كملخص تنفيذي. للاطلاع على كامل السجل ({activeTransactions.length} حركة)، يرجى اختيار التقرير التفصيلي.
              </p>
            </div>
          )}
        </div>

        {/* Institutional Sign-off, Audit Stamp, and Compliance Footer */}
        <div className="mt-8 pt-6 border-t-2 border-slate-900 break-avoid">
          <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 items-center mb-4">
            
            {/* Electronic System Endorsement */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">الاعتماد والتوقيع الإلكتروني</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-amber-400 font-black text-sm border border-amber-500/30">
                  ثـ
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">نظام ثـري الذكي لإدارة الثروة</p>
                  <p className="text-[8.5px] font-bold text-amber-700">تشفير محلي آمن 100%</p>
                </div>
              </div>
            </div>

            {/* Barcode & Security Hash Generator */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex gap-0.5 h-6 items-center my-1 opacity-70">
                <div className="w-1 h-full bg-slate-900" />
                <div className="w-0.5 h-full bg-slate-900" />
                <div className="w-1.5 h-full bg-slate-900" />
                <div className="w-0.5 h-full bg-slate-900" />
                <div className="w-2 h-full bg-slate-900" />
                <div className="w-0.5 h-full bg-slate-900" />
                <div className="w-1.5 h-full bg-slate-900" />
                <div className="w-1 h-full bg-slate-900" />
                <div className="w-0.5 h-full bg-slate-900" />
                <div className="w-2 h-full bg-slate-900" />
                <div className="w-0.5 h-full bg-slate-900" />
                <div className="w-1.5 h-full bg-slate-900" />
              </div>
              <p className="text-[7.5px] font-mono font-black text-slate-500">SEC-HASH: {statementId}-VERIFIED</p>
            </div>

            {/* Application Information */}
            <div className="text-right sm:text-left">
              <p className="text-xs font-black text-slate-900">ثَـــري • Thari Financial Engine</p>
              <p className="text-[9px] text-slate-500 font-medium">المنظومة التنفيذية لإدارة الأصول والميزانيات الشخصية</p>
              <p className="text-[8px] text-slate-400 font-mono mt-0.5">ISSUED: {now.toISOString()}</p>
            </div>

          </div>

          <div className="text-center bg-slate-950 text-slate-400 p-2.5 rounded-xl text-[9px] font-bold border border-slate-800">
            تم استخراج هذا التقرير المالي آلياً عبر منظومة ثري. البيانات محفوظة مشفرة وموثوقة ولا يتم مشاركتها خارج جهاز المستخدم.
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialReport;
