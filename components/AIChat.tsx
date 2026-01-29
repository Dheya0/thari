
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, MessageSquareQuote } from 'lucide-react';
import { ChatMessage, Transaction, Category } from '../types';
import { chatWithThari } from '../services/geminiService';

interface AIChatProps {
  history: ChatMessage[];
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onSendMessage: (msg: ChatMessage) => void;
}

const AIChat: React.FC<AIChatProps> = ({ history, transactions, categories, currency, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    onSendMessage(userMsg);
    setInput('');
    setIsLoading(true);

    const responseText = await chatWithThari(input, history, { transactions, categories, currency });
    const aiMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
    onSendMessage(aiMsg);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full min-h-[60vh] animate-fade">
      {/* Header Info */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-amber-500/10 rounded-[2.5rem] border border-amber-500/20 shadow-lg shadow-amber-500/5">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg">
          <Bot size={28} />
        </div>
        <div>
          <h3 className="font-black text-white text-sm">ثري الذكي</h3>
          <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest opacity-80">مستشارك المالي الشخصي</p>
        </div>
      </div>

      {/* Messages List - Flexible Height */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar space-y-6 px-1 pb-4">
        {history.length === 0 && (
          <div className="text-center py-16 space-y-4 opacity-40">
            <MessageSquareQuote size={48} className="mx-auto text-slate-700" />
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest max-w-[200px] mx-auto">
              أهلاً بك! أنا هنا لتحليل مصاريفك وتقديم نصائح لزيادة وفرتك. اسألني أي شيء.
            </p>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-slide-up`}>
            <div className={`max-w-[88%] p-5 rounded-[2.2rem] shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-br-none border border-slate-800' 
                : 'bg-amber-500 text-slate-950 rounded-bl-none font-bold'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end animate-pulse">
            <div className="bg-amber-500/20 p-5 rounded-[2.2rem] rounded-bl-none border border-amber-500/30 flex items-center gap-3">
              <Loader2 className="animate-spin text-amber-500" size={18} />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">ثري يحلل بياناتك...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom of flex container */}
      <div className="mt-4 pb-2 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="كيف يمكنني مساعدتك مالياً اليوم؟"
          className="w-full bg-slate-900 border border-white/5 p-5 rounded-[2.2rem] text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all pr-16"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="absolute left-2 top-2 bottom-4 w-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 active:scale-90 disabled:opacity-50 transition-all shadow-lg"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default AIChat;
