
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Edit2, Wallet as WalletIcon } from 'lucide-react';
import { Transaction, Category, TransactionType, Wallet } from '../types';
import { getIcon } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  currencySymbol: string;
  showFilters?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  categories, 
  wallets,
  onDelete,
  onEdit,
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
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 sm:py-20"
      >
        <div className="bg-slate-900 w-20 h-20 sm:w-24 sm:h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-5 shadow-inner border border-white/5">
          <WalletIcon className="text-slate-700" size={36} />
        </div>
        <p className="text-slate-500 text-xs sm:text-sm font-black uppercase tracking-widest">السجل المالي فارغ تماماً</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-sm z-10 backdrop-blur-xl transition-all">
          {['all', 'expense', 'income'].map((type) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={type}
              onClick={() => setTypeFilter(type as any)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all relative ${
                typeFilter === type 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type === 'all' ? 'الكل' : type === 'expense' ? 'المصاريف' : 'الدخل'}
            </motion.button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTransactions.map((tx, index) => {
            const category = categories.find(c => c.id === tx.categoryId);
            const wallet = wallets.find(w => w.id === tx.walletId);
            const isIncome = tx.type === 'income';

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                key={tx.id} 
                className="group bg-slate-900/80 p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl shadow-sm border border-white/5 flex items-center justify-between hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shrink-0 shadow-sm" style={{ backgroundColor: `${category?.color || '#3b82f6'}20`, color: category?.color || '#3b82f6' }}>
                    {getIcon(category?.icon || 'CreditCard', 22)}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-white block tracking-tight truncate">{category?.name || 'غير مصنف'}</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950/60 rounded-full w-fit border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: wallet?.color || '#a855f7' }} />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[100px]">{wallet?.name || 'المحفظة العامة'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  <div className="text-left">
                    <p className={`font-black text-sm sm:text-base tracking-tight ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isIncome ? '+' : '-'}{tx.amount.toLocaleString()} <span className="text-[11px] font-bold text-slate-400 ml-0.5">{currencySymbol}</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onEdit(tx)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-amber-400 transition-colors bg-slate-800/60 rounded-xl border border-white/5"
                    >
                      <Edit2 size={14} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDelete(tx.id)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 transition-colors bg-slate-800/60 rounded-xl border border-white/5"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TransactionList;
