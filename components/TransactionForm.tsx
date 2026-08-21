import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, StickyNote, Wallet as WalletIcon, ArrowLeftRight, 
  Camera, Image as ImageIcon, Trash2, Eye, CheckCircle2, Clock, 
  AlertCircle, Sparkles, Search, History, Edit3, ArrowUpRight, 
  ArrowDownLeft, ChevronDown, ChevronUp, Check, Filter
} from 'lucide-react';
import { Transaction, Category, TransactionType, Wallet, ReceiptAttachment } from '../types';
import { getIcon, DEFAULT_CURRENCIES, convertCurrency } from '../constants';
import { validateTransactionData } from '../services/balanceEngine';

interface TransactionFormProps {
  categories: Category[];
  wallets: Wallet[];
  onSubmit: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  onClose: () => void;
  initialData?: Transaction | null;
  exchangeRates: Record<string, number>;
  defaultType?: TransactionType;
  transactions?: Transaction[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  categories,
  wallets,
  onSubmit,
  onClose,
  initialData,
  exchangeRates,
  defaultType,
  transactions = []
}) => {
  // Mode: 'new' or 'edit'
  const [mode, setMode] = useState<'new' | 'edit'>(
    initialData || defaultType === 'adjustment' ? 'edit' : 'new'
  );
  
  // Selected transaction when editing
  const [selectedTxId, setSelectedTxId] = useState<string>(
    initialData?.id || (transactions.length > 0 ? transactions[0].id : '')
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [dropdownFilter, setDropdownFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');

  const [type, setType] = useState<TransactionType>(
    initialData?.type || (defaultType === 'adjustment' ? 'expense' : defaultType) || 'expense'
  );
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
  const [dismissCrossCurrencyAlert, setDismissCrossCurrencyAlert] = useState(false);
  const [permanentDismissCrossAlert, setPermanentDismissCrossAlert] = useState(() => {
    try {
      return localStorage.getItem('thari_hide_cross_currency_alert') === 'true';
    } catch {
      return false;
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const initialWallet = wallets.find(w => w.id === (initialData?.walletId || wallets[0]?.id));
  const [inputCurrency, setInputCurrency] = useState(initialData?.currency || initialWallet?.currencyCode || 'SAR');

  const selectedSourceWallet = wallets.find(w => w.id === walletId);
  const selectedDestWallet = wallets.find(w => w.id === destinationWalletId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Alternative wallet matching selected currency if available
  const matchingCurrencyWallet = wallets.find(w => w.id !== walletId && w.currencyCode === inputCurrency);

  const handleTogglePermanentDismiss = (checked: boolean) => {
    setPermanentDismissCrossAlert(checked);
    try {
      if (checked) {
        localStorage.setItem('thari_hide_cross_currency_alert', 'true');
      } else {
        localStorage.removeItem('thari_hide_cross_currency_alert');
      }
    } catch {
      // storage unavailable
    }
  };

  const populateFormWithTransaction = (tx: Transaction) => {
    setSelectedTxId(tx.id);
    setType(tx.type);
    setAmount(tx.amount.toString());
    setCategoryId(tx.categoryId || '');
    setWalletId(tx.walletId);
    setDestinationWalletId(tx.destinationWalletId || (wallets.find(w => w.id !== tx.walletId)?.id || ''));
    setDestinationAmount(tx.destinationAmount ? tx.destinationAmount.toString() : '');
    setNote(tx.note || '');
    setDate(tx.date || new Date().toISOString().split('T')[0]);
    setTime(tx.time || new Date().toTimeString().slice(0, 5));
    setInputCurrency(tx.currency);
    setReceipt(tx.receipt);
    setErrorMessage('');
  };

  // Initial load
  useEffect(() => {
    if (initialData) {
      populateFormWithTransaction(initialData);
      setMode('edit');
    }
  }, [initialData]);

  // When switching to Edit tab, if no transaction is selected or to set the first one
  const handleSwitchToEditMode = () => {
    setMode('edit');
    setErrorMessage('');
    if (transactions.length > 0) {
      const currentTx = transactions.find(t => t.id === selectedTxId) || transactions[0];
      populateFormWithTransaction(currentTx);
    }
  };

  // When switching to New mode
  const handleSwitchToNewMode = (newType: TransactionType) => {
    setMode('new');
    setType(newType);
    setAmount('');
    setNote('');
    setReceipt(undefined);
    setErrorMessage('');
    const defaultW = wallets[0];
    if (defaultW) {
      setWalletId(defaultW.id);
      setInputCurrency(defaultW.currencyCode);
    }
    if (categories.length > 0) {
      const availableCat = categories.find(c => c.type === (newType === 'transfer_to_goal' ? 'expense' : newType));
      setCategoryId(availableCat?.id || '');
    }
  };

  // Sync default currency on wallet change when in 'new' mode
  useEffect(() => {
    if (mode === 'new') {
      const selectedW = wallets.find(w => w.id === walletId);
      if (selectedW) {
        setInputCurrency(selectedW.currencyCode);
        setDismissCrossCurrencyAlert(false);
      }
    }
  }, [walletId, wallets, mode]);

  // Auto-calculate estimated destination amount if cross-currency transfer
  useEffect(() => {
    if (type === 'transfer' && amount && selectedSourceWallet && selectedDestWallet) {
      const srcCurr = inputCurrency;
      const destCurr = selectedDestWallet.currencyCode;
      if (srcCurr === destCurr) {
        setDestinationAmount(amount);
      } else {
        const numAmt = parseFloat(amount);
        if (!isNaN(numAmt) && numAmt > 0) {
          const estimated = convertCurrency(numAmt, srcCurr, destCurr, exchangeRates);
          setDestinationAmount(estimated.toFixed(2));
        }
      }
    }
  }, [type, amount, inputCurrency, selectedSourceWallet, selectedDestWallet, exchangeRates]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 4 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setReceipt({
        id: `rcp-${Date.now()}`,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl: resultStr,
        createdAt: new Date().toISOString(),
      });
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (type !== 'transfer' && type !== 'adjustment' && !categoryId) {
      setErrorMessage('يرجى اختيار تصنيف للعملية');
      return;
    }

    if (type === 'transfer') {
      if (!destinationWalletId || destinationWalletId === walletId) {
        setErrorMessage('يرجى اختيار محفظة مستلمة مختلفة عن المحفظة المصدر');
        return;
      }
    }

    if (mode === 'edit' && transactions.length > 0 && !selectedTxId) {
      setErrorMessage('يرجى اختيار المعاملة السابقة المراد تعديلها من القائمة المنسدلة');
      return;
    }

    setIsSubmitting(true);

    const walletNativeCurrency = selectedSourceWallet?.currencyCode || inputCurrency;
    const isCrossCurrency = inputCurrency !== walletNativeCurrency;
    const convertedInWallet = isCrossCurrency
      ? convertCurrency(parsedAmount, inputCurrency, walletNativeCurrency, exchangeRates)
      : parsedAmount;
    const rateUsed = isCrossCurrency && parsedAmount > 0 ? (convertedInWallet / parsedAmount) : 1;

    const editingOriginalTx = mode === 'edit' ? transactions.find(t => t.id === selectedTxId) : null;

    const txPayload: Omit<Transaction, 'id'> & { id?: string } = {
      ...(mode === 'edit' && selectedTxId ? { id: selectedTxId } : {}),
      amount: parsedAmount,
      type,
      categoryId: type === 'transfer' ? 'transfer' : type === 'adjustment' ? 'adjustment' : categoryId,
      walletId,
      destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
      destinationCurrency: type === 'transfer' && selectedDestWallet ? selectedDestWallet.currencyCode : undefined,
      destinationAmount: type === 'transfer' && destinationAmount ? parseFloat(destinationAmount) : undefined,
      walletCurrency: walletNativeCurrency,
      convertedAmountInWalletCurrency: convertedInWallet,
      exchangeRateUsed: rateUsed,
      note: note.trim() || (type === 'transfer' ? `تحويل إلى ${selectedDestWallet?.name || 'محفظة أخرى'}` : ''),
      date,
      time,
      currency: inputCurrency,
      frequency: 'once',
      receipt,
      createdAt: editingOriginalTx?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'PENDING',
    };

    const validation = validateTransactionData(txPayload as any);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'بيانات المعاملة غير مكتملة');
      setIsSubmitting(false);
      return;
    }

    onSubmit(txPayload);
  };

  const isCrossCurrency = selectedSourceWallet && inputCurrency !== selectedSourceWallet.currencyCode;
  const numAmount = parseFloat(amount) || 0;
  const effectiveTotalInWallet = isCrossCurrency && selectedSourceWallet && numAmount > 0
    ? convertCurrency(numAmount, inputCurrency, selectedSourceWallet.currencyCode, exchangeRates)
    : 0;
  const singleUnitRate = isCrossCurrency && selectedSourceWallet
    ? convertCurrency(1, inputCurrency, selectedSourceWallet.currencyCode, exchangeRates)
    : 1;

  // Filter transactions for dropdown selector
  const filteredTransactions = transactions.filter(t => {
    if (dropdownFilter !== 'all' && t.type !== dropdownFilter) return false;
    if (!dropdownSearch.trim()) return true;
    const query = dropdownSearch.toLowerCase();
    const cat = categories.find(c => c.id === t.categoryId);
    const wal = wallets.find(w => w.id === t.walletId);
    const noteMatch = (t.note || '').toLowerCase().includes(query);
    const catMatch = (cat?.name || '').toLowerCase().includes(query);
    const walMatch = (wal?.name || '').toLowerCase().includes(query);
    const amountMatch = t.amount.toString().includes(query);
    const currMatch = (t.currency || '').toLowerCase().includes(query);
    return noteMatch || catMatch || walMatch || amountMatch || currMatch;
  });

  const currentEditingTx = transactions.find(t => t.id === selectedTxId);
  const currentTxCat = categories.find(c => c.id === currentEditingTx?.categoryId);
  const currentTxWal = wallets.find(w => w.id === currentEditingTx?.walletId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[100] no-print overflow-hidden"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-slate-900 w-full max-w-md mx-auto rounded-3xl p-5 shadow-2xl relative max-h-[92vh] flex flex-col min-h-0 border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 shrink-0 pb-2.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${mode === 'edit' ? 'bg-amber-400 animate-pulse' : 'bg-amber-500'}`} />
            <h3 className="text-sm sm:text-base font-black text-white">
              {mode === 'edit' ? 'تعديل معاملة سابقة من السجل' : 'تسجيل معاملة مالية جديدة'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/5 active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* Top 4-Button Tabs: [مصروف | وارد | تحويل | تعديل ✏️] */}
        <div className="grid grid-cols-4 bg-slate-950 p-1 rounded-2xl border border-white/5 shrink-0 gap-1 mb-3.5">
          <button
            type="button"
            onClick={() => handleSwitchToNewMode('expense')}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              mode === 'new' && type === 'expense'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            مصروف
          </button>
          <button
            type="button"
            onClick={() => handleSwitchToNewMode('income')}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              mode === 'new' && type === 'income'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            وارد
          </button>
          <button
            type="button"
            onClick={() => handleSwitchToNewMode('transfer')}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              mode === 'new' && type === 'transfer'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تحويل
          </button>
          <button
            type="button"
            onClick={handleSwitchToEditMode}
            className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
              mode === 'edit'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
            }`}
          >
            <Edit3 size={12} />
            <span>تعديل</span>
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold p-2.5 rounded-xl mb-2.5 text-right shrink-0 flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 min-h-0 pr-0.5 pl-0.5 pb-2">
          
          {/* ========================================================= */}
          {/* 🌟 EDIT MODE: PROFESSIONAL DROPDOWN OF PREVIOUS RECORDS   */}
          {/* ========================================================= */}
          {mode === 'edit' && (
            <div className="space-y-2 shrink-0" ref={dropdownRef}>
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <History size={13} />
                  <span>اختر المعاملة السابقة من القائمة المنسدلة:</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {transactions.length} معاملة مسجلة
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="bg-slate-950/80 border border-dashed border-white/10 rounded-2xl p-4 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-300">لا توجد لديك معاملات سابقة في السجل حتى الآن</p>
                  <button
                    type="button"
                    onClick={() => handleSwitchToNewMode('expense')}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-black rounded-xl"
                  >
                    تسجيل معاملة جديدة
                  </button>
                </div>
              ) : (
                <div className="relative">
                  {/* Dropdown Toggle Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-amber-500/40 focus:border-amber-400 p-3 rounded-2xl text-right transition-all flex items-center justify-between gap-2 shadow-lg group active:scale-[0.99]"
                  >
                    {currentEditingTx ? (
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          currentEditingTx.type === 'expense' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                          currentEditingTx.type === 'income' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                          'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        }`}>
                          {currentEditingTx.type === 'expense' ? <ArrowUpRight size={15} /> :
                           currentEditingTx.type === 'income' ? <ArrowDownLeft size={15} /> :
                           <ArrowLeftRight size={14} />}
                        </div>
                        <div className="truncate text-right">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {currentEditingTx.note || (currentEditingTx.type === 'transfer' ? 'تحويل' : currentTxCat?.name || 'معاملة')}
                            </span>
                            <span className="text-[10px] text-amber-400/90 font-medium px-1.5 py-0.2 bg-amber-500/10 rounded-md">
                              {currentTxWal?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{currentEditingTx.date}</span>
                            <span>•</span>
                            <span className="font-bold dir-ltr text-amber-300">
                              {currentEditingTx.amount.toLocaleString()} {currentEditingTx.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        اضغط لفتح القائمة واختيار معاملة...
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-amber-400 shrink-0">
                      <span className="text-[10.5px] font-bold hidden sm:inline">تغيير</span>
                      {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {/* Dropdown Floating Menu */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-2.5 shadow-2xl z-50 max-h-64 flex flex-col min-h-0 space-y-2 overflow-hidden"
                      >
                        {/* Search and Filters inside dropdown */}
                        <div className="space-y-1.5 shrink-0">
                          <div className="relative">
                            <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={dropdownSearch}
                              onChange={(e) => setDropdownSearch(e.target.value)}
                              placeholder="بحث سريع بالملاحظة، المحفظة، أو المبلغ..."
                              className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50 text-right"
                              autoFocus
                            />
                            {dropdownSearch && (
                              <button
                                type="button"
                                onClick={() => setDropdownSearch('')}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          {/* Filter pills */}
                          <div className="flex gap-1 overflow-x-auto no-scrollbar flex-row-reverse pb-0.5">
                            {[
                              { id: 'all', label: 'الكل' },
                              { id: 'expense', label: 'مصروف' },
                              { id: 'income', label: 'وارد' },
                              { id: 'transfer', label: 'تحويل' },
                            ].map(f => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setDropdownFilter(f.id as any)}
                                className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all shrink-0 ${
                                  dropdownFilter === f.id
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black'
                                    : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/15'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* List Items in Dropdown */}
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 min-h-0 pr-0.5">
                          {filteredTransactions.length === 0 ? (
                            <div className="text-center py-4 text-slate-400 text-xs">
                              لا توجد معاملات مطابقة للبحث
                            </div>
                          ) : (
                            filteredTransactions.map(tx => {
                              const cat = categories.find(c => c.id === tx.categoryId);
                              const wal = wallets.find(w => w.id === tx.walletId);
                              const isSelected = tx.id === selectedTxId;
                              const isExp = tx.type === 'expense';
                              const isInc = tx.type === 'income';

                              return (
                                <div
                                  key={tx.id}
                                  onClick={() => {
                                    populateFormWithTransaction(tx);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border ${
                                    isSelected
                                      ? 'bg-amber-500/15 border-amber-500/50 text-white'
                                      : 'bg-slate-900/80 hover:bg-slate-800/90 border-white/5 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs border ${
                                      isExp ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                      isInc ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                      {isExp ? <ArrowUpRight size={13} /> : isInc ? <ArrowDownLeft size={13} /> : <ArrowLeftRight size={12} />}
                                    </div>
                                    <div className="text-right truncate">
                                      <p className="text-xs font-bold truncate">
                                        {tx.note || (tx.type === 'transfer' ? 'تحويل' : cat?.name || 'معاملة')}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        {wal?.name} • {tx.date}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-left shrink-0 flex items-center gap-1.5">
                                    <span className={`text-xs font-black dir-ltr ${
                                      isExp ? 'text-rose-400' : isInc ? 'text-emerald-400' : 'text-blue-400'
                                    }`}>
                                      {tx.amount.toLocaleString()} {tx.currency}
                                    </span>
                                    {isSelected && <Check size={14} className="text-amber-400" />}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* Transfer Info Note */}
          {type === 'transfer' && (
            <p className="text-[10px] text-blue-300/80 px-1 text-right font-medium">
              💡 <strong>التحويل:</strong> نقل أموال بين محافظك الخاصة (مثلاً: صرف يمني إلى دولار أو سحب بنكي إلى كاش)، ولا يُحسب كمصروف أو إيراد جديد.
            </p>
          )}

          {/* Amount & Currency Fields */}
          <div className="space-y-1 shrink-0">
            <div className="bg-slate-950/80 border border-white/10 p-3.5 rounded-2xl flex flex-col gap-1.5 focus-within:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">المبلغ والعملة</span>
                <span className="text-[10px] text-amber-400/80 font-semibold">
                  {type === 'transfer' ? 'المبلغ المحوّل من المصدر' : mode === 'edit' ? 'تعديل المبلغ' : 'قيمة المعاملة'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="relative shrink-0">
                  <select
                    value={inputCurrency}
                    onChange={(e) => setInputCurrency(e.target.value)}
                    className="appearance-none bg-slate-900 border border-white/15 text-amber-400 text-xs font-black rounded-xl py-2 pl-6 pr-3 outline-none uppercase tracking-wider shadow-md cursor-pointer hover:border-amber-400"
                  >
                    {DEFAULT_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setErrorMessage(''); }}
                  placeholder="0.00"
                  className="w-full text-2xl sm:text-3xl font-black text-right bg-transparent border-none outline-none text-white placeholder:text-white/20"
                  autoFocus={mode === 'new'}
                />
              </div>
            </div>
          </div>

          {/* Source Wallet Selector */}
          <div className="space-y-1.5 shrink-0">
            <label className="text-[11px] font-bold text-slate-400 px-1 block text-right">
              {type === 'transfer' ? 'المحفظة المصدر (يخصم منها)' : 'المحفظة المتأثرة'}
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1 flex-row-reverse">
              {wallets.map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWalletId(w.id)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
                    walletId === w.id
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-md'
                      : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                  <span>{w.name}</span>
                  <span className="text-[10px] opacity-75">({w.currencyCode})</span>
                </button>
              ))}
            </div>

            {/* Multi-Currency & Cross-Wallet Notice Banner */}
            {type !== 'transfer' && isCrossCurrency && selectedSourceWallet && !dismissCrossCurrencyAlert && !permanentDismissCrossAlert && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-950/20 border border-amber-500/35 rounded-2xl p-3 space-y-2 mt-2 text-right"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs">
                    <Sparkles size={14} className="text-amber-400 shrink-0 animate-pulse" />
                    <span>تنبيه العملات المتعددة والصرف الآلي</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissCrossCurrencyAlert(true)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    title="إخفاء التنبيه"
                  >
                    <X size={13} />
                  </button>
                </div>

                <p className="text-[11px] leading-relaxed text-amber-200/90 font-medium">
                  أنت تسجل هذه المعاملة بـ <strong className="text-amber-300 font-black">({inputCurrency})</strong> بينما العملة الأساسية للمحفظة المختارة (<span className="text-white font-bold">{selectedSourceWallet.name}</span>) هي <strong className="text-amber-300 font-black">({selectedSourceWallet.currencyCode})</strong>.
                </p>

                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">سعر الصرف المعتمد:</span>
                    <span className="font-mono font-bold text-slate-200 dir-ltr">
                      1 {inputCurrency} = {singleUnitRate.toLocaleString('en-US', { maximumFractionDigits: 4 })} {selectedSourceWallet.currencyCode}
                    </span>
                  </div>
                  {numAmount > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 font-black text-[11px]">
                      <span className="text-amber-300">
                        {type === 'expense' ? 'المخصوم الفعلي من المحفظة:' : 'المضاف الفعلي للمحفظة:'}
                      </span>
                      <span className="font-mono text-amber-200 dir-ltr text-xs">
                        {effectiveTotalInWallet.toLocaleString('en-US', { maximumFractionDigits: 2 })} {selectedSourceWallet.currencyCode}
                      </span>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1 px-1 text-[10.5px] text-slate-300 hover:text-white transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={permanentDismissCrossAlert}
                    onChange={(e) => handleTogglePermanentDismiss(e.target.checked)}
                    className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>عدم إظهار هذا التنبيه مستقبلاً (إخفاء دائم)</span>
                </label>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                  {matchingCurrencyWallet ? (
                    <button
                      type="button"
                      onClick={() => {
                        setWalletId(matchingCurrencyWallet.id);
                        setDismissCrossCurrencyAlert(false);
                      }}
                      className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-[10px] font-black flex items-center gap-1 transition-colors"
                    >
                      <WalletIcon size={11} />
                      <span>التبديل إلى محفظة {matchingCurrencyWallet.name} ({inputCurrency})</span>
                    </button>
                  ) : (
                    <span className="text-[9.5px] text-slate-400">
                      سيتم احتساب الخصم بالسعر المعادل وحفظ بيانات العملتين بالتقرير
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setDismissCrossCurrencyAlert(true)}
                    className="text-[10.5px] text-amber-400 hover:text-amber-300 font-bold underline px-1 py-0.5"
                  >
                    إخفاء ومتابعة
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Transfer Destination Wallet & Conversion */}
          {type === 'transfer' && (
            <div className="bg-blue-950/30 border border-blue-500/30 p-3.5 rounded-2xl space-y-3 text-right">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <ArrowLeftRight size={14} className="text-blue-400" />
                  المحفظة المستلمة (يضاف إليها)
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 flex-row-reverse">
                {wallets
                  .filter(w => w.id !== walletId)
                  .map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setDestinationWalletId(w.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
                        destinationWalletId === w.id
                          ? 'bg-blue-500 text-white border-blue-400 font-black shadow-md'
                          : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                      <span>{w.name}</span>
                      <span className="text-[10px] opacity-75">({w.currencyCode})</span>
                    </button>
                  ))}
              </div>

              {/* Destination Amount Field (Cross Currency Support) */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">المبلغ المستلم الفعلي:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400">{selectedDestWallet?.currencyCode || ''}</span>
                  <input
                    type="number"
                    step="any"
                    value={destinationAmount}
                    onChange={(e) => setDestinationAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-24 text-right bg-transparent border-none outline-none font-black text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Categories Horizontal Slider (Only for Income / Expense) */}
          {type !== 'transfer' && type !== 'adjustment' && (
            <div className="space-y-1.5 shrink-0">
              <label className="text-[11px] font-bold text-slate-400 px-1 block text-right">تصنيف المعاملة</label>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 px-1 flex-row-reverse">
                {categories
                  .filter(c => c.type === (type === 'transfer_to_goal' ? 'expense' : type))
                  .map(cat => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setCategoryId(cat.id); setErrorMessage(''); }}
                        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all text-xs font-bold active:scale-95 ${
                          isSelected
                            ? 'border-amber-500/80 bg-amber-500/15 text-amber-400 font-black shadow-sm'
                            : 'border-white/5 bg-slate-950 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <span className="shrink-0" style={{ color: cat.color }}>
                          {getIcon(cat.icon, 14)}
                        </span>
                        <span className="truncate max-w-[90px]">{cat.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Date, Time & Note */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="bg-slate-950 p-2.5 rounded-xl flex items-center gap-2 border border-white/5 focus-within:border-white/20 transition-all">
              <Calendar size={14} className="text-slate-500 shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs text-slate-200 w-full cursor-pointer"
              />
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl flex items-center gap-2 border border-white/5 focus-within:border-white/20 transition-all">
              <Clock size={14} className="text-slate-500 shrink-0" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs text-slate-200 w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl flex items-center gap-2 border border-white/5 focus-within:border-white/20 transition-all shrink-0">
            <StickyNote size={14} className="text-slate-500 shrink-0" />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="وصف أو ملاحظة للمعاملة (اختياري)..."
              className="bg-transparent border-none outline-none font-medium text-xs text-slate-200 w-full placeholder:text-slate-600 text-right"
            />
          </div>

          {/* Receipt Attachment Section */}
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Camera size={13} className="text-amber-500" />
                إرفاق سند أو فاتورة (اختياري)
              </span>
              {receipt && (
                <button
                  type="button"
                  onClick={() => setReceipt(undefined)}
                  className="text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center gap-1"
                >
                  <Trash2 size={11} /> حذف المرفق
                </button>
              )}
            </div>

            {receipt ? (
              <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-xl border border-white/10">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src={receipt.dataUrl}
                    alt="Receipt preview"
                    className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0 cursor-pointer"
                    onClick={() => setShowReceiptPreview(true)}
                  />
                  <div className="truncate text-right">
                    <p className="text-xs font-bold text-slate-200 truncate">{receipt.fileName}</p>
                    <p className="text-[10px] text-slate-400">{(receipt.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReceiptPreview(true)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  title="معاينة الفاتورة"
                >
                  <Eye size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 border border-dashed border-white/15 hover:border-amber-500/50 rounded-xl text-slate-400 hover:text-amber-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-98"
              >
                <ImageIcon size={15} />
                <span>رفع صورة الفاتورة أو السند</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 mt-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 shrink-0"
          >
            <CheckCircle2 size={18} />
            <span>{mode === 'edit' ? 'حفظ تعديل المعاملة في السجل ✏️' : 'تأكيد وحفظ المعاملة'}</span>
          </button>
        </form>

        {/* Receipt Full Preview Modal */}
        <AnimatePresence>
          {showReceiptPreview && receipt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-4"
            >
              <div className="flex justify-between items-center w-full max-w-lg mb-3">
                <h4 className="text-sm font-bold text-white truncate">{receipt.fileName}</h4>
                <button
                  onClick={() => setShowReceiptPreview(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <img
                src={receipt.dataUrl}
                alt="Receipt Full View"
                className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default TransactionForm;
