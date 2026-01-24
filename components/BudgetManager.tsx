
import React, { useState } from 'react';
import { Target, TriangleAlert, Plus } from 'lucide-react';
import { Budget, Category, Transaction } from '../types';

interface BudgetManagerProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onSetBudget: (catId: string, amount: number) => void;
  currencySymbol: string;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ budgets, categories, transactions, onSetBudget, currencySymbol }) => {
  const [selectedCat, setSelectedCat] = useState('');
  const [amount, setAmount] = useState('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const budgetStats = budgets.map(b => {
    const category = categories.find(c => c.id === b.categoryId);
    const spent = transactions
      .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const percentage = Math.min((spent / b.amount) * 100, 100);
    
    return { ...b, category, spent, percentage };
  });

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-lg shadow-indigo-100 dark:shadow-none">
        <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Target /> تحديد ميزانية ذكية</h3>
        <div className="space-y-4">
          <select 
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-white/20 border-none outline-none text-white placeholder:text-white/60 font-bold"
          >
            <option value="" className="text-slate-900">اختر التصنيف لضبط الميزانية</option>
            {expenseCategories.map(c => (
              <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <div className="relative flex-1">
               <input 
                type="number"
                placeholder="المبلغ الأقصى"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-white/20 border-none outline-none text-white placeholder:text-white/60 font-black"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60">{currencySymbol}</span>
            </div>
            <button 
              onClick={() => {
                if (selectedCat && amount) {
                  onSetBudget(selectedCat, parseFloat(amount));
                  setAmount('');
                  setSelectedCat('');
                }
              }}
              className="bg-white text-indigo-600 px-8 font-black rounded-2xl active:scale-95 transition-all shadow-md"
            >
              حفظ
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-black text-slate-800 dark:text-white px-2 text-lg">مراقبة الإنفاق الذكي</h4>
        {budgetStats.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
            <p className="text-slate-400 font-bold">ابدأ بتحديد ميزانية لتصنيفاتك</p>
          </div>
        )}
        
        {budgetStats.map(b => {
          const isCritical = b.percentage >= 90;
          const isWarning = b.percentage >= 75 && b.percentage < 90;

          return (
            <div key={b.categoryId} className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm space-y-4 border-2 transition-all ${isCritical ? 'border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10' : 'border-transparent'}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div 
                    className={`p-3 rounded-2xl transition-all duration-300 ${isCritical ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-110' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                  >
                    {isCritical ? <TriangleAlert size={24} className="animate-pulse" /> : <Target size={24} />}
                  </div>
                  <div>
                    <span className="font-black text-slate-800 dark:text-white text-lg block">{b.category?.name}</span>
                    {isCritical && <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">تجاوزت الحد المسموح!</span>}
                    {isWarning && !isCritical && <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">اقتربت من الحد</span>}
                  </div>
                </div>
                <div className="text-left">
                   <p className="text-sm font-black dark:text-white">
                    {b.spent.toLocaleString()} / {b.amount.toLocaleString()} <span className="text-[10px] opacity-60">{currencySymbol}</span>
                  </p>
                  <p className={`text-[11px] font-bold ${isCritical ? 'text-rose-500' : 'text-slate-400'}`}>
                    {isCritical ? 'ميزانية منتهية' : `تبقي لك ${(b.amount - b.spent).toLocaleString()} ${currencySymbol}`}
                  </p>
                </div>
              </div>

              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className={`text-[10px] font-black inline-block py-1 px-2 rounded-full ${isCritical ? 'bg-rose-500 text-white shadow-sm' : isWarning ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {Math.round(b.percentage)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800">
                  <div 
                    style={{ width: `${b.percentage}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ${
                      isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetManager;
