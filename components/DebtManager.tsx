import React, { useState, useMemo } from 'react';
import { 
  User, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Plus, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet as WalletIcon, 
  Calendar, 
  Edit3, 
  UserMinus, 
  UserPlus, 
  Info, 
  Link2, 
  Link2Off, 
  EyeOff, 
  GripHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Receipt, 
  CreditCard, 
  Check, 
  AlertCircle, 
  Scale, 
  Search, 
  Filter, 
  History,
  Phone,
  Tag,
  FileSpreadsheet
} from 'lucide-react';
import { Debt, Wallet, DebtInstallment, DebtPayment } from '../types';
import { 
  getDebtCalculations, 
  getDebtRemaining, 
  groupDebtsByPerson, 
  getOverallDebtStats, 
  PersonDebtSummary,
  DebtCalculation 
} from '../utils/debtModel';

interface DebtManagerProps {
  debts: Debt[];
  wallets: Wallet[];
  onAddDebt: (debt: Omit<Debt, 'id'>, walletId?: string) => void;
  onUpdateDebt: (id: string, updates: Partial<Debt>) => void;
  onSettleDebt: (id: string, walletId?: string) => void;
  onPayDebt?: (
    id: string, 
    amount: number, 
    walletId?: string, 
    noteSuffix?: string, 
    customDebtUpdates?: Partial<Debt>,
    paymentDate?: string
  ) => void;
  onDeleteDebt: (id: string) => void;
  currencySymbol: string;
  currencyCode: string;
}

