
import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, ArrowRight, Loader2, Info } from 'lucide-react';
import { Transaction } from '../types';
import { getFinancialForecast } from '../services/geminiService';

interface SimulationProps {
  transactions: Transaction[];
  currencySymbol: string;
  apiKey?: string;
}

const FinancialSimulation: React.FC<SimulationProps> = ({ transactions, currencySymbol, apiKey }) => {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchForecast = async () => {
    if (transactions.length < 5) return;
    setLoading(true);
    const data = await getFinancialForecast(transactions, currencySymbol, apiKey);
    setForecast(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchForecast();
  }, [transactions, currencySymbol, apiKey]);

  if (transactions.length < 5) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-800 text-center space-y-4">
        <Info className="mx-auto text-slate-700" size={32} />
        <p className="text-xs font-bold text-slate-500 leading-relaxed">سجل المزيد من العمليات المالية (5 على الأقل) لنتمكن من قراءة مستقبلك المالي بدقة.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade">
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-950 p-8 rounded-[3rem] border border-purple-500/20 shadow-2xl group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000">
           <Sparkles size={120} />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-slate-950 shadow-lg">
                <Sparkles size={20} />
             </div>
             <div>
                <h3 className="font-black text-white text-base">مرآة المستقبل المالي</h3>
                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Financial Simulation 🔮</p>
             </div>
          </div>

          {loading ? (
             <div className="py-10 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-purple-500" size={32} />
                <p className="text-xs font-bold text-slate-500">ثري يحلل الأنماط المالية ويحاكي المستقبل...</p>
             </div>
          ) : forecast ? (
            <div className="space-y-6">
               <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">الرصيد المتوقع بعد 6 أشهر</p>
                    <h4 className="text-4xl font-black text-white">
                        {forecast.projectedBalance?.toLocaleString()} 
                        <span className="text-lg text-purple-500 ml-2">{currencySymbol}</span>
                    </h4>
                  </div>
                  <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                     <span className="text-[10px] font-black text-emerald-500">+{forecast.savingPotential} توفير ممكن</span>
                  </div>
               </div>

               <div className="p-5 bg-white/5 rounded-2xl border border-white/5 italic">
                  <p className="text-sm font-bold text-slate-300 leading-relaxed">"{forecast.insight}"</p>
               </div>

               <button onClick={fetchForecast} className="w-full py-4 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500/20 transition-all">
                  تحديث المحاكاة <ArrowRight size={14} className="rotate-180" />
               </button>
            </div>
          ) : (
             <div className="text-center py-10">
                <button onClick={fetchForecast} className="bg-purple-500 text-white px-8 py-3 rounded-2xl font-black">ابدأ المحاكاة الآن</button>
             </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-2">
             <TrendingUp className="text-emerald-500" size={24} />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">النمو السنوي</p>
             <p className="text-xl font-black text-white">متصاعد</p>
          </div>
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-2">
             <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-slate-950">!</div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">نقاط الهدر</p>
             <p className="text-xl font-black text-white">منخفضة</p>
          </div>
      </div>
    </div>
  );
};

export default FinancialSimulation;
    