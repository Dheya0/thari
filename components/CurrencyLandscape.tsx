import React from 'react';
import { motion } from 'motion/react';
import { Currency } from '../types';

interface CurrencyLandscapeProps {
  currencies: Currency[];
  selectedCurrency: Currency;
  onSelectCurrency: (currency: Currency) => void;
  currencyBalances?: Record<string, number>;
}

export const CurrencyLandscape: React.FC<CurrencyLandscapeProps> = ({
  currencies,
  selectedCurrency,
  onSelectCurrency,
  currencyBalances = {}
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          منظور العملات
        </span>
        <span className="text-[10px] text-slate-400 font-numeric">
          {currencies.length} عملات مسجلة
        </span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5">
        {currencies.map(curr => {
          const isSelected = curr.code === selectedCurrency.code;
          const balance = currencyBalances[curr.code];
          const hasBalance = typeof balance === 'number' && !isNaN(balance);

          return (
            <motion.button
              key={curr.code}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectCurrency(curr)}
              className={`flex flex-col items-start px-3.5 py-2.5 rounded-2xl transition-all duration-200 shrink-0 min-w-[110px] sm:min-w-[125px] text-right border ${
                isSelected
                  ? 'bg-gradient-to-b from-[#D9B978]/15 to-[#D9B978]/5 border-[#D9B978]/40 shadow-sm'
                  : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between w-full gap-2 mb-1">
                <span className={`text-xs font-semibold ${isSelected ? 'text-[#D9B978]' : 'text-slate-300'}`}>
                  {curr.name}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-numeric ${
                  isSelected 
                    ? 'bg-[#D9B978]/20 text-[#D9B978] font-bold' 
                    : 'bg-white/[0.05] text-slate-400'
                }`}>
                  {curr.code}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-sm font-semibold font-numeric tracking-tight ${
                  isSelected ? 'text-white' : 'text-slate-300'
                }`}>
                  {hasBalance ? Math.round(balance).toLocaleString('en-US') : curr.symbol}
                </span>
                {hasBalance && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    {curr.symbol}
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
