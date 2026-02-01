
import React, { useMemo } from 'react';
import { AlertTriangle, Clock, Calendar, ChevronLeft, Bell } from 'lucide-react';
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

    // 1. Budget Alerts
    budgets.forEach(b => {
      const categoryName = categories.find(c => c.id === b.categoryId)?.name || 'تصنيف';
      const spent = transactions
        .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percent = (spent / b.amount) * 100;
      
      if (percent >= 100) {
        list.push({
          id: `b-${b.categoryId}`,
          type: 'critical',
          message: `تجاوزت ميزانية ${categoryName} بنسبة ${Math.round(percent - 100)}%`,
          icon: AlertTriangle
        });
      } else if (percent >= 80) {
        list.push({
          id: `b-${b.categoryId}`,
          type: 'warning',
          message: `اقتربت من الحد الأقصى لميزانية ${categoryName} (${Math.round(percent)}%)`,
          icon: AlertTriangle
        });
      }
    });

    // 2. Debt Due Dates (Next 3 Days)
    const today = new Date();
    debts.filter(d => !d.isPaid && d.dueDate).forEach(d => {
      const due = new Date(d.dueDate!);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays >= 0 && diffDays <= 3) {
        list.push({
          id: `d-${d.id}`,
          type: 'info',
          message: diffDays === 0 ? `موعد سداد دين "${d.personName}" اليوم!` : `تبقى ${diffDays} يوم لسداد دين "${d.personName}"`,
          icon: Clock
        });
      } else if (diffDays < 0) {
         list.push({
          id: `d-${d.id}`,
          type: 'critical',
          message: `تأخر سداد دين "${d.personName}" بمقدار ${Math.abs(diffDays)} يوم`,
          icon: Clock
        });
      }
    });

    // 3. Subscription Renewals (Next 3 Days)
    subscriptions.filter(s => s.isActive && s.nextBillingDate).forEach(s => {
      const due = new Date(s.nextBillingDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 3) {
        list.push({
          id: `s-${s.id}`,
          type: 'info',
          message: diffDays === 0 ? `تجديد اشتراك "${s.name}" اليوم` : `تجديد اشتراك "${s.name}" خلال ${diffDays} يوم`,
          icon: Calendar
        });
      }
    });

    return list;
  }, [budgets, transactions, debts, subscriptions, categories]);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-3 animate-fade">
      <div className="flex items-center gap-2 px-2">
        <Bell size={14} className="text-amber-500 animate-pulse" />
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">تنبيهات ذكية</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className={`snap-start min-w-[85%] sm:min-w-[300px] p-4 rounded-[2rem] border flex items-center gap-3 shadow-sm ${
              alert.type === 'critical' ? 'bg-rose-500/10 border-rose-500/30' : 
              alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : 
              'bg-blue-500/10 border-blue-500/30'
            }`}
          >
            <div className={`p-2.5 rounded-full ${
               alert.type === 'critical' ? 'bg-rose-500 text-white' : 
               alert.type === 'warning' ? 'bg-amber-500 text-slate-950' : 
               'bg-blue-500 text-white'
            }`}>
              <alert.icon size={16} />
            </div>
            <p className={`text-xs font-black flex-1 ${
               alert.type === 'critical' ? 'text-rose-500' : 
               alert.type === 'warning' ? 'text-amber-500' : 
               'text-blue-500'
            }`}>
              {alert.message}
            </p>
            <ChevronLeft size={16} className="opacity-50" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartAlerts;
