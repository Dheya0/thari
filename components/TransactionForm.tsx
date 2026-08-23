import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, StickyNote, Wallet as WalletIcon, ArrowLeftRight, 
  Camera, Image as ImageIcon, Trash2, CheckCircle2, Clock, 
  AlertCircle, Search, ArrowUpRight, ArrowDownLeft, ChevronRight, 
  UserPlus, UserMinus, Scale, Sliders, Check, Phone, DollarSign,
  Tag, Info, Edit3
} from 'lucide-react';
import { 
  Transaction, 
  Category, 
  TransactionType, 
  Wallet, 
  ReceiptAttachment, 
  Debt, 
  FinancialEventType 
} from '../types';
import { getIcon, DEFAULT_CURRENCIES, convertCurrency } from '../constants';

interface TransactionFormProps {
  categories: Category[];
  wallets: Wallet[];
  transactions?: Transaction[];
  debts?: Debt[];
  onSubmit: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  onAddDebt?: (debt: Omit<Debt, 'id'>, walletId?: string) => void;
  onPayDebt?: (
    id: string, 
    amount: number, 
    walletId?: string, 
    noteSuffix?: string, 
    customDebtUpdates?: Partial<Debt>,
    paymentDate?: string
  ) => void;
  onClose: () => void;
  initialData?: Transaction | null;
  exchangeRates: Record<string, number>;
  defaultType?: FinancialEventType | TransactionType;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  categories,
  wallets,
  transactions = [],
  debts = [],
  onSubmit,
  onAddDebt,
  onPayDebt,
  onClose,
  initialData,
  exchangeRates,
  defaultType,
}) => {
  // Map initial type to financial event type
  const mapInitialEventType = (): FinancialEventType | null => {
    if (initialData) {
      if (initialData.type === 'income') return 'income';
      if (initialData.type === 'transfer') return 'transfer';
      if (initialData.type === 'adjustment') return 'balance_adjustment';
      return 'expense';
    }
    if (defaultType) {
      if (defaultType === 'income') return 'income';
      if (defaultType === 'transfer') return 'transfer';
      if (defaultType === 'adjustment' || defaultType === 'balance_adjustment') return 'balance_adjustment';
      if (defaultType === 'debt_to_me') return 'debt_to_me';
      if (defaultType === 'debt_on_me') return 'debt_on_me';
      if (defaultType === 'debt_repayment') return 'debt_repayment';
      return 'expense';
    }
    return null;
  };

  const [selectedEvent, setSelectedEvent] = useState<FinancialEventType | null>(mapInitialEventType);
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(Boolean(initialData));
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<string>(initialData?.id || '');

  // Form Fields State
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [walletId, setWalletId] = useState(initialData?.walletId || wallets[0]?.id || '');
  const [destinationWalletId, setDestinationWalletId] = useState<string>(
    initialData?.destinationWalletId || (wallets.length > 1 ? wallets[1]?.id : '')
  );
  const [destinationAmount, setDestinationAmount] = useState<string>(
    initialData?.destinationAmount ? initialData.destinationAmount.toString() : ''
  );
  const [note, setNote] = useState(initialData?.note || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialData?.time || new Date().toTimeString().slice(0, 5));
  const [receipt, setReceipt] = useState<ReceiptAttachment | undefined>(initialData?.receipt);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debt Specific States
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [linkDebtToWallet, setLinkDebtToWallet] = useState(true);
  const [selectedDebtIdForRepayment, setSelectedDebtIdForRepayment] = useState<string>(
    debts.find(d => !d.isPaid)?.id || ''
  );

  // Balance Adjustment Specific States
  const [actualRealBalance, setActualRealBalance] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const selectedSourceWallet = wallets.find(w => w.id === walletId) || wallets[0];
  const selectedDestWallet = wallets.find(w => w.id === destinationWalletId) || (wallets.length > 1 ? wallets[1] : undefined);
  
  const [inputCurrency, setInputCurrency] = useState(
    initialData?.currency || selectedSourceWallet?.currencyCode || 'SAR'
  );

  // Sync default category when changing event type
  useEffect(() => {
    if (selectedEvent === 'expense' && !categoryId) {
      const firstExp = categories.find(c => c.type === 'expense');
      if (firstExp) setCategoryId(firstExp.id);
    } else if (selectedEvent === 'income' && !categoryId) {
      const firstInc = categories.find(c => c.type === 'income');
      if (firstInc) setCategoryId(firstInc.id);
    }
  }, [selectedEvent, categories]);

  // Keep currency in sync with selected source wallet unless manually modified
  useEffect(() => {
    if (selectedSourceWallet && !initialData && selectedEvent !== 'transfer') {
      setInputCurrency(selectedSourceWallet.currencyCode);
    }
  }, [walletId, selectedEvent]);

  // List of active (unsettled) debts for repayment
  const activeDebts = useMemo(() => {
    return debts.filter(d => !d.isPaid);
  }, [debts]);

  // Selected debt details for repayment
  const currentSelectedDebt = useMemo(() => {
    return debts.find(d => d.id === selectedDebtIdForRepayment);
  }, [debts, selectedDebtIdForRepayment]);

  // Unique past contact names for autocomplete
  const knownContacts = useMemo(() => {
    const names = new Set<string>();
    debts.forEach(d => {
      if (d.personName) names.add(d.personName.trim());
    });
    return Array.from(names);
  }, [debts]);

  // Handle transaction selection in edit mode
  const handleSelectTxForEdit = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;
    setSelectedTxForEdit(txId);
    setAmount(tx.amount.toString());
    setCategoryId(tx.categoryId || '');
    setWalletId(tx.walletId);
    setDestinationWalletId(tx.destinationWalletId || '');
    setDestinationAmount(tx.destinationAmount ? tx.destinationAmount.toString() : '');
    setInputCurrency(tx.currency || 'SAR');
    setNote(tx.note || '');
    setDate(tx.date);
    setTime(tx.time || '12:00');
    setReceipt(tx.receipt);

    if (tx.type === 'income') setSelectedEvent('income');
    else if (tx.type === 'transfer') setSelectedEvent('transfer');
    else if (tx.type === 'adjustment') {
      setSelectedEvent('balance_adjustment');
      setActualRealBalance(tx.amount.toString());
    } else setSelectedEvent('expense');
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceipt({
          id: 'rcpt-' + Date.now(),
          dataUrl: reader.result as string,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          createdAt: new Date().toISOString()
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Submissions
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedEvent) {
      setErrorMessage('يرجى اختيار نوع الحدث المالي أولاً');
      return;
    }

    const numericAmount = parseFloat(amount);

    // 1. EXPENSE EVENT
    if (selectedEvent === 'expense') {
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrorMessage('يرجى إدخال مبلغ صحيح أكبر من الصفر');
        return;
      }
      if (!walletId) {
        setErrorMessage('يرجى اختيار محفظة الدفع');
        return;
      }

      setIsSubmitting(true);
      const rate = exchangeRates[inputCurrency] || 1;
      const walletCurrency = selectedSourceWallet?.currencyCode || inputCurrency;
      const convertedToWallet = inputCurrency === walletCurrency 
        ? numericAmount 
        : convertCurrency(numericAmount, inputCurrency, walletCurrency, exchangeRates);

      const targetId = initialData?.id || (isEditingExisting ? selectedTxForEdit : undefined);

      onSubmit({
        ...(targetId ? { id: targetId } : {}),
        amount: numericAmount,
        type: 'expense',
        categoryId: categoryId || 'general-expense',
        walletId,
        currency: inputCurrency,
        exchangeRateUsed: rate,
        convertedAmountInWalletCurrency: convertedToWallet,
        date,
        time,
        frequency: 'once',
        note: note.trim(),
        receipt,
      });
      return;
    }

    // 2. INCOME EVENT
    if (selectedEvent === 'income') {
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrorMessage('يرجى إدخال مبلغ صحيح أكبر من الصفر');
        return;
      }
      if (!walletId) {
        setErrorMessage('يرجى اختيار محفظة الإيداع');
        return;
      }

      setIsSubmitting(true);
      const rate = exchangeRates[inputCurrency] || 1;
      const walletCurrency = selectedSourceWallet?.currencyCode || inputCurrency;
      const convertedToWallet = inputCurrency === walletCurrency 
        ? numericAmount 
        : convertCurrency(numericAmount, inputCurrency, walletCurrency, exchangeRates);

      const targetId = initialData?.id || (isEditingExisting ? selectedTxForEdit : undefined);

      onSubmit({
        ...(targetId ? { id: targetId } : {}),
        amount: numericAmount,
        type: 'income',
        categoryId: categoryId || 'general-income',
        walletId,
        currency: inputCurrency,
        exchangeRateUsed: rate,
        convertedAmountInWalletCurrency: convertedToWallet,
        date,
        time,
        frequency: 'once',
        note: note.trim(),
        receipt,
      });
      return;
    }

    // 3. TRANSFER EVENT
    if (selectedEvent === 'transfer') {
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrorMessage('يرجى إدخال مبلغ التحويل بشكل صحيح');
        return;
      }
      if (!walletId || !destinationWalletId) {
        setErrorMessage('يرجى اختيار المحفظة المرسلة والمستلمة');
        return;
      }
      if (walletId === destinationWalletId) {
        setErrorMessage('لا يمكن التحويل لنفس المحفظة');
        return;
      }

      setIsSubmitting(true);
      const sourceCurrency = selectedSourceWallet?.currencyCode || 'SAR';
      const destCurrency = selectedDestWallet?.currencyCode || sourceCurrency;
      
      let parsedDestAmount = parseFloat(destinationAmount);
      if (isNaN(parsedDestAmount) || parsedDestAmount <= 0) {
        parsedDestAmount = sourceCurrency === destCurrency 
          ? numericAmount 
          : convertCurrency(numericAmount, sourceCurrency, destCurrency, exchangeRates);
      }

      const targetId = initialData?.id || (isEditingExisting ? selectedTxForEdit : undefined);

      onSubmit({
        ...(targetId ? { id: targetId } : {}),
        amount: numericAmount,
        type: 'transfer',
        categoryId: 'transfer-internal',
        walletId,
        destinationWalletId,
        destinationAmount: parsedDestAmount,
        destinationCurrency: destCurrency,
        currency: sourceCurrency,
        exchangeRateUsed: exchangeRates[sourceCurrency] || 1,
        convertedAmountInWalletCurrency: numericAmount,
        date,
        time,
        frequency: 'once',
        note: note.trim() || `تحويل من ${selectedSourceWallet?.name} إلى ${selectedDestWallet?.name}`,
      });
      return;
    }

    // 4. DEBT TO ME (دين لي)
    if (selectedEvent === 'debt_to_me') {
      if (!personName.trim()) {
        setErrorMessage('يرجى إدخال اسم الشخص أو الجهة المدين');
        return;
      }
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrorMessage('يرجى إدخال مبلغ الدين بشكل صحيح');
        return;
      }

      setIsSubmitting(true);
      if (onAddDebt) {
        onAddDebt({
          personName: personName.trim(),
          personPhone: personPhone.trim() || undefined,
          amount: numericAmount,
          originalAmount: numericAmount,
          paidAmount: 0,
          type: 'to_me',
          currency: inputCurrency,
          createdAt: date ? `${date}T${time}:00.000Z` : new Date().toISOString(),
          dueDate: debtDueDate || undefined,
          isPaid: false,
          status: 'active',
          note: note.trim(),
          payments: []
        }, linkDebtToWallet ? walletId : undefined);
      }
      onClose();
      return;
    }

    // 5. DEBT ON ME (دين عليّ)
    if (selectedEvent === 'debt_on_me') {
      if (!personName.trim()) {
        setErrorMessage('يرجى إدخال اسم صاحب الدين (الدائن)');
        return;
      }
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrorMessage('يرجى إدخال مبلغ الدين بشكل صحيح');
        return;
      }

      setIsSubmitting(true);
      if (onAddDebt) {
        onAddDebt({
          personName: personName.trim(),
          personPhone: personPhone.trim() || undefined,
          amount: numericAmount,
          originalAmount: numericAmount,
          paidAmount: 0,
          type: 'on_me',
          currency: inputCurrency,
          createdAt: date ? `${date}T${time}:00.000Z` : new Date().toISOString(),
          dueDate: debtDueDate || undefined,
          isPaid: false,
          status: 'active',
          note: note.trim(),
          payments: []
        }, linkDebtToWallet ? walletId : undefined);
      }
      onClose();
      return;
    }

    // 6. DEBT REPAYMENT (تسديد دين)
    if (selectedEvent === 'debt_repayment') {
      if (!selectedDebtIdForRepayment) {
        setErrorMessage('يرجى تحديد الدين المراد سداده');
        return;
      }
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setErrorMessage('يرجى إدخال مبلغ السداد');
        return;
      }

      setIsSubmitting(true);
      if (onPayDebt) {
        onPayDebt(
          selectedDebtIdForRepayment,
          numericAmount,
          linkDebtToWallet ? walletId : undefined,
          note.trim(),
          undefined,
          date
        );
      }
      onClose();
      return;
    }

    // 7. BALANCE ADJUSTMENT (تصحيح الرصيد)
    if (selectedEvent === 'balance_adjustment') {
      if (!walletId) {
        setErrorMessage('يرجى اختيار المحفظة المراد تسوية رصيدها');
        return;
      }

      const realBal = parseFloat(actualRealBalance);
      if (isNaN(realBal)) {
        setErrorMessage('يرجى إدخال الرصيد الفعلي الحقيقي الموجود في المحفظة');
        return;
      }

      const currentLedgerBal = selectedSourceWallet ? (selectedSourceWallet.currentBalance || selectedSourceWallet.openingBalance || 0) : 0;
      const difference = realBal - currentLedgerBal;

      if (Math.abs(difference) < 0.001) {
        setErrorMessage('الرصيد الفعلي مطابق للرصيد المسجل، لا توجد فروقات للتصحيح');
        return;
      }

      setIsSubmitting(true);
      const walletCurrency = selectedSourceWallet?.currencyCode || 'SAR';

      const targetId = initialData?.id || (isEditingExisting ? selectedTxForEdit : undefined);

      onSubmit({
        ...(targetId ? { id: targetId } : {}),
        amount: Math.abs(difference),
        type: 'adjustment',
        categoryId: 'balance-reconciliation',
        walletId,
        currency: walletCurrency,
        exchangeRateUsed: exchangeRates[walletCurrency] || 1,
        convertedAmountInWalletCurrency: Math.abs(difference),
        date,
        time,
        frequency: 'once',
        note: note.trim() || `تسوية رصيد: تعديل من ${currentLedgerBal.toLocaleString()} إلى ${realBal.toLocaleString()} ${walletCurrency}`,
      });
      return;
    }
  };

  // Helper calculation for Adjustment
  const adjustmentCalc = useMemo(() => {
    if (selectedEvent !== 'balance_adjustment' || !selectedSourceWallet) return null;
    const current = selectedSourceWallet.currentBalance ?? selectedSourceWallet.openingBalance ?? 0;
    const actual = parseFloat(actualRealBalance);
    if (isNaN(actual)) return { current, actual: null, diff: 0, isIncrease: true };
    const diff = actual - current;
    return {
      current,
      actual,
      diff,
      isIncrease: diff > 0,
      absDiff: Math.abs(diff)
    };
  }, [selectedEvent, selectedSourceWallet, actualRealBalance]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto"
      >
        {/* TOP BAR / NAVIGATION */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            {selectedEvent && !initialData && (
              <button 
                type="button"
                onClick={() => {
                  setSelectedEvent(null);
                  setErrorMessage('');
                }}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                title="الرجوع لقائمة الأحداث"
              >
                <ChevronRight size={20} />
              </button>
            )}

            <div>
              <h3 className="font-black text-white text-base sm:text-lg">
                {!selectedEvent 
                  ? 'ماذا حدث؟' 
                  : selectedEvent === 'expense' ? 'تسجيل مصروف'
                  : selectedEvent === 'income' ? 'إيداع دخل'
                  : selectedEvent === 'transfer' ? 'تحويل مالي بين المحافظ'
                  : selectedEvent === 'debt_to_me' ? 'قيد دين لي (مستحق لي)'
                  : selectedEvent === 'debt_on_me' ? 'قيد دين عليّ (التزام)'
                  : selectedEvent === 'debt_repayment' ? 'تسديد دفعة دين'
                  : 'تصحيح وتسوية الرصيد'
                }
              </h3>
              <p className="text-[11px] font-medium text-slate-400">
                {!selectedEvent 
                  ? 'اختر نوع الحدث المالي للتسجيل الدفتري'
                  : 'تسجيل في دفتر القيود المحاسبية'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!selectedEvent && transactions.length > 0 && !initialData && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingExisting(!isEditingExisting);
                  if (!isEditingExisting && transactions[0]) {
                    handleSelectTxForEdit(transactions[0].id);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                  isEditingExisting 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                    : 'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700'
                }`}
              >
                <Edit3 size={13} />
                <span>تعديل سابق</span>
              </button>
            )}

            <button 
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2.5 text-rose-400 text-xs font-bold">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SCREEN 1: EVENT SELECTION GRID ("ماذا حدث؟") */}
        {!selectedEvent && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* If Edit mode selected from selector */}
            {isEditingExisting && (
              <div className="p-3.5 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-3 animate-fade">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 size={15} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">تعديل عملية مسجلة سابقة</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingExisting(false)}
                    className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-slate-800/80"
                  >
                    إلغاء التعديل
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">لا توجد عمليات مسجلة حتى الآن للتعديل.</p>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 block">اختر العملية من السجل:</label>
                    <select
                      value={selectedTxForEdit}
                      onChange={(e) => handleSelectTxForEdit(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                    >
                      {transactions.slice(0, 40).map(t => {
                        const cat = categories.find(c => c.id === t.categoryId);
                        const typeLabel = t.type === 'expense' ? 'مصروف' : t.type === 'income' ? 'دخل' : t.type === 'transfer' ? 'تحويل' : 'تسوية';
                        return (
                          <option key={t.id} value={t.id}>
                            {t.date} | {typeLabel} ({cat?.name || 'عام'}): {t.amount.toLocaleString()} {t.currency || 'SAR'} {t.note ? `- ${t.note}` : ''}
                          </option>
                        );
                      })}
                    </select>

                    {selectedTxForEdit && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const tx = transactions.find(t => t.id === selectedTxForEdit);
                            if (tx) handleSelectTxForEdit(tx.id);
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <span>فتح نموذج التعديل</span>
                          <ChevronRight size={14} className="rotate-180" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* 1. EXPENSE */}
              <button
                type="button"
                onClick={() => setSelectedEvent('expense')}
                className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all text-right group flex flex-col justify-between min-h-[95px] relative overflow-hidden"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-white text-sm sm:text-base group-hover:text-rose-400 transition-colors">مصروف</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-rose-500/20">
                    <ArrowDownLeft size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">تسجيل نفقة، شراء، فواتير</p>
              </button>

              {/* 2. INCOME */}
              <button
                type="button"
                onClick={() => setSelectedEvent('income')}
                className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-right group flex flex-col justify-between min-h-[95px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-white text-sm sm:text-base group-hover:text-emerald-400 transition-colors">دخل</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/20">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">إيداع راتب، أرباح، إيرادات</p>
              </button>

              {/* 3. TRANSFER */}
              <button
                type="button"
                onClick={() => setSelectedEvent('transfer')}
                className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-right group flex flex-col justify-between min-h-[95px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-white text-sm sm:text-base group-hover:text-blue-400 transition-colors">تحويل</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/20">
                    <ArrowLeftRight size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">نقل أموال بين المحافظ والحسابات</p>
              </button>

              {/* 4. DEBT TO ME */}
              <button
                type="button"
                onClick={() => setSelectedEvent('debt_to_me')}
                className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all text-right group flex flex-col justify-between min-h-[95px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-white text-sm sm:text-base group-hover:text-teal-400 transition-colors">دين لي</span>
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-teal-500/20">
                    <UserPlus size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">إقراض مبلغ لشخص (مستحق لي)</p>
              </button>

              {/* 5. DEBT ON ME */}
              <button
                type="button"
                onClick={() => setSelectedEvent('debt_on_me')}
                className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-right group flex flex-col justify-between min-h-[95px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-white text-sm sm:text-base group-hover:text-amber-400 transition-colors">دين عليّ</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-500/20">
                    <UserMinus size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">استلاف مبلغ أو التزام للغير</p>
              </button>

              {/* 6. DEBT REPAYMENT */}
              <button
                type="button"
                onClick={() => setSelectedEvent('debt_repayment')}
                className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-right group flex flex-col justify-between min-h-[95px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-white text-sm sm:text-base group-hover:text-indigo-400 transition-colors">تسديد دين</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-indigo-500/20">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">دفع أو استرداد دفعة من ذمة</p>
              </button>

              {/* 7. BALANCE ADJUSTMENT */}
              <button
                type="button"
                onClick={() => setSelectedEvent('balance_adjustment')}
                className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-right group flex flex-col justify-between min-h-[95px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-white text-sm sm:text-base group-hover:text-purple-400 transition-colors">تصحيح الرصيد</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-500/20">
                    <Scale size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">تسوية ومطابقة الرصيد الفعلي</p>
              </button>

              {/* 8. EDIT PREVIOUS TRANSACTION */}
              <button
                type="button"
                onClick={() => {
                  setIsEditingExisting(true);
                  if (transactions.length > 0) {
                    handleSelectTxForEdit(selectedTxForEdit || transactions[0].id);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all text-right group flex flex-col justify-between min-h-[95px] relative overflow-hidden ${
                  isEditingExisting
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950/60 border-white/5 hover:border-amber-500/40 hover:bg-amber-500/5'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-white text-sm sm:text-base group-hover:text-amber-400 transition-colors">تعديل عملية سابقة</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-500/20">
                    <Edit3 size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">تعديل قيود المصاريف والدخل السابقة</p>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: DEDICATED EVENT FORM */}
        {selectedEvent && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
            
            {/* === 1. EXPENSE VIEW === */}
            {selectedEvent === 'expense' && (
              <>
                {/* Amount & Currency */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">مبلغ المصروف والعملة</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      required
                      autoFocus
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-2xl sm:text-3xl font-black text-white focus:outline-none placeholder-slate-600"
                    />
                    <select
                      value={inputCurrency}
                      onChange={(e) => setInputCurrency(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-amber-400 font-bold focus:outline-none shrink-0"
                    >
                      {DEFAULT_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Wallet to pay from */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <WalletIcon size={14} className="text-amber-400" />
                    <span>الدفع من محفظة:</span>
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.currencyCode}) — الرصيد: {(w.currentBalance ?? w.openingBalance ?? 0).toLocaleString()} {w.currencyCode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expense Categories */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Tag size={14} className="text-rose-400" />
                    <span>تصنيف المصروف:</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
                    {categories.filter(c => c.type === 'expense').map(cat => {
                      const isSelected = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            isSelected 
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm' 
                              : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <span className="text-[10px] truncate max-w-full">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* === 2. INCOME VIEW === */}
            {selectedEvent === 'income' && (
              <>
                {/* Amount & Currency */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">مبلغ الدخل والعملة</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      required
                      autoFocus
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-2xl sm:text-3xl font-black text-emerald-400 focus:outline-none placeholder-slate-600"
                    />
                    <select
                      value={inputCurrency}
                      onChange={(e) => setInputCurrency(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none shrink-0"
                    >
                      {DEFAULT_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Destination Wallet */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <WalletIcon size={14} className="text-emerald-400" />
                    <span>الإيداع في محفظة:</span>
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.currencyCode}) — الرصيد: {(w.currentBalance ?? w.openingBalance ?? 0).toLocaleString()} {w.currencyCode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Income Categories */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Tag size={14} className="text-emerald-400" />
                    <span>مصدر / تصنيف الدخل:</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
                    {categories.filter(c => c.type === 'income').map(cat => {
                      const isSelected = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            isSelected 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm' 
                              : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <span className="text-[10px] truncate max-w-full">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* === 3. TRANSFER VIEW === */}
            {selectedEvent === 'transfer' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* From Wallet */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <ArrowDownLeft size={13} className="text-rose-400" />
                      <span>من محفظة (خصم):</span>
                    </label>
                    <select
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id} disabled={w.id === destinationWalletId}>
                          {w.name} ({w.currencyCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* To Wallet */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <ArrowUpRight size={13} className="text-emerald-400" />
                      <span>إلى محفظة (استلام):</span>
                    </label>
                    <select
                      value={destinationWalletId}
                      onChange={(e) => setDestinationWalletId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id} disabled={w.id === walletId}>
                          {w.name} ({w.currencyCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amount to transfer */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">المبلغ المراد تحويله ({selectedSourceWallet?.currencyCode})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-2xl sm:text-3xl font-black text-blue-400 focus:outline-none placeholder-slate-600"
                  />
                </div>

                {/* Multi-currency destination preview if currencies differ */}
                {selectedSourceWallet?.currencyCode !== selectedDestWallet?.currencyCode && selectedDestWallet && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-300">المبلغ المستلم بالعملة المستهدفة:</span>
                      <span className="text-[10px] text-slate-400">عملة {selectedDestWallet.currencyCode}</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      placeholder={`المبلغ بـ ${selectedDestWallet.currencyCode}`}
                      value={destinationAmount}
                      onChange={(e) => setDestinationAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-blue-400"
                    />
                  </div>
                )}
              </>
            )}

            {/* === 4. DEBT TO ME (دين لي) === */}
            {selectedEvent === 'debt_to_me' && (
              <>
                {/* Person Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <UserPlus size={14} className="text-teal-400" />
                    <span>اسم الشخص أو الجهة المستدينة (المدين):</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="مثال: أحمد محمد، مكتب المقاولات..."
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-teal-500"
                  />
                  {/* Known Contacts Chips */}
                  {knownContacts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {knownContacts.slice(0, 5).map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setPersonName(name)}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] text-slate-300 hover:text-white hover:bg-slate-700 font-medium"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount & Currency */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">مبلغ الدين المستحق لك</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-2xl sm:text-3xl font-black text-teal-400 focus:outline-none placeholder-slate-600"
                    />
                    <select
                      value={inputCurrency}
                      onChange={(e) => setInputCurrency(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-teal-400 font-bold focus:outline-none shrink-0"
                    >
                      {DEFAULT_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Wallet Funding Option */}
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkDebtToWallet}
                      onChange={(e) => setLinkDebtToWallet(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-500 focus:ring-0 bg-slate-900 border-white/20"
                    />
                    <span className="text-xs font-bold text-white">خصم المبلغ من محفظة نقدية الآن</span>
                  </label>
                  {linkDebtToWallet && (
                    <select
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-teal-500 mt-2"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.currencyCode})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Optional Due Date & Phone */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">تاريخ الاستحقاق (اختياري)</label>
                    <input
                      type="date"
                      value={debtDueDate}
                      onChange={(e) => setDebtDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">رقم الهاتف (اختياري)</label>
                    <input
                      type="tel"
                      placeholder="05XXXXXXXX"
                      value={personPhone}
                      onChange={(e) => setPersonPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* === 5. DEBT ON ME (دين عليّ) === */}
            {selectedEvent === 'debt_on_me' && (
              <>
                {/* Person Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <UserMinus size={14} className="text-amber-400" />
                    <span>اسم صاحب الدين (الدائن المستحق له):</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="مثال: خالد، البنك، مورد البضاعة..."
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                  {/* Known Contacts Chips */}
                  {knownContacts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {knownContacts.slice(0, 5).map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setPersonName(name)}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] text-slate-300 hover:text-white hover:bg-slate-700 font-medium"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount & Currency */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">مبلغ الالتزام المالي المستحق عليك</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent text-2xl sm:text-3xl font-black text-amber-400 focus:outline-none placeholder-slate-600"
                    />
                    <select
                      value={inputCurrency}
                      onChange={(e) => setInputCurrency(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-amber-400 font-bold focus:outline-none shrink-0"
                    >
                      {DEFAULT_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Wallet Receiving Option */}
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkDebtToWallet}
                      onChange={(e) => setLinkDebtToWallet(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-white/20"
                    />
                    <span className="text-xs font-bold text-white">إيداع المبلغ المستلف في محفظة الآن</span>
                  </label>
                  {linkDebtToWallet && (
                    <select
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500 mt-2"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.currencyCode})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Optional Due Date & Phone */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">تاريخ السداد المحدد</label>
                    <input
                      type="date"
                      value={debtDueDate}
                      onChange={(e) => setDebtDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">رقم الهاتف (اختياري)</label>
                    <input
                      type="tel"
                      placeholder="05XXXXXXXX"
                      value={personPhone}
                      onChange={(e) => setPersonPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* === 6. DEBT REPAYMENT (تسديد دين) === */}
            {selectedEvent === 'debt_repayment' && (
              <>
                {activeDebts.length === 0 ? (
                  <div className="p-6 bg-slate-950/60 rounded-2xl border border-white/5 text-center space-y-2">
                    <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                    <h4 className="font-bold text-white text-sm">لا توجد ديون نشطة مستحقة للسداد حالياً</h4>
                    <p className="text-xs text-slate-400">جميع الديون مسددة بالكامل أو لم يتم تسجيل أي ديون بعد.</p>
                  </div>
                ) : (
                  <>
                    {/* Debt Picker */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">اختر الذمة المالية المراد سدادها:</label>
                      <select
                        value={selectedDebtIdForRepayment}
                        onChange={(e) => {
                          setSelectedDebtIdForRepayment(e.target.value);
                          const target = debts.find(d => d.id === e.target.value);
                          if (target) {
                            const rem = Math.max(0, (target.originalAmount || target.amount) - (target.paidAmount || 0));
                            setAmount(rem.toString());
                          }
                        }}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                      >
                        {activeDebts.map(d => {
                          const rem = Math.max(0, (d.originalAmount || d.amount) - (d.paidAmount || 0));
                          return (
                            <option key={d.id} value={d.id}>
                              {d.type === 'to_me' ? '[دين لي]' : '[دين عليّ]'} {d.personName} — المتبقي: {rem.toLocaleString()} {d.currency || 'SAR'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Selected Debt Overview */}
                    {currentSelectedDebt && (
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block">
                            {currentSelectedDebt.type === 'to_me' ? 'استرداد دفعة من مستحقاتك' : 'سداد دفعة من التزاماتك'}
                          </span>
                          <span className="font-black text-white">{currentSelectedDebt.personName}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block">إجمالي المتبقي:</span>
                          <span className="font-black text-indigo-400 text-sm">
                            {Math.max(0, (currentSelectedDebt.originalAmount || currentSelectedDebt.amount) - (currentSelectedDebt.paidAmount || 0)).toLocaleString()} {currentSelectedDebt.currency || 'SAR'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Payment Amount */}
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">مبلغ الدفعة المسددة</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-transparent text-2xl sm:text-3xl font-black text-indigo-400 focus:outline-none placeholder-slate-600"
                      />
                      {/* Quick Shortcuts */}
                      {currentSelectedDebt && (
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const rem = Math.max(0, (currentSelectedDebt.originalAmount || currentSelectedDebt.amount) - (currentSelectedDebt.paidAmount || 0));
                              setAmount(rem.toString());
                            }}
                            className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-[10px] font-bold"
                          >
                            سداد كامل المبلغ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const rem = Math.max(0, (currentSelectedDebt.originalAmount || currentSelectedDebt.amount) - (currentSelectedDebt.paidAmount || 0));
                              setAmount((rem / 2).toString());
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold"
                          >
                            نصف المبلغ (50%)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Target Wallet for Payment */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">
                        {currentSelectedDebt?.type === 'to_me' ? 'إيداع الدفعة المستردة في محفظة:' : 'الخصم من محفظة للسداد:'}
                      </label>
                      <select
                        value={walletId}
                        onChange={(e) => setWalletId(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                      >
                        {wallets.map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.currencyCode})</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            {/* === 7. BALANCE ADJUSTMENT (تصحيح الرصيد) === */}
            {selectedEvent === 'balance_adjustment' && (
              <>
                {/* Wallet Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <WalletIcon size={14} className="text-purple-400" />
                    <span>اختر المحفظة المراد تصحيح رصيدها:</span>
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => {
                      setWalletId(e.target.value);
                      const target = wallets.find(w => w.id === e.target.value);
                      if (target) {
                        const cur = target.currentBalance ?? target.openingBalance ?? 0;
                        setActualRealBalance(cur.toString());
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.currencyCode}) — الدفتري: {(w.currentBalance ?? w.openingBalance ?? 0).toLocaleString()} {w.currencyCode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ledger vs Real Comparison */}
                {adjustmentCalc && (
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                      <span className="text-slate-400 font-bold">الرصيد الدفتري المسجل في التطبيق:</span>
                      <span className="text-white font-black text-sm">{adjustmentCalc.current.toLocaleString()} {selectedSourceWallet?.currencyCode}</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-purple-400 block">أدخل الرصيد الفعلي الموجود لديك الآن:</label>
                      <input
                        type="number"
                        step="any"
                        required
                        autoFocus
                        placeholder="الرصيد الفعلي الحقيقي..."
                        value={actualRealBalance}
                        onChange={(e) => setActualRealBalance(e.target.value)}
                        className="w-full bg-slate-900 border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xl font-black text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    {/* Discrepancy indicator */}
                    {adjustmentCalc.actual !== null && Math.abs(adjustmentCalc.diff) > 0.001 && (
                      <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                        adjustmentCalc.isIncrease 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        <span>فارق التسوية والتصحيح:</span>
                        <span className="font-black text-sm">
                          {adjustmentCalc.isIncrease ? '+' : '-'}{adjustmentCalc.absDiff?.toLocaleString()} {selectedSourceWallet?.currencyCode} ({adjustmentCalc.isIncrease ? 'زيادة' : 'عجز/نقص'})
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* COMMON FIELDS: DATE & TIME & NOTES */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Calendar size={12} />
                  <span>التاريخ</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={12} />
                  <span>الوقت</span>
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Note Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <StickyNote size={12} />
                <span>ملاحظات أو بيان الحدث (اختياري)</span>
              </label>
              <input
                type="text"
                placeholder="بيان تفصيلي للعملية..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Receipt attachment for expenses */}
            {selectedEvent === 'expense' && (
              <div className="space-y-1.5 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                {!receipt ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-white/10 hover:border-amber-500/40 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors bg-slate-950/40"
                  >
                    <Camera size={15} />
                    <span>إرفاق صورة الفاتورة أو الإيصال (اختياري)</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-white/10">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} className="text-amber-400" />
                      <span className="text-xs text-white font-bold truncate max-w-[180px]">{receipt.fileName || 'صورة الفاتورة'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowReceiptPreview(true)}
                        className="px-2 py-1 bg-slate-800 text-[10px] font-bold text-slate-300 rounded-lg"
                      >
                        معاينة
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceipt(undefined)}
                        className="p-1 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || (selectedEvent === 'debt_repayment' && activeDebts.length === 0)}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 ${
                  selectedEvent === 'expense' ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  : selectedEvent === 'income' ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : selectedEvent === 'transfer' ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
                  : selectedEvent === 'debt_to_me' ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
                  : selectedEvent === 'debt_on_me' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : selectedEvent === 'debt_repayment' ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'
                  : 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20'
                }`}
              >
                <Check size={18} strokeWidth={3} />
                <span>
                  {initialData ? 'حفظ التعديلات في القيود' 
                    : selectedEvent === 'expense' ? 'تسجيل المصروف في القيود'
                    : selectedEvent === 'income' ? 'إيداع الدخل في القيود'
                    : selectedEvent === 'transfer' ? 'تنفيذ التحويل المالي'
                    : selectedEvent === 'debt_to_me' ? 'قيد الدين والمستحق الدفتري'
                    : selectedEvent === 'debt_on_me' ? 'قيد الالتزام المالي'
                    : selectedEvent === 'debt_repayment' ? 'تسجيل دفعة السداد'
                    : 'تأكيد تصحيح وتسوية الرصيد'
                  }
                </span>
              </button>
            </div>
          </form>
        )}

        {/* RECEIPT PREVIEW MODAL */}
        {showReceiptPreview && receipt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
            <div className="relative max-w-lg w-full bg-slate-900 rounded-2xl p-4 border border-white/10">
              <button
                type="button"
                onClick={() => setShowReceiptPreview(false)}
                className="absolute top-3 left-3 p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700"
              >
                <X size={18} />
              </button>
              <img 
                src={receipt.dataUrl} 
                alt="Receipt" 
                className="w-full max-h-[70vh] object-contain rounded-xl mt-6"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TransactionForm;
