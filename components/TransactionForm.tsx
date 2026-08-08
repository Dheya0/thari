
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, StickyNote, RefreshCw, Wallet as WalletIcon } from 'lucide-react';
import { Transaction, Category, TransactionType, Wallet } from '../types';
import { getIcon, DEFAULT_CURRENCIES } from '../constants';

interface TransactionFormProps {
  categories: Category[];
  wallets: Wallet[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  initialData?: Transaction | null;
  exchangeRates: Record<string, number>;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, wallets, onSubmit, onClose, initialData }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const initialWallet = wallets.find(w => w.id === (initialData?.walletId || wallets[0]?.id));
  
  // العملة المختارة للعملية (مستقلة تماماً عن عملة المحفظة)
  const [inputCurrency, setInputCurrency] = useState(initialData?.currency || initialWallet?.currencyCode || 'SAR');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setWalletId(initialData.walletId);
      setNote(initialData.note);
      setDate(initialData.date);
      setInputCurrency(initialData.currency); 
    }
  }, [initialData]);

  // عند تغيير المحفظة، نضبط العملة الافتراضية لتكون عملة المحفظة، لكن يمكن للمستخدم تغييرها
  useEffect(() => {
    if (!initialData) {
        const selectedW = wallets.find(w => w.id === walletId);
        if (selectedW) {
            setInputCurrency(selectedW.currencyCode);
        }
    }
  }, [walletId, wallets, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !walletId) return;

    // الحفظ يتم بنفس العملة المدخلة دون تحويل
    onSubmit({ 
        amount: parseFloat(amount), 
        type, 
        categoryId, 
        walletId,
        note, 
        date, 
        currency: inputCurrency, 
        frequency: 'once' 
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[100] no-print overflow-hidden"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-slate-900 w-full max-w-md mx-auto rounded-3xl p-5 shadow-2xl relative max-h-[85vh] sm:max-h-[88vh] flex flex-col min-h-0 border border-white/10 overflow-hidden"
      >
        <div className="flex justify-between items-center mb-3 shrink-0 pb-2 border-b border-white/5">
          <h3 className="text-sm sm:text-base font-bold text-white">{initialData ? 'تعديل المعاملة المالية' : 'تسجيل معاملة مالية جديدة'}</h3>
          <button onClick={onClose} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/5 active:scale-90">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 min-h-0 pr-1 pl-1 pb-1">
          
          {/* Transaction Type Tabs */}
          <div className="grid grid-cols-2 bg-slate-950 p-0.5 rounded-xl border border-white/5 shrink-0">
            <button 
              type="button" 
              onClick={() => setType('expense')} 
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                type === 'expense' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              مصروف
            </button>
            <button 
              type="button" 
              onClick={() => setType('income')} 
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                type === 'income' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              وارد
            </button>
          </div>

          {/* Amount & Currency Fields Container */}
          <div className="space-y-1 shrink-0">
            <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">المبلغ والعملة</label>
              <div className="flex items-center justify-between gap-2.5 w-full">
                {/* Custom Currency Dropdown Button */}
                <div className="relative shrink-0">
                  <select 
                    value={inputCurrency}
                    onChange={(e) => setInputCurrency(e.target.value)}
                    className="appearance-none bg-slate-900 border border-white/10 text-white text-[11px] font-bold rounded-lg py-1.5 pl-6 pr-2.5 outline-none uppercase tracking-wider shadow-md cursor-pointer transition-all hover:bg-slate-800"
                  >
                    {DEFAULT_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Big input for amount */}
                <input 
                  type="number" 
                  step="any"
                  inputMode="decimal"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full text-xl sm:text-2xl font-extrabold text-right bg-transparent border-none outline-none text-white placeholder:text-white/10" 
                  autoFocus 
                />
              </div>
              
              {/* Pocket Storage detail brief banner placed compact inside card */}
              <div className="text-right border-t border-white/5 pt-1.5 mt-1">
                <p className="text-[9px] text-slate-500 font-medium">
                  * سيتم حفظ القيمة بـ <span className="text-amber-500 font-bold">{inputCurrency}</span> بشكل مستقل داخل جيوب المحفظة.
                </p>
              </div>
            </div>
          </div>

          {/* Wallets Horizontal Layout */}
          <div className="space-y-1.5 shrink-0">
            <label className="text-[11px] font-bold text-slate-400 px-1 block text-right">المحفظة المتأثرة</label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 px-1 flex-row-reverse">
              {wallets.map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWalletId(w.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg border transition-all text-xs font-bold ${
                    walletId === w.id 
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-sm' 
                      : 'bg-slate-950 text-slate-400 border-white/5 hover:border-white/10'
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Horizontal Slider layout - extremely space saving */}
          <div className="space-y-1.5 shrink-0">
            <label className="text-[11px] font-bold text-slate-400 px-1 block text-right">تصنيف المعاملة</label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 px-1 flex-row-reverse">
              {categories.filter(c => c.type === (type === 'transfer_to_goal' ? 'expense' : type)).map(cat => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold active:scale-95 ${
                      isSelected 
                        ? 'border-amber-500/80 bg-amber-500/10 text-amber-400 font-extrabold shadow-sm' 
                        : 'border-white/5 bg-slate-950 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span className="shrink-0" style={{ color: cat.color }}>{getIcon(cat.icon, 13)}</span>
                    <span className="truncate max-w-[85px]">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Note side by side */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            <div className="bg-slate-950 p-2.5 rounded-xl flex items-center gap-2 border border-white/5 focus-within:border-white/10 transition-all">
              <Calendar size={13} className="text-slate-500 shrink-0" />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="bg-transparent border-none outline-none font-medium text-xs text-slate-200 w-full cursor-pointer" 
              />
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl flex items-center gap-2 border border-white/5 focus-within:border-white/10 transition-all">
              <StickyNote size={13} className="text-slate-500 shrink-0" />
              <input 
                type="text" 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                placeholder="ملاحظة المعاملة..." 
                className="bg-transparent border-none outline-none font-medium text-xs text-slate-200 w-full placeholder:text-slate-650" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-2.5 mt-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md active:scale-95 transition-all text-sm leading-none shrink-0"
          >
            {initialData ? 'حفظ تعديلات المعاملة' : 'تأكيد وحفظ المعاملة'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TransactionForm;
