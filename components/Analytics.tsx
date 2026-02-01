
import React, { useMemo } from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, Category } from '../types';

interface AnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  onPrint: (type: 'summary' | 'detailed') => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions, categories, currencySymbol, onPrint }) => {
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { totalIncome, totalExpense };
  }, [transactions]);

  const expenseData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(t => { categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount; });
    return Object.keys(categoryTotals).map(catId => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat?.name || 'أخرى', value: categoryTotals[catId], color: cat?.color || '#cbd5e1' };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const handleExportCSV = () => {
    const headers = "Date,Type,Amount,Category,Wallet,Note\n";
    const csvContent = transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'N/A';
      const typeLabel = t.type === 'income' ? 'Income' : 'Expense';
      return `${t.date},${typeLabel},${t.amount},"${cat}","${t.walletId}","${t.note.replace(/"/g, '""')}"`;
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
           توزيع المصروفات
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
            <span className="text-xl font-black text-white">{stats.totalExpense.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
