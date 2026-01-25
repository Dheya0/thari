
import React, { useState } from 'react';
import { X, Calendar, Type, DollarSign, StickyNote, ChevronDown, Wallet as WalletIcon } from 'lucide-react';
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

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-end justify-center z-[100] animate-fade">
      <div className="bg-slate-900 w-full max-w-lg rounded-t-[3.5rem] p-8 shadow-2xl animate-slide-up relative max-h-[92vh] overflow-y-auto no-scrollbar border-t border-slate-800">
        
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-800 rounded-full" />

        <div className="flex justify-between items-center mb-8 pt-4">
          <h3 className="text-2xl font-black text-white tracking-tight">إضافة عملية</h3>
          <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-500 active:scale-90 transition-all">
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
        }} className="space-y-8 pb-10">
          
          <div className="flex bg-slate-950 p-1.5 rounded-[2.2rem] border border-slate-800">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-slate-800 shadow-md text-rose-500' : 'text-slate-600'}`}
            >
              مصروف
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest transition-all ${type === 'income' ? 'bg-slate-800 shadow-md text-emerald-500' : 'text-slate-600'}`}
            >
              دخل
            </button>
          </div>

          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-6xl font-black text-center py-6 bg-transparent border-none outline-none text-white placeholder:opacity-5 transition-all focus:scale-105"
              autoFocus
            />
            <span className="absolute left-0 right-0 -bottom-2 text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] text-center">{currency}</span>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-2">اختر المحفظة</label>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {wallets.map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWalletId(w.id)}
                  className={`px-6 py-4 rounded-[1.8rem] border-2 transition-all shrink-0 font-black text-xs ${walletId === w.id ? 'border-amber-500 bg-amber-900/20 text-amber-500' : 'border-transparent bg-slate-950 text-slate-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                    {w.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-2">التصنيف</label>
            <div className="grid grid-cols-4 gap-4 max-h-56 overflow-y-auto custom-scrollbar p-1">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border-2 transition-all active:scale-90 ${categoryId === cat.id ? 'border-amber-500 bg-amber-900/20 shadow-lg shadow-amber-500/10' : 'border-transparent bg-slate-950'}`}
                >
                  <div className="transition-transform duration-300" style={{ color: cat.color }}>
                    {getIcon(cat.icon, 24)}
                  </div>
                  <span className="text-[9px] font-black truncate w-full text-center text-slate-500">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-950 p-4 rounded-[1.8rem] flex items-center gap-3 border border-slate-800">
                <Calendar size={16} className="text-slate-600" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent border-none outline-none font-black text-xs text-slate-300 w-full" />
             </div>
             <div className="bg-slate-950 p-4 rounded-[1.8rem] flex items-center gap-3 border border-slate-800">
                <StickyNote size={16} className="text-slate-600" />
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة..." className="bg-transparent border-none outline-none font-black text-xs text-slate-300 w-full" />
             </div>
          </div>

          <button
            type="submit"
            className="w-full py-6 bg-amber-500 text-slate-950 font-black rounded-[2.2rem] shadow-2xl active:scale-95 transition-all text-lg tracking-tight"
          >
            تأكيد العملية
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
