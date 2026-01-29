
import React from 'react';
import { Transaction, Category, Currency, Wallet } from '../types';
import Logo from './Logo';

interface FinancialReportProps {
  transactions: Transaction[];
  categories: Category[];
  currency: Currency;
  userName: string;
  wallets: Wallet[];
}

const FinancialReport: React.FC<FinancialReportProps> = ({ transactions, categories, currency, userName, wallets }) => {
  const totals = {
    income: transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  };

  const savingsRate = totals.income > 0 ? Math.round(((totals.income - totals.expense) / totals.income) * 100) : 0;

  const topCategories = Object.entries(
    transactions.filter(t => t.type === 'expense').reduce((acc: any, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {})
  )
  .map(([id, amount]: any) => ({ 
    name: categories.find(c => c.id === id)?.name || 'أخرى', 
    amount,
    percentage: Math.round((amount / (totals.expense || 1)) * 100)
  }))
  .sort((a, b) => b.amount - a.amount)
  .slice(0, 6);

  // Calculate wallet balances for the report
  const walletBalances = wallets.map(w => {
    const balance = transactions
      .filter(t => t.walletId === w.id)
      .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
    return { ...w, balance };
  });

  return (
    <div id="printable-report" className="hidden print:block bg-white text-slate-900 p-10 min-h-screen w-full font-sans rtl relative overflow-hidden">
      {/* Decorative Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-12">
        <Logo size={600} />
      </div>

      {/* Header Section */}
      <div className="flex justify-between items-center border-b-8 border-amber-500 pb-8 mb-10 relative z-10">
        <div className="flex items-center gap-6">
          <Logo size={80} showText />
          <div className="h-16 w-1 bg-slate-100 rounded-full mx-2"></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">كشف الحالة المالية</h1>
            <p className="text-sm font-bold text-amber-600 uppercase tracking-widest">مستند رسمي صادر عن نظام ثري الذكي</p>
          </div>
        </div>
        <div className="text-left">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl mb-2 inline-block">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">رقم التقرير</p>
             <p className="text-sm font-mono">TH-{Date.now().toString().slice(-6)}</p>
          </div>
          <p className="text-sm font-bold text-slate-500">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      {/* User Info & Summary Section */}
      <div className="grid grid-cols-4 gap-6 mb-12 relative z-10">
        <div className="col-span-1 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">المستخدم المستهدف</p>
          <p className="text-lg font-black text-slate-800 text-center">{userName}</p>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">إجمالي المحافظ</p>
            <p className="text-xl font-black text-amber-600 text-center">{wallets.length}</p>
          </div>
        </div>

        <div className="col-span-3 grid grid-cols-3 gap-4">
           <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col justify-center">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">إجمالي الإيرادات</p>
              <p className="text-2xl font-black text-emerald-700">{totals.income.toLocaleString()} <span className="text-sm">{currency.symbol}</span></p>
           </div>
           <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 flex flex-col justify-center">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">إجمالي المصروفات</p>
              <p className="text-2xl font-black text-rose-700">{totals.expense.toLocaleString()} <span className="text-sm">{currency.symbol}</span></p>
           </div>
           <div className="bg-amber-500 p-6 rounded-[2rem] text-slate-950 flex flex-col justify-center shadow-lg shadow-amber-500/20">
              <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">صافي الرصيد</p>
              <p className="text-2xl font-black">{(totals.income - totals.expense).toLocaleString()} <span className="text-sm">{currency.symbol}</span></p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10 mb-12 relative z-10">
        {/* Expenditure Analysis */}
        <div className="col-span-7">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3">
            <span className="w-3 h-8 bg-amber-500 rounded-full"></span>
            تحليل هيكل الإنفاق
          </h3>
          <div className="space-y-6 bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
            {topCategories.map((cat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-700">{cat.name}</span>
                  <span className="text-slate-900">{cat.amount.toLocaleString()} {currency.symbol} ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-slate-200">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${cat.percentage}%` }}></div>
                </div>
              </div>
            ))}
            {topCategories.length === 0 && <p className="text-slate-400 italic text-center py-10">لا توجد بيانات مصروفات كافية للتحليل</p>}
          </div>
        </div>

        {/* Wallet Distribution & Health */}
        <div className="col-span-5 space-y-8">
           <section>
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <span className="w-3 h-8 bg-blue-500 rounded-full"></span>
                توزيع الأرصدة
              </h3>
              <div className="space-y-3">
                {walletBalances.map((w, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }}></div>
                      <span className="font-bold text-slate-700">{w.name}</span>
                    </div>
                    <span className="font-black text-slate-900">{w.balance.toLocaleString()} {currency.symbol}</span>
                  </div>
                ))}
              </div>
           </section>

           <section className="bg-slate-900 text-white p-8 rounded-[3rem] relative overflow-hidden shadow-xl">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 bg-amber-500 text-slate-950 rounded-lg font-black text-[10px] uppercase">توصية ثري</span>
                </div>
                <h3 className="text-amber-500 font-black text-lg mb-2">تقييم الموقف المالي</h3>
                <p className="text-sm leading-relaxed opacity-90 font-medium">
                  معدل الادخار الحالي هو <span className="text-amber-500 font-black">{savingsRate}%</span>. 
                  {savingsRate > 20 
                    ? " أنت تسير في المسار الصحيح للثروة. ننصحك بتحويل جزء من فائضك إلى أصول استثمارية طويلة الأمد لتعظيم الفائدة." 
                    : " ننصح بمراجعة بنود الإنفاق الأعلى في الجدول المقابل، حيث أن نسبة الادخار دون 20% قد تعرضك لمخاطر في حالات الطوارئ."}
                </p>
              </div>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
           </section>
        </div>
      </div>

      {/* Transactions Table Section */}
      <section className="relative z-10">
        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
          <span className="w-3 h-8 bg-emerald-500 rounded-full"></span>
          سجل العمليات الأخير
        </h3>
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-sm">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-5 font-black uppercase tracking-widest text-[10px]">التاريخ</th>
                <th className="p-5 font-black uppercase tracking-widest text-[10px]">الفئة</th>
                <th className="p-5 font-black uppercase tracking-widest text-[10px]">البيان / المحفظة</th>
                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 25).map((t, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="p-5 font-bold text-slate-500">{t.date}</td>
                  <td className="p-5">
                    <span className="font-black px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-700">
                      {categories.find(c => c.id === t.categoryId)?.name}
                    </span>
                  </td>
                  <td className="p-5">
                    <p className="font-bold text-slate-800">{t.note || 'عملية عادية'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{wallets.find(w => w.id === t.walletId)?.name}</p>
                  </td>
                  <td className={`p-5 font-black text-left text-base ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} {currency.symbol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-6 font-black uppercase tracking-[0.3em]">
          تم استخراج التقرير في {new Date().toLocaleTimeString('ar-SA')} - نظام ثري المالي الموحد
        </p>
      </section>

      {/* Footer Area with Official Stamp Feel */}
      <div className="mt-auto pt-16 flex justify-between items-end border-t border-slate-100 relative z-10">
         <div className="space-y-2 opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">توقيع النظام</p>
            <div className="w-32 h-1 bg-slate-900 rounded-full"></div>
         </div>
         <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 flex items-center justify-center p-2">
               <Logo size={40} />
            </div>
            <p className="text-[8px] font-black text-slate-400 tracking-[0.4em] uppercase">Authentic Financial Report</p>
         </div>
         <div className="text-left">
            <p className="text-[9px] font-black text-slate-400">نهاية المستند</p>
         </div>
      </div>
    </div>
  );
};

export default FinancialReport;
