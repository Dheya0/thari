
import React from 'react';
import { ChevronRight, ShieldCheck, Lock, EyeOff, Database, Trash2, Cpu, Globe } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[60] flex flex-col animate-in slide-in-from-left duration-300">
      {/* Header - iOS Style */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 p-4 pt-12 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 -mr-2 text-amber-600 active:opacity-50 transition-opacity"
        >
          <ChevronRight size={28} />
        </button>
        <h2 className="text-lg font-black dark:text-white">سياسة الخصوصية</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
        <div className="text-center space-y-3 mb-10">
          <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-amber-600">
            <ShieldCheck size={40} />
          </div>
          <h3 className="text-xl font-black dark:text-white">خصوصيتك هي أولويتنا</h3>
          <p className="text-sm text-slate-500 font-medium">آخر تحديث: مارس 2024</p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600">
            <Database size={20} />
            <h4 className="font-black text-sm uppercase tracking-widest">تخزين البيانات</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            تطبيق "ثري" مصمم ليعمل بمبدأ <strong>الخصوصية أولاً</strong>. يتم تخزين جميع بياناتك المالية (العمليات، الميزانيات، الأسماء) محلياً على جهازك فقط باستخدام تقنية LocalStorage. لا يتم إرسال هذه البيانات إلى أي خوادم خارجية تابعة لنا.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-blue-500">
            <Cpu size={20} />
            <h4 className="font-black text-sm uppercase tracking-widest">الذكاء الاصطناعي (Gemini)</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            عند طلب نصيحة مالية، يتم إرسال ملخص مجهول الهوية لعملياتك الأخيرة إلى نموذج Gemini API التابع لشركة Google لمعالجتها وتقديم النصيحة. لا يتم تخزين هذه البيانات في سجلات دائمة، وتتم العملية عبر اتصال مشفر (SSL).
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-500">
            <Lock size={20} />
            <h4 className="font-black text-sm uppercase tracking-widest">أمن المعلومات</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            يمكنك تفعيل رمز PIN لحماية الوصول إلى التطبيق. نحن نستخدم ميزات الأمان الافتراضية في نظام التشغيل (iOS/Android) لحماية حاوية البيانات المحلية الخاصة بالتطبيق.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-rose-500">
            <Trash2 size={20} />
            <h4 className="font-black text-sm uppercase tracking-widest">حقوق المستخدم والحذف</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            بما أن البيانات محلية، فلديك السيطرة الكاملة عليها. يمكنك في أي وقت حذف كافة البيانات من خلال "إعدادات التطبيق > حذف كافة البيانات نهائياً". كما سيؤدي حذف التطبيق من جهازك إلى مسح كافة البيانات المرتبطة به فوراً.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-slate-400">
            <Globe size={20} />
            <h4 className="font-black text-sm uppercase tracking-widest">تعديلات السياسة</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            قد نقوم بتحديث هذه السياسة من حين لآخر لتعكس التغييرات في ميزات التطبيق أو المتطلبات القانونية. سيتم إخطار المستخدمين بأي تغييرات جوهرية عبر تحديثات التطبيق.
          </p>
        </section>

        <div className="pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400 font-bold mb-4">إذا كان لديك أي استفسار حول الخصوصية، تواصل معنا:</p>
          <a href="mailto:support@thari.app" className="text-amber-600 font-black text-sm hover:underline">support@thari.app</a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
