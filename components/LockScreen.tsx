
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ChevronLeft, Fingerprint, ScanFace, AlertCircle, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import Logo from './Logo';
import { authenticateBiometrics, checkBiometricAvailable } from '../services/biometricService';

interface LockScreenProps {
  savedPin: string;
  isBiometricEnabled?: boolean;
  onUnlock: () => void;
}

type BioStatus = 'idle' | 'scanning' | 'success' | 'failed' | 'cancelled';

const LockScreen: React.FC<LockScreenProps> = ({ savedPin, isBiometricEnabled = true, onUnlock }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Face ID / البصمة');
  const [bioStatus, setBioStatus] = useState<BioStatus>('idle');
  const [bioFeedback, setBioFeedback] = useState<string>('');

  const triggerBiometricAuth = useCallback(async () => {
    if (bioStatus === 'scanning') return;
    setBioStatus('scanning');
    setBioFeedback(`جاري المسح والتحقق عبر ${biometricType}...`);
    setErrorMessage('');

    try {
      const result = await authenticateBiometrics('تأكيد الهوية لفتح تطبيق ثري');
      if (result.success) {
        setBioStatus('success');
        setBioFeedback('تم تأكيد الهوية بنجاح!');
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
          window.navigator.vibrate([20, 40, 20]);
        }
        setTimeout(onUnlock, 300);
      } else {
        if (result.isCancelled) {
          setBioStatus('cancelled');
          setBioFeedback('تم إلغاء المسح. انقر أدناه لإعادة المحاولة أو أدخل الرمز');
        } else {
          setBioStatus('failed');
          setBioFeedback(result.error || 'تعذر مطابقة البصمة، يرجى المحاولة ثانية');
        }
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
          window.navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (e) {
      console.warn('Biometric unlock error:', e);
      setBioStatus('failed');
      setBioFeedback('حدث خطأ غير متوقع أثناء المسح');
    }
  }, [bioStatus, biometricType, onUnlock]);

  useEffect(() => {
    let isMounted = true;
    checkBiometricAvailable().then((res) => {
      if (isMounted && res.isAvailable) {
        setBiometricAvailable(true);
        if (res.biometryType) {
          setBiometricType(res.biometryType);
        }
        if (isBiometricEnabled) {
          // Auto-trigger biometric prompt on screen load
          setTimeout(() => {
            if (isMounted) triggerBiometricAuth();
          }, 350);
        }
      }
    });
    return () => { isMounted = false; };
  }, [isBiometricEnabled, triggerBiometricAuth]);

  const handleKeyPress = (num: string) => {
    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);
      setErrorMessage('');
      
      if (newInput.length === 4) {
        if (newInput === savedPin) {
          setBioStatus('success');
          if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate([20, 40, 20]);
          }
          setTimeout(onUnlock, 150);
        } else {
          setError(true);
          setErrorMessage('رمز الدخول غير صحيح، حاول مجدداً');
          if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(150);
          }
          setTimeout(() => {
            setInput('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-center p-6 sm:p-8 animate-fade select-none overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-slate-950 pointer-events-none" />
      
      <div className="mb-4 sm:mb-6 text-center space-y-1.5 relative z-10">
        <Logo size={68} />
        <div className="flex items-center justify-center gap-1.5 text-amber-500 mt-2">
          <ShieldCheck size={16} />
          <span className="text-[11px] font-black uppercase tracking-widest">نظام حماية ثري المشفر</span>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5 text-center w-full max-w-xs relative z-10">
        <div>
          <h2 className="text-xl font-black text-white">أدخل رمز الدخول السري</h2>
          <p className="text-xs text-slate-400 font-bold mt-0.5">لحماية بياناتك ومعاملاتك المالية</p>
        </div>

        {/* Biometric Interactive Status Card / Visual Indicator */}
        {biometricAvailable && isBiometricEnabled && (
          <div className="transition-all duration-300">
            {bioStatus === 'scanning' && (
              <div className="flex items-center justify-center gap-2.5 bg-emerald-950/40 border border-emerald-500/40 py-2.5 px-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse">
                <div className="relative flex items-center justify-center">
                  <Fingerprint size={22} className="text-emerald-400 animate-spin-slow" />
                  <span className="absolute -inset-1 rounded-full border-2 border-emerald-400/50 animate-ping opacity-60 pointer-events-none" />
                </div>
                <span className="text-xs font-bold text-emerald-300">{bioFeedback}</span>
              </div>
            )}

            {bioStatus === 'success' && (
              <div className="flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/50 py-2.5 px-4 rounded-2xl shadow-lg animate-bounce">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span className="text-xs font-black text-emerald-300">تم التحقق بنجاح، جاري الدخول...</span>
              </div>
            )}

            {(bioStatus === 'failed' || bioStatus === 'cancelled') && (
              <button
                type="button"
                onClick={triggerBiometricAuth}
                className="w-full flex items-center justify-between bg-rose-950/40 border border-rose-500/40 py-2.5 px-4 rounded-2xl shadow-[0_0_15px_rgba(244,63,94,0.15)] active:scale-95 transition-transform group text-right"
              >
                <div className="flex items-center gap-2 text-rose-300">
                  <AlertCircle size={18} className="shrink-0 text-rose-400" />
                  <span className="text-xs font-bold leading-tight">{bioFeedback}</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-xl shrink-0">
                  <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                  إعادة
                </span>
              </button>
            )}

            {bioStatus === 'idle' && (
              <button
                type="button"
                onClick={triggerBiometricAuth}
                className="w-full flex items-center justify-center gap-2 bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 py-2.5 px-4 rounded-2xl text-emerald-400 active:scale-95 transition-all shadow-md group"
              >
                <Fingerprint size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">الفتح السريع بـ {biometricType}</span>
              </button>
            )}
          </div>
        )}
        
        {/* PIN 4-Dots Display */}
        <div className="flex justify-center items-center gap-5 py-1">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                input.length > i 
                  ? 'bg-amber-500 border-amber-500 scale-125 shadow-[0_0_12px_rgba(245,158,11,0.6)]' 
                  : 'border-slate-700 bg-slate-900/60'
              } ${error ? 'border-rose-500 bg-rose-500 animate-bounce shadow-[0_0_12px_rgba(244,63,94,0.8)]' : ''}`}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1.5 animate-shake">
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3.5 sm:gap-4 pt-1" dir="ltr">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'delete'].map((key, idx) => {
            if (key === 'bio') {
              const isScanning = bioStatus === 'scanning';
              const isFailed = bioStatus === 'failed';
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={triggerBiometricAuth}
                  disabled={isScanning}
                  title="الفتح بالبصمة أو Face ID"
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full border flex items-center justify-center transition-all active:scale-90 shadow-md mx-auto relative ${
                    isScanning
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/40 animate-pulse'
                      : isFailed
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 active:bg-emerald-500 active:text-slate-950'
                  }`}
                >
                  <Fingerprint size={28} className={isScanning ? 'animate-pulse scale-110' : ''} />
                  {isScanning && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping" />
                  )}
                </button>
              );
            }
            if (key === 'delete') {
              return (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInput(p => p.slice(0, -1));
                    setErrorMessage('');
                  }}
                  title="مسح"
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-900 active:scale-90 transition-all mx-auto"
                >
                  <ChevronLeft size={26} />
                </button>
              );
            }
            return (
              <button 
                key={idx}
                type="button"
                onClick={() => handleKeyPress(key)}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-2xl font-black text-white hover:border-amber-500/40 active:bg-amber-500 active:text-slate-950 transition-all active:scale-90 shadow-sm mx-auto"
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Action button if user wants to trigger Face ID / Touch ID manually */}
        {biometricAvailable && isBiometricEnabled && bioStatus !== 'scanning' && (
          <button
            type="button"
            onClick={triggerBiometricAuth}
            className="w-full py-3 px-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md mt-2 hover:bg-emerald-500/20"
          >
            <ScanFace size={18} />
            <span>إعادة التحقق بـ {biometricType}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LockScreen;

