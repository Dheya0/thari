import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, 
  Terminal, Activity, Zap, Lock, Database, ArrowRightLeft, FileText,
  Clock, HardDrive, Smartphone, Cpu, HelpCircle, X
} from 'lucide-react';
import { executeReleaseCandidateAudit, ReleaseAuditReport } from '../services/releaseAuditSuite';

interface ReleaseAuditModalProps {
  onClose: () => void;
}

export const ReleaseAuditModal: React.FC<ReleaseAuditModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReleaseAuditReport | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'tests' | 'benchmarks' | 'security'>('evidence');
  const [selectedSuite, setSelectedSuite] = useState<string>('ALL');

  const runAudit = async () => {
    setLoading(true);
    try {
      const auditResult = await executeReleaseCandidateAudit();
      setReport(auditResult);
    } catch (err) {
      console.error('Audit execution failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  const suites = [
    { id: 'ALL', label: 'كافة الاختبارات' },
    { id: 'ACCOUNTING', label: 'المعادلات المحاسبية (A-J)' },
    { id: 'RECONCILIATION', label: 'مطابقة الأرصدة' },
    { id: 'MULTI_CURRENCY', label: 'العملات وأسعار الصرف' },
    { id: 'TRANSFER', label: 'نزاهة التحويلات' },
    { id: 'RECURRING', label: 'العمليات الدورية' },
    { id: 'DIAGNOSTICS', label: 'التشخيص والإصلاح' },
    { id: 'SECURITY', label: 'التجزئة والتشفير' },
    { id: 'SYNC', label: 'المزامنة والتعارض' },
    { id: 'REPORTS', label: 'التقارير وQR' },
    { id: 'BACKUP', label: 'النسخ الاحتياطي' },
    { id: 'PERFORMANCE', label: 'معايير السرعة والأداء' },
  ];

  const filteredResults = report ? (
    selectedSuite === 'ALL' 
      ? report.results 
      : report.results.filter(r => r.suiteId === selectedSuite)
  ) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">تدقيق الجاهزية للإنتاج (Release Candidate Audit)</h2>
                {report && (
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                    report.overallStatus === 'GREEN' 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                      : report.overallStatus === 'YELLOW' 
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}>
                    {report.overallStatus === 'GREEN' ? '● GREEN — جاهز للإنتاج' : report.overallStatus === 'YELLOW' ? '▲ YELLOW — مخاطر معروفة' : '✕ RED — غير جاهز'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-bold">
                تحقق آلي بالبراهين والأدلة الرياضية والبرمجية (Evidence-Based Production Verification)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAudit}
              disabled={loading}
              className="p-2.5 bg-slate-800 hover:bg-slate-750 text-amber-400 rounded-xl border border-white/5 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-black disabled:opacity-50"
              title="إعادة تشغيل الاختبارات"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{loading ? 'جاري الفحص...' : 'إعادة الفحص'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl active:scale-95 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-2 gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`pb-3 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={15} />
            <span>جدول الأدلة والجاهزية (Evidence Table)</span>
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`pb-3 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tests'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal size={15} />
            <span>الاختبارات التفصيلية ({report ? `${report.passedTests}/${report.totalTests}` : '...'})</span>
          </button>
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`pb-3 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'benchmarks'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={15} />
            <span>معايير الأداء والسرعة (50k Tx)</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock size={15} />
            <span>تدقيق الأمان والتشفير</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
          {loading && !report ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw size={32} className="animate-spin text-amber-500" />
              <p className="text-sm font-bold">جاري تشغيل محركات التدقيق المحاسبي والأمان والسرعة...</p>
            </div>
          ) : report ? (
            <>
              {/* TAB 1: Evidence Table */}
              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  {/* Metric Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-500 font-black">إجمالي الاختبارات الآلية</span>
                      <span className="text-xl font-black text-white mt-1">{report.totalTests} اختبار</span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-emerald-400 font-black">نسبة النجاح</span>
                      <span className="text-xl font-black text-emerald-400 mt-1">
                        {Math.round((report.passedTests / report.totalTests) * 100)}%
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-amber-400 font-black">حالة بوابة الإطلاق</span>
                      <span className="text-xl font-black text-amber-400 mt-1">{report.overallStatus}</span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-500 font-black">توقيت الفحص</span>
                      <span className="text-xs font-black text-slate-300 mt-2 truncate">
                        {new Date(report.timestamp).toLocaleTimeString('ar-SA')}
                      </span>
                    </div>
                  </div>

                  {/* Evidence Table */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-black">
                          <tr>
                            <th className="p-3.5">المجال / المكون</th>
                            <th className="p-3.5 text-center">الحالة</th>
                            <th className="p-3.5">الدليل والبرهان الفعلي (Evidence)</th>
                            <th className="p-3.5">المخاطر المتبقية (Remaining Risk)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-bold">
                          {report.evidenceTable.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-3.5 text-white font-black whitespace-nowrap">{row.area}</td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                                  row.status === 'PASS' 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-300 leading-relaxed">{row.evidence}</td>
                              <td className="p-3.5 text-slate-400 text-[11px] leading-relaxed">{row.remainingRisk}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Detailed Test Suite Runner */}
              {activeTab === 'tests' && (
                <div className="space-y-4">
                  {/* Suite Selector Filter */}
                  <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                    {suites.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSuite(s.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                          selectedSuite === s.id
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Test Cards */}
                  <div className="space-y-2.5">
                    {filteredResults.map(test => (
                      <div
                        key={test.testId}
                        className={`p-4 rounded-2xl border transition-all ${
                          test.passed
                            ? 'bg-slate-950/70 border-emerald-500/20'
                            : 'bg-rose-950/20 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {test.passed ? (
                              <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-white">{test.testName}</h4>
                                <span className="text-[10px] font-mono text-slate-500">[{test.testId}]</span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-bold mt-1 leading-relaxed">{test.details}</p>
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              test.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {test.passed ? 'PASS' : 'FAIL'}
                            </span>
                            <span className="block text-[9px] text-slate-500 font-mono mt-1">
                              {test.executionTimeMs.toFixed(2)} ms
                            </span>
                          </div>
                        </div>

                        {/* Expandable Expected vs Actual Inspector */}
                        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                          <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                            <span className="text-slate-500 block mb-0.5 font-sans font-bold">المتوقع (Expected):</span>
                            <span className="text-emerald-300 break-all">{JSON.stringify(test.expected)}</span>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                            <span className="text-slate-500 block mb-0.5 font-sans font-bold">الفعلي (Actual):</span>
                            <span className="text-amber-300 break-all">{JSON.stringify(test.actual)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Performance Benchmarks */}
              {activeTab === 'benchmarks' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <h3 className="text-xs font-black text-white flex items-center gap-2">
                      <Zap size={16} className="text-amber-400" />
                      <span>اختبار سرعة محرك الحسابات المالية التراكمية (Stress Benchmark)</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">
                      تم قياس أزمنة المعالجة الحسابية المباشرة لتحويل العملات، فرز وتجميع دفتر القيود، وحساب صافي الثروة عبر عينات تبدأ من 100 عملية وحتى 50,000 عملية مالية حقيقية.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {report.benchmarks.map((bench, idx) => (
                      <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{bench.txCount.toLocaleString()} عملية مالية</span>
                          <span className="text-xs font-black text-emerald-400 font-mono">{bench.calculationTimeMs} ms</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(5, (bench.calculationTimeMs / 1000) * 100))}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                          <span>الحد المسموح: &lt; 1,500 ms</span>
                          <span className="text-emerald-400">ممتاز (Instant)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Security & Cryptography Audit */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-black text-white flex items-center gap-2">
                      <Lock size={16} className="text-amber-400" />
                      <span>تدقيق التفريق بين آليات الحماية والتشفير (Security Architecture)</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">
                      يعتمد «ثري» على الفصل التام بين تجزئة الرمز السري، التشفير المتماثل للبيانات، وإدارة الجلسات:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-white">تجزئة الرمز السري (PIN Hashing)</h4>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">{report.securityAuditSummary.pinKdfStatus}</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-white">التشفير التام (Data Encryption at Rest)</h4>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">{report.securityAuditSummary.aesGcmStatus}</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-white">تنقية السجلات والخصوصية (Sensitive Log Scrubbing)</h4>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">{report.securityAuditSummary.sensitiveLogStatus}</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-white">أمان وحماية مفاتيح الخدمات السحابية (API Key Handling)</h4>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">{report.securityAuditSummary.aiKeyHandlingStatus}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-[10px] text-slate-500 font-bold">
            THARI v4.0.0-rc1 • Verification Engine Complete
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-md"
          >
            إغلاق التدقيق
          </button>
        </div>

      </div>
    </div>
  );
};
