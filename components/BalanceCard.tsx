
import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, Sparkles } from 'lucide-react';

interface BalanceCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  symbol: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ totalBalance, totalIncome, totalExpense, symbol }) => {
  return (
    <div className="relative overflow-hidden group">
      <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/5 to-transparent rounded-[3rem] blur-3xl opacity-30 pointer-events-none"></div>
      
      <div className="relative bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-7 sm:p-8 shadow-2xl border border-white/5 transition-all duration-500 hover:bg-slate-900/50">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1.5">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
              <Sparkles size={11} className="text-amber-500" /> الثروة الحالية
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
              {totalBalance.toLocaleString()} 
              <span className="text-lg text-slate-600 font-bold">{symbol}</span>
            </h2>
          </div>
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-xl active:scale-90 transition-transform group">
            <Wallet size={24} className="group-hover:rotate-6 transition-transform" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-emerald-500/5 p-4 sm:p-5 rounded-[2.2rem] border border-emerald-500/10 group/income transition-all hover:bg-emerald-500/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-slate-950 rounded-xl text-emerald-500 border border-white/5">
                <ArrowUpRight size={12} strokeWidth={3} />
              </div>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">وارد</span>
            </div>
            <p className="text-base sm:text-lg font-black text-white truncate">
              {totalIncome.toLocaleString()} <span className="text-[9px] opacity-30">{symbol}</span>
            </p>
          </div>
          
          <div className="bg-rose-500/5 p-4 sm:p-5 rounded-[2.2rem] border border-rose-500/10 group/expense transition-all hover:bg-rose-500/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-slate-950 rounded-xl text-rose-500 border border-white/5">
                <ArrowDownLeft size={12} strokeWidth={3} />
              </div>
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">صادر</span>
            </div>
            <p className="text-base sm:text-lg font-black text-white truncate">
              {totalExpense.toLocaleString()} <span className="text-[9px] opacity-30">{symbol}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
