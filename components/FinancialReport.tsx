
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
}

const FinancialReport: React.FC<FinancialReportProps> = ({ transactions, categories, currency, userName, wallets, type, exchangeRates }) => {
  // Use all provided transactions but CONVERT them to the selected currency
  const totals = {
    income: transactions
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates), 0),
    
    expense: transactions
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates), 0),
  };
  const netBalance = totals.income - totals.expense;

  const walletBalances = wallets.map(w => {
    // Original balance in wallet's currency
    const rawBalance = transactions
      .filter(t => t.walletId === w.id)
      .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
    
    // Converted to Report Currency
    const convertedBalance = convertCurrency(rawBalance, w.currencyCode, currency.code, exchangeRates);

    return { ...w, balance: convertedBalance };
  });

  const categoryBreakdown = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const amount = transactions
        .filter(t => t.categoryId === c.id && t.type === 'expense')
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currency.code, exchangeRates), 0);
      return { ...c, amount };
    })
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const displayTransactions = type === 'detailed' ? transactions : transactions.slice(0, 20);

  if (transactions.length === 0) {
      return (
          <div id="printable-report" className="hidden print:flex flex-col items-center justify-center min-h-screen bg-white text-slate-400 p-20">
              <h1 className="text-2xl font-black mb-4 text-slate-900">تقرير خالي من البيانات</h1>
              <p className="text-center font-bold">لا توجد عمليات مسجلة حالياً.</p>
          </div>
      );
  }

  return (
    <div id="printable-report" className="hidden print:block bg-white text-black p-0 min-h-screen w-full font-sans rtl">
      
      <div className="max-w-[210mm] mx-auto p-12 bg-white">
        
        {/* Professional Header */}
        <div className="flex justify-between items-center border-b-4 border-amber-500 pb-8 mb-10">
            <div className="flex items-center gap-6">
                <div className="bg-slate-900 p-3 rounded-2xl">
                    <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" rx="20" fill="#0f172a" />
                        <rect x="25" y="45" width="12" height="20" rx="4" fill="#fbbf24" />
                        <rect x="44" y="25" width="12" height="40" rx="4" fill="#fbbf24" />
                        <rect x="63" y="35" width="12" height="30" rx="4" fill="#fbbf24" />
                        <path d="M25 78 Q 50 90 75 78" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-950 tracking-tight">تقرير ثري المالي</h1>
                    <p className="text-xs font-black text-amber-600 uppercase tracking-[0.3em] mt-1">Professional Financial Statement</p>
                </div>
            </div>
            <div className="text-left">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl min-w-[200px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">صاحب الحساب</p>
                    <p className="text-lg font-black text-slate-900 mb-3">{userName}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">تاريخ التقرير</p>
                    <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="p-8 rounded-3xl bg-emerald-50 border-2 border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">إجمالي الواردات</p>
                <p className="text-3xl font-black text-emerald-700">+{totals.income.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm opacity-50">{currency.symbol}</span></p>
            </div>
            <div className="p-8 rounded-3xl bg-rose-50 border-2 border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">إجمالي المنصرفات</p>
                <p className="text-3xl font-black text-rose-700">-{totals.expense.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm opacity-50">{currency.symbol}</span></p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">الرصيد الصافي</p>
                <p className="text-3xl font-black">{netBalance.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm text-amber-500">{currency.symbol}</span></p>
            </div>
        </div>

        {/* Section: Wallets Breakdown */}
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                <h3 className="text-lg font-black text-slate-900">توزيع أرصدة المحافظ (مقيمة بـ {currency.code})</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                {walletBalances.map((w, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-md" style={{ backgroundColor: w.color }} />
                            <span className="font-bold text-slate-700">{w.name} <span className="text-xs opacity-50">({w.currencyCode})</span></span>
                        </div>
                        <span className="font-black text-slate-900">{w.balance.toLocaleString(undefined, {maximumFractionDigits: 0})} {currency.symbol}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Section: Expenses Analysis */}
        {categoryBreakdown.length > 0 && (
            <div className="mb-12 break-inside-avoid">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                    <h3 className="text-lg font-black text-slate-900">تحليل الإنفاق حسب التصنيفات</h3>
                </div>
                <div className="space-y-4">
                    {categoryBreakdown.slice(0, 8).map((c, i) => {
                        const percent = totals.expense > 0 ? (c.amount / totals.expense) * 100 : 0;
                        return (
                            <div key={i} className="flex items-center gap-6">
                                <span className="w-32 text-sm font-black text-slate-600 truncate">{c.name}</span>
                                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-800 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                                <div className="w-40 text-left">
                                    <span className="text-sm font-black text-slate-900">{c.amount.toLocaleString(undefined, {maximumFractionDigits: 0})} {currency.symbol}</span>
                                    <span className="text-[10px] font-bold text-slate-400 mr-2">({Math.round(percent)}%)</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Section: Transactions History */}
        <div className="break-inside-avoid">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                <h3 className="text-lg font-black text-slate-900">
                    {type === 'detailed' ? 'كشف العمليات التفصيلي الكامل' : 'ملخص أحدث العمليات المالية'}
                </h3>
            </div>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-slate-900 text-white">
                        <th className="py-4 px-4 text-right rounded-tr-xl">التاريخ</th>
                        <th className="py-4 px-4 text-right">التصنيف</th>
                        <th className="py-4 px-4 text-right">المحفظة</th>
                        <th className="py-4 px-4 text-right">الملاحظة</th>
                        <th className="py-4 px-4 text-left rounded-tl-xl">المبلغ</th>
                        <th className="py-4 px-4 text-left">المعادل ({currency.code})</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border border-slate-200">
                    {displayTransactions.map((t, i) => {
                        const cat = categories.find(c => c.id === t.categoryId);
                        const wallet = wallets.find(w => w.id === t.walletId);
                        const convertedAmount = convertCurrency(t.amount, t.currency, currency.code, exchangeRates);
                        return (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="py-4 px-4 font-medium text-slate-500 text-xs">{t.date}</td>
                                <td className="py-4 px-4 font-black text-slate-800">{cat?.name}</td>
                                <td className="py-4 px-4 text-slate-600 text-xs">{wallet?.name}</td>
                                <td className="py-4 px-4 text-slate-500 text-xs italic max-w-[150px] truncate">{t.note || '-'}</td>
                                <td className={`py-4 px-4 text-left font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {t.type === 'income' ? '+' : ''}{t.amount.toLocaleString()} <span className="text-[9px] text-slate-400">{t.currency}</span>
                                </td>
                                <td className="py-4 px-4 text-left font-black text-slate-900">
                                    {Math.round(convertedAmount).toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {type === 'summary' && transactions.length > 20 && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
                    <p className="text-xs text-slate-400 font-bold">... تم عرض 20 عملية فقط من إجمالي {transactions.length} عملية سجلها تطبيق ثري ...</p>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-10 border-t-2 border-slate-100 text-center">
             <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-amber-500">★</span>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">تطبيق ثري - لإدارة الثروة والوفرة</p>
                <span className="text-amber-500">★</span>
             </div>
             <p className="text-[9px] text-slate-300 font-bold">هذا الكشف تم إنتاجه إلكترونياً ولا يتطلب توقيعاً. البيانات محمية بخصوصية جهازك فقط.</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialReport;
