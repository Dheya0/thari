
import React, { useMemo } from 'react';
import { ShieldCheck, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { Transaction, Budget, Debt } from '../types';

interface WealthScoreProps {
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  currencySymbol: string;
}

const WealthScore: React.FC<WealthScoreProps> = ({ transactions, budgets, debts, currencySymbol }) => {
  const scoreData = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    // 1. Savings Rate (40 points)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const savingsScore = Math.min(40, Math.max(0, (savingsRate / 30) * 40));

    // 2. Budget Adherence (30 points)
    let budgetScore = 30;
    budgets.forEach(b => {
      const spent = transactions
        .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      if (spent > b.amount) budgetScore -= 5;
    });
    budgetScore = Math.max(0, budgetScore);

    // 3. Debt Ratio (30 points)
    const totalDebt = debts.filter(d => !d.isPaid && d.type === 'on_me').reduce((s, d) => s + d.amount, 0);
    const debtScore = totalIncome > 0 ? Math.max(0, 30 - (totalDebt / totalIncome) * 30) : 15;

    const finalScore = Math.round(savingsScore + budgetScore + debtScore);
    
    let label = "مبتدئ";
    let color = "#ef4444";
    if (finalScore > 80) { label = "ثري حكيم"; color = "#10b981"; }
    else if (finalScore > 60) { label = "متوازن"; color = "#f59e0b"; }
    else if (finalScore > 40) { label = "مكافح"; color = "#f97316"; }

    return { score: finalScore, label, color };
  }, [transactions, budgets, debts]);

  return (
    <div className="relative group p-[2px] rounded-[3rem] bg-gradient-to-br from-amber-500/20 to-transparent overflow-hidden">
      <div className="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 transition-all duration-500 hover:bg-slate-900/60">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">مؤشر الوفرة</h3>
              <p className="text-xl font-black text-white">{scoreData.label}</p>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
             <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
                <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * scoreData.score) / 100}
                        style={{ color: scoreData.color, transition: 'stroke-dashoffset 1.5s ease-out' }} />
             </svg>
             <span className="absolute text-xl font-black text-white">{scoreData.score}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 group/tip transition-all hover:bg-white/10">
            {scoreData.score > 70 ? <ShieldCheck className="text-emerald-500" size={18} /> : <AlertCircle className="text-amber-500" size={18} />}
            <p className="text-[10px] font-bold text-slate-300 leading-relaxed">
              {scoreData.score > 70 
                ? "أداء مالي مذهل! استمر في تنويع استثماراتك." 
                : "حاول تقليل المصاريف غير الضرورية لرفع معدل ادخارك."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WealthScore;
