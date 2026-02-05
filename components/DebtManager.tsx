
import React, { useState, useMemo } from 'react';
import { User, Trash2, CheckCircle, Clock, Plus, X, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Calendar, Edit3, UserMinus, UserPlus, Info } from 'lucide-react';
import { Debt, Wallet } from '../types';

interface DebtManagerProps {
  debts: Debt[];
  wallets: Wallet[];
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onUpdateDebt: (id: string, updates: Partial<Debt>) => void;
  onSettleDebt: (id: string, walletId: string) => void;
  onDeleteDebt: (id: string) => void;
  currencySymbol: string;
  currencyCode: string;
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, wallets, onAddDebt, onUpdateDebt, onSettleDebt, onDeleteDebt, currencySymbol, currencyCode }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [showSettleModal, setShowSettleModal] = useState<string | null>(null);
  
  // Form State
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'to_me' | 'on_me'>('on_me');
  const [note, setNote] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  const stats = useMemo(() => {
    const iOwe = debts.filter(d => !d.isPaid && d.type === 'on_me').reduce((s, d) => s + d.amount, 0);
    const owedToMe = debts.filter(d => !d.isPaid && d.type === 'to_me').reduce((s, d) => s + d.amount, 0);
    return { iOwe, owedToMe };
  }, [debts]);

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => (a.isPaid === b.isPaid ? (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : a.isPaid ? 1 : -1));
  }, [debts]);

  const openAdd = () => {
    setEditingDebt(null);
    setPersonName(''); setAmount(''); setNote(''); setDueDate(''); setCreatedAt(new Date().toISOString().split('T')[0]);
    setShowAddForm(true);
  };

  const openEdit = (d: Debt) => {
    setEditingDebt(d);
    setPersonName(d.personName);
    setAmount(d.amount.toString());
    setType(d.type);
    setNote(d.note);
    setCreatedAt(d.createdAt || new Date().toISOString().split('T')[0]);
    setDueDate(d.dueDate || '');
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (personName && amount) {
      const data = {
        personName,
        amount: parseFloat(amount),
        type,
        isPaid: editingDebt ? editingDebt.isPaid : false,
        note,
        createdAt,
        dueDate,
        currency: currencyCode
      };

      if (editingDebt) {
        onUpdateDebt(editingDebt.id, data);
      } else {
        onAddDebt(data);
      }
      
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade">
      {/* Debts Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-xl shadow-rose-500/5">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
             <UserMinus size={120} />
          </div>
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2"><ArrowDownLeft size={12} /> ديون عليّ (الدائن)</p>
          <p className="text-2xl font-black text-white">{stats.iOwe.toLocaleString()} <span className="text-xs opacity-30">{currencySymbol}</span></p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-xl shadow-emerald-500/5">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
             <UserPlus size={120} />
          </div>
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><ArrowUpRight size={12} /> ديون لي (المدين)</p>
          <p className="text-2xl font-black text-white">{stats.owedToMe.toLocaleString()} <span className="text-xs opacity-30">{currencySymbol}</span></p>
        </div>
      </div>

      <button 
        onClick={openAdd}
        className="w-full py-5 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center gap-3 font-black text-amber-500 active:scale-95 transition-all shadow-xl"
      >
        <Plus size={20} /> تسجيل عملية دين جديدة
      </button>

      {/* Debts List */}
      <div className="space-y-4">
        {sortedDebts.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
            <User size={64} className="mx-auto text-slate-800 mb-6" />
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">لا يوجد سجل ذمم مالية حالياً</p>
          </div>
        ) : (
          sortedDebts.map((debt) => (
            <div 
              key={debt.id} 
              className={`p-6 rounded-[3rem] border transition-all relative overflow-hidden group ${debt.isPaid ? 'bg-slate-900/20 border-slate-900 grayscale opacity-40' : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/30 shadow-lg'}`}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${debt.type === 'on_me' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {debt.type === 'on_me' ? <UserMinus size={28} /> : <UserPlus size={28} />}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-lg">{debt.personName}</h4>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${debt.type === 'on_me' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {debt.type === 'on_me' ? 'دائن (له عليّ)' : 'مدين (لي عليه)'}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-xl font-black ${debt.type === 'on_me' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {debt.amount.toLocaleString()} <span className="text-[10px] opacity-40">{currencySymbol}</span>
                  </p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">المبلغ المتبقي</p>
                </div>
              </div>

              {debt.note && (
                  <div className="mt-4 p-4 bg-slate-950/50 rounded-2xl border border-white/5 flex items-start gap-3">
                      <Info size={14} className="text-slate-600 mt-0.5" />
                      <p className="text-xs font-bold text-slate-400 italic leading-relaxed">{debt.note}</p>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="p-3 bg-slate-950/30 rounded-2xl flex flex-col items-center border border-white/5">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={10} /> تاريخ النشوء</span>
                      <span className="text-[10px] font-black text-slate-300">{debt.createdAt}</span>
                  </div>
                  <div className="p-3 bg-slate-950/30 rounded-2xl flex flex-col items-center border border-white/5">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={10} /> موعد السداد</span>
                      <span className={`text-[10px] font-black ${debt.dueDate ? 'text-amber-500' : 'text-slate-600 italic'}`}>{debt.dueDate || 'غير محدد'}</span>
                  </div>
              </div>

              {!debt.isPaid && (
                <div className="flex gap-2 mt-6">
                  <button 
                    onClick={() => setShowSettleModal(debt.id)}
                    className="flex-2 flex-[2] py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                  >
                    <CheckCircle size={16} /> تأكيد السداد
                  </button>
                  <button 
                    onClick={() => openEdit(debt)}
                    className="p-4 bg-slate-800 text-slate-300 rounded-2xl active:scale-90 transition-all border border-slate-700 hover:bg-slate-700"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => { if(confirm('حذف هذا السجل نهائياً؟')) onDeleteDebt(debt.id) }}
                    className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl active:scale-90 transition-all border border-rose-500/20 hover:bg-rose-500/20"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
              
              {debt.isPaid && (
                  <div className="mt-4 flex items-center justify-center gap-2 py-2 bg-emerald-500/10 rounded-xl text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em]">
                      {/* Fix: Changed non-existent CheckCircle2 to CheckCircle */}
                      <CheckCircle size={12} /> تم تسوية هذه الذمة بالكامل
                  </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Debt Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[300] flex items-end justify-center animate-fade no-print">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-[4rem] p-10 pb-16 shadow-2xl border-t border-white/5 animate-slide-up overflow-y-auto no-scrollbar max-h-[90vh]">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-white tracking-tight">{editingDebt ? 'تعديل بيانات الذمة' : 'تسجيل ذمة مالية جديدة'}</h3>
              <button onClick={() => setShowAddForm(false)} className="p-4 bg-slate-800 rounded-2xl text-slate-500 active:scale-90"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex bg-slate-950 p-2 rounded-[2.2rem] border border-slate-800">
                <button type="button" onClick={() => setType('on_me')} className={`flex-1 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${type === 'on_me' ? 'bg-rose-500 text-white shadow-xl' : 'text-slate-600'}`}>عليّ (دائن)</button>
                <button type="button" onClick={() => setType('to_me')} className={`flex-1 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${type === 'to_me' ? 'bg-emerald-500 text-white shadow-xl' : 'text-slate-600'}`}>لي (مدين)</button>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">اسم الشخص أو الجهة</label>
                    <input type="text" value={personName} onChange={e => setPersonName(e.target.value)} placeholder="مثلاً: البنك، فلان..." className="w-full p-5 rounded-2xl bg-slate-950 border border-white/5 outline-none text-white font-bold focus:border-amber-500 transition-colors shadow-inner" required />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">المبلغ المالي</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-5 rounded-2xl bg-slate-950 border border-white/5 outline-none text-white font-black text-center text-3xl tracking-wider focus:border-amber-500 transition-colors" required />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">تاريخ النشوء</label>
                    <input type="date" value={createdAt} onChange={e => setCreatedAt(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-950 border border-white/5 outline-none text-slate-400 font-bold text-xs" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">موعد السداد</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-950 border border-white/5 outline-none text-slate-400 font-bold text-xs" />
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">ملاحظات إضافية</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="أي تفاصيل أخرى حول هذا الدين..." className="w-full p-5 rounded-2xl bg-slate-950 border border-white/5 outline-none text-white font-bold text-xs min-h-[100px] resize-none" />
              </div>

              <button type="submit" className="w-full py-6 bg-amber-500 text-slate-950 font-black rounded-[2.5rem] shadow-2xl text-lg hover:brightness-110 active:scale-95 transition-all">
                {editingDebt ? 'تحديث البيانات' : 'تأكيد التسجيل'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settle Debt Modal (Wallet Selector) */}
      {showSettleModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-end justify-center animate-fade no-print">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-[4rem] p-10 pb-16 shadow-2xl border-t border-slate-800 animate-slide-up text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-500 mb-6">
                <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">من أي محفظة تم التسوية؟</h3>
            <p className="text-slate-500 text-xs font-bold mb-10 leading-relaxed px-6">سيتم تسجيل هذه التسوية كعملية مالية رسمية في السجل لتحديث رصيد المحفظة تلقائياً.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              {wallets.map(w => (
                <button 
                  key={w.id} 
                  onClick={() => { onSettleDebt(showSettleModal, w.id); setShowSettleModal(null); }}
                  className="p-6 rounded-[2.5rem] bg-slate-950 border border-white/5 hover:border-amber-500/50 transition-all flex flex-col items-center gap-3 group active:scale-95 shadow-inner"
                >
                  <div className="p-3 rounded-xl bg-slate-900" style={{ color: w.color }}>
                    <WalletIcon size={24} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[11px] font-black text-white">{w.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowSettleModal(null)} className="text-slate-600 font-black text-[10px] uppercase tracking-[0.4em] hover:text-white transition-colors">إلغاء العملية</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManager;
