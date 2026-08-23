import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Coins, Check, ArrowRightLeft, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { Currency, Wallet } from '../types';
import { convertCurrency, DEFAULT_EXCHANGE_RATES } from '../constants';
import { formatFinancialNumber } from './ElegantDashboard';

interface CurrencyLandscapeProps {
  currencies: Currency[];
  selectedCurrency: Currency;
  onSelectCurrency: (currency: Currency) => void;
  currencyBalances?: Record<string, number>;
  wallets?: Wallet[];
  exchangeRates?: Record<string, number>;
  baseCurrencyCode?: string;
}

// Color palette map for currency exposure segments
const CURRENCY_ACCENT_COLORS: Record<string, { bar: string; text: string; bg: string; border: string }> = {
  SAR: { bar: '#D9B978', text: '#E5C17B', bg: 'rgba(217, 185, 120, 0.16)', border: 'rgba(217, 185, 120, 0.35)' },
  USD: { bar: '#60A5FA', text: '#93C5FD', bg: 'rgba(96, 165, 250, 0.16)', border: 'rgba(96, 165, 250, 0.35)' },
  YER_ADEN: { bar: '#10B981', text: '#34D399', bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(16, 185, 129, 0.35)' },
  YER_SANAA: { bar: '#F43F5E', text: '#FB7185', bg: 'rgba(244, 63, 94, 0.16)', border: 'rgba(244, 63, 94, 0.35)' },
  EUR: { bar: '#A855F7', text: '#C084FC', bg: 'rgba(168, 85, 247, 0.16)', border: 'rgba(168, 85, 247, 0.35)' },
  AED: { bar: '#F59E0B', text: '#FBBF24', bg: 'rgba(245, 158, 11, 0.16)', border: 'rgba(245, 158, 11, 0.35)' },
  KWD: { bar: '#2DD4BF', text: '#5EEAD4', bg: 'rgba(45, 212, 191, 0.16)', border: 'rgba(45, 212, 191, 0.35)' },
  OMR: { bar: '#38BDF8', text: '#7DD3FC', bg: 'rgba(56, 189, 248, 0.16)', border: 'rgba(56, 189, 248, 0.35)' },
  QAR: { bar: '#E11D48', text: '#FDA4AF', bg: 'rgba(225, 29, 72, 0.16)', border: 'rgba(225, 29, 72, 0.35)' },
  BHD: { bar: '#EC4899', text: '#F472B6', bg: 'rgba(236, 72, 153, 0.16)', border: 'rgba(236, 72, 153, 0.35)' },
  EGP: { bar: '#EAB308', text: '#FDE047', bg: 'rgba(234, 179, 8, 0.16)', border: 'rgba(234, 179, 8, 0.35)' },
  GBP: { bar: '#3B82F6', text: '#93C5FD', bg: 'rgba(59, 130, 246, 0.16)', border: 'rgba(59, 130, 246, 0.35)' },
};

export const CurrencyLandscape: React.FC<CurrencyLandscapeProps> = ({
  currencies,
  selectedCurrency,
  onSelectCurrency,
  currencyBalances = {},
  wallets = [],
  exchangeRates = DEFAULT_EXCHANGE_RATES,
  baseCurrencyCode = 'SAR'
}) => {
  // Calculate total wealth equivalent in base currency across all held currencies
  const exposureAnalysis = useMemo(() => {
    let totalInBase = 0;
    const items: {
      currency: Currency;
      nativeAmount: number;
      amountInBase: number;
      percentage: number;
      walletCount: number;
      color: { bar: string; text: string; bg: string; border: string };
      exchangeRateToSelected: number;
      ratePerOneSelected: number;
    }[] = [];

    // Tally amounts for currencies with active balances or wallets
    currencies.forEach(curr => {
      const nativeAmount = currencyBalances[curr.code] || 0;
      const amountInBase = convertCurrency(nativeAmount, curr.code, baseCurrencyCode, exchangeRates);
      const walletCount = wallets.filter(w => w.currencyCode === curr.code).length;

      if (nativeAmount !== 0 || walletCount > 0 || curr.code === selectedCurrency.code) {
        if (amountInBase > 0) {
          totalInBase += amountInBase;
        }

        const color = CURRENCY_ACCENT_COLORS[curr.code] || {
          bar: '#94A3B8',
          text: '#CBD5E1',
          bg: 'rgba(148, 163, 184, 0.16)',
          border: 'rgba(148, 163, 184, 0.3)'
        };

        const rateToSel = convertCurrency(1, curr.code, selectedCurrency.code, exchangeRates);
        const ratePerOne = convertCurrency(1, selectedCurrency.code, curr.code, exchangeRates);

        items.push({
          currency: curr,
          nativeAmount,
          amountInBase,
          percentage: 0,
          walletCount,
          color,
          exchangeRateToSelected: rateToSel,
          ratePerOneSelected: ratePerOne
        });
      }
    });

    // Compute percentage of portfolio
    const finalItems = items.map(item => ({
      ...item,
      percentage: totalInBase > 0 && item.amountInBase > 0 
        ? Math.round((item.amountInBase / (totalInBase <= 0 ? 1 : totalInBase)) * 100)
        : (item.currency.code === selectedCurrency.code ? 100 : 0)
    }));

    // Sort by largest balance first
    finalItems.sort((a, b) => b.amountInBase - a.amountInBase);

    return { totalInBase, items: finalItems };
  }, [currencies, currencyBalances, wallets, exchangeRates, baseCurrencyCode, selectedCurrency.code]);

  return (
    <div className="w-full bg-[#0D1219] rounded-2xl md:rounded-3xl p-4 sm:p-6 border border-white/[0.08] shadow-xl space-y-5 text-right font-sans" dir="rtl">
      {/* Header with Title and Current Base Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D9B978]/15 text-[#D9B978] flex items-center justify-center border border-[#D9B978]/30 shadow-inner">
            <Coins size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>المنظور الحي لتوزيع العملات</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                محرك الصرف المحلي نشط
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              التعرض المالي، الأرصدة المستقلة، والتحويل اللحظي بأسعار الصرف المحفوظة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-semibold text-slate-200">
            <span className="text-slate-400">عملة العرض الحالية:</span>
            <span className="text-[#D9B978] font-bold font-numeric">{selectedCurrency.symbol} ({selectedCurrency.code})</span>
          </div>
        </div>
      </div>

      {/* Proportional Exposure Visual Spectrum Bar */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-[#161F2B] border border-white/[0.08] rounded-full overflow-hidden flex p-0.5 gap-0.5">
          {exposureAnalysis.items.filter(i => i.amountInBase > 0).map(item => (
            <motion.div
              key={item.currency.code}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(item.percentage, 4)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-sm transition-all"
              style={{ backgroundColor: item.color.bar }}
              title={`${item.currency.name}: ${item.percentage}%`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300 font-medium px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9B978]" />
            <span>توزيع الأصول النقدية</span>
          </span>
          <span className="font-numeric text-slate-300">
            {exposureAnalysis.items.filter(i => i.nativeAmount !== 0).length} عملات ذات أرصدة نشطة
          </span>
        </div>
      </div>

      {/* Living Interactive Currency Grid / Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {exposureAnalysis.items.map(item => {
          const isSelected = item.currency.code === selectedCurrency.code;
          const hasBalance = item.nativeAmount !== 0;

          return (
            <motion.button
              key={item.currency.code}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCurrency(item.currency)}
              className={`p-4 rounded-2xl border text-right transition-all duration-200 flex flex-col justify-between relative overflow-hidden group shadow-md ${
                isSelected
                  ? 'bg-gradient-to-br from-[#231A10] via-[#161D27] to-[#10151E] border-[#D9B978] ring-1 ring-[#D9B978]/40 shadow-lg shadow-black/40'
                  : 'bg-[#141B24] hover:bg-[#1A232E] border-white/10 hover:border-white/20'
              }`}
            >
              {/* Top Row: Currency Symbol & Name & Select Indicator */}
              <div className="flex items-center justify-between w-full mb-2.5">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color.bar }}
                  />
                  <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#E5C17B]' : 'text-white'}`}>
                    {item.currency.name}
                  </span>
                </div>

                {isSelected ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#D9B978] text-slate-950 text-[10px] font-black flex items-center gap-1 shrink-0">
                    <Check size={11} strokeWidth={3} />
                    <span>الأساسية</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-300 font-numeric px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/10 shrink-0">
                    {item.currency.code}
                  </span>
                )}
              </div>

              {/* Native Balance Display */}
              <div className="space-y-1 my-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className={`text-base sm:text-lg font-bold font-numeric tracking-tight ${
                    item.nativeAmount < 0 ? 'text-rose-400' : 'text-white'
                  }`}>
                    {formatFinancialNumber(item.nativeAmount)}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    {item.currency.symbol}
                  </span>
                </div>

                {/* Sub-label: Converted equivalent in selected display currency */}
                {!isSelected && hasBalance && (
                  <div className="text-[11px] text-slate-300 font-numeric flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg border border-white/[0.04]">
                    <span className="text-slate-400">يعادل:</span>
                    <span className="font-semibold text-[#E5C17B]">
                      {formatFinancialNumber(convertCurrency(item.nativeAmount, item.currency.code, selectedCurrency.code, exchangeRates))} {selectedCurrency.symbol}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Row: Wallet Count & Live Rate */}
              <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-white/[0.06] text-[11px] text-slate-300">
                <span className="font-medium">
                  {item.walletCount > 0 ? `${item.walletCount} محافظ` : 'بدون محفظة'}
                </span>
                
                {item.percentage > 0 ? (
                  <span className="font-numeric font-bold" style={{ color: item.color.text }}>
                    {item.percentage}% من الثروة
                  </span>
                ) : (
                  <span className="font-numeric text-[10px] text-slate-400">
                    1 {item.currency.code} = {Math.round(item.exchangeRateToSelected * 100) / 100} {selectedCurrency.code}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CurrencyLandscape;
