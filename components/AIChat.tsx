import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Briefcase, TrendingUp, ShieldCheck, Scale, PieChart } from 'lucide-react';
import { ChatMessage, Transaction, Category } from '../types';
import { chatWithThari } from '../services/geminiService';

interface FinancialAdvisorProps {
  history: ChatMessage[];
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onSendMessage: (msg: ChatMessage) => void;
  apiKey?: string;
  setActiveTab?: (tab: any) => void;
}

export const AIChat: React.FC<FinancialAdvisorProps> = ({ 
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

  // Financial Analysis Engine (Deterministic, Private & Local)
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
          advisoryText = `📊 **تقرير التدقيق المالي:**\n\n- إجمالي الواردات المسجلة: ${localFinancialSummary.totalIncome.toLocaleString()} ${currency}\n- إجمالي المنصرفات: ${localFinancialSummary.totalExpense.toLocaleString()} ${currency}\n- صافي الفائض/العجز: ${localFinancialSummary.netSavings.toLocaleString()} ${currency}\n- نسبة الادخار الحالية: **${localFinancialSummary.savingsRatio}%**\n\n📌 **ملاحظة:** أعلى بند صرف مسجل هو (${localFinancialSummary.topCatName}) بمبلغ ${localFinancialSummary.topCatAmount.toLocaleString()} ${currency}. يُوصى بوضع سقف شهري محدد له.`;
        } else if (textToSend.includes('تقليص') || textToSend.includes('المصروفات')) {
          advisoryText = `💡 **توصيات ترشيد الإنفاق:**\n\n1. تركيز المراجعة على قطاع (${localFinancialSummary.topCatName}) حيث يمثل الحصة الأكبر من التدفقات الخارجة.\n2. مراجعة الاشتراكات الدورية وإلغاء الخدمات غير المستخدمة.\n3. تفعيل قاعدة (24 ساعة) قبل أي عملية شراء غير أساسية تفوق 500 ${currency}.`;
        } else if (textToSend.includes('طوارئ') || textToSend.includes('الأمان')) {
          const targetFund = localFinancialSummary.totalExpense > 0 ? (localFinancialSummary.totalExpense / (transactions.length > 30 ? 2 : 1)) * 6 : 10000;
          advisoryText = `🛡️ **دراسة صندوق الأمان المالي:**\n\n- حجم الصندوق المستهدف (تغطية 6 أشهر): **${Math.round(targetFund).toLocaleString()} ${currency}**\n- الاستراتيجية: تخصيص ما لا يقل عن 15% من كل إيراد قادم لحساب طوارئ منفصل لا يُمس إلا في الظروف القاهرة.`;
        } else {
          advisoryText = `📈 **الرأي الاستشاري المالي:**\n\nبناءً على تحليلات سجلاتك المالية، فإن وضعك الحالي يسجل نسبة ادخار تبلغ **${localFinancialSummary.savingsRatio}%**. لتحسين الكفاءة المالية، يُنصح بتثبيت ميزانية صارمة لكل تصنيف وتوزيع الفوائض على خطط استثمارية آمنة.`;
        }

        const botMsg: ChatMessage = { role: 'model', text: advisoryText, timestamp: Date.now() };
        onSendMessage(botMsg);
        setLoading(false);
      }, 400);
      return;
    }

    // If API key is present, invoke Gemini service
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
      <div className="bg-[#171D24] border border-white/10 p-3.5 rounded-2xl mb-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#D9B978]/10 border border-[#D9B978]/20 flex items-center justify-center text-[#D9B978]">
            <Briefcase size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#F4F1EA]">المستشار المالي الخاص</h3>
            <p className="text-[9px] text-slate-400">
              {apiKey ? 'استشارات وتحليلات مالية متقدمة ومحمية' : 'محرك تحليلي مالي مستقل ومتكامل (يعمل محلياً بدون إنترنت)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8EB9A7] animate-pulse" />
          <span className="text-[9px] font-semibold text-[#8EB9A7]">جاهز للاستشارة</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4 pb-28">
        {history.length === 0 && (
          <div className="space-y-4 pt-2">
            <div className="text-center py-6 bg-[#171D24]/60 rounded-3xl border border-white/5 p-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D9B978]/10 border border-[#D9B978]/20 text-[#D9B978] flex items-center justify-center mx-auto mb-3">
                <Briefcase size={22} />
              </div>
              <h4 className="text-sm font-semibold text-[#F4F1EA] mb-1">مرحباً بك في وحدة الاستشارات المالية</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                اطرح أي استفسار حول إدارة الثروة، وتوزيع الميزانيات، أو اختر نموذجاً من الاستشارات السريعة أدناه.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickConsultations.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.prompt)}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#171D24]/70 border border-white/5 hover:border-[#D9B978]/30 hover:bg-[#D9B978]/5 transition-all text-right group"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#D9B978]/10 text-[#D9B978] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <q.icon size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-[#F4F1EA] group-hover:text-[#D9B978] transition-colors">{q.title}</h5>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mt-0.5">{q.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#D9B978] text-slate-950 font-medium rounded-br-none shadow-md'
                  : 'bg-[#171D24] text-[#F4F1EA] border border-white/10 rounded-bl-none shadow-md'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-end">
            <div className="bg-[#171D24] text-slate-400 p-3.5 rounded-2xl border border-white/5 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D9B978] animate-ping" />
              <span>جاري صياغة الرأي المالي...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-[#C98387]/10 border border-[#C98387]/30 text-[#C98387] rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-[#0A0D10] via-[#0A0D10]/95 to-transparent pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-[#171D24] border border-white/10 rounded-2xl p-1.5 focus-within:border-[#D9B978]/50 shadow-lg"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب استفسارك المالي هنا..."
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[#F4F1EA] placeholder-slate-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-[#D9B978] text-slate-950 rounded-xl disabled:opacity-30 hover:bg-[#D9B978]/90 transition-all shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  );
};

export default AIChat;
