
import React, { useState } from 'react';
import { X, Calendar, StickyNote } from 'lucide-react';
import { Transaction, Category, TransactionType, Wallet } from '../types';
import { getIcon } from '../constants';

interface TransactionFormProps {
  categories: Category[];
  wallets: Wallet[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  currency: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, wallets, onSubmit, onClose, currency }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl flex items-end justify-center z-[100] p-0 sm:p-4 animate-fade">
      <div className="bg-slate-900 w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[4rem] p-6 sm:p-10 shadow-2xl relative max-h-[96vh] overflow-y-auto no-scrollbar border-t border-white/5">
        
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-slate-800 rounded-full" />

        <div className="flex justify-between items-center mb-8 pt-4">
          <h3 className="text-2xl font-black text-white">إضافة عملية</h3>
          <button onClick={onClose} className="p-3.5 bg-slate-800 rounded-2xl text-slate-500 border border-white/5 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (amount && categoryId && walletId) onSubmit({ 
            amount: parseFloat(amount), 
            type, 
            categoryId, 
            walletId,
            note, 
            date, 
            currency: 'SAR', 
            frequency: 'once' 
          });
        }} className="space-y-8">
          
          <div className="flex bg-slate-950 p-2 rounded-[2.5rem] border border-white/5">
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-slate-800 text-rose-500 shadow-xl' : 'text-slate-600'}`}>مصروف</button>
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all ${type === 'income' ? 'bg-slate-800 text-emerald-500 shadow-xl' : 'text-slate-600'}`}>وارد</button>
          </div>

          <div className="relative group">
            <input 
              type="number" 
              inputMode="decimal"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00" 
              className="w-full text-6xl sm:text-7xl font-black text-center py-6 bg-transparent border-none outline-none text-white placeholder:opacity-5 transition-all focus:scale-105" 
              autoFocus 
            />
            <span className="absolute left-0 right-0 -bottom-2 text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] text-center">{currency}</span>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4">التصنيف المالي</label>
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
            تأكيد العملية الماليـة
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
