
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Zap, Award, PieChart as PieIcon, BarChart3, CalendarDays } from 'lucide-react';
import { Transaction, Category } from '../types';

interface AnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions, categories, currencySymbol }) => {
  const isDark = document.documentElement.classList.contains('dark');

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

  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    return { totalIncome, totalExpense, savingsRate, dailyAvg: totalExpense / 30 };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-200 dark:text-slate-800 border border-slate-100 dark:border-slate-800">
          <BarChart3 size={48} />
        </div>
        <p className="text-slate-400 dark:text-slate-600 font-black text-sm uppercase tracking-widest">انتظر اكتمال بياناتك للتحليل</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-28 animate-fade">
      <div className="grid grid-cols-2 gap-4">
        <div className="premium-card p-6 rounded-[2.5rem]">
          <div className="flex items-center gap-2 mb-3 text-emerald-500">
            <Award size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">الادخار</span>
          </div>
          <p className="text-3xl font-black dark:text-white">{Math.max(0, Math.round(stats.savingsRate))}%</p>
          <div className="w-full bg-slate-50 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, stats.savingsRate))}%` }} />
          </div>
        </div>

        <div className="premium-card p-6 rounded-[2.5rem]">
          <div className="flex items-center gap-2 mb-3 text-amber-500">
            <Zap size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">اليومي</span>
          </div>
          <p className="text-2xl font-black dark:text-white">{Math.round(stats.dailyAvg).toLocaleString()}</p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 block uppercase">{currencySymbol} / يوم</span>
        </div>
      </div>

      <div className="premium-card p-8 rounded-[3rem]">
        <h3 className="text-lg font-black dark:text-white flex items-center gap-3 mb-8">
          <PieIcon size={20} className="text-amber-500" /> تحليل المصروفات
        </h3>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={expenseData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip 
                contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: '900', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">إجمالي الصرف</span>
            <span className="text-xl font-black dark:text-white">{stats.totalExpense.toLocaleString()}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-8">
          {expenseData.slice(0, 4).map((entry, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800/30">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black dark:text-slate-200 truncate">{entry.name}</span>
                <span className="text-[9px] text-slate-400 font-bold">{((entry.value / stats.totalExpense) * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card p-8 rounded-[3rem]">
        <h3 className="text-lg font-black mb-8 dark:text-white flex items-center gap-3">
          <CalendarDays size={20} className="text-blue-500" /> التطور الشهري
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
              <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: isDark ? '#475569' : '#94a3b8', fontWeight: 'bold' }} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: isDark ? '#475569' : '#94a3b8', fontWeight: 'bold' }} />
              <Tooltip cursor={{ fill: isDark ? '#0f172a' : '#f8fafc', radius: 12 }} contentStyle={{ background: isDark ? '#1e293b' : '#ffffff', borderRadius: '20px', border: 'none' }} />
              <Bar dataKey="income" name="الدخل" fill="#10b981" radius={[8, 8, 0, 0]} barSize={20} />
              <Bar dataKey="expense" name="المصروف" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