const DebtManager: React.FC<DebtManagerProps> = ({ 
  debts, 
  wallets, 
  onAddDebt, 
  onUpdateDebt, 
  onSettleDebt, 
  onPayDebt, 
  onDeleteDebt, 
  currencySymbol, 
  currencyCode 
}) => {
  // Main view modes: 'list' (individual debts) | 'persons' (statement by contact)
  const [activeView, setActiveView] = useState<'list' | 'persons'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'to_me' | 'on_me' | 'active' | 'settled' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [paymentModalData, setPaymentModalData] = useState<{ debt: Debt; prefillAmount?: number; installmentId?: string } | null>(null);
  const [historyModalDebt, setHistoryModalDebt] = useState<Debt | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const [expandedPersonName, setExpandedPersonName] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State (New / Edit Debt)
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [personTag, setPersonTag] = useState<'individual' | 'friend' | 'family' | 'customer' | 'supplier'>('individual');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'to_me' | 'on_me'>('on_me');
  const [note, setNote] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  
  // Installments in Form
  const [enableInstallments, setEnableInstallments] = useState(false);
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  
  // Wallet Transaction Link in Form
  const [includeWalletTransaction, setIncludeWalletTransaction] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');

  // Payment Modal Input State
  const [payAmountInput, setPayAmountInput] = useState('');
  const [payWalletId, setPayWalletId] = useState<string>(wallets[0]?.id || '');
  const [payDateInput, setPayDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [payNoteInput, setPayNoteInput] = useState('');
  const [payExternalOnly, setPayExternalOnly] = useState(false);

  // Global calculations
  const stats = useMemo(() => getOverallDebtStats(debts), [debts]);
  const personSummaries = useMemo(() => groupDebtsByPerson(debts), [debts]);

  // Unique contact names for quick suggestion chips
  const existingContactNames = useMemo(() => {
    const names = Array.from(new Set(debts.map(d => d.personName?.trim()).filter(Boolean)));
    return names;
  }, [debts]);

  // Filtered debts
  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      const calc = getDebtCalculations(d);
      
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = d.personName?.toLowerCase().includes(q);
        const matchesNote = d.note?.toLowerCase().includes(q);
        const matchesAmount = d.amount.toString().includes(q);
        if (!matchesName && !matchesNote && !matchesAmount) return false;
      }

      // Status / Type filter
      if (statusFilter === 'to_me') return d.type === 'to_me';
      if (statusFilter === 'on_me') return d.type === 'on_me';
      if (statusFilter === 'active') return calc.status !== 'settled';
      if (statusFilter === 'settled') return calc.status === 'settled';
      if (statusFilter === 'overdue') return calc.status === 'overdue';
      return true;
    }).sort((a, b) => {
      const aCalc = getDebtCalculations(a);
      const bCalc = getDebtCalculations(b);
      // Active first, then overdue first, then newest
      if (aCalc.status === 'settled' && bCalc.status !== 'settled') return 1;
      if (aCalc.status !== 'settled' && bCalc.status === 'settled') return -1;
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
  }, [debts, statusFilter, searchQuery]);

  // Filtered persons
  const filteredPersons = useMemo(() => {
    if (!searchQuery.trim()) return personSummaries;
    const q = searchQuery.toLowerCase().trim();
    return personSummaries.filter(p => 
      p.personName.toLowerCase().includes(q) || 
      (p.personPhone && p.personPhone.includes(q))
    );
  }, [personSummaries, searchQuery]);

  const openAdd = (prefilledPerson?: string) => {
    setEditingDebt(null);
    setPersonName(prefilledPerson || '');
    setPersonPhone('');
    setPersonTag('individual');
    setAmount('');
    setNote('');
    setDueDate(''); 
    setCreatedAt(new Date().toISOString().split('T')[0]);
    setIncludeWalletTransaction(true);
    setEnableInstallments(false);
    setInstallmentCount(3);
    setShowAddForm(true);
  };

  const openEdit = (d: Debt) => {
    setEditingDebt(d);
    setPersonName(d.personName || '');
    setPersonPhone(d.personPhone || '');
    setPersonTag(d.personTag || 'individual');
    setAmount((d.originalAmount || d.amount).toString());
    setType(d.type);
    setNote(d.note || '');
    setCreatedAt(d.createdAt || new Date().toISOString().split('T')[0]);
    setDueDate(d.dueDate || '');
    setEnableInstallments(!!d.installments && d.installments.length > 0);
    setInstallmentCount(d.installments?.length || 3);
    setShowAddForm(true);
  };

  const openPaymentModal = (debt: Debt, prefillAmount?: number, installmentId?: string) => {
    const remaining = getDebtRemaining(debt);
    const amountToPay = prefillAmount !== undefined ? prefillAmount : remaining;
    setPaymentModalData({ debt, prefillAmount: amountToPay, installmentId });
    setPayAmountInput(amountToPay.toString());
    setPayDateInput(new Date().toISOString().split('T')[0]);
    setPayNoteInput(installmentId ? 'سداد قسط محدد' : (amountToPay >= remaining ? 'سداد كامل المبلغ المتبقي' : 'دفعة سداد جزئية'));
    setPayExternalOnly(false);
    setPayWalletId(wallets[0]?.id || '');
  };

  const generateInstallments = (total: number, count: number, start: string): DebtInstallment[] => {
    const installments: DebtInstallment[] = [];
    const perInstallment = parseFloat((total / count).toFixed(2));
    const startDate = new Date(start);
    
    for (let i = 0; i < count; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i + 1);
        installments.push({
            id: `inst-${Date.now()}-${i}`,
            amount: perInstallment,
            dueDate: date.toISOString().split('T')[0],
            isPaid: false
        });
    }
    return installments;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !amount) return;

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) return;
    
    let installmentsData = editingDebt?.installments;
    if (!editingDebt && enableInstallments && installmentCount > 1) {
       installmentsData = generateInstallments(totalAmount, installmentCount, createdAt);
    }

    const data: any = {
      personName: personName.trim(),
      personPhone: personPhone.trim() || undefined,
      personTag: personTag || 'individual',
      amount: totalAmount,
      originalAmount: totalAmount,
      type,
      isPaid: editingDebt ? editingDebt.isPaid : false,
      paidAmount: editingDebt ? (editingDebt.paidAmount || 0) : 0,
      note,
      createdAt,
      dueDate: dueDate || undefined,
      currency: currencyCode,
      installments: installmentsData,
      payments: editingDebt?.payments || []
    };

    if (editingDebt) {
      onUpdateDebt(editingDebt.id, data);
    } else {
      onAddDebt(data, includeWalletTransaction ? selectedWalletId : undefined);
    }
    
    setShowAddForm(false);
  };

  // Submit payment from the Payment Modal
  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalData) return;

    const payVal = parseFloat(payAmountInput);
    if (isNaN(payVal) || payVal <= 0) return;

    const { debt, installmentId } = paymentModalData;
    const chosenWalletId = payExternalOnly ? undefined : payWalletId;

    let updatedInstallments = debt.installments;
    if (installmentId && debt.installments) {
      updatedInstallments = debt.installments.map(inst => 
        inst.id === installmentId ? { ...inst, isPaid: true, paidDate: payDateInput } : inst
      );
    }

    if (onPayDebt) {
      onPayDebt(
        debt.id, 
        payVal, 
        chosenWalletId, 
        payNoteInput.trim() || undefined, 
        updatedInstallments ? { installments: updatedInstallments } : undefined,
        payDateInput
      );
    } else {
      onSettleDebt(debt.id, chosenWalletId);
    }

    setPaymentModalData(null);
  };

  return (
    <div className="space-y-6 pb-28 max-w-5xl mx-auto w-full text-right" dir="rtl">
      
      {/* 1. Header & Summary Cards (Every Number Interpreted) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Debts I Owe (عليّ) */}
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden group shadow-lg shadow-rose-500/5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <UserMinus size={18} />
            </span>
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
              <ArrowDownLeft size={12} /> ديون عليّ (التزامات)
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {stats.totalIOweRemaining.toLocaleString()} <span className="text-xs text-rose-400 font-bold">{currencySymbol}</span>
          </p>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-2 pt-2 border-t border-rose-500/10">
            <span>الأصل: {stats.totalOriginalIOwe.toLocaleString()}</span>
            <span>المدفوع: {stats.totalPaidIOwe.toLocaleString()}</span>
          </div>
        </div>

        {/* Debts Owed to Me (لي) */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden group shadow-lg shadow-emerald-500/5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <UserPlus size={18} />
            </span>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <ArrowUpRight size={12} /> ديون لي (مستحقات)
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            {stats.totalOwedToMeRemaining.toLocaleString()} <span className="text-xs text-emerald-400 font-bold">{currencySymbol}</span>
          </p>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-2 pt-2 border-t border-emerald-500/10">
            <span>الأصل: {stats.totalOriginalOwedToMe.toLocaleString()}</span>
            <span>المسترد: {stats.totalPaidOwedToMe.toLocaleString()}</span>
          </div>
        </div>

        {/* Net Debt Position */}
        <div className="bg-slate-900/80 border border-white/5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden group shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Scale size={18} />
            </span>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
              صافي المركز المالي
            </span>
          </div>
          {(() => {
            const net = stats.totalOwedToMeRemaining - stats.totalIOweRemaining;
            const isPositive = net > 0;
            const isZero = Math.abs(net) < 0.01;
            return (
              <>
                <p className={`text-xl sm:text-2xl font-black ${isZero ? 'text-slate-300' : isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Math.abs(net).toLocaleString()} <span className="text-xs font-bold">{currencySymbol}</span>
                </p>
                <div className="text-[10px] font-bold text-slate-400 mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                  <span>{isZero ? 'الذمم متعادلة' : isPositive ? 'صافي مستحق لك' : 'صافي التزام عليك'}</span>
                  <span>{stats.uniquePersonsCount} جهة تعامل</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* 2. Top Action Bar: Add Debt + View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button 
          onClick={() => openAdd()}
          className="py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm active:scale-98 transition-all shadow-lg shadow-amber-500/10 shrink-0"
        >
          <Plus size={18} strokeWidth={3} /> تسجيل دين جديد
        </button>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-white/5 self-center sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveView('list')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeView === 'list' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt size={14} />
            <span>سجل العمليات ({debts.length})</span>
          </button>
          <button
            onClick={() => setActiveView('persons')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeView === 'persons' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>جهات التعامل ({stats.uniquePersonsCount})</span>
          </button>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الملاحظة، أو المبلغ..."
              className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950/80 border border-white/5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 outline-none transition-all font-bold"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips (for list view) */}
        {activeView === 'list' && (
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                statusFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-white/5 hover:text-white'
              }`}
            >
              الكل ({debts.length})
            </button>
            <button
              onClick={() => setStatusFilter('to_me')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                statusFilter === 'to_me' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-emerald-400 border border-white/5'
              }`}
            >
              <ArrowUpRight size={13} /> دين لي ({debts.filter(d => d.type === 'to_me').length})
            </button>
            <button
              onClick={() => setStatusFilter('on_me')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                statusFilter === 'on_me' ? 'bg-rose-500 text-white' : 'bg-slate-950 text-rose-400 border border-white/5'
              }`}
            >
              <ArrowDownLeft size={13} /> دين عليّ ({debts.filter(d => d.type === 'on_me').length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                statusFilter === 'active' ? 'bg-blue-500 text-white' : 'bg-slate-950 text-blue-400 border border-white/5'
              }`}
            >
              قائمة نشطة ({stats.activeCount})
            </button>
            {stats.overdueCount > 0 && (
              <button
                onClick={() => setStatusFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 ${
                  statusFilter === 'overdue' ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-950 text-rose-400 border border-rose-500/30'
                }`}
              >
                <AlertCircle size={13} /> متأخرة ({stats.overdueCount})
              </button>
            )}
            <button
              onClick={() => setStatusFilter('settled')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                statusFilter === 'settled' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-white/5'
              }`}
            >
              مسددة بالكامل ({stats.settledCount})
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN CONTENT AREA */}
      {activeView === 'list' ? (
        /* LIST OF INDIVIDUAL DEBTS */
        <div className="space-y-3.5">
          {filteredDebts.length === 0 ? (
            <div className="text-center py-14 bg-slate-900/50 rounded-3xl border border-white/5 p-6">
              <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500 border border-white/5">
                <Receipt size={30} />
              </div>
              <h4 className="text-white font-bold text-sm mb-1">لا توجد ديون تطابق الفلتر الحالي</h4>
              <p className="text-slate-400 text-xs mb-5">يمكنك تسجيل دين جديد أو تغيير معايير البحث.</p>
              <button 
                onClick={() => openAdd()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> إضافة دين الآن
              </button>
            </div>
          ) : (
            filteredDebts.map(debt => {
              const calc = getDebtCalculations(debt);
              const isExpanded = expandedDebtId === debt.id;
              const hasInstallments = !!debt.installments && debt.installments.length > 0;
              const paymentsCount = debt.payments?.length || (debt.paidAmount > 0 ? 1 : 0);

              return (
                <div 
                  key={debt.id} 
                  className={`p-4 sm:p-5 rounded-3xl border transition-all relative overflow-hidden group ${
                    calc.status === 'settled'
                      ? 'bg-slate-900/40 border-white/5 opacity-70 hover:opacity-100'
                      : calc.status === 'overdue'
                      ? 'bg-slate-900/90 border-rose-500/30 shadow-lg shadow-rose-500/5'
                      : 'bg-slate-900/80 border-white/5 hover:border-amber-500/30 shadow-sm'
                  }`}
                >
                  {/* Top Row: Type Badge + Status + Person Name */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow shrink-0 ${
                        debt.type === 'to_me' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {debt.type === 'to_me' ? <UserPlus size={20} /> : <UserMinus size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-sm sm:text-base leading-tight">
                            {debt.personName}
                          </h4>
                          {debt.personTag && (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                              {debt.personTag === 'customer' ? 'عميل' : debt.personTag === 'supplier' ? 'مورد' : debt.personTag === 'friend' ? 'صديق' : debt.personTag === 'family' ? 'عائلة' : 'فرد'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            debt.type === 'to_me' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {debt.type === 'to_me' ? 'دين لي (مستحق لي)' : 'دين عليّ (التزام للغير)'}
                          </span>
                          
                          {/* Status Badge */}
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            calc.status === 'settled' 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : calc.status === 'overdue' 
                              ? 'bg-rose-500/20 text-rose-300 animate-pulse' 
                              : calc.status === 'partial' 
                              ? 'bg-amber-500/20 text-amber-300' 
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {calc.statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Left: Remaining / Highlighted Balance */}
                    <div className="text-left">
                      <p className={`text-base sm:text-lg font-black ${
                        calc.status === 'settled' 
                          ? 'text-emerald-400' 
                          : debt.type === 'to_me' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {calc.remainingAmount.toLocaleString()} <span className="text-[10px] opacity-70">{debt.currency || currencySymbol}</span>
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        المتبقي للسداد
                      </p>
                    </div>
                  </div>

                  {/* Explainable Financial Matrix (المبلغ الأصلي | المدفوع | المتبقي) */}
                  <div className="grid grid-cols-3 gap-2 mt-3.5 p-2.5 bg-slate-950/60 rounded-2xl border border-white/5 text-center text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">المبلغ الأصلي</span>
                      <span className="font-black text-white">{calc.originalAmount.toLocaleString()} {debt.currency || currencySymbol}</span>
                    </div>
                    <div className="border-r border-l border-white/5 px-1">
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">المدفوع ({Math.round(calc.progressPercent)}%)</span>
                      <span className="font-black text-amber-400">{calc.paidAmount.toLocaleString()} {debt.currency || currencySymbol}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 block mb-0.5">المتبقي الصافي</span>
                      <span className={`font-black ${debt.type === 'to_me' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {calc.remainingAmount.toLocaleString()} {debt.currency || currencySymbol}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-2.5 mb-1">
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          calc.status === 'settled' 
                            ? 'bg-emerald-500' 
                            : debt.type === 'to_me' ? 'bg-emerald-400' : 'bg-amber-500'
                        }`} 
                        style={{ width: `${calc.progressPercent}%` }} 
                      />
                    </div>
                  </div>

                  {/* Dates & Notes */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-[10px] text-slate-400 font-bold">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-500" /> النشوء: {debt.createdAt}
                      </span>
                      {debt.dueDate && (
                        <span className={`flex items-center gap-1 ${calc.isOverdue ? 'text-rose-400' : 'text-slate-300'}`}>
                          <Clock size={11} /> الاستحقاق: {debt.dueDate}
                        </span>
                      )}
                    </div>
                    
                    {paymentsCount > 0 && (
                      <button
                        onClick={() => setHistoryModalDebt(debt)}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold underline underline-offset-2"
                      >
                        <History size={11} /> سجل الدفعات ({paymentsCount})
                      </button>
                    )}
                  </div>

                  {debt.note && (
                    <div className="mt-2.5 p-2 bg-slate-950/40 rounded-xl border border-white/5 flex items-start gap-2 text-right">
                      <Info size={12} className="text-slate-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] font-medium text-slate-300 leading-relaxed">{debt.note}</p>
                    </div>
                  )}

                  {/* Installments Table (if applicable) */}
                  {hasInstallments && (
                    <div className="mt-3">
                      <button 
                        onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
                      >
                        <span>جدول الأقساط ({debt.installments!.filter(i => i.isPaid).length}/{debt.installments!.length} مدفوع)</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                          {debt.installments!.map((inst, idx) => (
                            <div 
                              key={inst.id} 
                              className={`flex items-center justify-between p-2.5 rounded-xl border ${
                                inst.isPaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-950 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-[10px] font-bold text-slate-500">#{idx+1}</span>
                                <div>
                                  <p className={`text-xs font-bold ${inst.isPaid ? 'text-emerald-400' : 'text-white'}`}>
                                    {inst.amount.toLocaleString()} {debt.currency || currencySymbol}
                                  </p>
                                  <p className="text-[9px] text-slate-500">تاريخ: {inst.dueDate}</p>
                                </div>
                              </div>
                              {inst.isPaid ? (
                                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                                  <CheckCircle size={13} /> مسدد
                                </span>
                              ) : (
                                <button 
                                  onClick={() => openPaymentModal(debt, inst.amount, inst.id)}
                                  className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-[10px] font-bold hover:bg-amber-400 active:scale-95"
                                >
                                  سداد القسط
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                    {calc.status !== 'settled' ? (
                      <>
                        <button 
                          onClick={() => openPaymentModal(debt, calc.remainingAmount)}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
                        >
                          <CreditCard size={14} /> تسجيل دفعة / سداد
                        </button>
                        <button 
                          onClick={() => openPaymentModal(debt, calc.remainingAmount)}
                          className="py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                          title="سداد كامل المبلغ المتبقي فورا"
                        >
                          <CheckCircle size={14} />
                          <span className="hidden sm:inline">سداد كامل</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 py-2 bg-emerald-500/10 rounded-xl text-emerald-400 font-black text-xs flex items-center justify-center gap-1.5 border border-emerald-500/20">
                        <CheckCircle size={14} /> تم تسوية هذه الذمة المالية بالكامل
                      </div>
                    )}

                    <button 
                      onClick={() => openEdit(debt)}
                      className="p-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl active:scale-90 transition-all border border-slate-700 hover:bg-slate-700"
                      title="تعديل بيانات الدين"
                    >
                      <Edit3 size={15} />
                    </button>

                    {confirmDeleteId === debt.id ? (
                      <div className="flex gap-1 items-center bg-slate-950 p-1 rounded-xl border border-rose-500/30">
                        <button 
                          onClick={() => { onDeleteDebt(debt.id); setConfirmDeleteId(null); }}
                          className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black active:scale-95 hover:bg-rose-500"
                        >
                          حذف مؤكد
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold hover:bg-slate-700"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDeleteId(debt.id)}
                        className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl active:scale-90 transition-all border border-rose-500/20 hover:bg-rose-500/20"
                        title="حذف السجل"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* PERSONS / CONTACTS STATEMENT VIEW (كشف حساب جهات التعامل) */
        <div className="space-y-4">
          {filteredPersons.length === 0 ? (
            <div className="text-center py-14 bg-slate-900/50 rounded-3xl border border-white/5 p-6">
              <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500 border border-white/5">
                <Users size={30} />
              </div>
              <h4 className="text-white font-bold text-sm mb-1">لا توجد جهات تعامل مسجلة</h4>
              <p className="text-slate-400 text-xs mb-5">عند تسجيل أي دين لشخص أو جهة، ستظهر كشوف حساباتهم المجمعة هنا تلقائياً.</p>
              <button 
                onClick={() => openAdd()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> إضافة جهة تعامل ودين جديد
              </button>
            </div>
          ) : (
            filteredPersons.map(person => {
              const isExpanded = expandedPersonName === person.personName;
              const hasNet = Math.abs(person.netBalance) > 0.01;

              return (
                <div 
                  key={person.personName}
                  className="bg-slate-900/80 border border-white/5 rounded-3xl p-4 sm:p-5 hover:border-amber-500/20 transition-all"
                >
                  {/* Person Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-lg">
                        {person.personName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-base">{person.personName}</h4>
                          {person.personTag && (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                              {person.personTag === 'customer' ? 'عميل' : person.personTag === 'supplier' ? 'مورد' : 'فرد'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">
                          {person.debts.length} عمليات مسجلة ({person.activeDebtsCount} نشطة، {person.settledDebtsCount} مسددة)
                        </p>
                      </div>
                    </div>

                    {/* Net Balance Pill */}
                    <div className="text-right sm:text-left">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">
                        صافي المعاملة والحساب
                      </span>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs sm:text-sm ${
                        !hasNet 
                          ? 'bg-slate-800 text-slate-300' 
                          : person.netStatus === 'receivable'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {!hasNet ? (
                          <span className="flex items-center gap-1"><CheckCircle size={14} className="text-emerald-400" /> الحساب متقاص وخالص</span>
                        ) : person.netStatus === 'receivable' ? (
                          <>
                            <ArrowUpRight size={14} />
                            <span>لك بذمته: {person.netBalance.toLocaleString()} {currencySymbol}</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft size={14} />
                            <span>له بذمتك: {Math.abs(person.netBalance).toLocaleString()} {currencySymbol}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown for this Person */}
                  <div className="grid grid-cols-2 gap-2.5 my-3 text-xs">
                    {/* Owed to Me */}
                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-emerald-500/10">
                      <span className="text-[10px] font-black text-emerald-400 block mb-1 flex items-center gap-1">
                        <ArrowUpRight size={12} /> إجمالي ما أقرضته (دين لي)
                      </span>
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-400 text-[10px] font-bold">المتبقي:</span>
                        <span className="font-black text-emerald-400 text-sm">{person.totalOwedToMeRemaining.toLocaleString()} {currencySymbol}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                        <span>الأصل: {person.totalOwedToMeOriginal.toLocaleString()}</span>
                        <span>المسترد: {person.totalOwedToMePaid.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* I Owe */}
                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-rose-500/10">
                      <span className="text-[10px] font-black text-rose-400 block mb-1 flex items-center gap-1">
                        <ArrowDownLeft size={12} /> إجمالي ما استلفته منه (دين عليّ)
                      </span>
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-400 text-[10px] font-bold">المتبقي:</span>
                        <span className="font-black text-rose-400 text-sm">{person.totalIOweRemaining.toLocaleString()} {currencySymbol}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                        <span>الأصل: {person.totalIOweOriginal.toLocaleString()}</span>
                        <span>المسدد: {person.totalIOwePaid.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expand / Collapse individual debts for this person */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      onClick={() => setExpandedPersonName(isExpanded ? null : person.personName)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-white/5 transition-all"
                    >
                      <span>{isExpanded ? 'إخفاء كشف العمليات' : `عرض كشف العمليات التفصيلي (${person.debts.length})`}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <button
                      onClick={() => openAdd(person.personName)}
                      className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1 transition-all"
                    >
                      <Plus size={13} /> تسجيل دين جديد معه
                    </button>
                  </div>

                  {/* Expanded Debt Items List for this person */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-white/5">
                      {person.debts.map(d => {
                        const calc = getDebtCalculations(d);
                        return (
                          <div 
                            key={d.id}
                            className="bg-slate-950/80 p-3 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2 h-2 rounded-full ${d.type === 'to_me' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">
                                    {d.type === 'to_me' ? 'دين لي' : 'دين عليّ'}
                                  </span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    calc.status === 'settled' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {calc.statusLabel}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500">تاريخ: {d.createdAt}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-left">
                                <span className={`font-black ${d.type === 'to_me' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  المتبقي: {calc.remainingAmount.toLocaleString()} {currencySymbol}
                                </span>
                                <span className="text-[10px] text-slate-500 block">الأصل: {calc.originalAmount.toLocaleString()}</span>
                              </div>

                              {calc.status !== 'settled' && (
                                <button
                                  onClick={() => openPaymentModal(d, calc.remainingAmount)}
                                  className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] hover:bg-amber-400 active:scale-95"
                                >
                                  سداد
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT DEBT (سلس وبسيط للجميع مع خيارات المحفظة والأقساط) */}
      {/* ========================================================================= */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[300] flex items-center justify-center p-3 sm:p-4 no-print overflow-hidden">
          <div className="bg-slate-900 w-full max-w-lg mx-auto rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[85vh] flex flex-col border border-white/10 overflow-hidden text-right" dir="rtl">
            <div className="flex justify-between items-center mb-4 shrink-0 pb-3 border-b border-white/5">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Receipt size={18} className="text-amber-500" />
                {editingDebt ? 'تعديل بيانات الدين' : 'تسجيل دين مالي جديد'}
              </h3>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white active:scale-90 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar space-y-4 min-h-0 pr-1 pl-1 pb-1">
              
              {/* Type Switcher: دين علي vs دين لي */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">نوع الدين والالتزام</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setType('on_me')} 
                    className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      type === 'on_me' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserMinus size={14} /> دين عليّ (التزام للغير)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setType('to_me')} 
                    className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      type === 'to_me' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserPlus size={14} /> دين لي (مستحق لي)
                  </button>
                </div>
              </div>

              {/* Person Name & Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    اسم الشخص أو الجهة
                  </label>
                  {existingContactNames.length > 0 && !editingDebt && (
                    <span className="text-[9px] text-slate-500">اختر من السابقين أو اكتب اسماً جديداً</span>
                  )}
                </div>
                <input 
                  type="text" 
                  value={personName} 
                  onChange={e => setPersonName(e.target.value)} 
                  placeholder="مثلاً: محمد، البنك، فلان..." 
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 outline-none text-white text-xs sm:text-sm font-bold focus:border-amber-500 transition-colors shadow-inner" 
                  required 
                />

                {/* Quick Selection Chips for Contacts */}
                {!editingDebt && existingContactNames.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pt-1 pb-0.5">
                    {existingContactNames.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setPersonName(name)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
                          personName === name 
                            ? 'bg-amber-500 text-slate-950 font-black' 
                            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount & Currency */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                  المبلغ الأصلي الإجمالي ({currencyCode})
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="any"
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 outline-none text-amber-400 font-black text-center text-xl tracking-wider focus:border-amber-500 transition-colors shadow-inner" 
                    required 
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
                    {currencySymbol}
                  </span>
                </div>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">تاريخ النشوء</label>
                  <input 
                    type="date" 
                    value={createdAt} 
                    onChange={e => setCreatedAt(e.target.value)} 
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/5 outline-none text-slate-300 font-bold text-xs" 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">تاريخ الاستحقاق (اختياري)</label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/5 outline-none text-slate-300 font-bold text-xs" 
                  />
                </div>
              </div>

              {/* Contact Tag (Optional) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">تصنيف جهة التعامل (اختياري)</label>
                <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  {[
                    { id: 'individual', label: 'فرد / عام' },
                    { id: 'friend', label: 'صديق' },
                    { id: 'family', label: 'عائلة' },
                    { id: 'customer', label: 'عميل' },
                    { id: 'supplier', label: 'مورد' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPersonTag(t.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        personTag === t.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Installments Option */}
              {!editingDebt && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <GripHorizontal size={14} /> تفعيل جدول الأقساط الشهرية
                    </span>
                    <div 
                      dir="ltr" 
                      className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-all ${enableInstallments ? 'bg-amber-500' : 'bg-slate-800'}`} 
                      onClick={() => setEnableInstallments(!enableInstallments)}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${enableInstallments ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  {enableInstallments && (
                    <div className="animate-fade space-y-1.5 pt-1">
                      <div className="flex gap-2 items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">عدد الأقساط:</label>
                        <input 
                          type="range" 
                          min="2" 
                          max="36" 
                          value={installmentCount} 
                          onChange={e => setInstallmentCount(parseInt(e.target.value))} 
                          className="flex-1 accent-amber-500 h-1.5" 
                        />
                        <span className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded-lg text-xs min-w-[2rem] text-center">
                          {installmentCount}
                        </span>
                      </div>
                      <p className="text-[10px] text-center text-slate-400 font-bold">
                        سيتم تقسيم المبلغ إلى {installmentCount} قسط بقيمة {amount ? (parseFloat(amount)/installmentCount).toFixed(1) : 0} {currencySymbol} شهرياً.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction Link Toggle */}
              {!editingDebt && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        includeWalletTransaction ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {includeWalletTransaction ? <Link2 size={14} /> : <Link2Off size={14} />}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white text-xs">تسجيل أثر مالي في المحفظة</p>
                        <p className="text-[9px] text-slate-400">
                          {type === 'to_me' ? 'خصم المبلغ من محفظتك كإقراض' : 'إيداع المبلغ في محفظتك كاستلاف'}
                        </p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setIncludeWalletTransaction(!includeWalletTransaction)}
                      className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-all ${includeWalletTransaction ? 'bg-amber-500' : 'bg-slate-800'}`}
                      dir="ltr"
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${includeWalletTransaction ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>

                  {includeWalletTransaction && (
                    <div className="animate-fade space-y-1.5 pt-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        {type === 'to_me' ? 'خصم المبلغ من المحفظة:' : 'إيداع المبلغ في المحفظة:'}
                      </label>
                      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                        {wallets.map(w => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => setSelectedWalletId(w.id)}
                            className={`shrink-0 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
                              selectedWalletId === w.id 
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500' 
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                            <span>{w.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">ملاحظات إضافية</label>
                <textarea 
                  rows={2} 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  placeholder="أي تفاصيل أو شروط خاصة بالسداد..." 
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-white/5 outline-none text-white font-bold text-xs resize-none focus:border-amber-500" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-md text-xs sm:text-sm active:scale-98 transition-all mt-2"
              >
                {editingDebt ? 'حفظ تعديلات الدين' : 'تسجيل الدين وحفظ السجل 💾'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD PAYMENT (سداد جزئي أو كامل مع اختيار المحفظة) */}
      {/* ========================================================================= */}
      {paymentModalData && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[350] flex items-center justify-center p-3 sm:p-4 no-print overflow-hidden">
          <div className="bg-slate-900 w-full max-w-md mx-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 overflow-hidden max-h-[85vh] flex flex-col min-h-0 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-400" />
                تسجيل دفعة سداد
              </h3>
              <button 
                onClick={() => setPaymentModalData(null)}
                className="p-1.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 pr-1 pl-1">
              {/* Debt Context Banner */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">طرف التعامل</span>
                    <span className="text-sm font-black text-white">{paymentModalData.debt.personName}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 font-bold block">المتبقي الإجمالي</span>
                    <span className="text-sm font-black text-amber-400">
                      {getDebtRemaining(paymentModalData.debt).toLocaleString()} {paymentModalData.debt.currency || currencySymbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount Input & Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">مبلغ الدفعة المسددة</label>
                <input 
                  type="number"
                  step="any"
                  value={payAmountInput}
                  onChange={e => setPayAmountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 outline-none text-emerald-400 font-black text-center text-xl tracking-wider focus:border-emerald-500 transition-colors shadow-inner"
                  required
                />
                
                {/* Presets */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPayAmountInput(getDebtRemaining(paymentModalData.debt).toString())}
                    className="flex-1 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold hover:bg-emerald-500/20"
                  >
                    كامل المتبقي ({getDebtRemaining(paymentModalData.debt).toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmountInput((getDebtRemaining(paymentModalData.debt) / 2).toFixed(1))}
                    className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold hover:bg-slate-700"
                  >
                    نصف المتبقي
                  </button>
                </div>
              </div>

              {/* Payment Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">تاريخ الدفعة</label>
                <input 
                  type="date"
                  value={payDateInput}
                  onChange={e => setPayDateInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/5 outline-none text-white font-bold text-xs"
                  required
                />
              </div>

              {/* Wallet Link Toggle */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300">تسوية خارجية (بدون تأثير على المحافظ)</span>
                  <input 
                    type="checkbox"
                    checked={payExternalOnly}
                    onChange={e => setPayExternalOnly(e.target.checked)}
                    className="accent-amber-500 w-4 h-4"
                  />
                </div>

                {!payExternalOnly && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[9px] font-bold text-slate-400">
                      {paymentModalData.debt.type === 'to_me' ? 'إيداع الدفعة في محفظة:' : 'سحب الدفعة من محفظة:'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {wallets.map(w => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setPayWalletId(w.id)}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                            payWalletId === w.id 
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500' 
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: w.color }} />
                          <span className="truncate">{w.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ملاحظة الدفعة</label>
                <input 
                  type="text"
                  value={payNoteInput}
                  onChange={e => setPayNoteInput(e.target.value)}
                  placeholder="مثلاً: دفعة كاش، تحويل بنكي..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/5 outline-none text-white text-xs font-bold"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg text-xs sm:text-sm active:scale-98 transition-all mt-2"
              >
                تأكيد وحفظ الدفعة في السجل 💳
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PAYMENT HISTORY MODAL (سجل الدفعات التفصيلي لكل دين) */}
      {/* ========================================================================= */}
      {historyModalDebt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[350] flex items-center justify-center p-3 sm:p-4 no-print overflow-hidden">
          <div className="bg-slate-900 w-full max-w-md mx-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 overflow-hidden max-h-[85vh] flex flex-col min-h-0 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <History size={18} className="text-amber-500" />
                  سجل دفعات الدين
                </h3>
                <p className="text-xs text-slate-400 font-bold">{historyModalDebt.personName}</p>
              </div>
              <button 
                onClick={() => setHistoryModalDebt(null)}
                className="p-1.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1 pl-1">
              {(!historyModalDebt.payments || historyModalDebt.payments.length === 0) ? (
                <div className="text-center py-8 text-slate-500 text-xs font-bold">
                  {historyModalDebt.paidAmount > 0 ? (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                      <p className="text-emerald-400 font-black text-sm mb-1">
                        تم سداد: {historyModalDebt.paidAmount.toLocaleString()} {historyModalDebt.currency || currencySymbol}
                      </p>
                      <p className="text-slate-400 text-[10px]">دفعة سابقة مسجلة على هذا الدين.</p>
                    </div>
                  ) : (
                    <p>لم يتم تسجيل أي دفعات سداد لهذا الدين حتى الآن.</p>
                  )}
                </div>
              ) : (
                historyModalDebt.payments.map((p, idx) => (
                  <div key={p.id || idx} className="p-3 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-black text-sm">
                          +{p.amount.toLocaleString()} {historyModalDebt.currency || currencySymbol}
                        </span>
                        {p.walletName && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {p.walletName}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        تاريخ: {p.date} {p.note ? `• ${p.note}` : ''}
                      </p>
                    </div>
                    <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setHistoryModalDebt(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl mt-3"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DebtManager;
