
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
      <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/5 to-amber-300/5 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
      
      <div className="relative bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-800 transition-all duration-500 hover:-translate-y-1">
        <div className="flex justify-between items-start mb-10">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={12} className="text-amber-500" /> إجمالي الثروة الحالية
            </p>
            <h2 className="text-4xl font-black text-white tracking-tight">
              {totalBalance.toLocaleString()} <span className="text-xl text-slate-700 font-bold ml-1">{symbol}</span>
            </h2>
          </div>
          <div className="w-16 h-16 bg-amber-500 rounded-[2rem] flex items-center justify-center text-slate-950 shadow-2xl active:scale-95 transition-transform group">
            <Wallet size={28} className="group-hover:rotate-12 transition-transform" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/5 p-5 rounded-[2.2rem] border border-emerald-500/10 group/income transition-colors hover:bg-emerald-500/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-800 rounded-2xl text-emerald-500 shadow-sm transition-transform group-hover/income:scale-110">
                <ArrowUpRight size={14} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">وارد</span>
            </div>
            <p className="text-lg font-black text-white">
              {totalIncome.toLocaleString()} <span className="text-[10px] opacity-30">{symbol}</span>
            </p>
          </div>
          
          <div className="bg-rose-500/5 p-5 rounded-[2.2rem] border border-rose-500/10 group/expense transition-colors hover:bg-rose-500/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-800 rounded-2xl text-rose-500 shadow-sm transition-transform group-hover/expense:scale-110">
                <ArrowDownLeft size={14} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">صادر</span>
            </div>
            <p className="text-lg font-black text-white">
              {totalExpense.toLocaleString()} <span className="text-[10px] opacity-30">{symbol}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
