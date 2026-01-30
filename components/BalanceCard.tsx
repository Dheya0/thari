
import React from 'react';
import { Wallet, Sparkles, TrendingUp } from 'lucide-react';

interface BalanceCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  symbol: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ totalBalance, totalIncome, totalExpense, symbol }) => {
  return (
    <div className="relative overflow-hidden group perspective-1000">
      {/* Glossy Metal Card Design */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-950 rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden transition-all duration-700 hover:scale-[1.02] hover:-rotate-1 active:scale-95 group">
        
        {/* Shimmer Effect */}
        <div className="shimmer absolute inset-0 pointer-events-none opacity-20"></div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full -ml-12 -mb-12"></div>

        <div className="flex justify-between items-start mb-10 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
               <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.3em]">رصيدك النخبوي</p>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter flex items-baseline gap-2">
              {totalBalance.toLocaleString()} 
              <span className="text-xl text-slate-500 font-bold">{symbol}</span>
            </h2>
          </div>
          <div className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-2xl transition-transform group-hover:rotate-12">
            <Wallet size={28} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-[2.2rem] border border-white/5 flex flex-col gap-1 transition-all hover:bg-white/10">
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">التدفقات</span>
            <p className="text-xl font-black text-white">
              {totalIncome.toLocaleString()} <span className="text-[10px] opacity-40">{symbol}</span>
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-[2.2rem] border border-white/5 flex flex-col gap-1 transition-all hover:bg-white/10">
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">الالتزامات</span>
            <p className="text-xl font-black text-white">
              {totalExpense.toLocaleString()} <span className="text-[10px] opacity-40">{symbol}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
