
import React from 'react';
import { Bot, Lock, Sparkles, Construction } from 'lucide-react';
import { ChatMessage, Transaction, Category } from '../types';

interface AIChatProps {
  history: ChatMessage[];
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onSendMessage: (msg: ChatMessage) => void;
}

const AIChat: React.FC<AIChatProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 space-y-8 animate-fade">
      <div className="relative group">
         <div className="w-32 h-32 bg-slate-900 rounded-[3rem] flex items-center justify-center border border-slate-800 shadow-2xl transition-transform group-hover:scale-105">
            <Bot size={64} className="text-slate-700 group-hover:text-slate-600 transition-colors" />
         </div>
         
         {/* Lock Icon */}
         <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-3 rounded-2xl shadow-lg shadow-amber-500/20 animate-bounce">
            <Lock size={20} strokeWidth={2.5} />
         </div>
         
         {/* Decor icon */}
         <div className="absolute -top-2 -left-2 bg-slate-800 text-slate-500 p-3 rounded-2xl border border-slate-700">
            <Sparkles size={20} />
         </div>
      </div>

      <div className="space-y-4 max-w-xs mx-auto">
         <h3 className="text-2xl font-black text-white">المساعد الذكي قيد التطوير</h3>
         
         <p className="text-sm font-bold text-slate-500 leading-relaxed">
           نعمل حالياً على ترقية "ثري الذكي" لتقديم تحليلات مالية أكثر دقة وعمقاً باستخدام أحدث تقنيات الذكاء الاصطناعي.
         </p>
         
         <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-3xl mt-4">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center justify-center gap-2">
               <Construction size={14} /> ستتوفر الخدمة قريباً
            </p>
         </div>
      </div>
    </div>
  );
};

export default AIChat;
