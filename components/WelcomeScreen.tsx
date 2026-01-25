
import React from 'react';
import { ShieldCheck, BrainCircuit, Wallet, ChevronLeft } from 'lucide-react';
import Logo from './Logo';

interface WelcomeScreenProps {
  onAccept: () => void;
  onShowPrivacy: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onAccept, onShowPrivacy }) => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[200] flex flex-col p-8 overflow-y-auto animate-in fade-in duration-700">
      <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[40%] bg-amber-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[60%] h-[30%] bg-blue-500/5 blur-[80px] rounded-full" />

      <div className="relative flex-1 flex flex-col items-center justify-center max-w-md mx-auto py-12">
        <div className="mb-12 relative">
          <Logo size={120} />
        </div>

        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">مرحباً بك في ثري</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">المحاسب الذكي الذي يحمي خصوصيتك ويضاعف وفرتك.</p>
        </div>

        <div className="w-full space-y-8 mb-16">
          <FeatureItem 
            icon={<ShieldCheck className="text-emerald-500" />}
            title="خصوصية مطلقة"
            desc="بياناتك المالية لا تغادر جهازك أبداً، تخزين محلي بالكامل."
          />
          <FeatureItem 
            icon={<BrainCircuit className="text-amber-500" />}
            title="ذكاء اصطناعي مالي"
            desc="تحليلات عميقة ونوافذ ذكية لتحسين عاداتك في الإنفاق والادخار."
          />
          <FeatureItem 
            icon={<Wallet className="text-blue-500" />}
            title="تقسيم المحافظ"
            desc="خصص ميزانياتك للراتب، العمولات، والمدخرات في محافظ مستقلة."
          />
        </div>

        <div className="w-full space-y-6 mt-auto">
          <p className="text-[11px] text-slate-400 text-center leading-relaxed px-4">
            بالضغط على "الموافقة والمتابعة"، فإنك تقر بموافقتك على 
            <button onClick={onShowPrivacy} className="text-amber-600 font-black mx-1 underline">سياسة الخصوصية</button> 
          </p>
          
          <button 
            onClick={onAccept}
            className="w-full bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            الموافقة والمتابعة
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex gap-5 items-start">
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
      {icon}
    </div>
    <div className="space-y-1">
      <h4 className="font-black text-slate-800 dark:text-white text-base">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
    </div>
  </div>
);

export default WelcomeScreen;
