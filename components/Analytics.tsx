import React, { useMemo, useState } from 'react';
import { Download, Printer, FileText, TrendingUp, TrendingDown, Minus, Filter, Sparkles, PieChart as PieChartIcon, BarChart3, ShieldCheck, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Layers } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction, Category, Wallet } from '../types';
import { convertCurrency } from '../constants';
import { buildExecutiveCSVContent, exportAndShareExecutiveCSV } from '../utils/exportHelper';

interface AnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  onPrint: (type: 'summary' | 'detailed') => void;
  currentCurrencyCode?: string; 
  exchangeRates: Record<string, number>;
  wallets: Wallet[];
  initialWalletId?: string | null;
  onFilterChange: (walletId: string | null) => void;
  userName?: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ 
  transactions, 
  categories, 
  currencySymbol, 
  onPrint, 
  currentCurrencyCode = 'SAR', 
  exchangeRates, 
  wallets, 
  initialWalletId, 
  onFilterChange, 
  userName = 'مستخدم ثري' 
}) => {
  const [chartView, setChartView] = useState<'donut' | 'bar'>('donut');

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currentCurrencyCode, exchangeRates), 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + convertCurrency(t.amount, t.currency, currentCurrencyCode, exchangeRates), 0);
    
    const netSavings = totalIncome - totalExpense;
    const savingsRatio = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
        
    return { totalIncome, totalExpense, netSavings, savingsRatio };
  }, [transactions, currentCurrencyCode, exchangeRates]);

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
      }).reduce((s, t) => s + convertCurrency(t.amount, t.currency, currentCurrencyCode, exchangeRates), 0);
    };

    const curInc = getMonthlyTotal(currentMonth, currentYear, 'income');
    const curExp = getMonthlyTotal(currentMonth, currentYear, 'expense');
    const prevInc = getMonthlyTotal(prevMonth, prevYear, 'income');
    const prevExp = getMonthlyTotal(prevMonth, prevYear, 'expense');

    const calcChange = (cur: number, prev: number) => prev === 0 ? 0 : ((cur - prev) / prev) * 100;

    return {
      incomeChange: calcChange(curInc, prevInc),
      expenseChange: calcChange(curExp, prevExp),
      curInc, 
      curExp,
      prevInc,
      prevExp
    };
  }, [transactions, currentCurrencyCode, exchangeRates]);

  const expenseData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};
    
    expenses.forEach(t => { 
      const convertedAmount = convertCurrency(t.amount, t.currency, currentCurrencyCode, exchangeRates);
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + convertedAmount; 
    });

    return Object.keys(categoryTotals).map(catId => {
      const cat = categories.find(c => c.id === catId);
      return { 
        name: cat?.name || 'أخرى', 
        value: Math.round(categoryTotals[catId]), 
        color: cat?.color || '#f59e0b' 
      };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories, currentCurrencyCode, exchangeRates]);

  const handleExportCSV = () => {
    const csvContent = buildExecutiveCSVContent({
      transactions,
      categories,
      wallets,
      userName,
      currency: { code: currentCurrencyCode, symbol: currencySymbol, name: currentCurrencyCode, icon: '' },
      exchangeRates,
      type: 'detailed',
      filterWalletId: initialWalletId,
    });

    const fileName = `Thari_Executive_Report_${new Date().toISOString().split('T')[0]}.csv`;
    exportAndShareExecutiveCSV(csvContent, fileName);
  };

  if (transactions.length === 0) {
    return (
      <div className="space-y-4 animate-fade">
        <div className="bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-3xl border border-white/10 flex items-center justify-between shadow-lg">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">نطاق التقرير</span>
          <select 
            value={initialWalletId || ''} 
            onChange={(e) => onFilterChange(e.target.value || null)}
            className="bg-slate-950 text-white font-bold p-3 rounded-2xl border border-slate-800 outline-none text-xs"
          >
            <option value="">كل المحافظ (تقرير شامل)</option>
            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-white/5">
          <Layers className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-bold">لا توجد بيانات متاحة لهذا النطاق حالياً.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-fade">
      
      {/* Executive Quick Stats Strip */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-black text-white">المركز المالي والمؤشرات التنفيذية</p>
              <p className="text-[10px] text-slate-400 font-bold">مقيمة بالعملة المعيارية: {currentCurrencyCode}</p>
            </div>
          </div>
          <div className="text-left">
            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              وفر شهري {stats.savingsRatio}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* MoM Income */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <ArrowUpRight size={13} className="text-emerald-400" /> واردات الشهر
              </span>
              <div className={`flex items-center text-[9px] font-black px-1.5 py-0.5 rounded ${momStats.incomeChange >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                {momStats.incomeChange > 0 ? <TrendingUp size={10} className="mr-0.5" /> : momStats.incomeChange < 0 ? <TrendingDown size={10} className="mr-0.5" /> : <Minus size={10} className="mr-0.5" />}
                {Math.abs(momStats.incomeChange).toFixed(1)}%
              </div>
            </div>
            <p className="text-base sm:text-lg font-black text-white dir-ltr text-right">
              +{Math.round(momStats.curInc).toLocaleString()} <span className="text-xs text-slate-400">{currencySymbol}</span>
            </p>
          </div>

          {/* MoM Expense */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <ArrowDownLeft size={13} className="text-rose-400" /> منصرفات الشهر
              </span>
              <div className={`flex items-center text-[9px] font-black px-1.5 py-0.5 rounded ${momStats.expenseChange <= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                {momStats.expenseChange > 0 ? <TrendingUp size={10} className="mr-0.5" /> : momStats.expenseChange < 0 ? <TrendingDown size={10} className="mr-0.5" /> : <Minus size={10} className="mr-0.5" />}
                {Math.abs(momStats.expenseChange).toFixed(1)}%
              </div>
            </div>
            <p className="text-base sm:text-lg font-black text-white dir-ltr text-right">
              -{Math.round(momStats.curExp).toLocaleString()} <span className="text-xs text-slate-400">{currencySymbol}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Scope Selector and Document Export Deck */}
      <div className="space-y-3.5">
        <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-white/10 flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/20">
            <Filter size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">نطاق التقرير واستخراج الكشف</p>
            <select 
              value={initialWalletId || ''} 
              onChange={(e) => onFilterChange(e.target.value || null)}
              className="w-full bg-transparent text-white font-bold outline-none text-xs cursor-pointer truncate"
            >
              <option value="" className="bg-slate-900 text-white">كافة المحافظ (كشف مالي شامل)</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                  محفظة: {w.name} ({w.currencyCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons with Institutional Finish */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => onPrint('summary')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-500 text-slate-950 font-black rounded-2xl text-xs uppercase transition-all active:scale-95 shadow-lg shadow-amber-500/20 hover:bg-amber-400"
          >
            <Printer size={16} /> <span>طباعة ملخص تنفيذي</span>
          </button>
          
          <button 
            onClick={() => onPrint('detailed')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-800 text-white font-bold rounded-2xl text-xs uppercase transition-all active:scale-95 border border-white/10 hover:bg-slate-700"
          >
            <FileText size={16} className="text-amber-400" /> <span>كشف حساب تفصيلي</span>
          </button>
        </div>

        <button 
          onClick={handleExportCSV}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900/90 border border-white/10 text-slate-300 rounded-2xl text-xs font-bold uppercase transition-all active:scale-95 hover:text-white hover:border-emerald-500/40"
        >
          <Download size={15} className="text-emerald-400" /> <span>تصدير جدول البيانات المؤسسي Excel (CSV)</span>
        </button>
      </div>

      {/* Spending Distribution Breakdown Section */}
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-5 sm:p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">
              هيكل توزيع المصروفات
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">مقيمة بـ {currentCurrencyCode}</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setChartView('donut')}
              className={`p-1.5 rounded-lg transition-all ${chartView === 'donut' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              title="رسم بياني دائري"
            >
              <PieChartIcon size={16} />
            </button>
            <button 
              onClick={() => setChartView('bar')}
              className={`p-1.5 rounded-lg transition-all ${chartView === 'bar' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              title="رسم بياني عمودي"
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>

        {/* Chart View */}
        {chartView === 'donut' ? (
          <div className="h-60 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={expenseData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={68} 
                  outerRadius={92} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString()} ${currencySymbol}`, 'المصروف']}
                  contentStyle={{ background: '#090d16', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">إجمالي المصروفات</span>
              <span className="text-lg sm:text-xl font-black text-white mt-0.5">
                {Math.round(stats.totalExpense).toLocaleString()} <span className="text-xs text-amber-400">{currencySymbol}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="h-60 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData.slice(0, 6)} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} hide />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString()} ${currencySymbol}`, 'المصروف']}
                  contentStyle={{ background: '#090d16', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {expenseData.slice(0, 6).map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category List Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
          {expenseData.slice(0, 6).map((item, idx) => {
            const pct = stats.totalExpense > 0 ? ((item.value / stats.totalExpense) * 100).toFixed(0) : '0';
            return (
              <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-bold text-slate-200 truncate">{item.name}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Analytics;
