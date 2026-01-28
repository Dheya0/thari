
import React, { useState, useRef } from 'react';
import { 
  Trash2, Plus, Check, Save, User, Wallet as WalletIcon, ChevronDown, Trash, Info, ShieldAlert, Download, Upload, Lock, ShieldCheck, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Currency, Wallet } from '../types';

interface SettingsProps {
  userName: string;
  pin: string | null;
  currency: Currency;
  currencies: Currency[];
  wallets: Wallet[];
  onUpdateSettings: (updates: any) => void;
  onAddCurrency: (curr: Currency) => void;
  onRemoveCurrency: (code: string) => void;
  onAddWallet: (w: Omit<Wallet, 'id'>) => void;
  onRemoveWallet: (id: string) => void;
  onExport: () => void;
  onRestore: (json: string) => void;
  onClearData: () => void;
  onShowPrivacyPolicy: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  userName, pin, currency, currencies, wallets, onUpdateSettings, 
  onAddCurrency, onRemoveCurrency, onAddWallet, onRemoveWallet,
  onExport, onRestore, onClearData, onShowPrivacyPolicy
}) => {
  const [localUserName, setLocalUserName] = useState(userName);
  const [localPin, setLocalPin] = useState(pin || '');
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(!!pin);
  // Fix: Added missing state for showing the wallet creation modal
  const [showWalletModal, setShowWalletModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // إذا كان القفل معطلاً، نرسل pin كـ null
    const finalPin = isSecurityEnabled ? (localPin.length === 4 ? localPin : pin) : null;
    onUpdateSettings({ userName: localUserName, pin: finalPin });
    alert("تم حفظ التغييرات بنجاح");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) onRestore(event.target.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade">
      <div className="flex justify-between items-center bg-slate-900/95 p-4 rounded-3xl border border-slate-800">
        <h3 className="font-black text-white">إعدادات ثري</h3>
        <button onClick={handleSave} className="bg-amber-500 text-slate-950 px-6 py-2 rounded-2xl font-black text-sm active:scale-95 transition-all">
          حفظ التغييرات
        </button>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 divide-y divide-slate-800">
        {/* Profile */}
        <div className="p-6 space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <User size={14} /> الملف الشخصي
          </label>
          <input type="text" value={localUserName} onChange={e => setLocalUserName(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-800 text-white font-bold border-none outline-none focus:ring-1 focus:ring-amber-500" placeholder="الاسم" />
        </div>

        {/* Security / PIN Lock */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} /> أمن التطبيق (قفل PIN)
            </label>
            <button 
              onClick={() => setIsSecurityEnabled(!isSecurityEnabled)}
              className={`transition-colors duration-300 ${isSecurityEnabled ? 'text-amber-500' : 'text-slate-600'}`}
            >
              {isSecurityEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
          
          {isSecurityEnabled && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-[9px] text-slate-400 font-bold">أدخل 4 أرقام لحماية بياناتك المالية:</p>
              <input 
                type="password" 
                value={localPin} 
                onChange={e => setLocalPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                maxLength={4} 
                className="w-full p-4 rounded-2xl bg-slate-800 text-white font-bold tracking-[1em] text-center border-none outline-none focus:ring-1 focus:ring-amber-500" 
                placeholder="****" 
              />
              <p className="text-[8px] text-amber-500/60 font-black text-center uppercase tracking-widest">تذكر الرمز جيداً، لن تظهر شاشة القفل إلا بعد إعادة فتح التطبيق</p>
            </div>
          )}
        </div>

        {/* Wallets */}
        <div className="p-6">
           <div className="flex justify-between items-center mb-4">
              <span className="font-black text-xs text-white">المحافظ ({currency.code})</span>
              <button onClick={() => setShowWalletModal(true)} className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg active:scale-90 transition-transform"><Plus size={16} /></button>
           </div>
           <div className="space-y-2">
              {wallets.filter(w => w.currencyCode === currency.code).map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                    <span className="text-xs font-bold text-slate-200">{w.name}</span>
                  </div>
                  <button onClick={() => onRemoveWallet(w.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash size={14} /></button>
                </div>
              ))}
           </div>
        </div>

        {/* Data Management */}
        <div className="p-6 grid grid-cols-2 gap-4">
          <button onClick={onExport} className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 active:scale-95 transition-all">
            <Download size={20} className="text-amber-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">نسخة احتياطية</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 active:scale-95 transition-all">
            <Upload size={20} className="text-blue-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">استعادة البيانات</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        </div>
      </div>

      <div className="bg-rose-500/5 border border-rose-900/20 p-6 rounded-[2.5rem]">
        <button onClick={onClearData} className="w-full py-4 bg-rose-500/10 text-rose-500 font-black text-[10px] uppercase flex items-center justify-center gap-3 rounded-2xl active:scale-95 transition-all">
          <Trash2 size={16} /> مسح السجل المالي والديون نهائياً
        </button>
      </div>

      <div className="text-center py-4">
        <button onClick={onShowPrivacyPolicy} className="text-[10px] text-slate-600 font-bold underline decoration-slate-800">سياسة الخصوصية والأمان</button>
      </div>

      {showWalletModal && <WalletModal currentCurrency={currency} onClose={() => setShowWalletModal(false)} onAdd={onAddWallet} />}
    </div>
  );
};

const WalletModal = ({ currentCurrency, onClose, onAdd }: any) => {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-end justify-center animate-fade">
      <div className="bg-slate-900 w-full max-w-lg rounded-t-[3rem] p-8 pb-12 shadow-2xl border-t border-slate-800 animate-slide-up">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-white tracking-tight">إضافة محفظة {currentCurrency.code}</h3>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-xl text-slate-500"><ChevronDown size={20} /></button>
        </div>
        <div className="space-y-6">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="اسم المحفظة (مثلاً: المدخرات)" className="w-full p-4 rounded-2xl bg-slate-800 text-white font-bold border-none outline-none focus:ring-1 focus:ring-amber-500" autoFocus />
          <button onClick={() => { if(name) { onAdd({name, currencyCode: currentCurrency.code, color: '#f59e0b'}); onClose(); }}} className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-3xl shadow-xl active:scale-95 transition-all">تأكيد الإضافة</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
