
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Key, Settings, AlertTriangle, Loader2, StopCircle } from 'lucide-react';
import { ChatMessage, Transaction, Category } from '../types';
import { chatWithThari } from '../services/geminiService';

interface AIChatProps {
  history: ChatMessage[];
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onSendMessage: (msg: ChatMessage) => void;
  apiKey?: string;
  setActiveTab?: (tab: any) => void; // Optional to redirect to settings
}

const AIChat: React.FC<AIChatProps> = ({ history, transactions, categories, currency, onSendMessage, apiKey, setActiveTab }) => {
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

  // --- State 1: No API Key Provided ---
  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8 space-y-8 animate-fade">
        <div className="w-32 h-32 bg-slate-900 rounded-[3rem] flex items-center justify-center border border-slate-800 shadow-2xl relative">
           <Bot size={64} className="text-slate-700" />
           <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-3 rounded-2xl shadow-lg animate-bounce">
              <Key size={20} strokeWidth={2.5} />
           </div>
        </div>

        <div className="space-y-4 max-w-xs mx-auto">
           <h3 className="text-2xl font-black text-white">تفعيل المساعد الذكي</h3>
           <p className="text-sm font-bold text-slate-500 leading-relaxed">
             للحفاظ على خصوصيتك واستمرارية الخدمة، يتطلب "ثري" مفتاح API خاص بك من Google Gemini.
           </p>
           
           <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-[10px] text-amber-600 font-bold leading-relaxed">
              الخدمة مجانية تماماً من Google. نحن لا نخزن مفتاحك في أي خوادم خارجية.
           </div>

           {/* Note: In a real implementation, you might pass a function to switch tabs via props. 
               Assuming user knows to go to settings or using a direct link if implemented. */}
           <div className="pt-4">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">اذهب إلى الإعدادات {'>'} مفتاح Gemini API</p>
           </div>
        </div>
      </div>
    );
  }

  // --- State 2: Active Chat ---
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    onSendMessage(userMsg);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const responseText = await chatWithThari(input, history, { transactions, categories, currency }, apiKey);
      
      // Basic validation check on response
      if (responseText.includes("تأكد من صحة مفتاح")) {
         setError("المفتاح المدخل غير صالح. يرجى التأكد منه في الإعدادات.");
      }

      const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      onSendMessage(botMsg);
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال. تأكد من الإنترنت والمفتاح.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] relative animate-fade">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-6 pb-24">
        {history.length === 0 && (
           <div className="text-center py-10 opacity-50">
              <Sparkles className="mx-auto text-amber-500 mb-4" size={40} />
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">أنا ثري، مستشارك المالي.<br/>كيف يمكنني مساعدتك اليوم؟</p>
           </div>
        )}

        {history.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isUser ? 'bg-slate-800 text-slate-400' : 'bg-amber-500 text-slate-950'}`}>
                {isUser ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-bold leading-relaxed ${
                isUser 
                  ? 'bg-slate-800 text-white rounded-tr-sm' 
                  : 'bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-500/10 text-slate-200 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
           <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                <Loader2 size={16} className="text-slate-950 animate-spin" />
              </div>
              <div className="bg-slate-900/50 p-4 rounded-2xl rounded-tl-sm border border-white/5">
                 <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
              </div>
           </div>
        )}

        {error && (
            <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold mx-4 animate-pulse">
                <AlertTriangle size={16} /> {error}
            </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl p-4 border-t border-white/5">
        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder="اسأل ثري عن وضعك المالي..."
            className="w-full bg-slate-900 text-white text-sm font-bold p-4 pl-12 rounded-3xl border border-slate-800 focus:border-amber-500/50 outline-none resize-none max-h-32 min-h-[56px] shadow-xl"
            rows={1}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className={`absolute left-2 bottom-2 p-3 rounded-full transition-all ${
                input.trim() && !loading ? 'bg-amber-500 text-slate-950 hover:scale-110 active:scale-90' : 'bg-slate-800 text-slate-600'
            }`}
          >
            {loading ? <StopCircle size={18} className="animate-pulse" /> : <Send size={18} className={input.trim() ? 'ml-0.5' : ''} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
