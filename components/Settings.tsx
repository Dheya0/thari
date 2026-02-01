
import React, { useState, useRef } from 'react';
import { 
  Trash2, User, Wallet as WalletIcon, Lock, Upload, Edit2, Plus, Tag, Coins, X, Check, Printer, FileDown, ChevronDown, AlertCircle, AlertTriangle, FileSpreadsheet, Code
} from 'lucide-react';
import { Currency, Wallet, Category, Transaction } from '../types';
import { encryptData, decryptData } from '../services/encryptionService';

interface SettingsProps {
  userName: string;
  pin: string | null;
  currency: Currency;
  currencies: Currency[];
  wallets: Wallet[];
  categories: Category[];
  appState: any; 
  onUpdateSettings: (updates: any) => void;
  onAddCurrency: (curr: Currency) => void;
  onRemoveCurrency: (code: string) => void;
  onAddWallet: (w: Omit<Wallet, 'id'>) => void;
  onUpdateWallet: (id: string, w: Partial<Wallet>) => void;
  onRemoveWallet: (id: string) => void;
  onAddCategory: (c: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, c: Partial<Category>) => void;
  onRemoveCategory: (id: string) => void;
  onRestore: (data: any) => void;
  onClearData: () => void;
  onShowPrivacyPolicy: () => void;
  onPrint?: (type: 'summary' | 'detailed') => void;
}

const ToastNotification = ({ toast }: { toast: { message: string, type: 'success' | 'error' } | null }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[300] flex items-center gap-3 animate-fade ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
      {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
      <span className="font-bold text-sm">{toast.message}</span>
    </div>
  );
};

