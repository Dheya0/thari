
import React, { useState, useMemo } from 'react';
import { User, Trash2, CheckCircle, Clock, Plus, X, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, ChevronDown } from 'lucide-react';
import { Debt, Wallet } from '../types';

interface DebtManagerProps {
  debts: Debt[];
  wallets: Wallet[];
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onSettleDebt: (id: string, walletId: string) => void;
  onDeleteDebt: (id: string) => void;
  currencySymbol: string;
  currencyCode: string;
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, wallets, onAddDebt, onSettleDebt, onDeleteDebt, currencySymbol, currencyCode }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState<string | null>(null);
  
  // Form State
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'to_me' | 'on_me'>('on_me');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');

  const stats = useMemo(() => {
    const iOwe = debts.filter(d => !d.isPaid && d.type === 'on_me').reduce((s, d) => s + d.amount, 0);
    const owedToMe = debts.filter(d => !d.isPaid && d.type === 'to_me').reduce((s, d) => s + d.amount, 0);
    return { iOwe, owedToMe };
  }, [debts]);

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => (a.isPaid === b.isPaid ? 0 : a.isPaid ? 1 : -1));
  }, [debts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (personName && amount) {
      onAddDebt({
        personName,
        amount: parseFloat(amount),
        type,
        isPaid: false,
        note,
        dueDate,
        currency: currencyCode
      });
      setShowAddForm(false);
      // Reset
      setPersonName(''); setAmount(''); setNote(''); setDueDate('');
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade">
      {/* Debts Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-[2.5rem] relative overflow-hidden">
          <ArrowDownLeft className="absolute -right-2 -top-2 text-rose-500/10" size={80} />
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">ديون عليّ</p>
          <p className="text-2xl font-black text-white">{stats.iOwe.toLocaleString()} <span className="text-xs opacity-30">{currencySymbol}</span></p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[2.5rem] relative overflow-hidden">
          <ArrowUpRight className="absolute -right-2 -top-2 text-emerald-500/10" size={80} />
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">ديون لي</p>
          <p className="text-2xl font-black text-white">{stats.owedToMe.toLocaleString()} <span className="text-xs opacity-30">{currencySymbol}</span></p>
        </div>
      </div>

      <button 
        onClick={() => setShowAddForm(true)}
        className="w-full py-5 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center gap-3 font-black text-amber-500 active:scale-95 transition-all"
      >
        <Plus size={20} /> تسجيل دين جديد
      </button>

      {/* Debts List */}
      <div className="space-y-4">
        {sortedDebts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-800">
            <User size={48} className="mx-auto text-slate-800 mb-4" />
            <p className="text-slate-500 font-black text-sm uppercase tracking-widest">لا يوجد سجل ديون حالياً</p>
          </div>
        ) : (
          sortedDebts.map((debt) => (
            <div 
              key={debt.id} 
              className={`p-5 rounded-[2.5rem] border transition-all ${debt.isPaid ? 'bg-slate-900/30 border-slate-900 opacity-60' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${debt.type === 'on_me' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-white">{debt.personName}</h4>
                    <p className="text-[10px] text-slate-500 font-bold">{debt.note || 'بدون ملاحظات'}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-lg font-black ${debt.type === 'on_me' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {debt.amount.toLocaleString()} <span className="text-[10px] opacity-40">{currencySymbol}</span>
                  </p>
                  {debt.dueDate && <p className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1 justify-end"><Clock size={10} /> {debt.dueDate}</p>}
                </div>
              </div>

              {!debt.isPaid && (
                <div className="flex gap-2 mt-5">
                  <button 
                    onClick={() => setShowSettleModal(debt.id)}
                    className="flex-1 py-3 bg-amber-500 text-slate-950 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <CheckCircle size={14} /> تسديد
                  </button>
                  <button 
                    onClick={() => onDeleteDebt(debt.id)}
                    className="p-3 bg-slate-800 text-slate-500 rounded-2xl active:scale-90 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Debt Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[110] flex items-end justify-center animate-fade">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-[3rem] p-8 pb-12 shadow-2xl border-t border-slate-800 animate-slide-up">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-white tracking-tight">تسجيل دين جديد</h3>
              <button onClick={() => setShowAddForm(false)} className="p-3 bg-slate-800 rounded-2xl text-slate-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex bg-slate-950 p-1.5 rounded-[1.8rem] border border-slate-800">
                <button type="button" onClick={() => setType('on_me')} className={`flex-1 py-3 rounded-[1.4rem] text-[10px] font-black uppercase transition-all ${type === 'on_me' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'text-slate-600'}`}>دين عليّ</button>
                <button type="button" onClick={() => setType('to_me')} className={`flex-1 py-3 rounded-[1.4rem] text-[10px] font-black uppercase transition-all ${type === 'to_me' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-600'}`}>دين لي</button>
              </div>
              <input type="text" value={personName} onChange={e => setPersonName(e.target.value)} placeholder="اسم الشخص / الجهة" className="w-full p-4 rounded-2xl bg-slate-800 border-none outline-none text-white font-bold" required />
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="المبلغ" className="w-full p-4 rounded-2xl bg-slate-800 border-none outline-none text-white font-bold" required />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-800 border-none outline-none text-slate-400 font-bold text-xs" />
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="ملاحظة..." className="w-full p-4 rounded-2xl bg-slate-800 border-none outline-none text-white font-bold text-xs" />
              </div>
              <button type="submit" className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-[2rem] shadow-xl text-lg">تأكيد التسجيل</button>
            </form>
          </div>
        </div>
      )}

      {/* Settle Debt Modal (Wallet Selector) */}
      {showSettleModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[120] flex items-end justify-center animate-fade">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-[3rem] p-8 pb-12 shadow-2xl border-t border-slate-800 animate-slide-up text-center">
            <h3 className="text-xl font-black text-white mb-4">من أي محفظة سيتم التسديد؟</h3>
            <p className="text-slate-500 text-xs font-bold mb-8">سيتم إنشاء عملية مالية تلقائياً لتحديث رصيدك</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {wallets.map(w => (
                <button 
                  key={w.id} 
                  onClick={() => { onSettleDebt(showSettleModal, w.id); setShowSettleModal(null); }}
                  className="p-5 rounded-[2rem] bg-slate-950 border border-slate-800 hover:border-amber-500 transition-all flex flex-col items-center gap-2 group"
                >
                  <WalletIcon size={24} style={{ color: w.color }} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-white">{w.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowSettleModal(null)} className="text-slate-600 font-black text-xs uppercase tracking-[0.3em]">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManager;
