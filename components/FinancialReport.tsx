
import React from 'react';
import { Transaction, Category, Currency, Wallet } from '../types';

interface FinancialReportProps {
  transactions: Transaction[];
  categories: Category[];
  currency: Currency;
  userName: string;
  wallets: Wallet[];
  type: 'summary' | 'detailed';
}

const FinancialReport: React.FC<FinancialReportProps> = ({ transactions, categories, currency, userName, wallets, type }) => {
  const totals = {
    income: transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  };
  const netBalance = totals.income - totals.expense;

  const walletBalances = wallets.map(w => {
    const balance = transactions
      .filter(t => t.walletId === w.id)
      .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
    return { ...w, balance };
  });

  // Category Breakdown for Report
  const categoryBreakdown = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const amount = transactions
        .filter(t => t.categoryId === c.id && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      return { ...c, amount };
    })
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const displayTransactions = type === 'detailed' ? transactions : transactions.slice(0, 20);

  return (
    <div id="printable-report" className="hidden print:block bg-white text-black p-0 min-h-screen w-full font-sans rtl">
      
      {/* Page 1 */}
      <div className="max-w-[210mm] mx-auto p-10 bg-white">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex items-center gap-4">
                {/* Logo SVG */}
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="10" width="80" height="80" rx="20" fill="#f59e0b" />
                    <circle cx="50" cy="40" r="8" fill="#ffffff" />
                    <circle cx="70" cy="65" r="8" fill="#ffffff" />
                    <circle cx="30" cy="65" r="8" fill="#ffffff" />
                    <path d="M30 65C30 80 70 80 70 65" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
                </svg>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">تقرير ثري المالي</h1>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">كشف حساب شخصي</p>
                </div>
            </div>
            <div className="text-left space-y-1">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">المستخدم</p>
                <p className="text-lg font-bold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">تاريخ الإصدار</p>
                <p className="text-lg font-bold text-slate-900">{new Date().toLocaleDateString('ar-SA')}</p>
            </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي الدخل</p>
                <p className="text-2xl font-black text-emerald-600">+{totals.income.toLocaleString()} <span className="text-sm text-slate-400">{currency.symbol}</span></p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي المصروفات</p>
                <p className="text-2xl font-black text-rose-600">-{totals.expense.toLocaleString()} <span className="text-sm text-slate-400">{currency.symbol}</span></p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 text-white">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">صافي الرصيد</p>
                <p className="text-2xl font-black">{netBalance.toLocaleString()} <span className="text-sm text-slate-500">{currency.symbol}</span></p>
            </div>
        </div>

        {/* Wallet Balances Table */}
        <div className="mb-10">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 border-b pb-2">ملخص المحافظ</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {walletBalances.map((w, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                            <span className="font-bold text-sm text-slate-700">{w.name}</span>
                        </div>
                        <span className="font-bold text-sm">{w.balance.toLocaleString()} {currency.symbol}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Category Breakdown (Visual) */}
        {categoryBreakdown.length > 0 && (
            <div className="mb-10 break-inside-avoid">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 border-b pb-2">تحليل المصروفات</h3>
                <div className="space-y-3">
                    {categoryBreakdown.slice(0, 6).map((c, i) => {
                        const percent = totals.expense > 0 ? (c.amount / totals.expense) * 100 : 0;
                        return (
                            <div key={i} className="flex items-center gap-4">
                                <span className="w-24 text-xs font-bold text-slate-600 truncate">{c.name}</span>
                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-800 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                                <span className="w-20 text-right text-xs font-bold">{c.amount.toLocaleString()}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Transactions Table */}
        <div className="break-inside-avoid">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 border-b pb-2">
                {type === 'detailed' ? 'سجل العمليات التفصيلي' : 'أحدث العمليات'}
            </h3>
            <table className="w-full text-xs">
                <thead>
                    <tr className="bg-slate-50 border-y border-slate-200">
                        <th className="py-3 px-2 text-right font-black text-slate-500">التاريخ</th>
                        <th className="py-3 px-2 text-right font-black text-slate-500">التصنيف</th>
                        <th className="py-3 px-2 text-right font-black text-slate-500">المحفظة</th>
                        <th className="py-3 px-2 text-right font-black text-slate-500 w-1/3">الملاحظات</th>
                        <th className="py-3 px-2 text-left font-black text-slate-500">المبلغ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {displayTransactions.map((t, i) => {
                        const cat = categories.find(c => c.id === t.categoryId);
                        const wallet = wallets.find(w => w.id === t.walletId);
                        return (
                            <tr key={i} className="group">
                                <td className="py-3 px-2 font-medium text-slate-600">{t.date}</td>
                                <td className="py-3 px-2 font-bold text-slate-800">{cat?.name}</td>
                                <td className="py-3 px-2 text-slate-500">{wallet?.name}</td>
                                <td className="py-3 px-2 text-slate-500">{t.note || '-'}</td>
                                <td className={`py-3 px-2 text-left font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {t.type === 'income' ? '+' : ''}{t.amount.toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {type === 'summary' && transactions.length > 20 && (
                <p className="text-center text-[10px] text-slate-400 mt-4 font-bold">... يوجد {transactions.length - 20} عملية أخرى غير معروضة في الملخص ...</p>
            )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                 تم إنشاء هذا التقرير تلقائياً بواسطة تطبيق ثري - مستشارك المالي الذكي
             </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialReport;
