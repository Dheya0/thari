import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, StickyNote, RefreshCw, Wallet as WalletIcon, ArrowLeftRight, Camera, Image as ImageIcon, Trash2, Eye, SlidersHorizontal, CheckCircle2, Clock } from 'lucide-react';
import { Transaction, Category, TransactionType, Wallet, ReceiptAttachment } from '../types';
import { getIcon, DEFAULT_CURRENCIES, convertCurrency } from '../constants';
import { validateTransactionData } from '../services/balanceEngine';

interface TransactionFormProps {
  categories: Category[];
  wallets: Wallet[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  initialData?: Transaction | null;
  exchangeRates: Record<string, number>;
  defaultType?: TransactionType;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  categories,
  wallets,
  onSubmit,
  onClose,
  initialData,
  exchangeRates,
  defaultType
}) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || defaultType || 'expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [destinationWalletId, setDestinationWalletId] = useState<string>(
    initialData?.destinationWalletId || (wallets.length > 1 ? wallets[1]?.id : '')
  );
  const [destinationAmount, setDestinationAmount] = useState<string>(
    initialData?.destinationAmount ? initialData.destinationAmount.toString() : ''
  );
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [receipt, setReceipt] = useState<ReceiptAttachment | undefined>(initialData?.receipt);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialWallet = wallets.find(w => w.id === (initialData?.walletId || wallets[0]?.id));
  const [inputCurrency, setInputCurrency] = useState(initialData?.currency || initialWallet?.currencyCode || 'SAR');

  const selectedSourceWallet = wallets.find(w => w.id === walletId);
  const selectedDestWallet = wallets.find(w => w.id === destinationWalletId);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId || '');
      setWalletId(initialData.walletId);
      setDestinationWalletId(initialData.destinationWalletId || (wallets.find(w => w.id !== initialData.walletId)?.id || ''));
      setDestinationAmount(initialData.destinationAmount ? initialData.destinationAmount.toString() : '');
      setNote(initialData.note || '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setTime(initialData.time || new Date().toTimeString().slice(0, 5));
      setInputCurrency(initialData.currency);
      setReceipt(initialData.receipt);
    }
  }, [initialData]);

  // Sync default currency on wallet change
  useEffect(() => {
    if (!initialData) {
      const selectedW = wallets.find(w => w.id === walletId);
      if (selectedW) {
        setInputCurrency(selectedW.currencyCode);
      }
    }
  }, [walletId, wallets, initialData]);

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

    // Check size limit (max 4MB base64)
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

    setIsSubmitting(true);

    const txPayload: Omit<Transaction, 'id'> = {
      amount: parsedAmount,
      type,
      categoryId: type === 'transfer' ? 'transfer' : type === 'adjustment' ? 'adjustment' : categoryId,
      walletId,
      destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
      destinationCurrency: type === 'transfer' && selectedDestWallet ? selectedDestWallet.currencyCode : undefined,
      destinationAmount: type === 'transfer' && destinationAmount ? parseFloat(destinationAmount) : undefined,
      note: note.trim() || (type === 'transfer' ? `تحويل إلى ${selectedDestWallet?.name || 'محفظة أخرى'}` : ''),
      date,
      time,
      currency: inputCurrency,
      frequency: 'once',
      receipt,
      createdAt: new Date().toISOString(),
      syncStatus: 'PENDING',
    };

    const validation = validateTransactionData(txPayload);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'بيانات المعاملة غير مكتملة');
      setIsSubmitting(false);
      return;
    }

    onSubmit(txPayload);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[100] no-print overflow-hidden"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-slate-900 w-full max-w-md mx-auto rounded-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col min-h-0 border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 shrink-0 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm sm:text-base font-black text-white">
              {initialData ? 'تعديل المعاملة المالية' : 'تسجيل معاملة مالية جديدة'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/5 active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold p-2.5 rounded-xl mb-2 text-right shrink-0">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 min-h-0 pr-0.5 pl-0.5 pb-2">
          {/* Operation Type Grid */}
          <div className="grid grid-cols-4 bg-slate-950 p-1 rounded-2xl border border-white/5 shrink-0 gap-1">
            <button
              type="button"
              onClick={() => { setType('expense'); setErrorMessage(''); }}
              className={`py-2 rounded-xl text-xs font-black transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              مصروف
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setErrorMessage(''); }}
              className={`py-2 rounded-xl text-xs font-black transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              وارد
            </button>
            <button
              type="button"
              onClick={() => { setType('transfer'); setErrorMessage(''); }}
              className={`py-2 rounded-xl text-xs font-black transition-all ${
                type === 'transfer'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              تحويل
            </button>
            <button
              type="button"
              onClick={() => { setType('adjustment'); setErrorMessage(''); }}
              className={`py-2 rounded-xl text-xs font-black transition-all ${
                type === 'adjustment'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              تعديل
            </button>
          </div>

          {/* Amount & Currency Fields */}
          <div className="space-y-1 shrink-0">
            <div className="bg-slate-950/80 border border-white/10 p-3.5 rounded-2xl flex flex-col gap-1.5 focus-within:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">المبلغ والعملة</span>
                <span className="text-[10px] text-amber-400/80 font-semibold">
                  {type === 'transfer' ? 'المبلغ المحوّل من المصدر' : 'قيمة المعاملة'}
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
                  autoFocus
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
          </div>

          {/* Transfer Destination Wallet & Conversion */}
          {type === 'transfer' && (
            <div className="bg-blue-950/30 border border-blue-500/30 p-3.5 rounded-2xl space-y-3">
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
              className="bg-transparent border-none outline-none font-medium text-xs text-slate-200 w-full placeholder:text-slate-600"
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
            <span>{initialData ? 'حفظ تعديلات المعاملة' : 'تأكيد وحفظ المعاملة'}</span>
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
