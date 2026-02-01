
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, StickyNote, ArrowRightLeft } from 'lucide-react';
import { Transaction, Category, TransactionType, Wallet } from '../types';
import { getIcon, CURRENCY_RATES, DEFAULT_CURRENCIES } from '../constants';

interface TransactionFormProps {
  categories: Category[];
  wallets: Wallet[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  initialData?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, wallets, onSubmit, onClose, initialData }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Currency Converter State
  const [inputCurrency, setInputCurrency] = useState('SAR');

  // Pre-fill data
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setWalletId(initialData.walletId);
      setNote(initialData.note);
      setDate(initialData.date);
      setInputCurrency(initialData.currency); // Assuming transaction stored originally with this currency
    } else if (wallets.length > 0) {
        const defaultWallet = wallets.find(w => w.id === walletId) || wallets[0];
        if (defaultWallet) setInputCurrency(defaultWallet.currencyCode);
    }
  }, [initialData, wallets]);

  // Update input currency when wallet changes (only if user hasn't manually changed it yet, simplistic approach: just default to wallet)
  useEffect(() => {
    if (!initialData) {
        const w = wallets.find(w => w.id === walletId);
        if (w) setInputCurrency(w.currencyCode);
    }
  }, [walletId]);

  const selectedWallet = wallets.find(w => w.id === walletId);
  const walletCurrency = selectedWallet?.currencyCode || 'SAR';

  // Live Conversion Calculation
  const convertedData = useMemo(() => {
    if (!amount || inputCurrency === walletCurrency) return null;
    
    // Formula: Target = Input * (Rate(Input) / Rate(Wallet)) assuming rates are relative to base SAR
    const inputRate = CURRENCY_RATES[inputCurrency] || 1;
    const walletRate = CURRENCY_RATES[walletCurrency] || 1;
    
    // Safety check for division by zero
    if (walletRate === 0) return null;

    // Convert Input to SAR then to Wallet Currency
    const inSAR = parseFloat(amount) * inputRate;
    const finalVal = inSAR / walletRate;

    return {
        amount: finalVal,
        rate: finalVal / parseFloat(amount)
    };
  }, [amount, inputCurrency, walletCurrency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !walletId) return;

    const finalAmount = convertedData ? convertedData.amount : parseFloat(amount);
    // If converted, append info to note
    const finalNote = convertedData 
        ? `${note} (الأصل: ${amount} ${inputCurrency})`.trim()
        : note;

    onSubmit({ 
        amount: parseFloat(finalAmount.toFixed(2)), 
        type, 
        categoryId, 
        walletId,
        note: finalNote, 
        date, 
        currency: walletCurrency, // Always save in wallet currency
        frequency: 'once' 
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl flex items-end justify-center z-[100] p-0 sm:p-4 animate-fade no-print">
      <div className="bg-slate-900 w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[4rem] p-6 sm:p-10 shadow-2xl relative max-h-[96vh] overflow-y-auto no-scrollbar border-t border-white/5">
        
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-slate-800 rounded-full" />

        <div className="flex justify-between items-center mb-8 pt-4">
          <h3 className="text-2xl font-black text-white">{initialData ? 'تعديل العملية' : 'إضافة عملية'}</h3>
          <button onClick={onClose} className="p-3.5 bg-slate-800 rounded-2xl text-slate-500 border border-white/5 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="flex bg-slate-950 p-2 rounded-[2.5rem] border border-white/5">
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-slate-800 text-rose-500 shadow-xl' : 'text-slate-600'}`}>مصروف</button>
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all ${type === 'income' ? 'bg-slate-800 text-emerald-500 shadow-xl' : 'text-slate-600'}`}>وارد</button>
          </div>

          <div className="space-y-2">
            <div className="relative group">
                <input 
                type="number" 
                inputMode="decimal"
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00" 
                className="w-full text-6xl sm:text-7xl font-black text-center py-4 bg-transparent border-none outline-none text-white placeholder:opacity-5 transition-all focus:scale-105" 
                autoFocus 
                />
                
                {/* Currency Selector */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <select 
                        value={inputCurrency}
                        onChange={(e) => setInputCurrency(e.target.value)}
                        className="bg-slate-800 text-white text-[10px] font-black rounded-xl p-2 border border-slate-700 outline-none uppercase tracking-wider"
                    >
                        {DEFAULT_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                </div>
            </div>

            {/* Live Conversion Display */}
            {convertedData && (
                <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-500/10 py-2 px-4 rounded-xl w-fit mx-auto animate-fade">
                    <ArrowRightLeft size={14} />
                    <span className="text-xs font-black">
                         = {convertedData.amount.toLocaleString(undefined, {maximumFractionDigits: 2})} {walletCurrency}
                    </span>
                </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">من أين / إلى أين؟</label>
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {wallets.map(w => (
                 <button
                  key={w.id}
                  type="button"
                  onClick={() => setWalletId(w.id)}
                  className={`shrink-0 px-6 py-3 rounded-2xl border transition-all text-xs font-bold ${walletId === w.id ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                 >
                   {w.name} ({w.currencyCode})
                 </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">التصنيف</label>
            <div className="grid grid-cols-4 gap-4 max-h-56 overflow-y-auto no-scrollbar p-1">
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
