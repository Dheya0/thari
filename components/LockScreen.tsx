import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, ChevronLeft, Fingerprint, ScanFace, AlertCircle, RefreshCw, CheckCircle2, Lock, Timer } from 'lucide-react';
import Logo from './Logo';
import { authenticateBiometrics, checkBiometricAvailable } from '../services/biometricService';
import { verifyPinDetailed, getRateLimitStatus, recordFailedAttempt, clearRateLimit } from '../services/securityService';
import { App as CapApp } from '@capacitor/app';

interface LockScreenProps {
  savedPin: string;
  pinSalt?: string;
  isBiometricEnabled?: boolean;
  onUnlock: () => void;
  onRehashPin?: (newPinHash: string, newSalt: string) => void;
}

type BioStatus = 'idle' | 'scanning' | 'success' | 'failed' | 'cancelled';

const LockScreen: React.FC<LockScreenProps> = ({ 
  savedPin, 
  pinSalt, 
  isBiometricEnabled = true, 
  onUnlock,
  onRehashPin
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Face ID / البصمة');
  const [isFaceId, setIsFaceId] = useState(false);
  const [bioStatus, setBioStatus] = useState<BioStatus>('idle');
  const [bioFeedback, setBioFeedback] = useState<string>('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const isScanningRef = useRef(false);
  const lastAttemptTimeRef = useRef(0);

  // Check rate limit on mount and run cooldown interval
  useEffect(() => {
    const status = getRateLimitStatus();
    if (status.isLocked) {
      setCooldownRemaining(status.remainingSeconds);
    }

    const interval = setInterval(() => {
      const current = getRateLimitStatus();
      if (current.isLocked) {
        setCooldownRemaining(current.remainingSeconds);
      } else {
        setCooldownRemaining(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const triggerBiometricAuth = useCallback(async (isAutoTrigger = false) => {
    if (isScanningRef.current) return;
    
    const now = Date.now();
    if (isAutoTrigger && now - lastAttemptTimeRef.current < 800) return;
    lastAttemptTimeRef.current = now;

    isScanningRef.current = true;
    setBioStatus('scanning');
    setBioFeedback(`جاري المسح والتحقق عبر ${biometricType}...`);
    setErrorMessage('');

    try {
      const result = await authenticateBiometrics('تأكيد الهوية لفتح تطبيق ثري');
      if (result.success) {
        setBioStatus('success');
        setBioFeedback('تم تأكيد الهوية بنجاح!');
        clearRateLimit();
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
          window.navigator.vibrate([20, 40, 20]);
        }
        setTimeout(onUnlock, 250);
      } else {
        if (result.needsUserGesture || (isAutoTrigger && !result.isCancelled)) {
          setBioStatus('idle');
          setBioFeedback('');
          isScanningRef.current = false;
          return;
        }

        if (result.isCancelled) {
          setBioStatus('cancelled');
          setBioFeedback('تم إلغاء المسح. انقر للفتح أو أدخل الرمز');
        } else {
          setBioStatus('failed');
          setBioFeedback(result.error || 'تعذر مطابقة البصمة، يرجى إدخال رمز PIN');
        }
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
          window.navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (e) {
      console.warn('Biometric unlock error:', e);
      if (isAutoTrigger) {
        setBioStatus('idle');
        setBioFeedback('');
      } else {
        setBioStatus('failed');
        setBioFeedback('تعذر فحص البصمة، يرجى إدخال رمز الدخول');
      }
    } finally {
      isScanningRef.current = false;
    }
  }, [biometricType, onUnlock]);

  // Initial availability check
  useEffect(() => {
    let isMounted = true;
    checkBiometricAvailable().then((res) => {
      if (isMounted && res.isAvailable) {
        setBiometricAvailable(true);
        if (res.biometryType) {
          setBiometricType(res.biometryType);
        }
        setIsFaceId(!!res.isFaceId);

        if (isBiometricEnabled) {
          setTimeout(() => {
            if (isMounted) triggerBiometricAuth(true);
          }, 350);
        }
      }
    });
    return () => { isMounted = false; };
  }, [isBiometricEnabled, triggerBiometricAuth]);

  // Handle Foreground Resumes
  useEffect(() => {
    if (!isBiometricEnabled) return;

    let appListenerHandle: any = null;
    try {
      CapApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          setTimeout(() => {
            triggerBiometricAuth(true);
          }, 300);
        }
      }).then(handle => {
        appListenerHandle = handle;
      });
    } catch (e) {}

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          triggerBiometricAuth(true);
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (appListenerHandle && typeof appListenerHandle.remove === 'function') {
        appListenerHandle.remove();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isBiometricEnabled, triggerBiometricAuth]);

  const handleKeyPress = async (num: string) => {
    if (cooldownRemaining > 0) return;

    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);
      setErrorMessage('');
      
      if (newInput.length === 4) {
        const verification = await verifyPinDetailed(newInput, savedPin, pinSalt);
        if (verification.isValid) {
          if (verification.needsRehash && verification.upgradedHash && verification.upgradedSalt && onRehashPin) {
            onRehashPin(verification.upgradedHash, verification.upgradedSalt);
          }
          setBioStatus('success');
          clearRateLimit();
          if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate([20, 40, 20]);
          }
          setTimeout(onUnlock, 150);
        } else {
          const limit = recordFailedAttempt();
          setError(true);
          if (limit.isLocked) {
            setCooldownRemaining(limit.remainingSeconds);
            setErrorMessage(`تم تجاوز عدد المحاولات المسموحة. تم قفل الإدخال لمدة ${limit.remainingSeconds} ثانية.`);
          } else {
            setErrorMessage(`رمز الدخول غير صحيح (${limit.failedAttempts}/5 محاولات)`);
          }
          
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

  const BiometricIcon = isFaceId ? ScanFace : Fingerprint;

  return (
    <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-center p-6 sm:p-8 select-none overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-slate-950 pointer-events-none" />
      
      <div className="mb-4 sm:mb-6 text-center space-y-1.5 relative z-10">
        <Logo size={64} />
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

        {/* Rate Limiting Cooldown Banner */}
        {cooldownRemaining > 0 && (
          <div className="bg-rose-950/60 border border-rose-500/50 py-2 px-3.5 rounded-2xl flex items-center justify-center gap-2 text-rose-300 animate-pulse">
            <Timer size={16} className="shrink-0 text-rose-400" />
            <span className="text-xs font-black">انتظر {cooldownRemaining} ثانية لإعادة المحاولة</span>
          </div>
        )}

        {/* Biometric Interactive Status Card */}
        {biometricAvailable && isBiometricEnabled && cooldownRemaining === 0 && (
          <div className="transition-all duration-300">
            {bioStatus === 'scanning' && (
              <div className="flex items-center justify-center gap-2.5 bg-emerald-950/40 border border-emerald-500/40 py-2.5 px-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse">
                <div className="relative flex items-center justify-center">
                  <BiometricIcon size={22} className="text-emerald-400 animate-spin-slow" />
                  <span className="absolute -inset-1 rounded-full border-2 border-emerald-400/50 animate-ping opacity-60 pointer-events-none" />
                </div>
                <span className="text-xs font-bold text-emerald-300">{bioFeedback}</span>
              </div>
            )}

            {bioStatus === 'success' && (
              <div className="flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/50 py-2.5 px-4 rounded-2xl shadow-lg">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span className="text-xs font-black text-emerald-300">تم التحقق بنجاح، جاري الدخول...</span>
              </div>
            )}

            {(bioStatus === 'failed' || bioStatus === 'cancelled') && (
              <button
                type="button"
                onClick={() => triggerBiometricAuth(false)}
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
                onClick={() => triggerBiometricAuth(false)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 py-2.5 px-4 rounded-2xl text-emerald-400 active:scale-95 transition-all shadow-md group"
              >
                <BiometricIcon size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">الفتح بـ {biometricType}</span>
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
          <p className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1.5 animate-shake text-center">
            <AlertCircle size={14} className="shrink-0" />
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
                  onClick={() => triggerBiometricAuth(false)}
                  disabled={isScanning || cooldownRemaining > 0}
                  title="الفتح بالبصمة أو Face ID"
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full border flex items-center justify-center transition-all active:scale-90 shadow-md mx-auto relative ${
                    isScanning
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/40 animate-pulse'
                      : isFailed
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 active:bg-emerald-500 active:text-slate-950 disabled:opacity-30'
                  }`}
                >
                  <BiometricIcon size={28} className={isScanning ? 'animate-pulse scale-110' : ''} />
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
                  disabled={cooldownRemaining > 0}
                  onClick={() => {
                    setInput(p => p.slice(0, -1));
                    setErrorMessage('');
                  }}
                  title="مسح"
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-900 active:scale-90 transition-all mx-auto disabled:opacity-30"
                >
                  <ChevronLeft size={26} />
                </button>
              );
            }
            return (
              <button 
                key={idx}
                type="button"
                disabled={cooldownRemaining > 0}
                onClick={() => handleKeyPress(key)}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-2xl font-black text-white hover:border-amber-500/40 active:bg-amber-500 active:text-slate-950 transition-all active:scale-90 shadow-sm mx-auto disabled:opacity-30"
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
