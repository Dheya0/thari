import React from 'react';
import { ShieldCheck, BrainCircuit, Wallet, ChevronLeft, Sparkles } from 'lucide-react';
import Logo from './Logo';

interface WelcomeScreenProps {
  onAccept: () => void;
  onShowPrivacy: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onAccept, onShowPrivacy }) => {
  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-[200] flex flex-col justify-between p-5 sm:p-6 overflow-y-auto select-none">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-sm mx-auto my-auto flex flex-col items-center text-center space-y-6 py-4">
        {/* Sleek Logo & Header with Official Hashtag */}
        <div className="space-y-3 flex flex-col items-center">
          {/* Official Financial Hashtag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border border-amber-500/35 text-amber-400 text-[11px] font-black tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse select-none">
            <Sparkles size={11} className="text-amber-400" />
            <span>#ثري_للنمو_المالي</span>
          </div>

          <div className="relative p-1">
            <Logo size={64} />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              مرحباً بك في <span className="text-amber-400">ثري</span>
            </h1>
            <p className="text-xs text-slate-400 font-bold max-w-xs leading-relaxed">
              محاسبك المالي الذكي لإدارة مصاريفك، مدخراتك، وديونك بخصوصية كاملة.
            </p>
          </div>
        </div>

        {/* Compact Modern Feature Highlights */}
        <div className="w-full space-y-2.5 text-right">
          <FeatureItem 
            icon={<ShieldCheck size={18} className="text-emerald-400" />}
            title="خصوصية وتشفير محلي"
            desc="بياناتك المالية محفوظة في جهازك بالكامل ومحمية ببصمتك."
          />
          <FeatureItem 
            icon={<BrainCircuit size={18} className="text-amber-400" />}
            title="ذكاء مالي واستشارات"
            desc="رؤى تحليلية فورية للمصاريف ومساعد مالي ذكي لمضاعفة وفرتك."
          />
          <FeatureItem 
            icon={<Wallet size={18} className="text-blue-400" />}
            title="محافظ متعددة وعملات"
            desc="تقسيم مالي سلس للراتب، المدخرات، الديون، وحساب الزكاة."
          />
        </div>

        {/* Footer Actions */}
        <div className="w-full space-y-3 pt-2">
          <button 
            onClick={onAccept}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 px-6 rounded-2xl font-black text-sm shadow-[0_10px_25px_rgba(245,158,11,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            <span>البدء واستخدام التطبيق</span>
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          <p className="text-[11px] text-slate-400 text-center font-bold leading-relaxed">
            بالبدء، فإنك توافق على 
            <button 
              type="button" 
              onClick={onShowPrivacy} 
              className="text-amber-400 hover:text-amber-300 font-black mx-1 underline underline-offset-4 cursor-pointer"
            >
              سياسة الخصوصية والاستخدام
            </button> 
          </p>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-sm hover:border-slate-700 transition-all">
    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
      {icon}
    </div>
    <div className="space-y-0.5 min-w-0">
      <h4 className="font-black text-white text-xs leading-tight">{title}</h4>
      <p className="text-[10px] text-slate-400 leading-snug font-bold line-clamp-1">{desc}</p>
    </div>
  </div>
);

export default WelcomeScreen;
