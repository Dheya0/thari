import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, Activity, ShieldCheck, AlertTriangle, CheckCircle2, 
  Wrench, RefreshCw, Layers, Database, Lock, Scale, AlertCircle 
} from 'lucide-react';
import { AppState } from '../types';
import { runFullSystemDiagnostics, autoRepairState, DiagnosticsReport } from '../services/diagnosticsService';

interface SystemDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onApplyRepairedState: (repairedState: AppState) => void;
}

export const SystemDiagnosticsModal: React.FC<SystemDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  state,
  onApplyRepairedState,
}) => {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [repairSummary, setRepairSummary] = useState<string[] | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  const runAudit = () => {
    const res = runFullSystemDiagnostics(state);
    setReport(res);
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
      setRepairSummary(null);
    }
  }, [isOpen, state]);

  if (!isOpen || !report) return null;

  const handleAutoRepair = () => {
    setIsFixing(true);
    setTimeout(() => {
      const { repairedState, repairedCount, summary } = autoRepairState(state);
      onApplyRepairedState(repairedState);
      setRepairSummary(summary.length > 0 ? summary : ['تمت إعادة مزامنة أرصدة المحافظ وتأكيد التكامل الهيكلي بنجاح.']);
      setIsFixing(false);
      runAudit();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              report.status === 'HEALTHY'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : report.status === 'WARNINGS'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <Activity size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">فحص تكامل البيانات والتدقيق المحاسبي</h2>
              <p className="text-xs text-slate-400">تحقق فوري من سلامة الأرصدة، العمليات، والمعادلات المحاسبية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`px-5 py-3 border-b flex items-center justify-between ${
          report.status === 'HEALTHY'
            ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
            : report.status === 'WARNINGS'
            ? 'bg-amber-950/30 border-amber-500/20 text-amber-400'
            : 'bg-rose-950/30 border-rose-500/20 text-rose-400'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            {report.status === 'HEALTHY' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>
              {report.status === 'HEALTHY'
                ? 'النظام المحاسبي وقواعد البيانات في حالة ممتازة وسليمة 100%'
                : report.status === 'WARNINGS'
                ? 'تم رصد بعض الملاحظات البسيطة القابلة للمعالجة'
                : 'يوجد عدم تطابق هيكلي يتطلب إصلاحاً تلقائياً'}
            </span>
          </div>
          <button
            onClick={runAudit}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <RefreshCw size={12} />
            <span>إعادة الفحص</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400">إجمالي العمليات</div>
              <div className="text-base font-black text-white font-mono">{report.totalTransactions}</div>
              <div className="text-[10px] text-slate-500">نشطة: {report.activeTransactions}</div>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400">سلة المحذوفات</div>
              <div className="text-base font-black text-rose-400 font-mono">{report.trashCount}</div>
              <div className="text-[10px] text-slate-500">مؤمنة بالحذف المرحلي</div>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400">المحافظ المسجلة</div>
              <div className="text-base font-black text-amber-400 font-mono">{report.walletsCount}</div>
              <div className="text-[10px] text-slate-500">محافظ نشطة</div>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400">القواعد المجدولة</div>
              <div className="text-base font-black text-blue-400 font-mono">{report.recurringRulesCount}</div>
              <div className="text-[10px] text-slate-500">دورية</div>
            </div>
          </div>

          {/* Engine Accounting Invariants Verification */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Scale size={16} className="text-amber-400" />
                <span>اختبارات الثبات المحاسبي (Accounting Invariants Suite)</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                report.engineAuditPassed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {report.engineAuditPassed ? 'ناجحة بالكامل (7/7)' : 'فشلت بعض الاختبارات'}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {report.engineAuditResults.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50">
                  <span className="text-slate-300 font-medium">{t.testName}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-slate-400">{t.actual}</span>
                    {t.passed ? (
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle size={13} className="text-rose-400 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues List */}
          {report.issues.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">الملاحظات المرصودة</div>
              <div className="space-y-2">
                {report.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1 ${
                      issue.type === 'error'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                        : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{issue.title}</span>
                      {issue.canAutoFix && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-current font-normal">
                          قابل للإصلاح التلقائي
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{issue.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repair Result Message */}
          {repairSummary && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>تقرير المعالجة التلقائية:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-300">
                {repairSummary.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            آخر فحص: {new Date(report.timestamp).toLocaleTimeString('ar-SA')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoRepair}
              disabled={isFixing}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Wrench size={14} />
              <span>{isFixing ? 'جاري الإصلاح...' : 'إصلاح ومزامنة الأرصدة تلقائياً'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
