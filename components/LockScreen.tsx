
import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldCheck, ChevronLeft } from 'lucide-react';
import Logo from './Logo';

interface LockScreenProps {
  savedPin: string;
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ savedPin, onUnlock }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);
      if (newInput === savedPin) {
        if (window.navigator.vibrate) window.navigator.vibrate([10, 30, 10]);
        setTimeout(onUnlock, 300);
      } else if (newInput.length === 4) {
        setError(true);
        if (window.navigator.vibrate) window.navigator.vibrate(50);
        setTimeout(() => {
          setInput('');
          setError(false);
        }, 500);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[1000] flex flex-col items-center justify-center p-8 animate-fade">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
      
      <div className="mb-16 text-center space-y-4">
        <Logo size={80} />
        <div className="flex items-center justify-center gap-2 text-amber-500 mt-4">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">نظام ثري الآمن</span>
        </div>
      </div>

      <div className="space-y-8 text-center w-full max-w-xs">
        <h2 className="text-xl font-black text-white">أدخل رمز الدخول</h2>
        
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                input.length > i 
                  ? 'bg-amber-500 border-amber-500 scale-125' 
                  : 'border-slate-800'
              } ${error ? 'border-rose-500 bg-rose-500 animate-bounce' : ''}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 pt-10">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key, idx) => {
            if (key === '') return <div key={idx} />;
            if (key === 'delete') return (
              <button 
                key={idx}
                onClick={() => setInput(input.slice(0, -1))}
                className="w-16 h-16 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-900"
              >
                <ChevronLeft size={24} />
              </button>
            );
            return (
              <button 
                key={idx}
                onClick={() => handleKeyPress(key)}
                className="w-16 h-16 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center text-2xl font-black text-white active:bg-amber-500 active:text-slate-950 transition-all active:scale-90"
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
