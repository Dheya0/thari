
import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldCheck, ChevronLeft, Fingerprint, ScanFace } from 'lucide-react';
import Logo from './Logo';
import { authenticateBiometrics, checkBiometricAvailable } from '../services/biometricService';

interface LockScreenProps {
  savedPin: string;
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ savedPin, onUnlock }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('البصمة / Face ID');

  useEffect(() => {
    let isMounted = true;
    checkBiometricAvailable().then((res) => {
      if (isMounted && res.isAvailable) {
        setBiometricAvailable(true);
        if (res.biometryType) {
          setBiometricType(res.biometryType);
        }
        // Auto-trigger biometric prompt on screen load
        handleBiometricAuth();
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleBiometricAuth = async () => {
    const success = await authenticateBiometrics('افتح تطبيق ثري بصمة الوجه أو الإبهام');
    if (success) {
      if (window.navigator.vibrate) window.navigator.vibrate([10, 30, 10]);
      onUnlock();
    }
  };

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
      
      <div className="mb-12 text-center space-y-3">
        <Logo size={80} />
        <div className="flex items-center justify-center gap-2 text-amber-500 mt-3">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">نظام ثري الآمن</span>
        </div>
      </div>

      <div className="space-y-6 text-center w-full max-w-xs">
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

        <div className="grid grid-cols-3 gap-5 pt-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'delete'].map((key, idx) => {
            if (key === 'bio') {
              return (
                <button
                  key={idx}
                  onClick={handleBiometricAuth}
                  title="الفتح بالبصمة / Face ID"
                  className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 active:bg-emerald-500 active:text-slate-950 transition-all active:scale-90 shadow-md"
                >
                  <Fingerprint size={28} />
                </button>
              );
            }
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

        {biometricAvailable && (
          <button
            onClick={handleBiometricAuth}
            className="w-full py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <ScanFace size={18} />
            <span>الفتح التلقائي بـ {biometricType}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LockScreen;
