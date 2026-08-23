import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Search, X, SlidersHorizontal, ArrowRightLeft, Coins, Globe } from 'lucide-react';
import { Currency } from '../types';
import { convertCurrency } from '../constants';

interface CurrencySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Currency[];
  selectedCurrency: Currency;
  onSelectCurrency: (currency: Currency) => void;
  exchangeRates: Record<string, number>;
  onOpenSettings?: () => void;
}

export const CurrencySelectorModal: React.FC<CurrencySelectorModalProps> = ({
  isOpen,
  onClose,
  currencies,
  selectedCurrency,
  onSelectCurrency,
  exchangeRates,
  onOpenSettings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter currencies
  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) return currencies;
    const q = searchQuery.toLowerCase().trim();
    return currencies.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [currencies, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-16 sm:pt-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[#0F141C] border border-[#D9B978]/30 rounded-2xl md:rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-10 flex flex-col max-h-[85vh] text-right font-sans"
          dir="rtl"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#141B24]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D9B978]/15 border border-[#D9B978]/30 flex items-center justify-center text-[#D9B978] shadow-inner">
                <Coins size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  تحديد العملة الأساسية للعرض
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  اختر العملة المعتمدة لاحتساب وتقييم المعاملات والأصول
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="إغلاق"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Input (Shown when more than 3 currencies) */}
          {currencies.length > 3 && (
            <div className="p-3 sm:px-5 sm:pt-4 sm:pb-2 bg-[#0F141C]">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم، الرمز، أو الكود (مثل: SAR, دولار, ر.ي)..."
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-[#18202B] border border-white/10 focus:border-[#D9B978] text-white text-xs placeholder:text-slate-500 outline-none transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Currencies List */}
          <div className="p-3 sm:p-5 overflow-y-auto space-y-2 max-h-[50vh] divide-y divide-white/[0.04]">
            {filteredCurrencies.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                لا توجد عملة مطابقة لبحثك
              </div>
            ) : (
              filteredCurrencies.map((curr) => {
                const isSelected = curr.code === selectedCurrency.code;
                const rateToSel = convertCurrency(1, curr.code, selectedCurrency.code, exchangeRates);
                const rateFromBase = convertCurrency(1, 'SAR', curr.code, exchangeRates);

                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => {
                      onSelectCurrency(curr);
                      onClose();
                    }}
                    className={`w-full p-3.5 rounded-xl border text-right transition-all flex items-center justify-between gap-3 group active:scale-[0.98] ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#2A2012] via-[#1A222D] to-[#141B24] border-[#D9B978] shadow-md ring-1 ring-[#D9B978]/40'
                        : 'bg-[#141B24] hover:bg-[#1C2633] border-white/5 hover:border-white/15 text-slate-200'
                    }`}
                  >
                    {/* Currency details */}
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                          isSelected
                            ? 'bg-[#D9B978] text-slate-950 border-[#D9B978] shadow-sm'
                            : 'bg-white/5 text-[#E5C17B] border-white/10 group-hover:border-[#D9B978]/40'
                        }`}
                      >
                        {curr.symbol}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold truncate ${
                              isSelected ? 'text-[#E5C17B]' : 'text-white'
                            }`}
                          >
                            {curr.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            {curr.code}
                          </span>
                        </div>

                        {!isSelected && (
                          <div className="text-[11px] text-slate-400 font-numeric mt-0.5">
                            1 {curr.code} ≈ {Math.round(rateToSel * 1000) / 1000} {selectedCurrency.symbol}
                          </div>
                        )}
                        {isSelected && (
                          <div className="text-[11px] text-[#D9B978] font-medium mt-0.5">
                            العملة الأساسية النشطة لكافة شاشات التطبيق
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Checkmark Badge */}
                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#D9B978] text-slate-950 flex items-center justify-center shadow-md">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-white/10 group-hover:border-[#D9B978]/40 flex items-center justify-center text-transparent group-hover:text-slate-400 transition-colors">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with Exchange Rates & Settings shortcut */}
          <div className="p-3 sm:p-4 bg-[#141B24] border-t border-white/[0.08] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Globe size={13} className="text-[#D9B978]" />
              <span>إجمالي {currencies.length} عملات مسجلة</span>
            </div>

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#D9B978]/15 border border-white/10 hover:border-[#D9B978]/40 text-slate-300 hover:text-[#E5C17B] transition-all text-[11px] font-medium"
              >
                <SlidersHorizontal size={13} />
                <span>إدارة أسعار الصرف</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CurrencySelectorModal;
