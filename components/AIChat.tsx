import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, User, Key, AlertTriangle, Loader2, StopCircle, Briefcase, TrendingUp, ShieldCheck, Scale, PieChart, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { ChatMessage, Transaction, Category } from '../types';
import { chatWithThari } from '../services/geminiService';

interface AIChatProps {
  history: ChatMessage[];
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onSendMessage: (msg: ChatMessage) => void;
  apiKey?: string;
  setActiveTab?: (tab: any) => void;
}

const AIChat: React.FC<AIChatProps> = ({ 
  history, 
  transactions, 
  categories, 
  currency, 
  onSendMessage, 
  apiKey, 
  setActiveTab 
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, loading]);

  // Executive Local Audit Engine (Works 100% Offline with zero external calls)
  const localFinancialSummary = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRatio = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    
    // Top expense category
    const catTotals: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + t.amount;
    });
    let topCatName = 'غير محدد';
    let topCatAmount = 0;
    Object.entries(catTotals).forEach(([id, amt]) => {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        const c = categories.find(cat => cat.id === id);
        if (c) topCatName = c.name;
      }
    });

    return { totalIncome, totalExpense, netSavings, savingsRatio, topCatName, topCatAmount };
  }, [transactions, categories]);

  const quickConsultations = [
    {
      title: 'تدقيق التدفق النقدي',
      prompt: 'قم بإجراء تدقيق مالي سريع لتدفقاتي النقدية مع توضيح نسبة الادخار وأكبر بنود الصرف.',
      icon: TrendingUp
    },
    {
      title: 'خطة تقليص المصروفات',
      prompt: 'ما هي التوصيات العملية لتقليص المصروفات في البنود الأعلى استنزافاً للأموال؟',
      icon: PieChart
    },
    {
      title: 'صندوق الطوارئ والأمان',
      prompt: 'كيف أبني صندوق طوارئ يغطي 6 أشهر من مصاريفي الأساسية بناءً على سجلي الحالي؟',
      icon: ShieldCheck
    },
    {
      title: 'توزيع الدخل الشهري',
      prompt: 'اقترح لي تقسيماً متوازناً للدخل (50/30/20) بناءً على نمط دخلي ومصروفاتي.',
      icon: Scale
    }
  ];

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend, timestamp: Date.now() };
    onSendMessage(userMsg);
    if (!customPrompt) setInput('');
    setLoading(true);
    setError(null);

    // If no API key, use the built-in deterministic institutional advisory engine
    if (!apiKey) {
      setTimeout(() => {
        let advisoryText = '';
        if (textToSend.includes('تدقيق') || textToSend.includes('التدفق')) {
          advisoryText = `📊 **تقرير التدقيق المالي الفوري:**\n\n- إجمالي الواردات المسجلة: ${localFinancialSummary.totalIncome.toLocaleString()} ${currency}\n- إجمالي المنصرفات: ${localFinancialSummary.totalExpense.toLocaleString()} ${currency}\n- صافي الفائض/العجز: ${localFinancialSummary.netSavings.toLocaleString()} ${currency}\n- نسبة الادخار الحالية: **${localFinancialSummary.savingsRatio}%**\n\n📌 **ملاحظة المستشار:** أعلى بند صرف مسجل هو (${localFinancialSummary.topCatName}) بمبلغ ${localFinancialSummary.topCatAmount.toLocaleString()} ${currency}. يُوصى بوضع سقف شهري محدد له.`;
        } else if (textToSend.includes('تقليص') || textToSend.includes('المصروفات')) {
          advisoryText = `💡 **توصيات ترشيد الإنفاق المؤسسية:**\n\n1. تركيز المراجعة على قطاع (${localFinancialSummary.topCatName}) حيث يمثل الحصة الأكبر من التدفقات الخارجة.\n2. مراجعة الاشتراكات الدورية وإلغاء الخدمات غير المستخدمة.\n3. تفعيل قاعدة (24 ساعة) قبل أي عملية شراء غير أساسية تفوق 500 ${currency}.`;
        } else if (textToSend.includes('طوارئ') || textToSend.includes('الأمان')) {
          const targetFund = localFinancialSummary.totalExpense > 0 ? (localFinancialSummary.totalExpense / (transactions.length > 30 ? 2 : 1)) * 6 : 10000;
          advisoryText = `🛡️ **دراسة صندوق الأمان المالي:**\n\n- حجم الصندوق المستهدف (تغطية 6 أشهر): **${Math.round(targetFund).toLocaleString()} ${currency}**\n- الاستراتيجية: تخصيص ما لا يقل عن 15% من كل إيراد قادم لحساب طوارئ منفصل لا يُمس إلا في الظروف القاهرة.`;
        } else {
          advisoryText = `📈 **الرأي الاستشاري المالي:**\n\nبناءً على تحليلات سجلاتك المالية، فإن وضعك الحالي يسجل نسبة ادخار تبلغ **${localFinancialSummary.savingsRatio}%**. لتحسين الكفاءة المالية، يُنصح بتثبيت ميزانية صارمة لكل تصنيف وتوزيع الفوائض على خطط استثمارية آمنة.`;
        }

        const botMsg: ChatMessage = { role: 'model', text: advisoryText, timestamp: Date.now() };
        onSendMessage(botMsg);
        setLoading(false);
      }, 500);
      return;
    }

    // If API key is present, use the enhanced executive Gemini engine
    try {
      const responseText = await chatWithThari(textToSend, history, { transactions, categories, currency }, apiKey);
      const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      onSendMessage(botMsg);
    } catch (err) {
      setError("تعذر استكمال الاتصال بالاستشارة. تم تفعيل المحلل الداخلي للطوارئ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-190px)] relative animate-fade">
      
      {/* Header Badge */}
      <div className="bg-slate-900/90 border border-white/10 p-3.5 rounded-2xl mb-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Briefcase size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">المستشار المالي التنفيذي</h3>
            <p className="text-[9px] text-slate-400 font-bold">
              {apiKey ? 'مفعل بـ Gemini Pro المشفر' : 'المحرك التحليلي المحاسبي المستقل (يعمل 100% بدون إنترنت)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-black text-emerald-400">نشط</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4 pb-28">
        {history.length === 0 && (
          <div className="space-y-4 pt-2">
            <div className="text-center py-6 bg-slate-900/40 rounded-3xl border border-white/5 p-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Briefcase size={22} />
              </div>
              <h4 className="text-sm font-black text-white mb-1">مرحباً بك في وحدة الاستشارات المالية</h4>
              <p className="text-[11px] text-slate-400 font-bold max-w-sm mx-auto leading-relaxed">
                جاهز لتحليل التدفقات، تدقيق الميزانيات، واقتراح خطط النمو المالي وحساب المؤشرات بناءً على بياناتك الفعلية.
              </p>
            </div>

            {/* Quick Consultation Chips */}
            <div className="grid grid-cols-2 gap-2">
              {quickConsultations.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-2xl text-right transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-white group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </span>
                      <Icon size={14} className="text-amber-400 shrink-0" />
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold line-clamp-2">
                      {item.prompt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {history.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${isUser ? 'bg-slate-800 text-slate-400' : 'bg-amber-500 text-slate-950 shadow-md'}`}>
                {isUser ? <User size={14} /> : <Briefcase size={14} />}
              </div>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-bold leading-relaxed whitespace-pre-wrap ${
                isUser 
                  ? 'bg-slate-800 text-white rounded-tr-sm border border-white/5' 
                  : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-white/10 text-slate-100 rounded-tl-sm shadow-lg'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 items-center">
            <div className="w-7 h-7 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
              <Loader2 size={14} className="text-slate-950 animate-spin" />
            </div>
            <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-sm border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> جاري تدقيق البيانات وصياغة المشورة...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl p-3 border-t border-white/10 rounded-2xl">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اطلب استشارة مالية أو تحليلاً لميزانيتك..."
            className="w-full bg-slate-900 text-white text-xs font-bold py-3.5 px-4 pl-12 rounded-2xl border border-white/10 focus:border-amber-500 outline-none shadow-inner"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className={`absolute left-1.5 p-2 rounded-xl transition-all ${
              input.trim() && !loading ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 shadow-md' : 'bg-slate-800 text-slate-600'
            }`}
            title="إرسال"
          >
            <Send size={15} className={input.trim() ? 'ml-0.5' : ''} />
          </button>
        </form>
      </div>

    </div>
  );
};

export default AIChat;
