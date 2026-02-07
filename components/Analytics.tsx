
import React, { useMemo } from 'react';
import { Download, Printer, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, Category } from '../types';
import { convertCurrency } from '../constants';

interface AnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  onPrint: (type: 'summary' | 'detailed') => void;
  currentCurrencyCode?: string; // Add current currency code to convert stats
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions, categories, currencySymbol, onPrint, currentCurrencyCode = 'SAR' }) => {
  const stats = useMemo(() => {
    // Convert all amounts to the current selected currency
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currentCurrencyCode), 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currentCurrencyCode), 0);
        
    return { totalIncome, totalExpense };
  }, [transactions, currentCurrencyCode]);

  // Month-over-Month Analysis
  const momStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const getMonthlyTotal = (month: number, year: number, type: 'income' | 'expense') => {
        return transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === month && d.getFullYear() === year && t.type === type;
        }).reduce((s, t) => s + convertCurrency(t.amount, t.currency, currentCurrencyCode), 0);
    };

    const curInc = getMonthlyTotal(currentMonth, currentYear, 'income');
    const curExp = getMonthlyTotal(currentMonth, currentYear, 'expense');
    const prevInc = getMonthlyTotal(prevMonth, prevYear, 'income');
    const prevExp = getMonthlyTotal(prevMonth, prevYear, 'expense');

    const calcChange = (cur: number, prev: number) => prev === 0 ? 0 : ((cur - prev) / prev) * 100;

    return {
        incomeChange: calcChange(curInc, prevInc),
        expenseChange: calcChange(curExp, prevExp),
        curInc, curExp
    };
  }, [transactions, currentCurrencyCode]);

  const expenseData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};
    
    expenses.forEach(t => { 
        // Convert amount before adding to total
        const convertedAmount = convertCurrency(t.amount, t.currency, currentCurrencyCode);
        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + convertedAmount; 
    });

    return Object.keys(categoryTotals).map(catId => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat?.name || 'أخرى', value: Math.round(categoryTotals[catId]), color: cat?.color || '#cbd5e1' };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories, currentCurrencyCode]);

  const handleExportCSV = () => {
    const headers = "Date,Type,Amount,Currency,ConvertedAmount,Category,Wallet,Note\n";
    const csvContent = transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'N/A';
      const typeLabel = t.type === 'income' ? 'Income' : 'Expense';
      const converted = convertCurrency(t.amount, t.currency, currentCurrencyCode).toFixed(2);
      return `${t.date},${typeLabel},${t.amount},${t.currency},${converted},"${cat}","${t.walletId}","${t.note.replace(/"/g, '""')}"`;
    }).join("\n");

    const blob = new Blob(["\ufeff" + headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Thari_Data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (transactions.length === 0) return null;

  return (
    <div className="space-y-8 pb-10 animate-fade">
      
      {/* Month Over Month Comparison */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-slate-900/60 p-5 rounded-[2.5rem] border border-slate-800 backdrop-blur-md">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">مقارنة الدخل الشهري</p>
            <div className="flex items-end justify-between">
                <span className="text-xl font-black text-white">{momStats.curInc.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg ${momStats.incomeChange >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {momStats.incomeChange > 0 ? <TrendingUp size={12} className="mr-1" /> : momStats.incomeChange < 0 ? <TrendingDown size={12} className="mr-1" /> : <Minus size={12} className="mr-1" />}
                    {Math.abs(momStats.incomeChange).toFixed(1)}%
                </div>
            </div>
         </div>
         <div className="bg-slate-900/60 p-5 rounded-[2.5rem] border border-slate-800 backdrop-blur-md">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">مقارنة المصاريف</p>
            <div className="flex items-end justify-between">
                <span className="text-xl font-black text-white">{momStats.curExp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg ${momStats.expenseChange <= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {momStats.expenseChange > 0 ? <TrendingUp size={12} className="mr-1" /> : momStats.expenseChange < 0 ? <TrendingDown size={12} className="mr-1" /> : <Minus size={12} className="mr-1" />}
                    {Math.abs(momStats.expenseChange).toFixed(1)}%
                </div>
            </div>
            <p className="text-[8px] text-slate-600 mt-2 font-bold">
                {momStats.expenseChange > 0 ? 'زادت مصاريفك عن الشهر الماضي' : 'أداء ممتاز! مصاريفك أقل'}
            </p>
         </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => onPrint('summary')}
            className="flex items-center justify-center gap-2 py-4 bg-amber-500 text-slate-950 rounded-[1.5rem] text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Printer size={16} /> طباعة ملخص
          </button>
          <button 
            onClick={() => onPrint('detailed')}
            className="flex items-center justify-center gap-2 py-4 bg-slate-800 text-white rounded-[1.5rem] text-[10px] font-black uppercase transition-all active:scale-95"
          >
            <FileText size={16} /> تقرير تفصيلي
          </button>
        </div>
         <button 
            onClick={handleExportCSV}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 border border-slate-800 text-slate-500 rounded-[1.5rem] text-[10px] font-black uppercase transition-all active:scale-95"
          >
            <Download size={16} /> تصدير Excel (CSV)
          </button>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem]">
        <h3 className="text-lg font-black text-white flex items-center gap-3 mb-8">
           توزيع المصروفات (مقيمة بـ {currentCurrencyCode})
        </h3>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={expenseData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">المصروفات</span>
            <span className="text-xl font-black text-white">{Math.round(stats.totalExpense).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
