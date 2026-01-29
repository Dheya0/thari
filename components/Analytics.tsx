
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Zap, Award, PieChart as PieIcon, BarChart3, CalendarDays, Download, Share2, FileText } from 'lucide-react';
import { Transaction, Category } from '../types';

interface AnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions, categories, currencySymbol }) => {
  const expenseData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(t => { categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount; });
    return Object.keys(categoryTotals).map(catId => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat?.name || 'أخرى', value: categoryTotals[catId], color: cat?.color || '#cbd5e1' };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!months[key]) months[key] = { income: 0, expense: 0 };
      if (t.type === 'income') months[key].income += t.amount;
      else months[key].expense += t.amount;
    });
    return Object.keys(months).map(key => ({ month: key, income: months[key].income, expense: months[key].expense })).slice(-6);
  }, [transactions]);

  const handleExportCSV = () => {
    const headers = "Date,Type,Amount,Category,Note\n";
    const csvContent = transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'N/A';
      return `${t.date},${t.type},${t.amount},"${cat}","${t.note}"`;
    }).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Thari_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    // تفعيل وضع الطباعة
    window.print();
  };

  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    return { totalIncome, totalExpense, savingsRate, dailyAvg: totalExpense / 30 };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-24 h-24 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center text-slate-800 border border-white/5">
          <BarChart3 size={48} />
        </div>
        <p className="text-slate-500 font-black text-sm uppercase tracking-widest">انتظر اكتمال بياناتك للتحليل</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-28 animate-fade">
      <div className="flex flex-col gap-4 px-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">التحليل المالي</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 py-4 bg-amber-500 text-slate-950 rounded-[1.5rem] text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <FileText size={16} /> تصدير PDF احترافي
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 py-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-[1.5rem] text-[10px] font-black uppercase transition-all active:scale-95"
          >
            <Download size={16} /> ملف Excel (CSV)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-6 rounded-[2.5rem]">
          <div className="flex items-center gap-2 mb-3 text-emerald-500">
            <Award size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">الادخار</span>
          </div>
          <p className="text-3xl font-black text-white">{Math.max(0, Math.round(stats.savingsRate))}%</p>
          <div className="w-full bg-slate-800/50 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, stats.savingsRate))}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-6 rounded-[2.5rem]">
          <div className="flex items-center gap-2 mb-3 text-amber-500">
            <Zap size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">المعدل اليومي</span>
          </div>
          <p className="text-2xl font-black text-white">{Math.round(stats.dailyAvg).toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 font-bold mt-1 block uppercase">{currencySymbol} / يوم</span>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem]">
        <h3 className="text-lg font-black text-white flex items-center gap-3 mb-8">
          <PieIcon size={20} className="text-amber-500" /> توزيع المصروفات
        </h3>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={expenseData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#0f172a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                itemStyle={{ color: '#fff', fontWeight: '900', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">الإجمالي</span>
            <span className="text-xl font-black text-white">{stats.totalExpense.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