const ConfirmDialog = ({ confirmData, onCancel }: { confirmData: { message: string, action: () => void } | null, onCancel: () => void }) => {
  if (!confirmData) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade">
      <div className="bg-slate-900 p-8 rounded-[2.5rem] max-w-sm w-full border border-slate-800 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
           <AlertTriangle size={32} />
        </div>
        <p className="text-white font-bold text-lg leading-relaxed">{confirmData.message}</p>
        <div className="grid grid-cols-2 gap-3">
           <button onClick={onCancel} className="py-4 bg-slate-950 text-slate-400 rounded-2xl font-black text-sm hover:bg-slate-800 transition-colors">إلغاء</button>
           <button onClick={() => { confirmData.action(); onCancel(); }} className="py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-sm shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-colors">تأكيد</button>
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC<SettingsProps> = ({ 
  userName, pin, currency, currencies, wallets, categories, appState, onUpdateSettings, 
  onAddCurrency, onRemoveCurrency, onAddWallet, onUpdateWallet, onRemoveWallet,
  onAddCategory, onUpdateCategory, onRemoveCategory,
  onRestore, onClearData, onShowPrivacyPolicy, onPrint
}) => {
  const [localUserName, setLocalUserName] = useState(userName);
  const [localPin, setLocalPin] = useState(pin || '');
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(!!pin);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'wallets' | 'categories' | 'currencies'>('main');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmData, setConfirmData] = useState<{message: string, action: () => void} | null>(null);
  const [showAddCurrencyForm, setShowAddCurrencyForm] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ name: '', code: '', symbol: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerConfirm = (message: string, action: () => void) => {
    setConfirmData({ message, action });
  };

  // وظيفة تنزيل الملف بشكل آمن
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
      }, 200);
  };

  // Backup (.thari) - Encrypted
  const handleExportBackup = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setTimeout(async () => {
        try {
          const password = prompt("🔒 لحماية النسخة، أدخل كلمة مرور.\n(اترك الحقل فارغاً واضغط 'موافق' لحفظ نسخة عادية)");
          if (password === null) { setIsExporting(false); return; }

          const dataStr = JSON.stringify(appState);
          const dateStr = new Date().toISOString().split('T')[0];
          
          if (!password) {
              downloadFile(dataStr, `Thari_Backup_${dateStr}.json`, 'application/json');
              showToast("تم حفظ النسخة (غير مشفرة)");
          } else {
              const encrypted = await encryptData(dataStr, password);
              downloadFile(encrypted, `Thari_Backup_Secure_${dateStr}.thari`, 'text/plain');
              showToast("تم حفظ النسخة المشفرة بنجاح");
          }
        } catch (e) {
          console.error("Export Error:", e);
          showToast("فشل النسخ الاحتياطي", 'error');
        } finally {
          setIsExporting(false);
        }
    }, 100);
  };

  // Export CSV (Excel)
  const handleExportCSV = () => {
    try {
        const transactions: Transaction[] = appState.transactions;
        const headers = ["التاريخ", "النوع", "المبلغ", "العملة", "التصنيف", "المحفظة", "ملاحظات"];
        
        // Add BOM for Excel Arabic support
        let csvContent = "\uFEFF" + headers.join(",") + "\n";

        transactions.forEach(t => {
            const cat = categories.find(c => c.id === t.categoryId)?.name || 'غير مصنف';
            const wallet = wallets.find(w => w.id === t.walletId)?.name || 'محفظة محذوفة';
            const type = t.type === 'income' ? 'دخل' : 'صرف';
            const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : "";
            
            const row = [
                t.date,
                type,
                t.amount,
                t.currency,
                cat,
                wallet,
                note
            ];
            csvContent += row.join(",") + "\n";
        });

        downloadFile(csvContent, `Thari_Report_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
        showToast("تم تصدير ملف Excel بنجاح");
    } catch (e) {
        showToast("حدث خطأ أثناء التصدير", 'error');
    }
  };

  // Export JSON (Raw)
  const handleExportJSON = () => {
      const dataStr = JSON.stringify(appState, null, 2);
      downloadFile(dataStr, `Thari_Data_Raw_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
      showToast("تم تصدير البيانات الخام");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    e.target.value = ''; 

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let parsedData;

        if (content.startsWith("THARI_")) {
            const password = prompt("🔓 الملف مشفر. أدخل كلمة المرور:");
            if (!password) return;
            const decrypted = await decryptData(content, password);
            parsedData = JSON.parse(decrypted);
        } else {
            try {
                parsedData = JSON.parse(content);
            } catch {
                throw new Error("تنسيق الملف غير صالح");
            }
        }

        if (parsedData && (parsedData.transactions || parsedData.userName)) {
            onRestore(parsedData);
            showToast("تم استعادة البيانات بنجاح!");
            setTimeout(() => window.location.reload(), 1500);
        } else {
            throw new Error("البيانات في الملف غير مكتملة");
        }
      } catch (e: any) {
        showToast(e.message || "فشل الاستعادة", 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveProfile = () => {
    const finalPin = isSecurityEnabled ? (localPin.length === 4 ? localPin : pin) : null;
    onUpdateSettings({ userName: localUserName, pin: finalPin });
    showToast("تم حفظ الإعدادات العامة");
  };
  
  const handlePrintClick = () => {
      if (onPrint) {
          onPrint('detailed');
      } else {
          window.print();
      }
  };

  // --- Currency Section ---
  if (activeSection === 'currencies') {
    return (
      <div className="space-y-6 pb-24 animate-fade">
        <div className="flex items-center gap-4 mb-4">
           <button onClick={() => setActiveSection('main')} className="p-2 bg-slate-800 rounded-full text-slate-400"><X size={20} /></button>
           <h3 className="font-black text-white text-lg">إدارة العملات</h3>
        </div>
        <div className="space-y-4">
           {currencies.map(c => (
             <div key={c.code} className="bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-3">
                    <span className="bg-slate-800 text-amber-500 font-black px-3 py-1.5 rounded-lg text-sm">{c.symbol}</span>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-base">{c.name}</span>
                        <span className="text-[10px] text-slate-500 font-black">{c.code}</span>
                    </div>
                </div>
                {currency.code !== c.code && (
                    <button 
                        onClick={() => triggerConfirm(
                            `هل أنت متأكد من حذف عملة ${c.name} (${c.code})؟`,
                            () => {
                                onRemoveCurrency(c.code);
                                showToast("تم حذف العملة بنجاح");
                            }
                        )} 
                        className="p-3 bg-slate-800 text-rose-500 rounded-xl hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 transition-all active:scale-95"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
             </div>
           ))}
           <button onClick={() => setShowAddCurrencyForm(true)} className="w-full py-5 bg-amber-500/10 text-amber-500 font-black rounded-2xl border border-amber-500/20 flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-all active:scale-95">
              <Plus size={20} /> إضافة عملة جديدة
           </button>
        </div>
        {/* Add Currency Modal Logic Same as before */}
        {showAddCurrencyForm && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[250] flex items-end justify-center animate-fade">
                <div className="bg-slate-900 w-full max-w-lg rounded-t-[3rem] p-8 pb-12 shadow-2xl border-t border-slate-800 animate-slide-up">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-black text-white">إضافة عملة</h3>
                        <button onClick={() => setShowAddCurrencyForm(false)} className="p-3 bg-slate-800 rounded-2xl text-slate-500"><X size={20} /></button>
                    </div>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">اسم العملة</label>
                            <input type="text" value={newCurrency.name} onChange={e => setNewCurrency({...newCurrency, name: e.target.value})} placeholder="مثال: دينار كويتي" className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-amber-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">الرمز (Code)</label>
                                <input type="text" value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})} placeholder="KWD" maxLength={3} className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-amber-500 uppercase text-center" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">الشعار (Symbol)</label>
                                <input type="text" value={newCurrency.symbol} onChange={e => setNewCurrency({...newCurrency, symbol: e.target.value})} placeholder="د.ك" className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-amber-500 text-center" />
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                if(!newCurrency.name || !newCurrency.code || !newCurrency.symbol) {
                                    showToast("يرجى تعبئة جميع الحقول المطلوبة", 'error');
                                    return;
                                }
                                onAddCurrency(newCurrency);
                                showToast("تم إضافة العملة بنجاح");
                                setNewCurrency({ name: '', code: '', symbol: '' });
                                setShowAddCurrencyForm(false);
                            }} 
                            className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-[2rem] text-lg shadow-xl active:scale-95 transition-all mt-4"
                        >
                            حفظ العملة
                        </button>
                    </div>
                </div>
            </div>
        )}
        <ToastNotification toast={toast} />
        <ConfirmDialog confirmData={confirmData} onCancel={() => setConfirmData(null)} />
      </div>
    );
  }

  if (activeSection === 'wallets') { return <div className="p-4 text-white">Wallets Section Placeholder (Handled in main logic)</div>; }
  if (activeSection === 'categories') { return <div className="p-4 text-white">Categories Section Placeholder (Handled in main logic)</div>; }

  // --- Main Settings View ---
  return (
    <div className="space-y-6 pb-24 animate-fade">
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-3xl border border-slate-800">
        <h3 className="font-black text-white">الإعدادات العامة</h3>
        <button onClick={handleSaveProfile} className="bg-amber-500 text-slate-950 px-6 py-2 rounded-2xl font-black text-sm active:scale-95 transition-all">حفظ</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
         <button onClick={() => setActiveSection('wallets')} className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col items-center gap-2 text-white font-bold hover:bg-slate-800 transition-colors">
            <WalletIcon className="text-amber-500" size={24} /> 
            <span className="text-xs">المحافظ</span>
         </button>
         <button onClick={() => setActiveSection('categories')} className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col items-center gap-2 text-white font-bold hover:bg-slate-800 transition-colors">
            <Tag className="text-blue-500" size={24} /> 
            <span className="text-xs">التصنيفات</span>
         </button>
         <button onClick={() => setActiveSection('currencies')} className="col-span-2 bg-slate-900 p-4 rounded-3xl border border-slate-800 flex items-center justify-between text-white font-bold hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-3">
                <Coins className="text-emerald-500" size={24} />
                <span>إعدادات العملات</span>
            </div>
            <Edit2 size={16} className="text-slate-600" />
         </button>
      </div>
      
      {/* Currency Selector */}
      <button 
        onClick={() => setShowCurrencyModal(true)}
        className="w-full bg-slate-900 p-5 rounded-[2.5rem] border border-slate-800 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-amber-500/30"
      >
        <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-500">
                 <span className="text-lg font-black">{currency.symbol}</span>
             </div>
             <div className="text-right">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">العملة الأساسية</p>
                 <p className="text-white font-bold text-lg">{currency.name}</p>
             </div>
        </div>
        <ChevronDown size={20} className="text-slate-500" />
      </button>

      {/* Main Controls Section */}
      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 divide-y divide-slate-800">
        <div className="p-6 space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><User size={14} /> الاسم</label>
          <input type="text" value={localUserName} onChange={e => setLocalUserName(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-800 text-white font-bold border-none outline-none focus:ring-1 focus:ring-amber-500" />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Lock size={14} /> رمز القفل (PIN)</label>
            <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isSecurityEnabled ? 'bg-amber-500' : 'bg-slate-700'}`} onClick={() => setIsSecurityEnabled(!isSecurityEnabled)}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isSecurityEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
          {isSecurityEnabled && (
            <input type="password" value={localPin} onChange={e => setLocalPin(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full p-4 rounded-2xl bg-slate-800 text-white font-bold text-center tracking-[1em]" placeholder="****" />
          )}
        </div>

        <div className="p-6">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">البيانات والتقارير</h4>
            <div className="space-y-3">
                
                {/* Export Options Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleExportCSV}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-800 rounded-[2rem] active:scale-95 transition-all group hover:bg-slate-700 border border-slate-700/50"
                    >
                        <FileSpreadsheet size={28} className="text-emerald-500 group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-sm font-black text-white">تصدير Excel</span>
                    </button>
                    <button 
                        onClick={handleExportJSON}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-800 rounded-[2rem] active:scale-95 transition-all group hover:bg-slate-700 border border-slate-700/50"
                    >
                        <Code size={28} className="text-blue-500 group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-sm font-black text-white">تصدير JSON</span>
                    </button>
                </div>

                {/* Print Button */}
                <button 
                  type="button"
                  onClick={handlePrintClick} 
                  className="w-full flex items-center justify-center gap-3 p-5 bg-slate-800/50 rounded-[2rem] active:scale-95 transition-all border-2 border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 group"
                >
                  <span className="text-sm font-black text-white">طباعة كشف حساب (PDF)</span>
                  <Printer size={22} className="text-white group-hover:scale-110 transition-transform" />
                </button>

                {/* Backup & Restore */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                    <button 
                        type="button"
                        onClick={handleExportBackup}
                        disabled={isExporting} 
                        className="flex items-center justify-center gap-2 p-4 bg-slate-800 rounded-3xl active:scale-95 transition-all relative overflow-hidden group hover:bg-slate-700 border border-slate-700/50"
                    >
                        {isExporting && <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center z-10"><div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}
                        <FileDown size={18} className="text-amber-500" />
                        <span className="text-xs font-black text-white">نسخ احتياطي</span>
                    </button>

                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()} 
                        className="flex items-center justify-center gap-2 p-4 bg-slate-800 rounded-3xl active:scale-95 transition-all group hover:bg-slate-700 border border-slate-700/50"
                    >
                        <Upload size={18} className="text-slate-400" />
                        <span className="text-xs font-black text-white">استعادة</span>
                    </button>
                </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".thari,.json,text/plain,*/*" />
        </div>
      </div>
      
       <div className="px-1">
           <button onClick={() => triggerConfirm("هل أنت متأكد من مسح جميع بيانات التطبيق؟", () => { onClearData(); showToast("تم مسح البيانات بنجاح"); })} className="w-full py-5 text-rose-500 font-black text-sm border border-rose-500/20 bg-rose-500/5 rounded-[2rem] hover:bg-rose-500/10 transition-all active:scale-95 flex items-center justify-center gap-2">
             <Trash2 size={18} /> حذف كافة البيانات
           </button>
       </div>

      {/* Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-end justify-center animate-fade">
            <div className="bg-slate-900 w-full max-w-lg rounded-t-[3rem] p-8 pb-12 shadow-2xl border-t border-slate-800 animate-slide-up">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-white">اختر العملة</h3>
                    <button onClick={() => setShowCurrencyModal(false)} className="p-3 bg-slate-800 rounded-2xl text-slate-500"><X size={20} /></button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                    {currencies.map(c => (
                        <button key={c.code} onClick={() => { onUpdateSettings({ currency: c }); setShowCurrencyModal(false); showToast(`تم التغيير إلى ${c.name}`); }} className="w-full p-4 rounded-3xl flex items-center justify-between border border-slate-800 bg-slate-950 text-white">
                            <span className="font-bold">{c.name} ({c.code})</span>
                            {currency.code === c.code && <Check size={20} className="text-amber-500" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
      
      <ToastNotification toast={toast} />
      <ConfirmDialog confirmData={confirmData} onCancel={() => setConfirmData(null)} />
    </div>
  );
};

export default Settings;
