import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Lock, 
  Database, 
  Trash2, 
  Cpu, 
  Globe, 
  ShieldAlert, 
  Mail, 
  CheckCircle2, 
  EyeOff, 
  Fingerprint, 
  HardDrive 
} from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
  language?: 'ar' | 'en';
}

interface PolicyContent {
  title: string;
  subtitle: string;
  lastUpdated: string;
  badgePrivacyFirst: string;
  badgeEncrypted: string;
  badgeNoTrackers: string;
  sections: {
    icon: any;
    color: string;
    title: string;
    description: string;
    highlights?: string[];
  }[];
  contactTitle: string;
  contactDesc: string;
  footerNote: string;
  copyright: string;
  backBtn: string;
  switchLangBtn: string;
}

const CONTENT: Record<'ar' | 'en', PolicyContent> = {
  ar: {
    title: 'سياسة الخصوصية وحماية البيانات',
    subtitle: 'خصوصيتك وسرية بياناتك المالية هي أولويتنا ومبدأنا الأساسي',
    lastUpdated: 'آخر تحديث: أغسطس 2024 (الإصدار 1.2.0)',
    badgePrivacyFirst: 'الخصوصية أولاً (Local-First)',
    badgeEncrypted: 'تشفير محلي عسكري',
    badgeNoTrackers: 'خالٍ تماماً من التتبع',
    sections: [
      {
        icon: Database,
        color: '#D9B978',
        title: '1. التخزين المحلي والسيادة الكاملة على البيانات',
        description: 'تطبيق "ثري" مصمم وفق معمارية (Local-First). يتم تخزين ومعالجة كافة معاملاتك المالية، المحافظ، الديون، الميزانيات، وسجلات الزكاة محلياً على جهازك فقط. نحن لا نمتلك خوادم مركزية تستقبل أو تحتفظ ببياناتك المالية، مما يمنحك السيادة الكاملة والأمان المطلق.',
        highlights: [
          'البيانات مخزنة في الحاوية الآمنة لجهازك فقط',
          'لا يتم جمع أو بيع أو مشاركة أي بيانات مالية مع أطراف خارجية',
          'العمل الكامل أوفلاين دون الحاجة لأي اتصال بالإنترنت'
        ]
      },
      {
        icon: Cpu,
        color: '#3b82f6',
        title: '2. الاستشارة والتحليل الذكي (اختياري ومجهول الهوية)',
        description: 'في حال استخدامك لمساعد الذكاء الاصطناعي الذكي، تتم معالجة استفساراتك عبر تشفير مباشر ومجهول الهوية تماماً (Anonymous Querying) دون ربطها بأي معرف شخصي أو اسم. كما يمكنك استخدام المحرك التحليلي الرياضي المدمج دون أي اتصال خارجي.',
        highlights: [
          'معالجة استفسارات الذكاء الاصطناعي بدون بيانات تعريفية شخصية',
          'إمكانية استخدام مفتاح API المخصص لك للتحكم الكامل',
          'تشغيل أدوات التحليل وإحصائيات الإنفاق محلياً 100%'
        ]
      },
      {
        icon: Lock,
        color: '#10b981',
        title: '3. أمن الأجهزة، رمز PIN، والتحقق الحيوي (Biometrics)',
        description: 'يتيح لك التطبيق قفل الوصول برمز PIN معقد وتفعيل المصادقة الحيوية المتقدمة مثل Face ID و Touch ID ومستشعر البصمة. تتم المصادقة داخل النظام الأمني المباشر لجهازك (Secure Enclave) ولا يستطيع التطبيق قراءة بياناتك الحيوية الخام أبداً.',
        highlights: [
          'دعم المصادقة البيومترية المعيارية عبر نظام التشغيل',
          'خاصية القفل الفوري وقفل التطبيق التلقائي عند الخروج',
          'حماية مضاعفة عند محاولة استعادة أو تصدير البيانات'
        ]
      },
      {
        icon: HardDrive,
        color: '#8b5cf6',
        title: '4. النسخ الاحتياطي المشفر والتصدير الآمن',
        description: 'يمكنك إنشاء وتصدير نسخ احتياطية مشفرة بكلمة مرور خاصة باستخدام خوارزميات التشفير المعيارية (AES-GCM / PBKDF2). لا يمكن لأي شخص بما في ذلك المطورون فك تشفير النسخة دون كلمة المرور المحددة من قبلك.',
        highlights: [
          'تشفير كامل لكافة السجلات المالية عند التصدير',
          'توليد تقارير Excel و PDF و CSV محلياً على جهازك',
          'إمكانية النسخ التلقائي للبريد الشخصي بأمان'
        ]
      },
      {
        icon: Trash2,
        color: '#ef4444',
        title: '5. حق الحذف والمسح الكامل للبيانات',
        description: 'أنت المتحكم الوحيد ببياناتك المالية. يمكنك في أي لحظة مسح كافة السجلات والعمليات بنقرة واحدة من صفحة الإعدادات عبر خيار "مسح كافة السجلات المالية". كما يؤدي إلغاء تثبيت التطبيق من جهازك إلى حذف قاعدة البيانات المحلية بالكامل وفوراً.',
        highlights: [
          'زر مسح شامل فوري وغير قابل للاسترجاع للسجلات المالية',
          'حذف التطبيق يزيل كافة الملفات والمفاتيح المخزنة محلياً',
          'عدم بقاء أي أثر لبياناتك على أي وسيط سحابي'
        ]
      },
      {
        icon: EyeOff,
        color: '#f59e0b',
        title: '6. انعدام الإعلانات وأدوات التتبع التجاري',
        description: 'تطبيق ثري خالٍ تماماً من حزم التتبع الإعلاني (Advertising SDKs)، شبكات التجسس السلوكي، وأكواد تعقب التحليلات التجارية للطرف الثالث. تجربتك المالية نقية، آمنة، وخاصة بك بالكامل.',
        highlights: [
          'صفر إعلانات تجارية مزعجة',
          'صفر متتبعات سلوكية تابعة لشبكات التواصل أو الإعلانات',
          'تجربة نظيفة ومهنية مصممة لراحة بالك'
        ]
      }
    ],
    contactTitle: 'الدعم الفني والتواصل الرسمي',
    contactDesc: 'إذا كان لديك أي أسئلة، استفسارات، أو اقتراحات بشأن سياسة الخصوصية وأمان البيانات، يسعدنا تواصلك معنا مباشرة عبر البريد الإلكتروني الرسمي المعتمد للتطبيق:',
    footerNote: 'تطبيق ثري - خصوصية مطلقة، تشفير محلي، وسيادة مالية كاملة على جهازك',
    copyright: `جميع الحقوق محفوظة © ${new Date().getFullYear()} تطبيق ثري`,
    backBtn: 'رجوع',
    switchLangBtn: 'English'
  },
  en: {
    title: 'Privacy Policy & Data Protection',
    subtitle: 'Your privacy and financial confidentiality are our utmost priority and core principle',
    lastUpdated: 'Last Updated: August 2024 (Version 1.2.0)',
    badgePrivacyFirst: 'Privacy-First (Local-First)',
    badgeEncrypted: 'Military-Grade Local Encryption',
    badgeNoTrackers: '100% Free of Trackers',
    sections: [
      {
        icon: Database,
        color: '#D9B978',
        title: '1. Local Storage & Complete Data Sovereignty',
        description: '"Thari" is built from the ground up using a Local-First architecture. All your financial transactions, wallets, debts, budgets, and Zakat logs are stored and processed strictly on your device. We operate no central servers that receive, collect, or store your financial records, granting you complete data sovereignty and absolute peace of mind.',
        highlights: [
          'Data is securely kept only within your device’s sandbox container',
          'Zero collection, sale, or sharing of personal financial records',
          'Full offline functionality without requiring an active internet connection'
        ]
      },
      {
        icon: Cpu,
        color: '#3b82f6',
        title: '2. Smart AI & Consultation (Optional & Anonymous)',
        description: 'When using the smart AI assistant for customized financial advice, inquiries are handled anonymously and transmitted via direct encrypted connections without associating any personal identifying markers. You can also run the built-in mathematical analytics engine completely offline.',
        highlights: [
          'AI query processing free of personal identifiers',
          'Support for custom API keys for total personal control',
          '100% offline local spending analytics and statistics'
        ]
      },
      {
        icon: Lock,
        color: '#10b981',
        title: '3. Device Security, PIN Protection & Biometrics',
        description: 'Thari allows you to lock access with a robust PIN code and enable native biometrics such as Face ID, Touch ID, or fingerprint sensors. Authentication takes place directly within your device’s isolated Secure Enclave, and the application never has access to your raw biometric data.',
        highlights: [
          'Standard OS-level biometric authentication support',
          'Instant lock and automated screen-locking on backgrounding',
          'Double verification when exporting or restoring sensitive records'
        ]
      },
      {
        icon: HardDrive,
        color: '#8b5cf6',
        title: '4. Encrypted Backups & Secure Exporting',
        description: 'You can generate and export backups encrypted with a custom password using industry-standard cryptography (AES-GCM / PBKDF2). No one—including the app developers—can decrypt or view your backup without your specific password.',
        highlights: [
          'Full client-side encryption of all financial records upon export',
          'Local generation of Excel, PDF, and CSV reports directly on your device',
          'Optional secure scheduled email backups'
        ]
      },
      {
        icon: Trash2,
        color: '#ef4444',
        title: '5. Right to Data Deletion & Complete Purge',
        description: 'You are the sole custodian of your financial data. At any time, you can purge all records and transaction logs in a single tap via the "Clear All Financial Records" setting. Furthermore, uninstalling the app permanently and instantaneously deletes the local database from your device.',
        highlights: [
          'Immediate, irreversible one-tap deletion button for all records',
          'App uninstallation automatically wipes all locally stored files and keys',
          'Zero residue or remnants left on any cloud server'
        ]
      },
      {
        icon: EyeOff,
        color: '#f59e0b',
        title: '6. No Advertising & Zero Commercial Trackers',
        description: 'Thari contains zero commercial advertising SDKs, behavioral telemetry trackers, or third-party marketing beacons. Your financial management experience remains clean, quiet, and exclusively yours.',
        highlights: [
          'Zero intrusive ads or popups',
          'Zero behavioral trackers linked to social or advertising networks',
          'A pristine, professional environment designed for your peace of mind'
        ]
      }
    ],
    contactTitle: 'Technical Support & Official Contact',
    contactDesc: 'If you have any questions, inquiries, or feedback regarding our privacy practices and data protection, please contact our official development team directly at:',
    footerNote: 'Thari App - Absolute Privacy, Local Encryption & Total Financial Sovereignty on Your Device',
    copyright: `All Rights Reserved © ${new Date().getFullYear()} Thari App`,
    backBtn: 'Back',
    switchLangBtn: 'العربية'
  }
};

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack, language = 'ar' }) => {
  const [currentLang, setCurrentLang] = useState<'ar' | 'en'>(language);
  const t = CONTENT[currentLang];
  const isRTL = currentLang === 'ar';

  const toggleLanguage = () => {
    setCurrentLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className="fixed inset-0 bg-[#0A0D10] text-[#F4F1EA] z-[450] flex flex-col animate-fade overflow-hidden"
    >
      {/* Top Header - Luxury Dark Navigation */}
      <header className="bg-[#11161C]/90 backdrop-blur-xl border-b border-white/10 p-4 pt-12 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onBack}
            className="p-2.5 bg-[#0A0D10] hover:bg-white/5 border border-white/10 rounded-2xl text-[#D9B978] active:scale-90 transition-all flex items-center gap-1.5"
            title={t.backBtn}
          >
            {isRTL ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
            <span className="text-xs font-black hidden sm:inline">{t.backBtn}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D9B978]/10 text-[#D9B978] flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#F4F1EA] tracking-tight">{t.title}</h2>
          </div>
        </div>

        {/* Language Switcher Badge */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="px-3.5 py-2 bg-[#D9B978]/10 hover:bg-[#D9B978]/20 border border-[#D9B978]/30 text-[#D9B978] rounded-xl text-xs font-black active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Globe size={14} />
          <span>{t.switchLangBtn}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full pb-28 text-start">
        
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-[#11161C] to-[#151c24] p-6 sm:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D9B978]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="w-20 h-20 bg-[#D9B978]/15 border border-[#D9B978]/30 rounded-3xl flex items-center justify-center mx-auto text-[#D9B978] shadow-xl shadow-[#D9B978]/10">
            <ShieldCheck size={42} strokeWidth={2.2} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-[#F4F1EA] tracking-tight">{t.subtitle}</h3>
            <p className="text-xs sm:text-sm text-slate-400 font-bold">{t.lastUpdated}</p>
          </div>

          {/* Badges Grid */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-[#D9B978]/10 border border-[#D9B978]/20 text-[#D9B978] text-[11px] font-black flex items-center gap-1.5">
              <CheckCircle2 size={13} /> {t.badgePrivacyFirst}
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center gap-1.5">
              <Lock size={13} /> {t.badgeEncrypted}
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-black flex items-center gap-1.5">
              <EyeOff size={13} /> {t.badgeNoTrackers}
            </span>
          </div>
        </div>

        {/* Detailed Sections List */}
        <div className="space-y-4">
          {t.sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <section 
                key={idx}
                className="bg-[#11161C] p-6 rounded-[2rem] border border-white/10 shadow-lg space-y-4 transition-all hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/5"
                    style={{ backgroundColor: `${section.color}15`, color: section.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <h4 className="font-black text-sm sm:text-base text-[#F4F1EA] tracking-wide">
                    {section.title}
                  </h4>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  {section.description}
                </p>

                {section.highlights && section.highlights.length > 0 && (
                  <div className="bg-[#0A0D10] p-4 rounded-2xl border border-white/5 space-y-2">
                    {section.highlights.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2.5 text-xs text-slate-400 font-bold">
                        <CheckCircle2 size={15} className="text-[#D9B978] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Contact Support Section */}
        <div className="bg-[#11161C] p-6 rounded-[2.5rem] border border-[#D9B978]/20 shadow-xl space-y-4">
          <div className="flex items-center gap-3 text-[#D9B978]">
            <div className="w-10 h-10 rounded-2xl bg-[#D9B978]/15 text-[#D9B978] flex items-center justify-center shrink-0">
              <Mail size={20} />
            </div>
            <h4 className="font-black text-sm sm:text-base text-[#F4F1EA]">{t.contactTitle}</h4>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {t.contactDesc}
          </p>

          <div className="pt-2">
            <a 
              href="mailto:thari-app@inbox.ru"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#D9B978] text-[#0A0D10] font-black text-xs sm:text-sm shadow-xl shadow-[#D9B978]/10 hover:bg-[#c9a764] active:scale-95 transition-all dir-ltr"
            >
              <Mail size={16} />
              <span>thari-app@inbox.ru</span>
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-8 pb-4 border-t border-white/10 text-center space-y-2">
          <p className="text-xs text-slate-400 font-bold">{t.footerNote}</p>
          <p className="text-xs text-[#D9B978] font-black">{t.copyright}</p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
