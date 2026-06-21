import React, { useMemo } from 'react';
import { Award, Briefcase, Coins, Shield, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { Transaction, Budget, Debt } from '../types';

interface ExecutiveInsightsProps {
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  totalBalance: number;
  currencySymbol: string;
}

const ExecutiveInsights: React.FC<ExecutiveInsightsProps> = ({ transactions, budgets, debts, totalBalance, currencySymbol }) => {
  const calculations = useMemo(() => {
    // 30 days of transactions for active burn rate calculation
    const currentDate = new Date('2026-06-21T01:39:51-07:00'); // Let's use the local context ISO or realistic calculations
    const last30Days = transactions.filter(t => {
      const transDate = new Date(t.date);
      const diffTime = Math.abs(currentDate.getTime() - transDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    // Monthly burn rate (default to general average if no 30 days transactions exist)
    let burnRate = last30Days.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    if (burnRate === 0) {
      burnRate = totalExpense > 0 ? (totalExpense / Math.max(1, Math.ceil(transactions.length / 5))) : 0;
    }

    // Runway (شهور الأمان المالي)
    const runwayMonths = burnRate > 0 ? (totalBalance / burnRate) : Infinity;

    // Active Debts
    const activeDebts = debts.filter(d => !d.isPaid && d.type === 'on_me').reduce((s, d) => s + d.amount, 0);

    // Savings rate
    const savingsRatio = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    return {
      burnRate,
      runwayMonths,
      activeDebts,
      savingsRatio,
      totalIncome,
      totalExpense
    };
  }, [transactions, debts, totalBalance]);

  // Generate elegant Executive Briefing in Natural Language
  const briefing = useMemo(() => {
    const { runwayMonths, burnRate, activeDebts, savingsRatio, totalIncome, totalExpense } = calculations;

    let title = "مستقر ومتنامٍ";
    let message = "";
    let actionItem = "";
    let statusColor = "text-amber-400";

    if (runwayMonths === Infinity || runwayMonths > 12) {
      title = "سيولة فائقة المستوى وتدفق آمن";
      message = `تهانينا، الهيكل المالي الخاص بمشاريعك ومحافظك متين للغاية. الملاءة النقدية الحالية تغطي المصاريف التشغيلية ومعدل الحرق المالي لـ ${runwayMonths === Infinity ? 'فترة غير محدودة' : Math.round(runwayMonths) + ' شهراً'} مقبلاً بأمان مالي كامل دون الحاجة لأي تمويل إضافي.`;
      actionItem = "ننصح بإنشاء قناة استثمارية دورية لتحويل 30% من الكاش الخامل في عقارات تدر عوائد أو سبائك ذهبية للاستفادة من تقلبات السوق الحالية وتعزيز رصيد الوفرة.";
      statusColor = "text-amber-400";
    } else if (runwayMonths >= 6 && runwayMonths <= 12) {
      title = "أمان نقد متوازن ومتحفظ";
      message = `رصيد الأمان والملاءة لديك كافٍ لتأمين نمط حياتك الحالي لمدة ${Math.round(runwayMonths)} أشهر. تدفقاتك الواردة جيدة، والنزيف المالي يقع تحت السيطرة الفعالة للإدارة الذكية.`;
      actionItem = "بإمكانك التوسع ببطء في الاستثمارات قصيرة الأجل (المضاربة المغلقة) لرفع نقاط الوفرة الشهرية مع ضمان وجود الوديعة التشغيلية ثابتة.";
    } else if (runwayMonths >= 3 && runwayMonths < 6) {
      title = "حركة سيولة معتدلة تتطلب اليقظة";
      message = `رصيد الأمان الحالي يكفي لـ ${Math.round(runwayMonths)} أشهر فقط من التشغيل المتواصل بمعدل الإنفاق الجاري البالغ ${Math.round(burnRate).toLocaleString()} ${currencySymbol} شهرياً. هناك بعض البنود والتزامات الديون المستحقة البالغة ${activeDebts.toLocaleString()} ${currencySymbol}.`;
      actionItem = "نقترح إعطاء الأولوية لتسوية الالتزامات قصيرة الأجل (الديون) لرفع هامش الملاءة، وإيقاف الاشتراكات والمدفوعات المتكررة الخاملة مؤقتاً.";
      statusColor = "text-blue-400";
    } else {
      title = "معدل تشغيل نقد حرج";
      message = `يتضح من المؤشرات أن معدل الحرق المالي الشهري يقترب بشكل مباشر من حجم النقد السائل (يكفي لأقل من ${Math.ceil(Math.max(1, runwayMonths))} أشهر). الديون النشطة والالتزامات تضغط على هيكل الاحتياطي الإجمالي.`;
      actionItem = "ننصح فورياً بجدولة الديون، وإعادة هيكلة بنود الميزانية بشكل يحمي السيولة النقدية المطلقة، وتجميد الصرف غير المدر للدخل لرفع مؤشر الوفرحة.";
      statusColor = "text-rose-400";
    }

    return { title, message, actionItem, statusColor };
  }, [calculations, currencySymbol]);

  return (
    <div className="relative group p-[2px] rounded-2xl md:rounded-[2.5rem] bg-gradient-to-br from-amber-500/20 to-transparent overflow-hidden">
      <div className="bg-slate-900/60 backdrop-blur-3xl p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/5 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Award size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5">التقرير التحليلي وخط العمل لقادة الشركات</p>
              <h3 className={`text-sm sm:text-base font-black ${briefing.statusColor} leading-snug`}>{briefing.title}</h3>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col justify-between sm:justify-start w-full sm:w-auto items-center sm:items-start border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold">فترة الأمان المالي</span>
            <span className="text-lg sm:text-xl font-black text-white">
              {calculations.runwayMonths === Infinity ? 'أمان دائم' : `~ ${Math.round(calculations.runwayMonths)} شهر`}
            </span>
          </div>
        </div>

        {/* Narrative Section described like visual letters */}
        <div className="space-y-4 text-xs leading-relaxed text-slate-300 border-t border-b border-white/5 py-4">
          <p className="text-justify font-bold text-slate-200">{briefing.message}</p>
          <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/10 flex gap-2.5">
            <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-amber-300 font-medium leading-relaxed">{briefing.actionItem}</p>
          </div>
        </div>

        {/* Summary Mini KPIs - Grid of 3 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-950/40 p-2.5 sm:p-3.5 rounded-xl border border-white/5 text-center flex flex-col justify-center min-h-[64px]">
            <span className="text-[9px] sm:text-xs text-slate-400 font-bold block mb-1">معدل الحرق المالي</span>
            <span className="text-[11px] sm:text-xs font-black text-slate-200 truncate">
              {Math.round(calculations.burnRate).toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-500 select-none">{currencySymbol}/شهرياً</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 sm:p-3.5 rounded-xl border border-white/5 text-center flex flex-col justify-center min-h-[64px]">
            <span className="text-[9px] sm:text-xs text-slate-400 font-bold block mb-1">صافي نسبة الوفرة</span>
            <span className="text-[11px] sm:text-xs font-black text-emerald-400 truncate">
              {calculations.savingsRatio > 0 ? `+${Math.round(calculations.savingsRatio)}%` : `${Math.round(calculations.savingsRatio)}%`}
            </span>
            <span className="text-[9px] text-slate-500 select-none">معدل الاحتفاظ</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 sm:p-3.5 rounded-xl border border-white/5 text-center flex flex-col justify-center min-h-[64px]">
            <span className="text-[9px] sm:text-xs text-slate-400 font-bold block mb-1">الالتزامات المستجدة</span>
            <span className="text-[11px] sm:text-xs font-black text-rose-400 truncate">
              {calculations.activeDebts.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-500 select-none">{currencySymbol} مستحقة</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutiveInsights;
