import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, FileText, Repeat, Trash2, Scale, Briefcase, 
  ArrowLeft, Sparkles, ShieldCheck, Database, HardDrive, 
  Coins, CheckCircle2
} from 'lucide-react';

interface ToolsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringRulesCount: number;
  trashCount: number;
  onOpenReports: () => void;
  onOpenRecurring: () => void;
  onOpenTrash: () => void;
  onOpenDiagnostics: () => void;
  onOpenAIAdvisor: () => void;
}

export const ToolsHubModal: React.FC<ToolsHubModalProps> = ({
  isOpen,
  onClose,
  recurringRulesCount,
  trashCount,
  onOpenReports,
  onOpenRecurring,
  onOpenTrash,
  onOpenDiagnostics,
  onOpenAIAdvisor,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade no-print"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-[#0F141C] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.7)] text-right overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D9B978]/10 border border-[#D9B978]/20 flex items-center justify-center text-[#D9B978]">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">مركز الأدوات والميزات</h3>
                <p className="text-xs text-slate-400">إدارة متقدمة للتقارير والعمليات والتدقيق المحاسبي</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tools Grid */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-3">
            {/* Tool 1: Financial Reports */}
            <button
              onClick={() => { onClose(); onOpenReports(); }}
              className="w-full group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#D9B978]/30 transition-all text-right flex items-center justify-between gap-4 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#D9B978]/10 text-[#D9B978] flex items-center justify-center shrink-0 border border-[#D9B978]/20 group-hover:scale-105 transition-transform">
                  <FileText size={22} />
                </div>
                <div className="truncate">
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#D9B978] transition-colors">التقارير المالية والطباعة</h4>
                  <p className="text-xs text-slate-400 truncate">تصدير تقارير محاسبية شاملة بصيغة PDF و Excel و CSV</p>
                </div>
              </div>
              <ArrowLeft size={16} className="text-slate-500 group-hover:text-white group-hover:-translate-x-1 transition-all shrink-0" />
            </button>

            {/* Tool 2: Recurring Rules */}
            <button
              onClick={() => { onClose(); onOpenRecurring(); }}
              className="w-full group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#8EB9A7]/30 transition-all text-right flex items-center justify-between gap-4 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#8EB9A7]/10 text-[#8EB9A7] flex items-center justify-center shrink-0 border border-[#8EB9A7]/20 group-hover:scale-105 transition-transform">
                  <Repeat size={22} />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#8EB9A7] transition-colors">العمليات الدورية والمجدولة</h4>
                    {recurringRulesCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8EB9A7]/20 text-[#8EB9A7] border border-[#8EB9A7]/30">
                        {recurringRulesCount} نشطة
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">أتمتة المصاريف والرواتب والاشتراكات المتكررة تلقائياً</p>
                </div>
              </div>
              <ArrowLeft size={16} className="text-slate-500 group-hover:text-white group-hover:-translate-x-1 transition-all shrink-0" />
            </button>

            {/* Tool 3: Trash Bin */}
            <button
              onClick={() => { onClose(); onOpenTrash(); }}
              className="w-full group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#C98387]/30 transition-all text-right flex items-center justify-between gap-4 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#C98387]/10 text-[#C98387] flex items-center justify-center shrink-0 border border-[#C98387]/20 group-hover:scale-105 transition-transform">
                  <Trash2 size={22} />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#C98387] transition-colors">سلة المحذوفات والاسترجاع</h4>
                    {trashCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C98387]/20 text-[#C98387] border border-[#C98387]/30">
                        {trashCount} عملية
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">استرجاع العمليات المحذوفة بأمان وتفادي الحذف العرضي</p>
                </div>
              </div>
              <ArrowLeft size={16} className="text-slate-500 group-hover:text-white group-hover:-translate-x-1 transition-all shrink-0" />
            </button>

            {/* Tool 4: System Diagnostics & Accounting Audit */}
            <button
              onClick={() => { onClose(); onOpenDiagnostics(); }}
              className="w-full group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#759BC8]/30 transition-all text-right flex items-center justify-between gap-4 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#759BC8]/10 text-[#759BC8] flex items-center justify-center shrink-0 border border-[#759BC8]/20 group-hover:scale-105 transition-transform">
                  <Scale size={22} />
                </div>
                <div className="truncate">
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#759BC8] transition-colors">فحص تكامل البيانات والتدقيق</h4>
                  <p className="text-xs text-slate-400 truncate">مطابقة ميزان المحافظ والتحقق من العمليات المعزولة والنزاهة</p>
                </div>
              </div>
              <ArrowLeft size={16} className="text-slate-500 group-hover:text-white group-hover:-translate-x-1 transition-all shrink-0" />
            </button>

            {/* Tool 5: Private Financial Advisor */}
            <button
              onClick={() => { onClose(); onOpenAIAdvisor(); }}
              className="w-full group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#D9B978]/30 transition-all text-right flex items-center justify-between gap-4 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D9B978]/20 to-[#8EB9A7]/20 text-[#D9B978] flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                  <Briefcase size={22} />
                </div>
                <div className="truncate">
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#D9B978] transition-colors">المستشار المالي الخاص</h4>
                  <p className="text-xs text-slate-400 truncate">تحليل التدفقات النقدية وتقديم الرأي المالي والخطط المخصصة</p>
                </div>
              </div>
              <ArrowLeft size={16} className="text-slate-500 group-hover:text-white group-hover:-translate-x-1 transition-all shrink-0" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
