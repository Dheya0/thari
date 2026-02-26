import React from 'react';
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
    <div className="relative overflow-hidden group perspective-1000">
      {/* Glossy Metal Card Design */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-950 rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden transition-all duration-700 hover:scale-[1.02] hover:-rotate-1 active:scale-95 group">
        
        {/* Shimmer Effect */}
        <div className="shimmer absolute inset-0 pointer-events-none opacity-20"></div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full -ml-12 -mb-12"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isTravelMode ? 'bg-purple-500' : 'bg-amber-500'} animate-pulse`}></div>
               <p className={`text-[10px] font-black ${isTravelMode ? 'text-purple-500/80' : 'text-amber-500/80'} uppercase tracking-[0.3em]`}>
                 {isTravelMode ? 'وضع السفر (عملات منفصلة)' : 'الرصيد التقديري'}
               </p>
            </div>
            {!isTravelMode && (
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter flex items-baseline gap-2">
                {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
                <span className="text-xl text-slate-500 font-bold">{symbol}</span>
                </h2>
            )}
            {isTravelMode && (
                <div className="flex items-center gap-2 mt-1">
                    <Plane size={24} className="text-purple-500" />
                    <span className="text-2xl font-black text-white">ملخص الرحلة</span>
                </div>
            )}
          </div>
          <div className={`w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center ${isTravelMode ? 'text-purple-500' : 'text-amber-500'} shadow-2xl transition-transform group-hover:rotate-12`}>
            {isTravelMode ? <Plane size={28} /> : <Wallet size={28} />}
          </div>
        </div>
        
        {/* Travel Mode: Detailed Breakdown */}
        {isTravelMode && balances && Object.keys(balances).length > 0 && (
            <div className="mb-6 relative z-10 animate-fade-in">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 mb-4">
                    <div className="space-y-4">
                        <div>
                            <p className="text-[9px] font-bold text-slate-500 mb-2">الأرصدة المتاحة</p>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {Object.entries(balances).map(([code, amount]) => {
                                    const val = amount as number;
                                    // if (val === 0) return null; // Show even zero if it exists in map? No, hide zero.
                                    if (Math.abs(val) < 0.01) return null;
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
                                <p className="text-[9px] font-bold text-slate-500 mb-2">إجمالي المصروفات (حسب العملة)</p>
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
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">الأرصدة الفعلية (جيوب المحفظة)</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {Object.entries(balances).map(([code, amount]) => {
                        const val = amount as number;
                        return (
                        <div key={code} className={`shrink-0 px-3 py-2 rounded-xl border flex flex-col items-start min-w-[80px] ${val < 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-900/50 border-white/10'}`}>
                            <span className="text-[9px] font-black text-slate-400">{code}</span>
                            <span className={`text-sm font-black ${val < 0 ? 'text-rose-400' : 'text-white'}`}>
                                {val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </span>
                        </div>
                    )})}
                </div>
            </div>
        )}
        
        {!isTravelMode && (
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-[2.2rem] border border-white/5 flex flex-col gap-1 transition-all hover:bg-white/10">
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">التدفقات</span>
            <p className="text-xl font-black text-white">
              {totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] opacity-40">{symbol}</span>
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-[2.2rem] border border-white/5 flex flex-col gap-1 transition-all hover:bg-white/10">
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">الالتزامات</span>
            <p className="text-xl font-black text-white">
              {totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] opacity-40">{symbol}</span>
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default BalanceCard;
