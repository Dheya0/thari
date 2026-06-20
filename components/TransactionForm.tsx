
import React, { useState, useEffect } from 'react';
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
    // Multi-currency support: The transaction retains its original currency
    onSubmit({ 
        amount: parseFloat(amount), 
        type, 
        categoryId, 
        walletId,
        note, 
        date, 
        currency: inputCurrency, // Save directly as USD, EUR, etc.
        frequency: 'once' 
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl flex flex-col justify-end z-[100] sm:p-4 animate-fade no-print">
      <div className="bg-slate-900 w-full max-w-lg mx-auto sm:rounded-[4rem] rounded-t-[2.5rem] p-6 sm:p-10 shadow-2xl relative max-h-[96vh] flex flex-col min-h-0 border-t border-white/5">
        
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-slate-800 rounded-full shrink-0" />

        <div className="flex justify-between items-center mb-6 pt-4 shrink-0">
          <h3 className="text-xl sm:text-2xl font-black text-white">{initialData ? 'تعديل العملية' : 'إضافة عملية'}</h3>
          <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-500 border border-white/5 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto no-scrollbar pb-[env(safe-area-inset-bottom)]">
          
          <div className="flex bg-slate-950 p-2 rounded-[2rem] border border-white/5 shrink-0">
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-slate-800 text-rose-500 shadow-xl' : 'text-slate-600'}`}>مصروف</button>
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${type === 'income' ? 'bg-slate-800 text-emerald-500 shadow-xl' : 'text-slate-600'}`}>وارد</button>
          </div>

          <div className="space-y-4 shrink-0">
            <div className="flex flex-col items-center gap-2 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest content-center">المبلغ</label>
                <div className="flex items-center justify-center gap-3 w-full">
                    <input 
                    type="number" 
                    inputMode="decimal"
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="w-1/2 text-4xl sm:text-5xl font-black text-center py-2 bg-transparent border-none outline-none text-white placeholder:opacity-5 transition-all focus:scale-105" 
                    autoFocus 
                    />
                    
                    <select 
                        value={inputCurrency}
                        onChange={(e) => setInputCurrency(e.target.value)}
                        className="bg-slate-800 text-white text-[10px] font-black rounded-xl p-3 border border-slate-700 outline-none uppercase tracking-wider shadow-lg shrink-0"
                    >
                        {DEFAULT_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                </div>
            </div>

            {/* تم إزالة حقل التحويل - سيتم الحفظ بالعملة الأصلية لتبقى منفصلة */}
            <div className="text-center">
                 <p className="text-[9px] text-slate-500 font-bold bg-slate-950/50 py-2 rounded-xl border border-white/5 inline-block px-4">
                    سيتم حفظ المبلغ بـ <span className="text-amber-500 mx-1">{inputCurrency}</span> بشكل مستقل داخل المحفظة
                 </p>
            </div>
          </div>

          <div className="space-y-3 shrink-0">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">المحفظة</label>
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
              {wallets.map(w => (
                 <button
                  key={w.id}
                  type="button"
                  onClick={() => setWalletId(w.id)}
                  className={`shrink-0 px-5 py-2.5 rounded-xl border transition-all text-[11px] font-bold ${walletId === w.id ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                 >
                   {w.name}
                 </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 shrink-0">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">التصنيف</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto no-scrollbar p-1">
              {categories.filter(c => c.type === (type === 'transfer_to_goal' ? 'expense' : type)).map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-[2.2rem] border-2 transition-all active:scale-95 ${categoryId === cat.id ? 'border-amber-500 bg-amber-500/10' : 'border-transparent bg-slate-950/50'}`}
                >
                  <div className="p-1 rounded-full transition-transform" style={{ color: cat.color }}>{getIcon(cat.icon, 24)}</div>
                  <span className="text-[9px] font-black text-slate-400 truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-950 p-5 rounded-[2rem] flex items-center gap-4 border border-white/5">
                <Calendar size={18} className="text-slate-600" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent border-none outline-none font-black text-xs text-slate-300 w-full" />
             </div>
             <div className="bg-slate-950 p-5 rounded-[2rem] flex items-center gap-4 border border-white/5">
                <StickyNote size={18} className="text-slate-600" />
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة..." className="bg-transparent border-none outline-none font-black text-xs text-slate-300 w-full" />
             </div>
          </div>

          <button type="submit" className="w-full py-6 bg-amber-500 text-slate-950 font-black rounded-[2.5rem] shadow-2xl active:scale-95 transition-all text-lg hover:brightness-110">
            {initialData ? 'حفظ التعديلات' : 'تأكيد العملية'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
