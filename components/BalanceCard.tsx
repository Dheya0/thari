import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Sparkles, TrendingUp, Plane } from 'lucide-react';

interface BalanceCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  symbol: string;
  balances?: Record<string, number>;
  expenseBreakdown?: Record<string, number>; // Breakdown of expenses per currency
  isTravelMode?: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ totalBalance, totalIncome, totalExpense, symbol, balances, expenseBreakdown, isTravelMode }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden group perspective-1000 w-full"
    >
      {/* Sleek Dark Card Design - Clean without heavy blurs */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-xl border border-white/10 overflow-hidden transition-all duration-300 w-full">
        
        <div className="flex justify-between items-start mb-5 relative z-10 gap-2">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full shrink-0 ${isTravelMode ? 'bg-purple-500' : 'bg-amber-500'} animate-pulse`}></div>
               <p className={`text-[11px] font-bold ${isTravelMode ? 'text-purple-400' : 'text-amber-500'} uppercase tracking-wider truncate`}>
                 {isTravelMode ? 'وضع السفر (عملات منفصلة)' : 'الرصيد التقديري'}
               </p>
            </div>
            {!isTravelMode && (
                <div className="flex items-baseline gap-1.5 overflow-hidden">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight truncate">
                        {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </h2>
                    <span className="text-sm sm:text-lg text-slate-400 font-bold shrink-0">{symbol}</span>
                </div>
            )}
            {isTravelMode && (
                <div className="flex items-center gap-2 mt-1">
                    <Plane size={22} className="text-purple-500 shrink-0" />
                    <span className="text-xl sm:text-2xl font-black text-white truncate">ملخص الرحلة</span>
                </div>
            )}
          </div>
          <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center ${isTravelMode ? 'text-purple-400' : 'text-amber-500'} shadow-lg`}>
            {isTravelMode ? <Plane className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
          </div>
        </div>
        
        {/* Travel Mode: Detailed Breakdown */}
        {isTravelMode && balances && Object.keys(balances).length > 0 && (
            <div className="mb-6 relative z-10 animate-fade-in">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 mb-4">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-2">الأرصدة المتاحة</p>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {Object.entries(balances).map(([code, amount]) => {
                                    const val = amount as number;
                                    // Show all balances in Travel Mode, even zero
                                    return (
                                    <div key={code} className={`shrink-0 px-4 py-3 rounded-xl border flex flex-col items-start min-w-[100px] ${val < 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                        <span className="text-[10px] font-black text-slate-400 mb-1">{code}</span>
                                        <span className={`text-lg font-black ${val < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                        </span>
                                    </div>
                                )})}
                            </div>
                        </div>

                        {expenseBreakdown && Object.keys(expenseBreakdown).length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-slate-400 mb-2">إجمالي المصروفات (حسب العملة)</p>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {Object.entries(expenseBreakdown).map(([code, amount]) => {
                                        const val = amount as number;
                                        if (Math.abs(val) < 0.01) return null;
                                        return (
                                        <div key={code} className="shrink-0 px-4 py-3 rounded-xl border border-rose-500/10 bg-rose-500/5 flex flex-col items-start min-w-[100px]">
                                            <span className="text-[10px] font-black text-slate-400 mb-1">{code}</span>
                                            <span className="text-lg font-black text-rose-400">
                                                -{val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                            </span>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Normal Mode: Breakdown Scroll */}
        {!isTravelMode && balances && Object.keys(balances).length > 0 && (
            <div className="mb-6 relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2 px-1">الأرصدة الفعلية (جيوب المحفظة)</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {Object.entries(balances).map(([code, amount]) => {
                        const val = amount as number;
                        return (
                        <div key={code} className={`shrink-0 px-3.5 py-2.5 rounded-xl border flex flex-col items-start min-w-[85px] ${val < 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-900/50 border-white/10'}`}>
                            <span className="text-[10px] font-bold text-slate-400">{code}</span>
                            <span className={`text-sm font-black ${val < 0 ? 'text-rose-400' : 'text-white'}`}>
                                {val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </span>
                        </div>
                    )})}
                </div>
            </div>
        )}
        
        {!isTravelMode && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
          <div className="bg-white/5 p-3.5 sm:p-4 rounded-2xl border border-white/5 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">التدفقات</span>
            <p className="text-base sm:text-lg font-black text-white">
              {totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] font-bold text-slate-400">{symbol}</span>
            </p>
          </div>
          
          <div className="bg-white/5 p-3.5 sm:p-4 rounded-2xl border border-white/5 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">الالتزامات</span>
            <p className="text-base sm:text-lg font-black text-white">
              {totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] font-bold text-slate-400">{symbol}</span>
            </p>
          </div>
        </div>
        )}
      </div>
    </motion.div>
  );
};

export default BalanceCard;
