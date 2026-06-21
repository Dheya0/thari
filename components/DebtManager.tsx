
import React, { useState, useMemo } from 'react';
import { User, Trash2, CheckCircle, Clock, Plus, X, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Calendar, Edit3, UserMinus, UserPlus, Info, Link2, Link2Off, EyeOff, GripHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Debt, Wallet, DebtInstallment } from '../types';

interface DebtManagerProps {
  debts: Debt[];
  wallets: Wallet[];
  onAddDebt: (debt: Omit<Debt, 'id'>, walletId?: string) => void;
  onUpdateDebt: (id: string, updates: Partial<Debt>) => void;
  onSettleDebt: (id: string, walletId?: string) => void; // Used for full settlement
  onPayDebt?: (id: string, amount: number, walletId?: string, noteSuffix?: string, customDebtUpdates?: Partial<Debt>) => void;
  onDeleteDebt: (id: string) => void;
  currencySymbol: string;
  currencyCode: string;
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, wallets, onAddDebt, onUpdateDebt, onSettleDebt, onPayDebt, onDeleteDebt, currencySymbol, currencyCode }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [showSettleModal, setShowSettleModal] = useState<{ debtId: string, installmentId?: string } | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  
  // Form State
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'to_me' | 'on_me'>('on_me');
  const [note, setNote] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  
  // Installment State
  const [enableInstallments, setEnableInstallments] = useState(false);
  const [installmentCount, setInstallmentCount] = useState<number>(1);
  
  // New State for Transaction Link
  const [includeWalletTransaction, setIncludeWalletTransaction] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const iOwe = debts.filter(d => !d.isPaid && d.type === 'on_me').reduce((s, d) => s + (d.amount - (d.paidAmount || 0)), 0);
    const owedToMe = debts.filter(d => !d.isPaid && d.type === 'to_me').reduce((s, d) => s + (d.amount - (d.paidAmount || 0)), 0);
    return { iOwe, owedToMe };
  }, [debts]);

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => (a.isPaid === b.isPaid ? (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : a.isPaid ? 1 : -1));
  }, [debts]);

  const openAdd = () => {
    setEditingDebt(null);
    setPersonName(''); setAmount(''); setNote(''); setDueDate(''); 
    setCreatedAt(new Date().toISOString().split('T')[0]);
    setIncludeWalletTransaction(true);
    setEnableInstallments(false);
    setInstallmentCount(1);
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
    setEnableInstallments(!!d.installments && d.installments.length > 0);
    setInstallmentCount(d.installments?.length || 1);
    setShowAddForm(true);
  };

  const generateInstallments = (total: number, count: number, start: string): DebtInstallment[] => {
    const installments: DebtInstallment[] = [];
    const perInstallment = total / count;
    const startDate = new Date(start);
    
    for (let i = 0; i < count; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i + 1); // Next month
        installments.push({
            id: `inst-${Date.now()}-${i}`,
            amount: parseFloat(perInstallment.toFixed(2)),
            dueDate: date.toISOString().split('T')[0],
            isPaid: false
        });
    }
    return installments;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (personName && amount) {
      const totalAmount = parseFloat(amount);
      
      let installmentsData = editingDebt?.installments;
      // Generate new installments only if creating new or if explicitly resetting/enabling
      if (!editingDebt && enableInstallments && installmentCount > 1) {
         installmentsData = generateInstallments(totalAmount, installmentCount, createdAt);
      }

      const data: any = {
        personName,
        amount: totalAmount,
        type,
        isPaid: editingDebt ? editingDebt.isPaid : false,
        paidAmount: editingDebt ? editingDebt.paidAmount : 0,
        note,
        createdAt,
        dueDate,
        currency: currencyCode,
        installments: installmentsData
      };

      if (editingDebt) {
        onUpdateDebt(editingDebt.id, data);
      } else {
        onAddDebt(data, includeWalletTransaction ? selectedWalletId : undefined);
      }
      
      setShowAddForm(false);
    }
  };

  // Handle Paying a specific installment or Full Amount
  const executeSettlement = (walletId?: string) => {
     if (!showSettleModal) return;

     const { debtId, installmentId } = showSettleModal;
     const debt = debts.find(d => d.id === debtId);
     if (!debt) return;

     if (installmentId && debt.installments) {
        // Pay Specific Installment
        const instIndex = debt.installments.findIndex(i => i.id === installmentId);
        if (instIndex === -1) return;

        const instAmount = debt.installments[instIndex].amount;
        
        const updatedInstallments = [...debt.installments];
        updatedInstallments[instIndex] = { 
            ...updatedInstallments[instIndex], 
            isPaid: true, 
            paidDate: new Date().toISOString().split('T')[0] 
        };

        if (onPayDebt) {
            // This cleanly handles the transaction and automatically updates state in the parent
            onPayDebt(
                debtId, 
                instAmount, 
                walletId, 
                `قسط ${instIndex + 1}`, 
                { installments: updatedInstallments }
            );
        } else {
            // Fallback
            const newPaidAmount = (debt.paidAmount || 0) + instAmount;
            const isFullyPaid = newPaidAmount >= debt.amount * 0.99;
            onUpdateDebt(debtId, {
                installments: updatedInstallments,
                paidAmount: newPaidAmount,
                isPaid: isFullyPaid
            });
        }
     } else {
        // Full Settlement of the remaining amount
        const remainingAmount = debt.amount - (debt.paidAmount || 0);
        if (onPayDebt) {
            onPayDebt(
                debtId, 
                remainingAmount, 
                walletId, 
                "سداد كامل المتبقي"
            );
        } else {
            onSettleDebt(debtId, walletId);
        }
     }
     setShowSettleModal(null);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade">
      {/* Debts Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-rose-500/15 border border-rose-500/20 p-4 sm:p-5 rounded-2xl relative overflow-hidden group shadow-lg shadow-rose-500/5 text-right">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
             <UserMinus size={90} />
          </div>
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-end"><ArrowDownLeft size={11} /> ديون عليّ (متبقية)</p>
          <p className="text-xl font-black text-white">{stats.iOwe.toLocaleString()} <span className="text-xs opacity-30">{currencySymbol}</span></p>
        </div>
        <div className="bg-emerald-500/15 border border-emerald-500/20 p-4 sm:p-5 rounded-2xl relative overflow-hidden group shadow-lg shadow-emerald-500/5 text-right">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
             <UserPlus size={90} />
          </div>
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-end"><ArrowUpRight size={11} /> ديون لي (متبقية)</p>
          <p className="text-xl font-black text-white">{stats.owedToMe.toLocaleString()} <span className="text-xs opacity-30">{currencySymbol}</span></p>
        </div>
      </div>

      <button 
        onClick={openAdd}
        className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm text-amber-500 active:scale-95 transition-all shadow-lg"
      >
        <Plus size={16} /> تسجيل دين / تقسيط جديد
      </button>

      {/* Debts List */}
      <div className="space-y-3">
        {sortedDebts.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            <User size={48} className="mx-auto text-slate-850 mb-4" />
            <p className="text-slate-550 font-black text-[9px] uppercase tracking-[0.25em]">لا يوجد سجل ذمم مالية حالياً</p>
          </div>
        ) : (
          sortedDebts.map((debt) => {
             const progress = Math.min(100, ((debt.paidAmount || 0) / debt.amount) * 100);
             const remaining = debt.amount - (debt.paidAmount || 0);
             const hasInstallments = debt.installments && debt.installments.length > 0;
             const isExpanded = expandedDebtId === debt.id;

             return (
            <div 
              key={debt.id} 
              className={`p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden group ${debt.isPaid ? 'bg-slate-900/20 border-slate-900 grayscale opacity-40' : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/30 shadow-md'}`}
            >
              <div className="flex justify-between items-start relative z-10 text-right">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow ${debt.type === 'on_me' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {debt.type === 'on_me' ? <UserMinus size={22} /> : <UserPlus size={22} />}
                  </div>
                  <div className="text-right">
                    <h4 className="font-extrabold text-white text-sm sm:text-base leading-tight">{debt.personName}</h4>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${debt.type === 'on_me' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {debt.type === 'on_me' ? 'دائن (له عليّ)' : 'مدين (لي عليه)'}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-base sm:text-lg font-black ${debt.type === 'on_me' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {debt.amount.toLocaleString()} <span className="text-[9px] opacity-40">{currencySymbol}</span>
                  </p>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">الإجمالي</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 mb-1">
                 <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                    <span>المدفوع: {(debt.paidAmount || 0).toLocaleString()}</span>
                    <span>المتبقي: {remaining.toLocaleString()}</span>
                 </div>
                 <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${debt.isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
                 </div>
              </div>

              {debt.note && (
                  <div className="mt-3 p-3 bg-slate-950/50 rounded-xl border border-white/5 flex items-start gap-2 text-right">
                      <p className="text-[10px] font-semibold text-slate-400 italic leading-relaxed flex-1">{debt.note}</p>
                      <Info size={12} className="text-slate-650 mt-0.5 shrink-0" />
                  </div>
              )}

              {/* Installments Section */}
              {hasInstallments && (
                 <div className="mt-3">
                     <button 
                        onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-white/5 text-[9px] font-black text-slate-400 hover:text-white transition-colors"
                     >
                        <span>جدول الأقساط ({debt.installments!.filter(i => i.isPaid).length}/{debt.installments!.length} مدفوع)</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                     </button>
                     
                     {isExpanded && (
                         <div className="mt-2 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                             {debt.installments!.map((inst, idx) => (
                                 <div key={inst.id} className={`flex items-center justify-between p-3 rounded-xl border ${inst.isPaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-950 border-slate-800'}`}>
                                     <div className="flex items-center gap-3">
                                         <span className="text-[10px] font-bold text-slate-500">#{idx+1}</span>
                                         <div>
                                             <p className={`text-xs font-black ${inst.isPaid ? 'text-emerald-500' : 'text-white'}`}>{inst.amount.toLocaleString()}</p>
                                             <p className="text-[9px] text-slate-500">{inst.dueDate}</p>
                                         </div>
                                     </div>
                                     {inst.isPaid ? (
                                         <CheckCircle size={16} className="text-emerald-500" />
                                     ) : (
                                         <button 
                                            onClick={() => setShowSettleModal({ debtId: debt.id, installmentId: inst.id })}
                                            className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-[9px] font-black hover:bg-amber-400"
                                         >
                                            سداد
                                         </button>
                                     )}
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="p-2 bg-slate-950/30 rounded-xl flex flex-col items-center border border-white/5">
                      <span className="text-[7.5px] font-black text-slate-500 tracking-widest mb-0.5 flex items-center gap-1"><Calendar size={9} /> تاريخ النشوء</span>
                      <span className="text-[9.5px] font-black text-slate-350">{debt.createdAt}</span>
                  </div>
                  <div className="p-2 bg-slate-950/30 rounded-xl flex flex-col items-center border border-white/5">
                      <span className="text-[7.5px] font-black text-slate-500 tracking-widest mb-0.5 flex items-center gap-1"><Clock size={9} /> آخر موعد</span>
                      <span className={`text-[9.5px] font-black ${debt.dueDate ? 'text-amber-500' : 'text-slate-650 italic'}`}>{debt.dueDate || 'غير محدد'}</span>
                  </div>
              </div>

              {!debt.isPaid && (
                <div className="flex gap-1.5 mt-4">
                  {!hasInstallments && (
                      <button 
                        onClick={() => setShowSettleModal({ debtId: debt.id })}
                        className="flex-2 flex-[2] py-2.5 bg-amber-500 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md"
                      >
                        <CheckCircle size={14} /> سداد كامل
                      </button>
                  )}
                  {hasInstallments && (
                      <div className="flex-2 flex-[2] py-2.5 bg-slate-800 text-slate-400 rounded-xl font-black text-[9px] flex items-center justify-center gap-1 border border-slate-700">
                          <Info size={12} /> استخدم القائمة للأقساط
                      </div>
                  )}
                  <button 
                    onClick={() => openEdit(debt)}
                    className="p-2.5 bg-slate-800 text-slate-350 rounded-xl active:scale-90 transition-all border border-slate-700 hover:bg-slate-700 focus:outline-none"
                  >
                    <Edit3 size={14} />
                  </button>
                  {confirmDeleteId === debt.id ? (
                    <div className="flex gap-1.5 items-center bg-slate-950 p-1 rounded-xl border border-rose-500/20 shrink-0">
                      <button 
                        onClick={() => { onDeleteDebt(debt.id); setConfirmDeleteId(null); }}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[10px] font-black active:scale-95 transition-all hover:bg-rose-500"
                      >
                        حذف مؤكد
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold active:scale-95 transition-all hover:bg-slate-700"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setConfirmDeleteId(debt.id)}
                      className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl active:scale-90 transition-all border border-rose-500/20 hover:bg-rose-500/20 focus:outline-none"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
              
              {debt.isPaid && (
                  <div className="mt-3 flex items-center justify-center gap-1 py-1.5 bg-emerald-500/10 rounded-xl text-emerald-500 font-extrabold text-[9px] uppercase tracking-wider">
                      <CheckCircle size={10} /> تم تسوية هذه الذمة بالكامل
                  </div>
              )}
            </div>
          )})
        )}
      </div>

      {/* Add/Edit Debt Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[300] flex flex-col justify-end sm:p-4 animate-fade no-print">
          <div className="bg-slate-900 w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col min-h-0 border-t border-white/5 animate-slide-up">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">{editingDebt ? 'تعديل بيانات الذمة' : 'تسجيل ذمة مالية جديدة'}</h3>
              <button onClick={() => setShowAddForm(false)} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white active:scale-90 transition-colors"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 overflow-y-auto no-scrollbar pb-[env(safe-area-inset-bottom)] shrink-0">
              <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
                <button type="button" onClick={() => setType('on_me')} className={`flex-1 py-2 rounded-lg text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all ${type === 'on_me' ? 'bg-rose-500 text-white shadow' : 'text-slate-550'}`}>عليّ (دائن)</button>
                <button type="button" onClick={() => setType('to_me')} className={`flex-1 py-2 rounded-lg text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all ${type === 'to_me' ? 'bg-emerald-500 text-white shadow' : 'text-slate-550'}`}>لي (مدين)</button>
              </div>

              <div className="space-y-3 shrink-0">
                 <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest px-1">اسم الشخص أو الجهة</label>
                    <input type="text" value={personName} onChange={e => setPersonName(e.target.value)} placeholder="مثلاً: البنك، فلان..." className="w-full p-3.5 rounded-xl bg-slate-950 border border-white/5 outline-none text-white text-xs font-bold focus:border-amber-500 transition-colors shadow-inner" required />
                 </div>
                 
                 <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest px-1">المبلغ المالي الإجمالي</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-3.5 rounded-xl bg-slate-950 border border-white/5 outline-none text-white font-black text-center text-xl tracking-wider focus:border-amber-500 transition-colors" required />
                 </div>
              </div>

              {/* Installments Toggle */}
              {!editingDebt && (
                 <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                         <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><GripHorizontal size={12} /> تفعيل نظام الأقساط</span>
                         <div dir="ltr" className={`w-10 h-5.5 rounded-full p-0.5 cursor-pointer transition-all ${enableInstallments ? 'bg-amber-500' : 'bg-slate-800'}`} onClick={() => setEnableInstallments(!enableInstallments)}>
                            <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${enableInstallments ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                         </div>
                    </div>
                    {enableInstallments && (
                         <div className="animate-fade space-y-2">
                            <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest px-2">عدد الأقساط (شهرياً)</label>
                            <div className="flex gap-3 items-center">
                                <input type="range" min="2" max="60" value={installmentCount} onChange={e => setInstallmentCount(parseInt(e.target.value))} className="flex-1 accent-amber-500 h-1" />
                                <span className="bg-slate-800 text-white font-black px-2.5 py-1 rounded-lg text-[10px] min-w-[2.2rem] text-center">{installmentCount}</span>
                            </div>
                            <p className="text-[8px] text-center text-slate-500">سيتم تقسيم المبلغ إلى {installmentCount} قسط يبدأ من الشهر القادم.</p>
                         </div>
                    )}
                 </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest px-1">تاريخ النشوء</label>
                    <input type="date" value={createdAt} onChange={e => setCreatedAt(e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-white/5 outline-none text-slate-400 font-bold text-xs" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest px-1">آخر موعد للسداد</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-white/5 outline-none text-slate-400 font-bold text-xs" />
                 </div>
              </div>

              {/* Transaction Link Toggle - Only when adding new debt */}
              {!editingDebt && (
                 <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${includeWalletTransaction ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                                  {includeWalletTransaction ? <Link2 size={15} /> : <Link2Off size={15} />}
                              </div>
                              <div className="text-right">
                                  <p className="font-extrabold text-white text-xs">تسجيل عملية مالية</p>
                                  <p className="text-[8px] text-slate-500">هل أثر هذا الدين على رصيد محفظتك؟</p>
                              </div>
                         </div>
                         <div 
                           onClick={() => setIncludeWalletTransaction(!includeWalletTransaction)}
                           className={`w-10 h-5.5 rounded-full p-0.5 cursor-pointer transition-all ${includeWalletTransaction ? 'bg-amber-500' : 'bg-slate-800'}`}
                           dir="ltr"
                         >
                            <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${includeWalletTransaction ? 'translate-x-5' : 'translate-x-0'}`} />
                         </div>
                    </div>

                    {includeWalletTransaction && (
                        <div className="animate-fade space-y-2">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">
                                {type === 'to_me' ? 'سحب المبلغ من:' : 'إيداع المبلغ في:'}
                            </label>
                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                                {wallets.map(w => (
                                    <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => setSelectedWalletId(w.id)}
                                    className={`shrink-0 px-3.5 py-2 rounded-xl border transition-all text-[10px] font-bold flex flex-col items-center gap-0.5 ${selectedWalletId === w.id ? 'bg-amber-500/20 text-amber-500 border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                                    >
                                    <span>{w.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
              )}

              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest px-1">ملاحظات إضافية</label>
                <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="أي تفاصيل أخرى حول هذا الدين..." className="w-full p-3 rounded-xl bg-slate-950 border border-white/5 outline-none text-white font-bold text-xs resize-none" />
              </div>

              <button type="submit" className="w-full py-3.5 bg-amber-500 text-slate-950 font-black rounded-xl shadow text-sm hover:brightness-110 active:scale-95 transition-all">
                {editingDebt ? 'تحديث البيانات' : 'حفظ السجل'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settle Debt Modal (Wallet Selector) */}
      {showSettleModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex flex-col justify-end p-0 sm:p-4 animate-fade no-print">
          <div className="bg-slate-900 w-full max-w-lg mx-auto rounded-t-[2.5rem] sm:rounded-[4rem] p-6 sm:p-10 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-2xl border-t border-slate-800 animate-slide-up text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 rounded-3xl sm:rounded-[2rem] flex items-center justify-center mx-auto text-emerald-500 mb-6">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3">تأكيد عملية السداد</h3>
            <p className="text-slate-500 text-[10px] sm:text-xs font-bold mb-8 sm:mb-10 leading-relaxed px-2 sm:px-6">
                {showSettleModal.installmentId ? "سيتم سداد هذا القسط فقط." : "سيتم سداد كامل المبلغ المتبقي."} <br/>
                اختر المحفظة لتحديث رصيدها، أو اختر تسوية خارجية.
            </p>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
              {wallets.map(w => (
                <button 
                  key={w.id} 
                  onClick={() => executeSettlement(w.id)}
                  className="p-4 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] bg-slate-950 border border-white/5 hover:border-amber-500/50 transition-all flex flex-col items-center gap-3 group active:scale-95 shadow-inner"
                >
                  <div className="p-3 rounded-xl bg-slate-900" style={{ color: w.color }}>
                    <WalletIcon size={20} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] font-black text-white px-2 text-center leading-tight">{w.name}</span>
                </button>
              ))}
            </div>
            
            <button 
                onClick={() => executeSettlement(undefined)}
                className="w-full py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] bg-slate-800 text-slate-300 font-bold text-xs mb-6 sm:mb-8 flex items-center justify-center gap-2 active:scale-95"
            >
                <EyeOff size={16} /> تسوية خارجية (لا تؤثر على الرصيد)
            </button>

            <button onClick={() => setShowSettleModal(null)} className="text-slate-600 font-black text-[10px] uppercase tracking-[0.4em] hover:text-white transition-colors">إلغاء العملية</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManager;
