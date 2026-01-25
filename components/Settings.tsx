
import React, { useState, useRef } from 'react';
import { 
  Trash2, Plus, Check, Save, User, Wallet as WalletIcon, ChevronDown, Trash, Info, ShieldAlert, Download, Upload, Lock, ShieldCheck
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
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateSettings({ userName: localUserName, pin: localPin || null });
    alert("تم حفظ التغييرات");
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
          حفظ
        </button>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 divide-y divide-slate-800">
        {/* Profile */}
        <div className="p-6 space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <User size={14} /> الملف الشخصي
          </label>
          <input type="text" value={localUserName} onChange={e => setLocalUserName(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-800 text-white font-bold" placeholder="الاسم" />
        </div>

        {/* Security */}
        <div className="p-6 space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Lock size={14} /> رمز القفل (PIN)
          </label>
          <input type="password" value={localPin} onChange={e => setLocalPin(e.target.value)} maxLength={4} className="w-full p-4 rounded-2xl bg-slate-800 text-white font-bold tracking-[1em] text-center" placeholder="****" />
          <p className="text-[9px] text-slate-600 font-bold text-center italic">سيتم طلب الرمز عند كل عملية فتح للتطبيق</p>
        </div>

        {/* Wallets */}
        <div className="p-6">
           <div className="flex justify-between items-center mb-4">
              <span className="font-black text-xs text-white">المحافظ ({currency.code})</span>
              <button onClick={() => setShowWalletModal(true)} className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg"><Plus size={16} /></button>
           </div>
           <div className="space-y-2">
              {wallets.filter(w => w.currencyCode === currency.code).map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                    <span className="text-xs font-bold">{w.name}</span>
                  </div>
                  <button onClick={() => onRemoveWallet(w.id)} className="text-slate-600 hover:text-rose-500"><Trash size={14} /></button>
                </div>
              ))}
           </div>
        </div>

        {/* Backup & Restore */}
        <div className="p-6 grid grid-cols-2 gap-4">
          <button onClick={onExport} className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 active:bg-slate-800">
            <Download size={20} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase">نسخة احتياطية</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 active:bg-slate-800">
            <Upload size={20} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase">استعادة البيانات</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        </div>
      </div>

      <div className="bg-rose-500/5 border border-rose-900/20 p-6 rounded-[2.5rem]">
        <button onClick={onClearData} className="w-full py-4 bg-rose-500/10 text-rose-500 font-black text-xs uppercase flex items-center justify-center gap-3 rounded-2xl">
          <Trash2 size={16} /> مسح كافة البيانات
        </button>
      </div>

      <div className="text-center py-4">
        <button onClick={onShowPrivacyPolicy} className="text-[10px] text-slate-600 font-bold underline">سياسة الخصوصية</button>
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
          <h3 className="text-xl font-black text-white">إضافة محفظة</h3>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-xl text-slate-500"><ChevronDown size={20} /></button>
        </div>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="الاسم" className="w-full p-4 rounded-2xl bg-slate-800 text-white font-bold mb-6" />
        <button onClick={() => { if(name) { onAdd({name, currencyCode: currentCurrency.code, color: '#f59e0b'}); onClose(); }}} className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-[2rem]">تأكيد</button>
      </div>
    </div>
  );
};

export default Settings;
