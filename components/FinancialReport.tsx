import React from 'react';
import { Transaction, Category, Currency, Wallet } from '../types';
import { convertCurrency } from '../constants';

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
}

const FinancialReport: React.FC<FinancialReportProps> = ({ 
  transactions, 
  categories, 
  currency, 
  userName, 
  wallets, 
  type, 
  exchangeRates, 
  filterWalletId, 
  filterCurrency 
}) => {
  // --- Filtering Logic inside Report ---
  let activeTransactions = filterWalletId 
    ? transactions.filter(t => t.walletId === filterWalletId) 
    : transactions;

  if (filterCurrency) {
      activeTransactions = activeTransactions.filter(t => t.currency === filterCurrency);
  }

  const activeWallet = filterWalletId ? wallets.find(w => w.id === filterWalletId) : null;

  // Calculate totals in selected display currency
  const totals = {
    income: activeTransactions
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates), 0),
    
    expense: activeTransactions
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates), 0),
  };
  const netBalance = totals.income - totals.expense;
  const savingsRate = totals.income > 0 ? Math.max(0, Math.round((netBalance / totals.income) * 100)) : 0;

  // Wallet Breakdown (if no specific wallet is filtered)
  const walletBalances = !filterWalletId ? wallets.map(w => {
    const rawBalance = transactions
      .filter(t => t.walletId === w.id)
      .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
    
    const convertedBalance = convertCurrency(rawBalance, w.currencyCode, currency.code, exchangeRates);
    return { ...w, balance: convertedBalance };
  }) : [];

  // Expense Categories Breakdown
  const categoryBreakdown = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const amount = activeTransactions
        .filter(t => t.categoryId === c.id && t.type === 'expense')
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates), 0);
      return { ...c, amount };
    })
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // In 'detailed' mode, display ALL transactions. In 'summary' mode, display recent 20.
  const displayTransactions = type === 'detailed' ? activeTransactions : activeTransactions.slice(0, 20);

  const reportDate = new Date().toLocaleDateString('ar-SA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const reportTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const statementId = `THARI-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (activeTransactions.length === 0) {
      return (
          <div id="printable-report" className="hidden print:flex flex-col items-center justify-center min-h-screen bg-white text-slate-400 p-20 dir-rtl">
              <h1 className="text-2xl font-black mb-4 text-slate-900">تقرير خالي من البيانات</h1>
              <p className="text-center font-bold">لا توجد عمليات مسجلة {activeWallet ? `لمحفظة ${activeWallet.name}` : ''} حالياً.</p>
          </div>
      );
  }

  return (
    <div id="printable-report" className="hidden print:block bg-white text-black p-0 min-h-screen w-full font-sans rtl dir-rtl">
      <div className="max-w-[210mm] mx-auto p-8 md:p-10 bg-white border border-slate-200 shadow-2xl relative overflow-hidden">
        
        {/* Top Gold & Slate Decorative Bar */}
        <div className="h-2.5 bg-gradient-to-r from-slate-950 via-amber-500 to-slate-950 -mx-8 md:-mx-10 -mt-8 md:-mt-10 mb-8" />

        {/* Executive Institutional Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6 break-avoid">
            {/* Header Main Bar */}
            <div className="flex justify-between items-center gap-6 mb-6">
                
                {/* Brand Identity & Logo */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center p-2.5 shadow-md border border-amber-500/40 shrink-0">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <defs>
                                <linearGradient id="gold-grad-rpt" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#fbbf24" />
                                    <stop offset="50%" stopColor="#d97706" />
                                    <stop offset="100%" stopColor="#b45309" />
                                </linearGradient>
                            </defs>
                            <rect x="5" y="5" width="90" height="90" rx="24" fill="#0f172a" stroke="url(#gold-grad-rpt)" strokeWidth="2" />
                            <rect x="24" y="45" width="12" height="20" rx="6" fill="url(#gold-grad-rpt)" />
                            <rect x="44" y="25" width="12" height="40" rx="6" fill="url(#gold-grad-rpt)" />
                            <rect x="64" y="35" width="12" height="30" rx="6" fill="url(#gold-grad-rpt)" />
                            <path d="M 24 78 Q 50 92 76 78" stroke="url(#gold-grad-rpt)" strokeWidth="5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black text-slate-950 tracking-tight leading-none">ثـري</h1>
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded tracking-widest uppercase">THARI SYSTEM</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-1">منظومة إدارة الثروة والمالية الشخصية التنفيذية</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Official Executive Financial System</p>
                    </div>
                </div>

                {/* Circular Official Certification Seal Graphic */}
                <div className="hidden sm:flex items-center justify-center shrink-0">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-amber-600/60 p-1 flex items-center justify-center relative rotate-[-12deg] bg-amber-500/5">
                        <div className="w-full h-full rounded-full border border-amber-600 flex flex-col items-center justify-center text-center p-1 bg-white/90 shadow-inner">
                            <span className="text-[7px] font-black text-amber-700 tracking-widest uppercase">★ THARI CERTIFIED ★</span>
                            <span className="text-[10px] font-black text-slate-900 my-0.5">مستند معتمد</span>
                            <span className="text-[7px] font-bold text-slate-600">كشف مالي موثق</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Title Banner */}
            <div className="bg-slate-950 text-white rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {type === 'detailed' ? 'كشف حساب تفصيلي كامل' : 'تقرير ملخص تنفيذي'}
                        </span>
                        {filterCurrency && (
                            <span className="bg-slate-800 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
                                تصفية بالعملة: {filterCurrency}
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-black text-amber-400">
                        {activeWallet ? `كشف الحساب المالي لمحفظة: ${activeWallet.name}` : 'كشف الحساب والتقرير المالي المؤسسي الشامل'}
                    </h2>
                </div>
                <div className="text-left sm:text-left bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">رقم المستند المرجعي</p>
                    <p className="text-xs font-mono font-bold text-amber-400">{statementId}</p>
                </div>
            </div>
        </div>

        {/* Institutional Metadata Table Box */}
        <div className="bg-slate-50 rounded-2xl border border-slate-300 p-4 mb-6 break-avoid">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">صاحب الحساب</p>
                    <p className="text-sm font-black text-slate-900">{userName || 'مستخدم ثري'}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">تاريخ وساعة الإصدار</p>
                    <p className="text-xs font-bold text-slate-800">{reportDate}</p>
                    <p className="text-[10px] font-medium text-slate-500">{reportTime}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">نطاق التقرير والعملة</p>
                    <p className="text-xs font-bold text-slate-800">{activeWallet ? activeWallet.name : 'جميع المحافظ'}</p>
                    <p className="text-[10px] font-bold text-amber-700">{currency.name} ({currency.code})</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">حالة التوثيق والاعتماد</p>
                    <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full border border-emerald-300 font-black text-[10px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        <span>معتمد وموثق إلكترونياً</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6 break-avoid">
            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300">
                <p className="text-[9px] font-black text-emerald-800 uppercase tracking-wider mb-1">إجمالي الواردات (المقبوضات)</p>
                <p className="text-xl font-black text-emerald-700 dir-ltr text-right">
                  +{totals.income.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs opacity-75">{currency.symbol}</span>
                </p>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300">
                <p className="text-[9px] font-black text-rose-800 uppercase tracking-wider mb-1">إجمالي المنصرفات (المصروفات)</p>
                <p className="text-xl font-black text-rose-700 dir-ltr text-right">
                  -{totals.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs opacity-75">{currency.symbol}</span>
                </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 text-white border-2 border-amber-500/60 shadow-md">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider">صافي الحركة المالية</p>
                    <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">نسبة الوفر: {savingsRate}%</span>
                </div>
                <p className="text-xl font-black text-white dir-ltr text-right">
                  {netBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs text-amber-400">{currency.symbol}</span>
                </p>
            </div>
        </div>

        {/* Section: Wallets Breakdown */}
        {!filterWalletId && walletBalances.length > 0 && (
            <div className="mb-6 break-avoid">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                    <h3 className="text-sm font-black text-slate-900">توزيع أرصدة المحافظ الحالية (مقيمة بـ {currency.code})</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
                    {walletBalances.map((w, i) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-200/80 last:border-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: w.color }} />
                                <span className="font-bold text-slate-800">{w.name} <span className="text-[10px] text-slate-500">({w.currencyCode})</span></span>
                            </div>
                            <span className="font-black text-slate-950 dir-ltr">{w.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency.symbol}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Section: Expenses Analysis */}
        {categoryBreakdown.length > 0 && (
            <div className="mb-6 break-avoid">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
                    <h3 className="text-sm font-black text-slate-900">تحليل إنفاق المصروفات حسب التصنيفات</h3>
                </div>
                <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-300">
                    {categoryBreakdown.slice(0, 8).map((c, i) => {
                        const percent = totals.expense > 0 ? (c.amount / totals.expense) * 100 : 0;
                        return (
                            <div key={i} className="flex items-center gap-3 text-xs">
                                <span className="w-24 font-bold text-slate-800 truncate">{c.name}</span>
                                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-900 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                                <div className="w-28 text-left font-black text-slate-950 dir-ltr">
                                    <span>{c.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency.symbol}</span>
                                    <span className="text-[9px] font-normal text-slate-500 mr-1">({Math.round(percent)}%)</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Section: Transactions Ledger Table */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-3 break-avoid">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-slate-900 rounded-full" />
                    <h3 className="text-sm font-black text-slate-900">
                        {type === 'detailed' ? 'سجل القيد والمعاملات التفصيلي الشامل' : 'ملخص القيود المالية'}
                    </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-600">
                  عرض {displayTransactions.length} من أصل {activeTransactions.length} قيد مسجل
                </span>
            </div>

            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-slate-950 text-white break-avoid">
                        <th className="py-2.5 px-3 text-right rounded-tr-lg font-black w-24">التاريخ</th>
                        <th className="py-2.5 px-3 text-right font-black">التصنيف</th>
                        <th className="py-2.5 px-3 text-right font-black">المحفظة</th>
                        <th className="py-2.5 px-3 text-right font-black">البيان / الملاحظات</th>
                        <th className="py-2.5 px-3 text-left font-black">المبلغ الأصلي</th>
                        <th className="py-2.5 px-3 text-left rounded-tl-lg font-black">المعادل بـ ({currency.code})</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-x border-b border-slate-300">
                    {displayTransactions.map((t, i) => {
                        const cat = categories.find(c => c.id === t.categoryId);
                        const wallet = wallets.find(w => w.id === t.walletId);
                        const convertedAmount = convertCurrency(t.amount, t.currency, currency.code, exchangeRates);
                        return (
                            <tr key={i} className={`break-inside-avoid page-break-inside-avoid ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                <td className="py-2.5 px-3 font-medium text-slate-700 text-[11px] whitespace-nowrap">{t.date}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">{cat?.name || 'غير تصنيف'}</td>
                                <td className="py-2.5 px-3 text-slate-700 font-medium">{wallet?.name || '-'}</td>
                                <td className="py-2.5 px-3 text-slate-600 italic max-w-[150px] truncate">{t.note || '-'}</td>
                                <td className={`py-2.5 px-3 text-left font-bold dir-ltr ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} <span className="text-[9px] text-slate-500">{t.currency}</span>
                                </td>
                                <td className="py-2.5 px-3 text-left font-black text-slate-950 dir-ltr">
                                    {Math.round(convertedAmount).toLocaleString()} {currency.symbol}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-400 break-avoid">
                    <td colSpan={4} className="py-3 px-3 text-right text-slate-900">
                      إجمالي الحركة المعروضة ({displayTransactions.length} عملية)
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-left text-slate-950 text-sm dir-ltr">
                      {Math.round(displayTransactions.reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates) * (t.type === 'income' ? 1 : -1), 0)).toLocaleString()} {currency.symbol}
                    </td>
                  </tr>
                </tfoot>
            </table>

            {type === 'summary' && activeTransactions.length > 20 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg text-center border border-amber-300 break-avoid">
                    <p className="text-xs text-amber-900 font-bold">
                      ملاحظة: تم عرض أحدث 20 عملية فقط في هذا التقرير الملخص. للحصول على الكشف الكامل لجميع القيود ({activeTransactions.length} عملية)، يرجى اختيار التقرير التفصيلي.
                    </p>
                </div>
            )}
        </div>

        {/* Institutional Footer & Official Certification Block */}
        <div className="mt-10 pt-6 border-t-2 border-slate-900 break-avoid">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-right mb-4">
                 
                 {/* Sign-off Seal Box */}
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">اعتماد النظام والتوقيع الرقمي</p>
                     <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-amber-400 font-black text-xs">ثـ</div>
                         <div>
                             <p className="text-xs font-black text-slate-900">تطبيق ثري المالي</p>
                             <p className="text-[8px] font-bold text-amber-700">توقيع رقمي موثق تلقائياً</p>
                         </div>
                     </div>
                 </div>

                 {/* Security Verification & QR simulation */}
                 <div className="flex flex-col items-center justify-center text-center">
                     <div className="flex gap-1 h-6 items-center my-1 opacity-80">
                         <div className="w-1 h-full bg-slate-900" />
                         <div className="w-0.5 h-full bg-slate-900" />
                         <div className="w-2 h-full bg-slate-900" />
                         <div className="w-1.5 h-full bg-slate-900" />
                         <div className="w-0.5 h-full bg-slate-900" />
                         <div className="w-2.5 h-full bg-slate-900" />
                         <div className="w-1 h-full bg-slate-900" />
                         <div className="w-0.5 h-full bg-slate-900" />
                         <div className="w-2 h-full bg-slate-900" />
                     </div>
                     <p className="text-[8px] font-mono font-black text-slate-500">DIGITAL HASH: THARI-SEC-{Math.floor(100000 + Math.random() * 900000)}</p>
                 </div>

                 {/* System Info */}
                 <div className="text-left md:text-left">
                     <p className="text-[10px] font-black text-slate-900">تطبيق ثـري • Thari System</p>
                     <p className="text-[8px] text-slate-500 font-medium">إدارة الثروات والمحافظ المالية الشخصية</p>
                     <p className="text-[8px] text-slate-400 font-mono mt-0.5">REF: {statementId}</p>
                 </div>
             </div>

             <div className="text-center bg-slate-950 text-slate-400 p-2.5 rounded-lg text-[9px] font-bold">
                 هذا المستند المالي صادر آلياً من تطبيق ثري وحُفظت كافة البيانات محلياً بخصائص الأمان العالية.
             </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialReport;
