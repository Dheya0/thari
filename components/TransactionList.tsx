
import React, { useState, useMemo } from 'react';
import { Trash2, Wallet, Filter, Check } from 'lucide-react';
import { Transaction, Category, TransactionType } from '../types';
import { getIcon } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  currencySymbol: string;
  showFilters?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  categories, 
  onDelete, 
  currencySymbol,
  showFilters = false
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesCategory = selectedCategoryId === 'all' || tx.categoryId === selectedCategoryId;
      return matchesType && matchesCategory;
    });
  }, [transactions, typeFilter, selectedCategoryId]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 animate-entry">
        <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="text-slate-400" size={32} />
        </div>
        <p className="text-slate-500 dark:text-slate-400">لا توجد عمليات مسجلة حتى الآن</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="space-y-4 mb-6 sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md py-2">
          {/* Type Filter */}
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${typeFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${typeFilter === 'expense' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}
            >
              مصروفات
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${typeFilter === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}
            >
              دخل
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedCategoryId === 'all' ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}
            >
              جميع التصنيفات
            </button>
            {categories
              .filter(cat => typeFilter === 'all' || cat.type === typeFilter)
              .map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all border ${selectedCategoryId === cat.id ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}
              >
                <span style={{ color: cat.color }}>{getIcon(cat.icon, 14)}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {sortedTransactions.length === 0 ? (
        <div className="text-center py-12 animate-entry">
          <p className="text-slate-400 text-sm">لا توجد عمليات تطابق الفلتر المختار</p>
          <button 
            onClick={() => { setTypeFilter('all'); setSelectedCategoryId('all'); }}
            className="mt-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        sortedTransactions.map((tx, index) => {
          const category = categories.find(c => c.id === tx.categoryId);
          return (
            <div 
              key={tx.id} 
              className="group animate-entry bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300"
              style={{ 
                animationDelay: `${Math.min(index * 40, 400)}ms`, 
                opacity: 0,
                fillMode: 'forwards'
              }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${category?.color}20`, color: category?.color }}>
                  {getIcon(category?.icon || 'CreditCard')}
                </div>
                <div>
                  <p className="font-bold dark:text-white transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{category?.name || 'غير مصنف'}</p>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-slate-400">{tx.date}</span>
                    {tx.note && <span className="text-xs text-slate-400 truncate max-w-[120px]">• {tx.note}</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`text-right transition-transform duration-300 group-hover:scale-105 ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  <p className="font-bold">
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} {currencySymbol}
                  </p>
                  <p className="text-[10px] opacity-70 uppercase tracking-wider">{tx.frequency === 'once' ? '' : tx.frequency}</p>
                </div>
                <button 
                  onClick={(e) => {
                    const target = e.currentTarget.closest('.group') as HTMLElement;
                    if (target) {
                      target.style.transform = 'translateX(-20px) scale(0.95)';
                      target.style.opacity = '0';
                      target.style.pointerEvents = 'none';
                    }
                    setTimeout(() => onDelete(tx.id), 250);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all focus:opacity-100 focus:outline-none"
                  aria-label="حذف العملية"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TransactionList;
