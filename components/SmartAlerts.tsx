
import React, { useMemo } from 'react';
import { AlertTriangle, Clock, Calendar, ChevronLeft, Bell, TrendingUp, ZapOff } from 'lucide-react';
import { Budget, Transaction, Debt, Subscription } from '../types';

interface SmartAlertsProps {
  budgets: Budget[];
  transactions: Transaction[];
  debts: Debt[];
  subscriptions: Subscription[];
  categories: any[];
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({ budgets, transactions, debts, subscriptions, categories }) => {
  const alerts = useMemo(() => {
    const list: { id: string, type: 'warning' | 'critical' | 'info', message: string, icon: any }[] = [];

    // 1. Spending Spike Detection (Anomaly)
    const thisWeekExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      const now = new Date();
      return t.type === 'expense' && (now.getTime() - d.getTime()) < (7 * 24 * 60 * 60 * 1000);
    }).reduce((s, t) => s + t.amount, 0);

    const prevWeekExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      return t.type === 'expense' && diff >= (7 * 24 * 60 * 60 * 1000) && diff < (14 * 24 * 60 * 60 * 1000);
    }).reduce((s, t) => s + t.amount, 0);

    if (prevWeekExpenses > 0 && thisWeekExpenses > prevWeekExpenses * 1.25) {
      const increase = Math.round(((thisWeekExpenses - prevWeekExpenses) / prevWeekExpenses) * 100);
      list.push({
        id: 'anomaly-spike',
        type: 'warning',
        message: `تنبيه: صرفك هذا الأسبوع أعلى من المعتاد بنسبة ${increase}%`,
        icon: TrendingUp
      });
    }

    // 2. Budget Alerts
    budgets.forEach(b => {
      const categoryName = categories.find(c => c.id === b.categoryId)?.name || 'تصنيف';
      const spent = transactions
        .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const percent = (spent / b.amount) * 100;
      if (percent >= 100) {
        list.push({ id: `b-${b.categoryId}`, type: 'critical', message: `تجاوزت ميزانية ${categoryName}!`, icon: AlertTriangle });
      }
    });

    // 3. Debt Due Dates
    const today = new Date();
    debts.filter(d => !d.isPaid && d.dueDate).forEach(d => {
      const due = new Date(d.dueDate!);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)); 
      if (diffDays >= 0 && diffDays <= 3) {
        list.push({ id: `d-${d.id}`, type: 'info', message: `موعد سداد دين "${d.personName}" اقترب`, icon: Clock });
      }
    });

    // 4. Subscription Potential Waste (If high expense but no activity in category)
    subscriptions.forEach(s => {
        const d = new Date(s.nextBillingDate);
        if (d < today) {
            list.push({ id: `s-expired-${s.id}`, type: 'warning', message: `اشتراك "${s.name}" قد يكون غير مفعل أو متأخر`, icon: ZapOff });
        }
    });

    return list;
  }, [budgets, transactions, debts, subscriptions, categories]);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-3 animate-fade">
      <div className="flex items-center gap-2 px-2">
        <Bell size={14} className="text-amber-500 animate-pulse" />
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">تنبيهات ثري الذكية</h3>
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x">
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className={`snap-start min-w-[85%] sm:min-w-[280px] p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3 shadow-md backdrop-blur-md ${
              alert.type === 'critical' ? 'bg-rose-500/10 border-rose-500/20' : 
              alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' : 
              'bg-blue-500/10 border-blue-500/20'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
               alert.type === 'critical' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 
               alert.type === 'warning' ? 'bg-amber-500 text-slate-950' : 
               'bg-blue-500 text-white'
            }`}>
              <alert.icon size={16} />
            </div>
            <p className={`text-[11px] font-bold flex-1 leading-snug ${
               alert.type === 'critical' ? 'text-rose-400' : 
               alert.type === 'warning' ? 'text-amber-400' : 
               'text-blue-400'
            }`}>
              {alert.message}
            </p>
            <ChevronLeft size={14} className="opacity-30 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartAlerts;
