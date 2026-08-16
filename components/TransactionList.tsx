import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Edit2, Wallet as WalletIcon, Coins, Filter, Calendar } from 'lucide-react';
import { Transaction, Category, TransactionType, Wallet, Currency } from '../types';
import { getIcon, DEFAULT_CURRENCIES, convertCurrency } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  currencySymbol: string;
  currentCurrencyCode?: string;
  currencies?: Currency[];
  exchangeRates?: Record<string, number>;
  showFilters?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  categories, 
  wallets, 
  onDelete, 
  onEdit, 
  currencySymbol,
  currentCurrencyCode = 'SAR',
  currencies = DEFAULT_CURRENCIES,
  exchangeRates = {},
  showFilters = false
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  // Extract all unique currencies present in current transactions
  const uniqueCurrenciesInTx = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.currency) set.add(t.currency);
    });
    return Array.from(set);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      const matchWallet = walletFilter === 'all' || tx.walletId === walletFilter;
      const matchCurrency = currencyFilter === 'all' || tx.currency === currencyFilter;
      return matchType && matchWallet && matchCurrency;
    });
  }, [transactions, typeFilter, walletFilter, currencyFilter]);

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
      {/* Comprehensive Filter Controls */}
      {showFilters && (
        <div className="space-y-3 bg-slate-900/90 p-3.5 rounded-3xl border border-white/10 shadow-lg backdrop-blur-xl transition-all">
          {/* Type Filter Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/5 shadow-inner">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'expense', label: 'المصاريف' },
              { id: 'income', label: 'الدخل / الواردات' }
            ].map((item) => (
              <motion.button
                whileTap={{ scale: 0.96 }}
                key={item.id}
                onClick={() => setTypeFilter(item.id as any)}
                className={`flex-1 py-2 rounded-xl text-[11px] font-black tracking-wide transition-all ${
                  typeFilter === item.id 
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* Quick Wallet & Currency Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Wallet Selector */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-white/5">
              <WalletIcon size={14} className="text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <select
                  value={walletFilter}
                  onChange={(e) => setWalletFilter(e.target.value)}
                  className="w-full bg-transparent text-white text-xs font-bold outline-none cursor-pointer truncate"
                >
                  <option value="all" className="bg-slate-900 text-white">كافة المحافظ ({wallets.length})</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                      محفظة: {w.name} ({w.currencyCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-white/5">
              <Coins size={14} className="text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="w-full bg-transparent text-white text-xs font-bold outline-none cursor-pointer truncate"
                >
                  <option value="all" className="bg-slate-900 text-white">كافة العملات المسجلة</option>
                  {uniqueCurrenciesInTx.map(code => {
                    const cObj = currencies.find(c => c.code === code) || DEFAULT_CURRENCIES.find(c => c.code === code);
                    return (
                      <option key={code} value={code} className="bg-slate-900 text-white">
                        عملة: {cObj?.name || code} ({code})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Active filter count status */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 font-bold">
            <span>عدد القيود المطابقة: <strong className="text-amber-400 font-black">{sortedTransactions.length}</strong> قيد</span>
            {(typeFilter !== 'all' || walletFilter !== 'all' || currencyFilter !== 'all') && (
              <button 
                onClick={() => { setTypeFilter('all'); setWalletFilter('all'); setCurrencyFilter('all'); }}
                className="text-amber-400 hover:underline font-black cursor-pointer"
              >
                إعادة ضبط الفلاتر
              </button>
            )}
          </div>
        </div>
      )}

      {/* Transaction Cards List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-white/5">
              <p className="text-xs text-slate-400 font-bold">لا توجد عمليات تطابق معايير التصفية المختارة.</p>
            </div>
          ) : (
            sortedTransactions.map((tx, index) => {
              const category = categories.find(c => c.id === tx.categoryId);
              const wallet = wallets.find(w => w.id === tx.walletId);
              const isIncome = tx.type === 'income';

              // Find exact transaction currency details
              const txCurrencyCode = tx.currency || wallet?.currencyCode || currentCurrencyCode;
              const txCurrencyObj = currencies.find(c => c.code === txCurrencyCode) || DEFAULT_CURRENCIES.find(c => c.code === txCurrencyCode);
              const txSymbol = txCurrencyObj?.symbol || txCurrencyCode;
              const txCurrencyName = txCurrencyObj?.name || txCurrencyCode;

              // Converted amount calculation for secondary display when transaction currency differs from active base currency
              const isDiffCurrency = txCurrencyCode !== currentCurrencyCode;
              const convertedAmount = isDiffCurrency 
                ? convertCurrency(tx.amount, txCurrencyCode, currentCurrencyCode, exchangeRates)
                : null;

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  key={tx.id} 
                  className="group bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-white/5 flex items-center justify-between hover:border-amber-500/30 transition-all duration-300 gap-2.5"
                >
                  {/* Left / Primary Info: Icon + Category + Wallet + Currency Tag */}
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div 
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shrink-0 shadow-sm" 
                      style={{ backgroundColor: `${category?.color || '#3b82f6'}20`, color: category?.color || '#3b82f6' }}
                    >
                      {getIcon(category?.icon || 'CreditCard', 22)}
                    </div>
                    
                    <div className="space-y-1 min-w-0 flex-1 text-right">
                      {/* Category Name & Note */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs sm:text-sm text-white tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
                          {category?.name || 'غير مصنف'}
                        </span>
                        {tx.note && (
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px] sm:max-w-[180px]">
                            ({tx.note})
                          </span>
                        )}
                      </div>

                      {/* Badges Bar: Wallet Name + Specific Currency Label */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Wallet Badge */}
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-950/80 rounded-lg border border-white/5">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: wallet?.color || '#a855f7' }} />
                          <span className="text-[9px] font-bold text-slate-400 truncate max-w-[90px]">{wallet?.name || 'المحفظة العامة'}</span>
                        </div>

                        {/* Specific Transaction Currency Badge */}
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/25 text-amber-400">
                          <Coins size={10} className="shrink-0" />
                          <span className="text-[9px] font-black tracking-wide truncate max-w-[100px]" title={txCurrencyName}>
                            {txCurrencyCode}
                          </span>
                        </div>

                        {/* Date */}
                        <span className="text-[9px] text-slate-500 font-mono hidden sm:inline-block">
                          {tx.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right / Financial Info: Amount in Specific Currency + Converted Eq */}
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <div className="text-left flex flex-col items-end">
                      {/* Exact Original Amount & Specific Currency Symbol */}
                      <p className={`font-black text-sm sm:text-base tracking-tight dir-ltr ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIncome ? '+' : '-'}{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                        <span className="text-[11px] font-bold text-slate-300 ml-1">
                          {txSymbol}
                        </span>
                      </p>

                      {/* Explicit Currency Equivalent if transaction is in foreign currency */}
                      {isDiffCurrency && convertedAmount !== null && (
                        <span className="text-[9.5px] font-bold text-slate-400 dir-ltr">
                          ≈ {Math.round(convertedAmount).toLocaleString()} {currencySymbol}
                        </span>
                      )}

                      {/* Small date on mobile */}
                      <span className="text-[8.5px] text-slate-500 font-mono sm:hidden">
                        {tx.date}
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-1">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEdit(tx)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors bg-slate-800/60 rounded-xl border border-white/5"
                        title="تعديل"
                      >
                        <Edit2 size={13} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors bg-slate-800/60 rounded-xl border border-white/5"
                        title="حذف"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TransactionList;
