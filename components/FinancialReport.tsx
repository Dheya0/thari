
import React from 'react';
import { Transaction, Category, Currency, Wallet } from '../types';
import Logo from './Logo';

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

  const walletBalances = wallets.map(w => {
    const balance = transactions
      .filter(t => t.walletId === w.id)
      .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
    return { ...w, balance };
  });

  const displayTransactions = type === 'detailed' ? transactions : transactions.slice(0, 25);

  return (
    <div id="printable-report" className="hidden print:block bg-white text-black p-8 min-h-screen w-full font-sans rtl">
      
      {/* Report Header */}
      <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-bold mb-2">تقرير مالي</h1>
           <p className="text-sm text-gray-600">تم الاستخراج بواسطة تطبيق ثري</p>
        </div>
        <div className="text-left">
           <p className="font-bold text-lg">{userName}</p>
           <p className="text-sm text-gray-500">{new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-300 p-4 rounded-lg bg-gray-50">
           <p className="text-xs font-bold text-gray-500 mb-1">الإيرادات</p>
           <p className="text-xl font-bold text-emerald-700">+{totals.income.toLocaleString()} {currency.symbol}</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-lg bg-gray-50">
           <p className="text-xs font-bold text-gray-500 mb-1">المصروفات</p>
           <p className="text-xl font-bold text-rose-700">-{totals.expense.toLocaleString()} {currency.symbol}</p>
        </div>
        <div className="border border-gray-800 p-4 rounded-lg bg-white">
           <p className="text-xs font-bold text-gray-500 mb-1">الرصيد الصافي</p>
           <p className="text-xl font-bold text-black">{(totals.income - totals.expense).toLocaleString()} {currency.symbol}</p>
        </div>
      </div>

      {/* Wallets */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 border-b pb-2">أرصدة المحافظ</h3>
        <div className="grid grid-cols-3 gap-4">
          {walletBalances.map((w, i) => (
             <div key={i} className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-sm font-medium">{w.name}</span>
                <span className="text-sm font-bold">{w.balance.toLocaleString()} {currency.symbol}</span>
             </div>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div>
        <h3 className="font-bold text-lg mb-4 border-b pb-2">{type === 'detailed' ? 'سجل العمليات الكامل' : 'آخر العمليات'}</h3>
        <table className="w-full text-xs">
          <thead>
             <tr className="bg-gray-100 border-b border-gray-300">
                <th className="py-2 px-1 text-right">التاريخ</th>
                <th className="py-2 px-1 text-right">التصنيف</th>
                <th className="py-2 px-1 text-right">الوصف</th>
                <th className="py-2 px-1 text-left">المبلغ</th>
             </tr>
          </thead>
          <tbody>
             {displayTransactions.map((t, i) => {
               const catName = categories.find(c => c.id === t.categoryId)?.name || 'عام';
               return (
                 <tr key={i} className="border-b border-gray-100">
                   <td className="py-2 px-1">{t.date}</td>
                   <td className="py-2 px-1 font-medium">{catName}</td>
                   <td className="py-2 px-1 text-gray-600">{t.note}</td>
                   <td className={`py-2 px-1 text-left font-bold ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                     {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                   </td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>

      <div className="mt-12 text-center text-xs text-gray-400">
         نهاية التقرير - {new Date().toLocaleString('ar-SA')}
      </div>
    </div>
  );
};

export default FinancialReport;
