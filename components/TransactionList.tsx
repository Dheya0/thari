
import React, { useState, useMemo } from 'react';
import { Trash2, Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import { Transaction, Category, TransactionType, Wallet } from '../types';
import { getIcon } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  onDelete: (id: string) => void;
  currencySymbol: string;
  showFilters?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  categories, 
  wallets,
  onDelete, 
  currencySymbol,
  showFilters = false
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => typeFilter === 'all' || tx.type === typeFilter);
  }, [transactions, typeFilter]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 animate-fade">
        <div className="bg-slate-50 dark:bg-slate-900 w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100 dark:border-slate-800">
          <WalletIcon className="text-slate-200 dark:text-slate-700" size={40} />
        </div>
        <p className="text-slate-400 dark:text-slate-500 text-sm font-black uppercase tracking-widest">السجل المالي فارغ تماماً</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showFilters && (
        <div className="flex bg-slate-50/80 dark:bg-slate-900/80 p-1.5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm sticky top-0 z-10 backdrop-blur-xl transition-all">
          {['all', 'expense', 'income'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type as any)}
              className={`flex-1 py-3.5 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                typeFilter === type 
                  ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-md scale-[1.02]' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              {type === 'all' ? 'الكل' : type === 'expense' ? 'المصاريف' : 'الدخل'}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {sortedTransactions.map((tx, index) => {
          const category = categories.find(c => c.id === tx.categoryId);
          const wallet = wallets.find(w => w.id === tx.walletId);
          const isIncome = tx.type === 'income';

          return (
            <div 
              key={tx.id} 
              className="group bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:border-amber-200 dark:hover:border-amber-900/30 transition-all duration-500 active:scale-[0.98]"
              style={{ animationDelay: `${index * 50}ms`, animation: 'fadeIn 0.6s ease-out forwards' }}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110 shadow-sm" style={{ backgroundColor: `${category?.color}15`, color: category?.color }}>
                  {getIcon(category?.icon || 'CreditCard', 26)}
                </div>
                <div className="space-y-1">
                  <span className="font-black text-[13px] text-slate-800 dark:text-white block tracking-tight">{category?.name}</span>
                  <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-full w-fit">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: wallet?.color }} />
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{wallet?.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-5">
                <div className="text-left flex flex-col items-end">
                  <p className={`font-black text-[15px] tracking-tight ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isIncome ? '+' : '-'}{tx.amount.toLocaleString()}
                  </p>
                  <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">{currencySymbol}</span>
                </div>
                <button 
                  onClick={() => onDelete(tx.id)}
                  className="p-3 text-slate-200 dark:text-slate-800 hover:text-rose-500 dark:hover:text-rose-400 transition-all active:scale-75"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionList;
