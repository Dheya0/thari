
import React, { useState, useRef } from 'react';
import { X, Calendar, StickyNote, Camera, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { Transaction, Category, TransactionType, Wallet } from '../types';
import { getIcon } from '../constants';
import { analyzeReceipt } from '../services/geminiService';

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
  const [isScanning, setIsScanning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const result = await analyzeReceipt(base64);
      if (result) {
        if (result.amount) setAmount(result.amount.toString());
        if (result.date) setDate(result.date);
        if (result.note) setNote(result.note);
        const matchedCat = categories.find(c => c.name.includes(result.category) || result.category.includes(c.name));
        if (matchedCat) setCategoryId(matchedCat.id);
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-end justify-center z-[100] animate-fade p-0 sm:p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3.5rem] p-6 sm:p-8 shadow-2xl animate-slide-up relative max-h-[96vh] overflow-y-auto no-scrollbar border-t border-white/5">
        
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-800 rounded-full" />

        <div className="flex justify-between items-center mb-6 pt-4">
          <h3 className="text-xl font-black text-white tracking-tight">إضافة عملية</h3>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl active:scale-90 transition-all flex items-center gap-2 border border-amber-500/20"
            >
              {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <span className="text-[9px] font-black uppercase tracking-widest">مسح</span>
            </button>
            <button onClick={onClose} className="p-2.5 bg-slate-800 rounded-2xl text-slate-500 active:scale-90 transition-all border border-white/5">
              <X size={18} />
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleScan} accept="image/*" className="hidden" />
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
        }} className="space-y-6 pb-6">
          
          <div className="flex bg-slate-950 p-1.5 rounded-[2rem] border border-white/5">
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3.5 rounded-[1.6rem] font-black text-[10px] uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-slate-800 shadow-md text-rose-500' : 'text-slate-600'}`}>مصروف</button>
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-3.5 rounded-[1.6rem] font-black text-[10px] uppercase tracking-widest transition-all ${type === 'income' ? 'bg-slate-800 shadow-md text-emerald-500' : 'text-slate-600'}`}>دخل</button>
          </div>

          <div className="relative">
            <input 
              type="number" 
              inputMode="decimal"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00" 
              className="w-full text-5xl sm:text-6xl font-black text-center py-4 bg-transparent border-none outline-none text-white placeholder:opacity-5 transition-all focus:scale-105" 
              autoFocus 
            />
            <span className="absolute left-0 right-0 -bottom-1 text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] text-center">{currency}</span>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-2">التصنيف</label>
            <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto no-scrollbar p-1">
              {categories.filter(c => c.type === type).map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-[1.8rem] border-2 transition-all active:scale-90 ${categoryId === cat.id ? 'border-amber-500 bg-amber-500/10' : 'border-transparent bg-slate-950'}`}
                >
                  <div className="transition-transform duration-300" style={{ color: cat.color }}>{getIcon(cat.icon, 22)}</div>
                  <span className="text-[8px] font-black truncate w-full text-center text-slate-500">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="bg-slate-950 p-4 rounded-[1.5rem] flex items-center gap-3 border border-white/5">
                <Calendar size={14} className="text-slate-600" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent border-none outline-none font-black text-[11px] text-slate-300 w-full" />
             </div>
             <div className="bg-slate-950 p-4 rounded-[1.5rem] flex items-center gap-3 border border-white/5">
                <StickyNote size={14} className="text-slate-600" />
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة قصيرة..." className="bg-transparent border-none outline-none font-black text-[11px] text-slate-300 w-full" />
             </div>
          </div>

          <button type="submit" className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-[2.2rem] shadow-[0_10px_30px_rgba(245,158,11,0.2)] active:scale-95 transition-all text-base tracking-tight hover:scale-[1.02]">
            تأكيد العملية الماليـة
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
