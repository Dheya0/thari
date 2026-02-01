
import React, { useState } from 'react';
import { CreditCard, Plus, X, Calendar, RefreshCw, Trash2, Zap, Clock } from 'lucide-react';
import { Subscription, Category } from '../types';
import { getIcon } from '../constants';

interface SubscriptionManagerProps {
  subscriptions: Subscription[];
  categories: Category[];
  onAdd: (sub: Omit<Subscription, 'id'>) => void;
  onRemove: (id: string) => void;
  currencySymbol: string;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ subscriptions, categories, onAdd, onRemove, currencySymbol }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [nextBilling, setNextBilling] = useState('');

  const totalMonthly = subscriptions.reduce((sum, sub) => {
    return sum + (sub.period === 'monthly' ? sub.amount : sub.amount / 12);
  }, 0);

  return (
    <div className="space-y-6 pb-24 animate-fade">
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
        <Zap className="absolute -right-4 -top-4 text-white/10 group-hover:scale-150 transition-transform duration-1000" size={120} />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">إجمالي الالتزام الشهري</p>
          <h2 className="text-4xl font-black mb-1">{totalMonthly.toLocaleString()} <span className="text-xl opacity-50">{currencySymbol}</span></h2>
          <p className="text-[10px] font-bold opacity-60 italic">شامل الاشتراكات السنوية والمقسطة</p>
        </div>
      </div>

      <button 
        onClick={() => setShowAdd(true)}
        className="w-full py-5 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center gap-3 font-black text-amber-500 active:scale-95 transition-all shadow-lg"
      >
        <Plus size={20} /> إضافة اشتراك جديد
      </button>

      <div className="space-y-4">
        {subscriptions.map((sub) => {
          const cat = categories.find(c => c.id === sub.categoryId);
          return (
            <div key={sub.id} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-[2.5rem] flex items-center justify-between group hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-amber-500 transition-colors">
                  {getIcon(cat?.icon || 'CreditCard', 24)}
                </div>
                <div>
                  <h4 className="font-black text-white">{sub.name}</h4>
                  <div className="flex flex-col gap-1">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <RefreshCw size={10} /> {sub.period === 'monthly' ? 'شهري' : 'سنوي'}
                     </p>
                     {sub.nextBillingDate && (
                         <p className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                            <Clock size={10} /> {sub.nextBillingDate}
                         </p>
                     )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-lg font-black text-white">{sub.amount.toLocaleString()} <span className="text-[10px] opacity-30">{currencySymbol}</span></p>
                </div>
                <button onClick={() => onRemove(sub.id)} className="p-3 text-slate-700 hover:text-rose-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-end justify-center animate-fade">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-[3.5rem] p-8 pb-12 shadow-2xl border-t border-slate-800 animate-slide-up">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white">إضافة اشتراك</h3>
                <button onClick={() => setShowAdd(false)} className="p-3 bg-slate-800 rounded-2xl text-slate-500"><X size={20} /></button>
             </div>
             <div className="space-y-6">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="اسم الاشتراك (مثلاً: Netflix)" className="w-full p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold" />
                <div className="flex gap-4">
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="المبلغ" className="flex-1 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold" />
                  <select value={period} onChange={e => setPeriod(e.target.value as any)} className="bg-slate-950 border border-slate-800 text-white p-5 rounded-2xl font-bold outline-none">
                    <option value="monthly">شهري</option>
                    <option value="yearly">سنوي</option>
                  </select>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-500 px-2 uppercase tracking-widest">تاريخ التجديد القادم</label>
                        <input type="date" value={nextBilling} onChange={e => setNextBilling(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 font-bold outline-none" />
                    </div>
                </div>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold outline-none">
                  <option value="">اختر التصنيف</option>
                  {categories.filter(c => c.type === 'expense').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={() => {
                  if (name && amount && categoryId) {
                    onAdd({ name, amount: parseFloat(amount), period, categoryId, nextBillingDate: nextBilling, isActive: true });
                    setShowAdd(false);
                    setName(''); setAmount(''); setNextBilling('');
                  }
                }} className="w-full py-6 bg-amber-500 text-slate-950 font-black rounded-[2.2rem] text-lg shadow-xl">حفظ الاشتراك</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
