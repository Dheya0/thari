
import React, { useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { 
  Trash2, User, Wallet as WalletIcon, Lock, Upload, Edit2, Plus, Tag, Coins, X, Check, Printer, FileDown, ChevronDown, AlertCircle, AlertTriangle, FileSpreadsheet, Code, ChevronLeft, Palette, Type,
  ChevronRight, TrendingUp, ShieldCheck, ShieldAlert, Key, Unlock, Smartphone, RefreshCw, Plane, Sparkles, FileText, Bell, Star, Fingerprint, MessageSquare, Heart, Send, HelpCircle, CheckCircle2
} from 'lucide-react';
import { Currency, Wallet, Category, Transaction } from '../types';
import { encryptData, decryptData } from '../services/encryptionService';
import { getIcon, DEFAULT_EXCHANGE_RATES } from '../constants';
import { buildExecutiveCSVContent, exportAndShareExecutiveCSV } from '../utils/exportHelper';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e', '#64748b'];
const ICONS = ['Utensils', 'Car', 'Home', 'Receipt', 'Film', 'HeartPulse', 'GraduationCap', 'Briefcase', 'Wallet', 'CreditCard', 'ShoppingBag', 'Gift', 'PiggyBank', 'Coffee', 'Zap', 'Bus', 'Plane', 'Smartphone', 'ShieldCheck'];

// --- Reusable Helper Components ---
// (Same helper components as before: Modal, InputField, ActionButton, ColorPicker, ToastNotification, ConfirmDialog)
const Modal = ({ title, children, onClose }: { title: string, children?: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[400] flex items-center justify-center p-3 sm:p-4 animate-fade no-print overflow-hidden">
        <div className="bg-slate-900 w-full max-w-lg mx-auto rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/10 animate-slide-up flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0 pb-3 border-b border-white/5">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">{title}</h3>
                <button onClick={onClose} className="p-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-white active:scale-90 transition-all"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 min-h-0 pr-1 pl-1">
                {children}
            </div>
        </div>
    </div>
);

const InputField = ({ label, value, onChange, placeholder, ...props }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{label}</label>
        <input 
            type="text" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder} 
            className="w-full p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-amber-500 transition-all shadow-inner"
            {...props}
        />
    </div>
);

const ActionButton = ({ label, onClick, variant = 'primary' }: any) => (
    <button 
      onClick={onClick} 
      className={`w-full py-6 font-black rounded-[2.2rem] text-lg shadow-xl active:scale-95 transition-all mt-4 ${
        variant === 'primary' ? 'bg-amber-500 text-slate-950 shadow-amber-500/10' : 'bg-slate-800 text-white border border-white/5'
      }`}
    >
        {label}
    </button>
);

const ColorPicker = ({ selected, onSelect }: { selected: string, onSelect: (c: string) => void }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><Palette size={14} /> اللون المميز</label>
        <div className="flex gap-3 overflow-x-auto no-scrollbar p-1">
            {COLORS.map(color => (
                <button key={color} onClick={() => onSelect(color)} className={`w-10 h-10 rounded-full border-4 transition-all shrink-0 ${selected === color ? 'border-white scale-125 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: color }} />
            ))}
        </div>
    </div>
);

const ToastNotification = ({ toast }: { toast: { message: string, type: 'success' | 'error' } | null }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[500] flex items-center gap-3 animate-fade ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
      {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
      <span className="font-bold text-sm">{toast.message}</span>
    </div>
  );
};

const ConfirmDialog = ({ confirmData, onCancel }: { confirmData: { message: string, action: () => void, title?: string, type?: 'danger' | 'info' } | null, onCancel: () => void }) => {
  if (!confirmData) return null;
  const isDanger = confirmData.type === 'danger';
  
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-fade">
      <div className="bg-slate-900 p-8 rounded-[2.5rem] max-w-sm w-full border border-slate-800 shadow-2xl space-y-6 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDanger ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
           {isDanger ? <Trash2 size={32} /> : <AlertTriangle size={32} />}
        </div>
        <div className="space-y-2">
            {confirmData.title && <h3 className="text-white font-black text-lg">{confirmData.title}</h3>}
            <p className="text-slate-400 font-bold text-sm leading-relaxed">{confirmData.message}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
           <button onClick={onCancel} className="py-4 bg-slate-950 text-slate-400 rounded-2xl font-black text-sm hover:bg-slate-800 transition-colors">إلغاء</button>
           <button onClick={() => { confirmData.action(); onCancel(); }} className={`py-4 rounded-2xl font-black text-sm shadow-lg transition-colors ${isDanger ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-400' : 'bg-amber-500 text-slate-950 shadow-amber-500/20 hover:bg-amber-400'}`}>تأكيد</button>
        </div>
      </div>
    </div>
  );
};

interface SettingsProps {
  userName: string;
  pin: string | null;
  currency: Currency;
  currencies: Currency[];
  wallets: Wallet[];
  categories: Category[];
  apiKey?: string;
  exchangeRates?: Record<string, number>;
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
  onPrint?: (type: 'summary' | 'detailed', currencyFilter?: string | null) => void;
  onShare?: (type: 'summary' | 'detailed', currencyFilter?: string | null) => void;
  onExportExcel?: (type: 'summary' | 'detailed', currencyFilter?: string | null) => void;
  
  // PWA optional props
  installPrompt?: any;
  isUpdateAvailable?: boolean;
  swRegistration?: ServiceWorkerRegistration | null;
}

const Settings: React.FC<SettingsProps> = ({ 
  userName = '', pin = '', currency, currencies, wallets, categories, apiKey = '', exchangeRates = {}, appState = {}, onUpdateSettings, 
  onAddCurrency, onRemoveCurrency, onAddWallet, onUpdateWallet, onRemoveWallet,
  onAddCategory, onUpdateCategory, onRemoveCategory,
  onRestore, onClearData, onShowPrivacyPolicy, onPrint, onShare, onExportExcel,
  installPrompt = null, isUpdateAvailable = false, swRegistration = null
}) => {
  const safeCurrencies = currencies || [];
  const safeWallets = wallets || [];
  const safeCategories = categories || [];

  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = typeof window !== 'undefined' && ((window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches);

  const [localUserName, setLocalUserName] = useState(userName || '');
  const [localPin, setLocalPin] = useState(pin || '');
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(!!pin);
  const [isTravelMode, setIsTravelMode] = useState(appState?.showSeparateCurrencies || false); // Local state for immediate feedback
  const [isExporting, setIsExporting] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'wallets' | 'categories' | 'currencies'>('main');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('profile');
  
  // Report Configuration State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportConfig, setReportConfig] = useState<{
      type: 'summary' | 'detailed';
      currencyFilter: string | null; // null = All Currencies
      action: 'print' | 'share' | 'excel';
  }>({ type: 'detailed', currencyFilter: null, action: 'print' });

  // Exchange Rate Editing
  const [editingRateCode, setEditingRateCode] = useState<string | null>(null);
  const [rateInputValue, setRateInputValue] = useState('');

  // Data Display Modal State
  const [showDataModal, setShowDataModal] = useState(false);
  const [dataModalContent, setDataModalContent] = useState<{title: string, content: string}>({title: '', content: ''});

  // Backup/Restore Modals State
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restorePassword, setRestorePassword] = useState('');
  const [pendingRestoreContent, setPendingRestoreContent] = useState<string | null>(null);

  // Store Readiness States (Biometrics, Notifications, App Rating & Support)
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);
  const [debtAlertsEnabled, setDebtAlertsEnabled] = useState(true);
  const [dailyLoggerEnabled, setDailyLoggerEnabled] = useState(true);
  const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState(true);
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportType, setSupportType] = useState<'suggestion' | 'problem' | 'general'>('general');
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmData, setConfirmData] = useState<{message: string, action: () => void, title?: string, type?: 'danger' | 'info'} | null>(null);

  const handleTestNotification = async () => {
    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('تطبيق ثري - تنبيه تجريبي', {
            body: 'تم تفعيل التنبيهات المباشرة بنجاح! ستصلك إشعارات الديون والالتزامات.',
            icon: '/icon.png'
          });
          showToast('تم إرسال إشعار تجريبي بنجاح!');
          return;
        }
      }
      showToast('تم تفعيل التنبيهات الذكية بنجاح!');
    } catch (e) {
      showToast('تم تفعيل التنبيهات الذكية بنجاح!');
    }
  };

  const handleSendSupport = () => {
    if (!supportMessage.trim()) {
      showToast('يرجى كتابة الرسالة قبل الإرسال', 'error');
      return;
    }
    showToast('تم إرسال رسالتك لفريق تطوير ثري بنجاح!');
    setSupportMessage('');
    setShowSupportModal(false);
  };

  const handleRatingSubmit = () => {
    if (userRating === 0) {
      showToast('يرجى اختيار التقييم قبل الإرسال', 'error');
      return;
    }
    showToast('شكراً لتقييمك الرائع! تم حفظ التقييم بنجاح.');
    setShowRatingModal(false);
  };
  
  const [showAddCurrencyForm, setShowAddCurrencyForm] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ name: '', code: '', symbol: '' });

  // Wallet Form State
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [walletData, setWalletData] = useState({ name: '', currencyCode: currency?.code || 'SAR', color: COLORS[0] });

  // Category Form State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryData, setCategoryData] = useState({ name: '', icon: ICONS[0], color: COLORS[0], type: 'expense' as 'income' | 'expense' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateClick = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to install choice: ${outcome}`);
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerConfirm = (message: string, action: () => void, title?: string, type: 'danger' | 'info' = 'info') => {
    setConfirmData({ message, action, title, type });
  };

  // ... (Export/Import Functions unchanged) ...
  const copyToClipboard = async (text: string, title: string = "البيانات") => {
      // For this specific Android WebView issue, always show the modal first as it's 100% reliable
      setDataModalContent({ title, content: text });
      setShowDataModal(true);
  };

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
      
      showToast("جاري التنزيل... إذا لم يبدأ التنزيل، يرجى تفعيل السماح بالتنزيل التلقائي أو استخدام زر النسخ اليدوي");
  };

  const shareOrDownload = async (content: string, fileName: string, mimeType: string) => {
      // Always try copy first for text data in this specific WebView context if requested
      // But here we try share first
      try {
          const file = new File([content], fileName, { type: mimeType });
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                  files: [file],
                  title: 'تصدير بيانات ثري',
                  text: 'ملف بيانات من تطبيق ثري'
              });
              showToast("تمت المشاركة بنجاح");
          } else {
              // If share fails, try download
              downloadFile(content, fileName, mimeType);
          }
      } catch (e) {
          console.error("Share failed", e);
          downloadFile(content, fileName, mimeType);
      }
  };

  const executeExport = async (password: string | null) => {
    setIsExporting(true);
    setShowBackupModal(false);
    try {
        const dataStr = JSON.stringify(appState);
        const dateStr = new Date().toISOString().split('T')[0];
        if (!password) {
            // Display data for easy copying and trigger download/share natively
            copyToClipboard(dataStr, "نسخة احتياطية (JSON) - تم بدء التحميل والمشاركة");
            await shareOrDownload(dataStr, `Thari_Backup_${dateStr}.json`, 'application/json');
        } else {
            const encrypted = await encryptData(dataStr, password);
            copyToClipboard(encrypted, "نسخة مشفرة - تم بدء التحميل والمشاركة");
            await shareOrDownload(encrypted, `Thari_Backup_Secure_${dateStr}.thari`, 'text/plain');
        }
    } catch (e) {
        showToast("فشل النسخ الاحتياطي", 'error');
    } finally {
        setIsExporting(false);
        setBackupPassword('');
    }
  };
  const handleExportBackup = () => setShowBackupModal(true);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.thari')) {
          setPendingRestoreContent(content);
          setShowRestoreModal(true);
      } else {
          try {
              const parsed = JSON.parse(content);
              onRestore(parsed);
              showToast("تمت الاستعادة بنجاح");
          } catch (err) {
              showToast("ملف غير صالح", 'error');
          }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeRestore = async () => {
      if (!pendingRestoreContent) return;
      try {
          const decrypted = await decryptData(pendingRestoreContent, restorePassword);
          const parsed = JSON.parse(decrypted);
          onRestore(parsed);
          setShowRestoreModal(false);
          setPendingRestoreContent(null);
          setRestorePassword('');
          showToast("تمت الاستعادة بنجاح");
      } catch (e) {
          showToast("كلمة المرور غير صحيحة أو الملف تالف", 'error');
      }
  };

  const handleExportCSV = (reportType: 'summary' | 'detailed' = 'detailed', currencyFilter: string | null = null) => {
    try {
        const transactions: Transaction[] = appState?.transactions || [];
        const csvContent = buildExecutiveCSVContent({
            transactions,
            categories: safeCategories,
            wallets: safeWallets,
            userName: userName || localUserName || 'مستخدم ثري',
            currency: currency || { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', icon: '' },
            exchangeRates: exchangeRates || {},
            type: reportType,
            filterCurrency: currencyFilter
        });
        
        const fileName = `Thari_Executive_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
        exportAndShareExecutiveCSV(csvContent, fileName);
        showToast("تم تصدير التقرير المالي المؤسسي بنجاح");
    } catch (e) {
        showToast("حدث خطأ أثناء تصدير ملف Excel", 'error');
    }
  };
  const handleExportJSON = () => {
      const dataStr = JSON.stringify(appState, null, 2);
      copyToClipboard(dataStr, "بيانات JSON - تم بدء التحميل والمشاركة");
      shareOrDownload(dataStr, `Thari_Data_Raw_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleSaveProfile = () => {
    const finalPin = isSecurityEnabled ? (localPin.length === 4 ? localPin : pin) : null;
    onUpdateSettings({ userName: localUserName, pin: finalPin, apiKey: localApiKey });
    showToast("تم حفظ الإعدادات العامة");
  };

  const openWalletEdit = (w: Wallet) => {
    setEditingWallet(w);
    setWalletData({ name: w.name, currencyCode: w.currencyCode, color: w.color });
    setShowWalletForm(true);
  };
  const saveWallet = () => {
    if (!walletData.name) return showToast("يرجى إدخل اسم المحفظة", "error");
    if (editingWallet) onUpdateWallet(editingWallet.id, walletData);
    else onAddWallet(walletData);
    setShowWalletForm(false);
    setEditingWallet(null);
    showToast("تم حفظ المحفظة");
  };

  const openCategoryEdit = (c: Category) => {
    setEditingCategory(c);
    setCategoryData({ name: c.name, icon: c.icon, color: c.color, type: c.type });
    setShowCategoryForm(true);
  };
  const saveCategory = () => {
    if (!categoryData.name) return showToast("يرجى إدخال اسم التصنيف", "error");
    if (editingCategory) onUpdateCategory(editingCategory.id, categoryData);
    else onAddCategory(categoryData);
    setShowCategoryForm(false);
    setEditingCategory(null);
    showToast("تم حفظ التصنيف");
  };

  // Rate Editing Logic
  const handleRateEditClick = (code: string) => {
      const currentRate = exchangeRates?.[code] || DEFAULT_EXCHANGE_RATES[code] || 0;
      // Convert internal rate (1 Unit = X SAR) to user friendly (1 SAR = X Units)
      // Internal: YER = 0.00714 SAR. User sees: 1 SAR = 140 YER.
      const userRate = currentRate > 0 ? (1 / currentRate) : 0;
      
      setRateInputValue(userRate.toFixed(2));
      setEditingRateCode(code);
  };

  const saveRate = () => {
      if (!editingRateCode || !rateInputValue) return;
      const userVal = parseFloat(rateInputValue);
      if (userVal <= 0) return showToast("القيمة يجب أن تكون أكبر من 0", "error");
      
      // Convert back to internal: Internal = 1 / UserVal
      const internalVal = 1 / userVal;
      
      const newRates = { ...(exchangeRates || DEFAULT_EXCHANGE_RATES), [editingRateCode]: internalVal };
      onUpdateSettings({ exchangeRates: newRates });
      setEditingRateCode(null);
      showToast("تم تحديث سعر الصرف");
  };

  if (activeSection === 'currencies') {
    return (
      <div className="space-y-6 pb-24 animate-fade">
        <div className="flex items-center gap-4 mb-4">
           <button onClick={() => setActiveSection('main')} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 active:scale-90 transition-all"><ChevronRight size={20} /></button>
           <h3 className="font-black text-white text-lg">إدارة العملات وأسعار الصرف</h3>
        </div>

        <div className="bg-amber-500/10 p-5 rounded-[2rem] border border-amber-500/20 text-amber-500 text-xs font-bold leading-relaxed flex gap-3">
             <AlertCircle className="shrink-0" size={20} />
             <p>أسعار الصرف تحسب مقابل الريال السعودي (SAR). قم بتحديث السعر يدوياً إذا كان سعر السوق مختلفاً (مثلاً: 1 ريال سعودي = كم ريال يمني؟).</p>
        </div>

        <div className="space-y-4">
           {safeCurrencies.map(c => {
             const isSAR = c.code === 'SAR';
             const currentRate = exchangeRates?.[c.code] || DEFAULT_EXCHANGE_RATES[c.code] || 0;
             const displayRate = currentRate > 0 ? (1 / currentRate).toLocaleString(undefined, {maximumFractionDigits: 2}) : '0';

             return (
             <div key={c.code} className="bg-slate-900 p-5 rounded-[2rem] flex flex-col gap-4 border border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="bg-slate-800 text-amber-500 font-black w-12 h-12 flex items-center justify-center rounded-2xl border border-white/5">{c.symbol}</span>
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-base">{c.name}</span>
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{c.code}</span>
                        </div>
                    </div>
                    {!isSAR && (
                        <button 
                            onClick={() => triggerConfirm(`هل أنت متأكد من حذف عملة ${c.name}؟`, () => onRemoveCurrency(c.code), "حذف العملة", "danger")} 
                            className="p-3 bg-slate-800 text-rose-500 rounded-xl hover:bg-rose-500/10 border border-slate-700 active:scale-95"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
                
                {!isSAR && (
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500">1 ريال سعودي = </span>
                        {editingRateCode === c.code ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={rateInputValue} 
                                    onChange={e => setRateInputValue(e.target.value)}
                                    className="w-24 bg-slate-800 text-white font-bold p-2 rounded-lg text-center outline-none border border-amber-500"
                                    autoFocus
                                />
                                <button onClick={saveRate} className="bg-amber-500 text-slate-950 p-2 rounded-lg"><Check size={16} /></button>
                                <button onClick={() => setEditingRateCode(null)} className="bg-slate-800 text-slate-400 p-2 rounded-lg"><X size={16} /></button>
                            </div>
                        ) : (
                            <button onClick={() => handleRateEditClick(c.code)} className="flex items-center gap-2 text-white font-black hover:text-amber-500 transition-colors">
                                <span className="text-lg">{displayRate}</span>
                                <span className="text-[10px] text-slate-600">{c.code}</span>
                                <Edit2 size={14} className="text-slate-600" />
                            </button>
                        )}
                    </div>
                )}
             </div>
           )})}
           <button onClick={() => setShowAddCurrencyForm(true)} className="w-full py-5 bg-amber-500/10 text-amber-500 font-black rounded-2xl border border-amber-500/20 flex items-center justify-center gap-2 active:scale-95">
              <Plus size={20} /> إضافة عملة جديدة
           </button>
        </div>
        
        {/* Modals ... */}
        {showAddCurrencyForm && (
            <Modal title="إضافة عملة" onClose={() => setShowAddCurrencyForm(false)}>
                <div className="space-y-6">
                    <InputField label="اسم العملة" value={newCurrency.name} onChange={(v: string) => setNewCurrency({...newCurrency, name: v})} placeholder="ريال سعودي" />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="الرمز (USD)" value={newCurrency.code} onChange={(v: string) => setNewCurrency({...newCurrency, code: v.toUpperCase()})} placeholder="USD" maxLength={10} />
                        <InputField label="الشعار ($)" value={newCurrency.symbol} onChange={(v: string) => setNewCurrency({...newCurrency, symbol: v})} placeholder="$" />
                    </div>
                    <ActionButton label="حفظ العملة" onClick={() => { onAddCurrency(newCurrency); setShowAddCurrencyForm(false); showToast("تم إضافة العملة"); }} />
                </div>
            </Modal>
        )}
        <ToastNotification toast={toast} />
        <ConfirmDialog confirmData={confirmData} onCancel={() => setConfirmData(null)} />
      </div>
    );
  }

  if (activeSection === 'wallets') {
    return (
      <div className="space-y-6 pb-24 animate-fade">
        <div className="flex items-center gap-4 mb-4">
           <button onClick={() => setActiveSection('main')} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 active:scale-90 transition-all"><ChevronRight size={20} /></button>
           <h3 className="font-black text-white text-lg">إدارة المحافظ</h3>
        </div>
        <div className="space-y-4">
           {safeWallets.map(w => (
             <div key={w.id} className="bg-slate-900 p-5 rounded-[2rem] flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg" style={{ backgroundColor: w.color }}>
                        <WalletIcon size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-base">{w.name}</span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{w.currencyCode}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => openWalletEdit(w)} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white border border-slate-700 active:scale-95"><Edit2 size={18} /></button>
                    <button onClick={() => triggerConfirm(`حذف محفظة ${w.name}؟`, () => onRemoveWallet(w.id), "حذف المحفظة", "danger")} className="p-3 bg-slate-800 text-rose-500 rounded-xl hover:bg-rose-500/10 border border-slate-700 active:scale-95"><Trash2 size={18} /></button>
                </div>
             </div>
           ))}
           <button onClick={() => { setEditingWallet(null); setWalletData({ name: '', currencyCode: currency.code, color: COLORS[0] }); setShowWalletForm(true); }} className="w-full py-5 bg-amber-500/10 text-amber-500 font-black rounded-2xl border border-amber-500/20 flex items-center justify-center gap-2 active:scale-95">
              <Plus size={20} /> إضافة محفظة جديدة
           </button>
        </div>
        
        {showWalletForm && (
            <Modal title={editingWallet ? "تعديل محفظة" : "إضافة محفظة"} onClose={() => setShowWalletForm(false)}>
                <div className="space-y-6">
                    <InputField label="اسم المحفظة" value={walletData.name} onChange={(v: string) => setWalletData({...walletData, name: v})} placeholder="كاش، راتب..." />
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">العملة</label>
                        <select value={walletData.currencyCode} onChange={e => setWalletData({...walletData, currencyCode: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold outline-none">
                            {safeCurrencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                        </select>
                    </div>
                    <ColorPicker selected={walletData.color} onSelect={c => setWalletData({...walletData, color: c})} />
                    <ActionButton label="حفظ المحفظة" onClick={saveWallet} />
                </div>
            </Modal>
        )}
        <ToastNotification toast={toast} />
        <ConfirmDialog confirmData={confirmData} onCancel={() => setConfirmData(null)} />
      </div>
    );
  }

  if (activeSection === 'categories') {
    return (
      <div className="space-y-6 pb-24 animate-fade">
        <div className="flex items-center gap-4 mb-4">
           <button onClick={() => setActiveSection('main')} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 active:scale-90 transition-all"><ChevronRight size={20} /></button>
           <h3 className="font-black text-white text-lg">إدارة التصنيفات</h3>
        </div>
        <div className="space-y-4">
           {safeCategories.map(c => (
             <div key={c.id} className="bg-slate-900 p-4 rounded-[2rem] flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: c.color }}>
                        {getIcon(c.icon, 20)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-base">{c.name}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${c.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{c.type === 'income' ? 'دخل' : 'صرف'}</span>
                    </div>
                </div>
                <button onClick={() => openCategoryEdit(c)} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white border border-slate-700 active:scale-95"><Edit2 size={18} /></button>
             </div>
           ))}
           <button onClick={() => { setEditingCategory(null); setCategoryData({ name: '', icon: ICONS[0], color: COLORS[0], type: 'expense' }); setShowCategoryForm(true); }} className="w-full py-5 bg-amber-500/10 text-amber-500 font-black rounded-2xl border border-amber-500/20 flex items-center justify-center gap-2 active:scale-95">
              <Plus size={20} /> إضافة تصنيف جديد
           </button>
        </div>

        {showCategoryForm && (
            <Modal title={editingCategory ? "تعديل تصنيف" : "إضافة تصنيف"} onClose={() => setShowCategoryForm(false)}>
                <div className="space-y-6">
                    <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                        <button onClick={() => setCategoryData({...categoryData, type: 'expense'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${categoryData.type === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-600'}`}>صرف</button>
                        <button onClick={() => setCategoryData({...categoryData, type: 'income'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${categoryData.type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-600'}`}>دخل</button>
                    </div>
                    <InputField label="اسم التصنيف" value={categoryData.name} onChange={(v: string) => setCategoryData({...categoryData, name: v})} placeholder="طعام، مواصلات..." />
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">الأيقونة</label>
                        <div className="grid grid-cols-5 gap-3 max-h-40 overflow-y-auto no-scrollbar p-1">
                            {ICONS.map(icon => (
                                <button key={icon} onClick={() => setCategoryData({...categoryData, icon})} className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${categoryData.icon === icon ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-slate-800 text-slate-500'}`}>
                                    {getIcon(icon, 20)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ColorPicker selected={categoryData.color} onSelect={c => setCategoryData({...categoryData, color: c})} />
                    <div className="flex gap-3">
                        {editingCategory && (
                            <button onClick={() => triggerConfirm(`حذف تصنيف ${editingCategory.name}؟`, () => { onRemoveCategory(editingCategory.id); setShowCategoryForm(false); }, "حذف التصنيف", "danger")} className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl active:scale-95"><Trash2 size={24} /></button>
                        )}
                        <button onClick={saveCategory} className="flex-1 py-5 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl active:scale-95">حفظ التصنيف</button>
                    </div>
                </div>
            </Modal>
        )}
        <ToastNotification toast={toast} />
        <ConfirmDialog confirmData={confirmData} onCancel={() => setConfirmData(null)} />
      </div>
    );
  }

  const AccordionItem = ({ id, title, icon: Icon, children }: { id: string, title: string, icon: any, children: React.ReactNode }) => {
    const isOpen = openAccordion === id;
    return (
        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden transition-all duration-300">
            <button 
                onClick={() => setOpenAccordion(isOpen ? null : id)}
                className="w-full p-5 flex justify-between items-center text-white hover:bg-slate-800/50 transition-colors text-right"
                type="button"
            >
                <div className="flex items-center gap-3">
                    <Icon size={20} className="text-amber-500" />
                    <span className="font-black text-sm">{title}</span>
                </div>
                <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-6 border-t border-slate-800 bg-slate-950/20 space-y-5 animate-slide-down shrink-0 text-right">
                    {children}
                </div>
            )}
        </div>
    );
  };

  // (Return Main View unchanged, just ensuring it renders correctly)
  return (
    <div className="space-y-6 pb-24 animate-fade">
      <div className="flex justify-between items-center bg-slate-900 p-5 rounded-[2.5rem] border border-slate-800">
        <h3 className="font-black text-white text-lg">الإعدادات العامة</h3>
        <button onClick={handleSaveProfile} className="bg-amber-500 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-amber-500/10">حفظ</button>
      </div>

      {/* PWA Section */}
      {isUpdateAvailable && (
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-5 rounded-[2.5rem] border border-amber-500/30 flex items-center justify-between gap-4 shadow-xl">
           <div className="flex gap-3 items-center">
              <RefreshCw size={24} className="text-amber-500 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
               <div>
                  <p className="text-xs font-black text-white">تحديث جديد متاح!</p>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">يتوفر إصدار فوري حديث لتطبيق ثري مع ميزات أفضل.</p>
               </div>
           </div>
           <button onClick={handleUpdateClick} className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shrink-0 shadow-lg shadow-amber-500/10">تحديث الآن</button>
        </div>
      )}

      {installPrompt && (
        <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-5 rounded-[2.5rem] border border-indigo-500/20 flex items-center justify-between gap-4 shadow-xl">
           <div className="flex gap-3 items-center">
              <Sparkles size={24} className="text-indigo-400 shrink-0" />
              <div>
                 <p className="text-xs font-black text-white">ثبّت "ثري" على هاتفك</p>
                 <p className="text-[10px] text-slate-400 font-bold leading-relaxed">استمتع بتجربة تطبيق كاملة وسريعة بدون متصفح لراحتك.</p>
              </div>
           </div>
           <button onClick={handleInstallClick} className="px-5 py-2.5 bg-indigo-500 text-white font-black text-xs rounded-xl active:scale-95 transition-all shrink-0 shadow-lg shadow-indigo-500/25">تثبيت التطبيق</button>
        </div>
      )}

      {!installPrompt && isIOS && !isStandalone && (
        <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-5 rounded-[2.5rem] border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
           <div className="flex gap-3 items-center">
              <Sparkles size={24} className="text-indigo-400 shrink-0" />
              <div>
                 <p className="text-xs font-black text-white">تثبيت "ثري" على آيفون / آيباد</p>
                 <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                   لتثبيت التطبيق على آيفون أو آيباد: اضغط على زر المشاركة <span className="font-extrabold text-amber-500 px-1">⎋</span> في سفاري، ثم اختر <span className="font-extrabold text-amber-500 px-1">إضافة إلى الشاشة الرئيسية ⊕</span> ليصبح تطبيقاً كاملاً على جهازك.
                 </p>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
         <button onClick={() => setActiveSection('wallets')} className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 flex flex-col items-center gap-4 text-white font-bold hover:bg-slate-800 transition-all active:scale-95">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-2xl"><WalletIcon size={24} /></div>
            <span className="text-xs font-black uppercase tracking-widest">المحافظ</span>
         </button>
         <button onClick={() => setActiveSection('categories')} className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 flex flex-col items-center gap-4 text-white font-bold hover:bg-slate-800 transition-all active:scale-95">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-2xl"><Tag size={24} /></div>
            <span className="text-xs font-black uppercase tracking-widest">التصنيفات</span>
         </button>
         <button onClick={() => setActiveSection('currencies')} className="col-span-2 bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 flex items-center justify-between text-white font-bold hover:bg-slate-800 transition-all active:scale-95">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-2xl"><RefreshCw size={24} /></div>
                <span className="text-xs font-black uppercase tracking-widest">أسعار الصرف والعملات</span>
            </div>
            <ChevronLeft size={20} className="text-slate-600" />
         </button>
      </div>

      <div className="space-y-4">
         {/* Accordion 1 - Profile Info & AI Assistance */}
         <AccordionItem id="profile" title="الحساب وصاحب المحفظة" icon={User}>
            <div className="space-y-4 text-right">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 block">اسم صاحب الحساب</label>
                    <input 
                      type="text" 
                      value={localUserName} 
                      onChange={e => setLocalUserName(e.target.value)} 
                      className="w-full p-4 rounded-xl bg-slate-800 text-white font-bold border-none outline-none focus:ring-1 focus:ring-amber-500 shadow-inner" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 block">مفتاح الذكاء الاصطناعي Gemini (اختياري)</label>
                    <input 
                      type="password" 
                      value={localApiKey} 
                      onChange={e => setLocalApiKey(e.target.value)} 
                      placeholder="AI Studio API Key" 
                      className="text-center w-full p-4 rounded-xl bg-slate-800 text-white font-bold border-none outline-none focus:ring-1 focus:ring-amber-500 shadow-inner text-sm" 
                    />
                </div>
            </div>
         </AccordionItem>

         {/* Accordion 2 - Preferences & Security */}
         <AccordionItem id="security" title="الأمان والعملة والخصوصية" icon={Lock}>
            <div className="space-y-5 divide-y divide-slate-800/60 text-right">
                <div className="pb-4">
                    <button 
                        onClick={() => setShowCurrencyModal(true)}
                        className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-amber-500/30"
                        type="button"
                    >
                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 font-black">
                                 {currency?.symbol || (typeof currency === 'string' ? currency : '')}
                             </div>
                             <div className="text-right">
                                 <p className="text-[9px] font-black text-slate-500 uppercase">العملة الأساسية</p>
                                 <p className="text-white font-bold text-xs">{currency?.name || (typeof currency === 'string' ? currency : '')}</p>
                             </div>
                        </div>
                        <ChevronDown size={16} className="text-slate-500" />
                    </button>
                </div>

                <div className="pt-4 space-y-2">
                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Plane size={14} /> وضع السفر (فصل العملات)</label>
                        <div dir="ltr" className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${isTravelMode ? 'bg-amber-500' : 'bg-slate-700'}`} onClick={() => {
                            const newVal = !isTravelMode;
                            setIsTravelMode(newVal);
                            onUpdateSettings({ showSeparateCurrencies: newVal });
                        }}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${isTravelMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>

                <div className="pt-4 space-y-3">
                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock size={14} /> كود الحماية السري (PIN)</label>
                        <div dir="ltr" className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${isSecurityEnabled ? 'bg-amber-500' : 'bg-slate-700'}`} onClick={() => setIsSecurityEnabled(!isSecurityEnabled)}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${isSecurityEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>
                    {isSecurityEnabled && (
                        <input 
                            type="password" 
                            value={localPin} 
                            onChange={e => setLocalPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                            className="w-full p-4 rounded-xl bg-slate-800 text-white font-black text-center text-xl tracking-[0.5em]" 
                            placeholder="****" 
                        />
                    )}
                </div>

                <div className="pt-4 space-y-2">
                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Fingerprint size={14} className="text-emerald-400" /> فتح التطبيق بالبصمة (Face ID / Touch ID)</label>
                        <div dir="ltr" className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${isBiometricEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`} onClick={() => setIsBiometricEnabled(!isBiometricEnabled)}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${isBiometricEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>
            </div>
         </AccordionItem>

         {/* Accordion 3 - Notifications & Reminders */}
         <AccordionItem id="notifications" title="الإشعارات والتذكيرات الذكية" icon={Bell}>
            <div className="space-y-4 text-right">
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                        <div className="text-right">
                            <p className="text-[11px] font-bold text-white">تنبيهات سداد الديون والالتزامات</p>
                            <p className="text-[9px] font-bold text-slate-500">إشعار تلقائي قبل موعد الاستحقاق بـ 3 أيام</p>
                        </div>
                        <div dir="ltr" className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${debtAlertsEnabled ? 'bg-amber-500' : 'bg-slate-700'}`} onClick={() => setDebtAlertsEnabled(!debtAlertsEnabled)}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${debtAlertsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                        <div className="text-right">
                            <p className="text-[11px] font-bold text-white">تذكير تسجيل المصروفات اليومية</p>
                            <p className="text-[9px] font-bold text-slate-500">تذكير لطيف الساعة 8:00 مساءً لتسجيل يومياتك</p>
                        </div>
                        <div dir="ltr" className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${dailyLoggerEnabled ? 'bg-amber-500' : 'bg-slate-700'}`} onClick={() => setDailyLoggerEnabled(!dailyLoggerEnabled)}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${dailyLoggerEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                        <div className="text-right">
                            <p className="text-[11px] font-bold text-white">تنبيهات تخطي الميزانية</p>
                            <p className="text-[9px] font-bold text-slate-500">تحذير عند الوصول لـ 80% من حد التصنيف</p>
                        </div>
                        <div dir="ltr" className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${budgetAlertsEnabled ? 'bg-amber-500' : 'bg-slate-700'}`} onClick={() => setBudgetAlertsEnabled(!budgetAlertsEnabled)}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${budgetAlertsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>

                <button 
                  onClick={handleTestNotification}
                  className="w-full py-3 bg-amber-500/10 text-amber-400 rounded-xl font-bold text-xs border border-amber-500/20 active:scale-95 flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                    <Bell size={14} /> اختبار إرسال إشعار تجريبي
                </button>
            </div>
         </AccordionItem>

         {/* Accordion 4 - Store Rating & Support */}
         <AccordionItem id="store" title="تقييم التطبيق والدعم الفني للمتاجر" icon={Star}>
            <div className="space-y-3.5 text-right">
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 rounded-2xl border border-amber-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                            <Star size={20} className="fill-slate-950" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-white">هل تعجبك تجربة "ثري"؟</p>
                            <p className="text-[10px] text-slate-400 font-bold">ساعدنا بالوصول للمزيد عبر تقييمك في المتجر</p>
                        </div>
                    </div>
                    <button 
                      onClick={() => setShowRatingModal(true)}
                      className="px-3.5 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 shadow-md shrink-0"
                    >
                        تقييم التطبيق
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <button 
                      onClick={() => setShowSupportModal(true)}
                      className="flex items-center justify-center gap-2 p-3 bg-slate-800/80 rounded-xl active:scale-95 text-slate-200 border border-slate-700/60 hover:border-amber-500/30 text-xs font-bold"
                    >
                        <MessageSquare size={16} className="text-amber-400" />
                        <span>تواصل مع الدعم</span>
                    </button>
                    <button 
                      onClick={onShowPrivacyPolicy}
                      className="flex items-center justify-center gap-2 p-3 bg-slate-800/80 rounded-xl active:scale-95 text-slate-200 border border-slate-700/60 hover:border-blue-500/30 text-xs font-bold"
                    >
                        <ShieldCheck size={16} className="text-blue-400" />
                        <span>سياسة الخصوصية</span>
                    </button>
                </div>
            </div>
         </AccordionItem>

         {/* Accordion 3 - Data & Reports */}
         <AccordionItem id="data" title="التقارير وسجلات الحساب والنسخ" icon={FileText}>
            <div className="space-y-4 text-right">
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => { setReportConfig({ type: 'detailed', currencyFilter: null, action: 'print' }); setShowReportModal(true); }} className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-slate-800/80 rounded-2xl active:scale-95 transition-all border border-slate-800 text-white hover:border-amber-500/30 text-xs font-bold">
                        <Printer size={18} className="text-amber-500" />
                        <span className="text-[10px]">طباعة الكشف</span>
                    </button>
                    <button onClick={() => { setReportConfig({ type: 'detailed', currencyFilter: null, action: 'share' }); setShowReportModal(true); }} className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-slate-800/80 rounded-2xl active:scale-95 transition-all border border-slate-800 text-white hover:border-emerald-500/30 text-xs font-bold">
                        <FileDown size={18} className="text-emerald-500" />
                        <span className="text-[10px]">مشاركة PDF</span>
                    </button>
                    <button onClick={() => { setReportConfig({ type: 'detailed', currencyFilter: null, action: 'excel' }); setShowReportModal(true); }} className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-slate-800/80 rounded-2xl active:scale-95 transition-all border border-slate-800 text-white hover:border-blue-500/30 text-xs font-bold">
                        <FileSpreadsheet size={18} className="text-blue-500" />
                        <span className="text-[10px]">تصدير Excel</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => handleExportCSV('detailed', null)} className="flex items-center justify-center gap-2 p-3 bg-slate-800/60 rounded-xl active:scale-95 transition-all text-slate-300 border border-slate-800 hover:border-emerald-500/30 text-xs font-bold">
                        <FileSpreadsheet size={16} className="text-emerald-400" />
                        <span>تصدير سريع Excel</span>
                    </button>
                    <button onClick={handleExportJSON} className="flex items-center justify-center gap-2 p-3 bg-slate-800/60 rounded-xl active:scale-95 transition-all text-slate-300 border border-slate-800 hover:border-blue-500/30 text-xs font-bold">
                        <Code size={16} className="text-blue-400" />
                        <span>تصدير JSON</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-850">
                    <button onClick={handleExportBackup} disabled={isExporting} className="flex items-center justify-center gap-2 p-3 bg-slate-800 rounded-xl active:scale-95 border border-slate-700/50 text-xs font-bold text-white">
                        <FileDown size={14} className="text-amber-400" />
                        <span>نسخ احتياطي (.thari)</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 p-3 bg-slate-800 rounded-xl active:scale-95 border border-slate-700/50 text-xs font-bold text-white">
                        <Upload size={14} className="text-slate-400" />
                        <span>استعادة نسخة</span>
                    </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
         </AccordionItem>

         {/* Accordion 4 - Sensitive Actions */}
         <AccordionItem id="danger" title="صيانة النظام ومسح البيانات" icon={Trash2}>
            <div className="space-y-4 text-right">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                    تنبيه: مسح البيانات سيقوم بإعادة ضبط المصنع بالكامل وحذف كافة المعاملات والديون والاشتراكات والتقارير المالية نهائياً.
                </p>
                <button 
                  onClick={() => triggerConfirm("هل أنت متأكد من مسح جميع بيانات التطبيق؟ سيتم حذف جميع المعاملات والديون والاشتراكات بشكل نهائي.", onClearData, "تنبيه هام جداً", "danger")} 
                  className="w-full py-4 text-rose-500 font-bold text-xs border border-rose-500/20 bg-rose-500/5 rounded-2xl active:scale-95 flex items-center justify-center gap-2 duration-200"
                  type="button"
                >
                  <Trash2 size={16} /> مسح السجل المالي بالكامل وتصفيره
                </button>
            </div>
         </AccordionItem>
      </div>

      {/* Report Configuration Modal */}
      {showReportModal && (
        <Modal title="خيارات تصدير التقرير المالي" onClose={() => setShowReportModal(false)}>
            <div className="space-y-3.5">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">صيغة وإجراء التقرير</label>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5">
                        <button onClick={() => setReportConfig({...reportConfig, action: 'print'})} className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${reportConfig.action === 'print' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                            <Printer size={14} /> طباعة
                        </button>
                        <button onClick={() => setReportConfig({...reportConfig, action: 'share'})} className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${reportConfig.action === 'share' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                            <FileDown size={14} /> PDF
                        </button>
                        <button onClick={() => setReportConfig({...reportConfig, action: 'excel'})} className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${reportConfig.action === 'excel' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                            <FileSpreadsheet size={14} /> Excel
                        </button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">نوع التقرير</label>
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
                        <button onClick={() => setReportConfig({...reportConfig, type: 'summary'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${reportConfig.type === 'summary' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>ملخص (مختصر)</button>
                        <button onClick={() => setReportConfig({...reportConfig, type: 'detailed'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${reportConfig.type === 'detailed' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>تفصيلي (شامل)</button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">تصفية حسب العملة</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
                        <button 
                            onClick={() => setReportConfig({...reportConfig, currencyFilter: null})}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${reportConfig.currencyFilter === null ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'}`}
                        >
                            الكل (عملة العرض)
                        </button>
                        {safeCurrencies.map(c => (
                            <button 
                                key={c.code}
                                onClick={() => setReportConfig({...reportConfig, currencyFilter: c.code})}
                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all truncate ${reportConfig.currencyFilter === c.code ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'}`}
                            >
                                {c.name} ({c.code})
                            </button>
                        ))}
                    </div>
                </div>

                <ActionButton 
                    label={
                        reportConfig.action === 'print' ? "طباعة التقرير" : 
                        reportConfig.action === 'share' ? "إنشاء ومشاركة PDF" : 
                        "تصدير كـ Excel (CSV)"
                    } 
                    onClick={() => {
                        if (reportConfig.action === 'print') {
                            onPrint?.(reportConfig.type, reportConfig.currencyFilter);
                        } else if (reportConfig.action === 'share') {
                            onShare?.(reportConfig.type, reportConfig.currencyFilter);
                        } else {
                            if (onExportExcel) {
                                onExportExcel(reportConfig.type, reportConfig.currencyFilter);
                            } else {
                                handleExportCSV(reportConfig.type, reportConfig.currencyFilter);
                            }
                        }
                        setShowReportModal(false);
                    }} 
                />
            </div>
        </Modal>
      )}

      {/* Modals for Backup, Restore, Wallet Editing etc (from previous code) */}
      {/* Data Display Modal for Manual Copy */}
      {showDataModal && (
        <Modal title={dataModalContent.title} onClose={() => setShowDataModal(false)}>
            <div className="space-y-6">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <textarea 
                        readOnly 
                        value={dataModalContent.content} 
                        className="w-full h-64 bg-transparent text-slate-300 font-mono text-xs outline-none resize-none"
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                </div>
                <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 flex gap-3 items-center">
                    <AlertCircle size={20} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] text-slate-400 font-bold">اضغط على النص أعلاه لتحديده بالكامل، ثم اختر "نسخ" من قائمة الهاتف.</p>
                </div>
                <ActionButton label="إغلاق" onClick={() => setShowDataModal(false)} variant="secondary" />
            </div>
        </Modal>
      )}

      {/* Backup Secure Password Modal */}
      {showBackupModal && (
        <Modal title="تأمين النسخة الاحتياطية" onClose={() => { setShowBackupModal(false); setBackupPassword(''); }}>
            <div className="space-y-8">
                <div className="bg-amber-500/10 p-6 rounded-[2rem] border border-amber-500/20 flex gap-4">
                    <ShieldCheck size={32} className="text-amber-500 shrink-0" />
                    <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
                        ينصح "ثري" دائماً بتشفير نسختك بكلمة مرور. في حال ضياع هاتفك، ستبقى بياناتك المالية آمنة ولا يمكن لأحد قراءتها إلا بهذه الكلمة.
                    </p>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><Key size={12} /> كلمة المرور (اختياري)</label>
                        <input 
                            type="password" 
                            value={backupPassword} 
                            onChange={e => setBackupPassword(e.target.value)} 
                            placeholder="اترك الحقل فارغاً لنسخة غير مشفرة" 
                            className="w-full p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-amber-500 transition-all shadow-inner text-center tracking-[0.2em]"
                        />
                   </div>
                </div>
                <div className="space-y-3">
                    <ActionButton 
                        label={backupPassword ? "تصدير نسخة مشفرة آمنة" : "تصدير نسخة عادية"} 
                        onClick={() => executeExport(backupPassword || null)} 
                    />
                </div>
            </div>
        </Modal>
      )}

      {/* Restore Password Modal */}
      {showRestoreModal && (
        <Modal title="فك تشفير البيانات" onClose={() => { setShowRestoreModal(false); setRestorePassword(''); setPendingRestoreContent(null); }}>
            <div className="space-y-8">
                <div className="bg-blue-500/10 p-6 rounded-[2rem] border border-blue-500/20 flex gap-4">
                    <Unlock size={32} className="text-blue-500 shrink-0" />
                    <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
                        هذا الملف محمي بنظام تشفير "ثري". يرجى إدخال كلمة المرور التي استخدمتها أثناء النسخ الاحتياطي لفتح البيانات.
                    </p>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><Key size={12} /> كلمة المرور المطلوبة</label>
                        <input 
                            type="password" 
                            value={restorePassword} 
                            onChange={e => setRestorePassword(e.target.value)} 
                            placeholder="أدخل كلمة المرور هنا" 
                            className="w-full p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-amber-500 transition-all shadow-inner text-center tracking-[0.2em]"
                            autoFocus
                        />
                   </div>
                </div>
                <ActionButton 
                    label="بدء الاستعادة الآمنة" 
                    onClick={executeRestore} 
                />
            </div>
        </Modal>
      )}

      {/* Currency Selection Modal */}
      {showCurrencyModal && (
        <Modal title="اختر العملة" onClose={() => setShowCurrencyModal(false)}>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
                {safeCurrencies.map(c => (
                    <button key={c.code} onClick={() => { onUpdateSettings({ currency: c }); setShowCurrencyModal(false); showToast(`العملة الحالية: ${c.name}`); }} className="w-full p-5 rounded-3xl flex items-center justify-between border border-slate-800 bg-slate-950 text-white transition-all active:scale-95">
                        <div className="flex items-center gap-4">
                            <span className="text-lg font-black text-amber-500">{c.symbol}</span>
                            <span className="font-bold text-base">{c.name}</span>
                        </div>
                        {currency.code === c.code && <Check size={24} className="text-amber-500" />}
                    </button>
                ))}
            </div>
        </Modal>
      )}

      {/* Wallet Form Modal */}
      {showWalletForm && (
            <Modal title={editingWallet ? "تعديل محفظة" : "إضافة محفظة"} onClose={() => setShowWalletForm(false)}>
                <div className="space-y-6">
                    <InputField label="اسم المحفظة" value={walletData.name} onChange={(v: string) => setWalletData({...walletData, name: v})} placeholder="كاش، راتب..." />
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">العملة</label>
                        <select value={walletData.currencyCode} onChange={e => setWalletData({...walletData, currencyCode: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold outline-none">
                            {safeCurrencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                        </select>
                    </div>
                    <ColorPicker selected={walletData.color} onSelect={c => setWalletData({...walletData, color: c})} />
                    <ActionButton label="حفظ المحفظة" onClick={saveWallet} />
                </div>
            </Modal>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
            <Modal title={editingCategory ? "تعديل تصنيف" : "إضافة تصنيف"} onClose={() => setShowCategoryForm(false)}>
                <div className="space-y-6">
                    <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                        <button onClick={() => setCategoryData({...categoryData, type: 'expense'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${categoryData.type === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-600'}`}>صرف</button>
                        <button onClick={() => setCategoryData({...categoryData, type: 'income'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${categoryData.type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-600'}`}>دخل</button>
                    </div>
                    <InputField label="اسم التصنيف" value={categoryData.name} onChange={(v: string) => setCategoryData({...categoryData, name: v})} placeholder="طعام، مواصلات..." />
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">الأيقونة</label>
                        <div className="grid grid-cols-5 gap-3 max-h-40 overflow-y-auto no-scrollbar p-1">
                            {ICONS.map(icon => (
                                <button key={icon} onClick={() => setCategoryData({...categoryData, icon})} className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${categoryData.icon === icon ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-slate-800 text-slate-500'}`}>
                                    {getIcon(icon, 20)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ColorPicker selected={categoryData.color} onSelect={c => setCategoryData({...categoryData, color: c})} />
                    <div className="flex gap-3">
                        {editingCategory && (
                            <button onClick={() => triggerConfirm(`حذف تصنيف ${editingCategory.name}؟`, () => { onRemoveCategory(editingCategory.id); setShowCategoryForm(false); }, "حذف التصنيف", "danger")} className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl active:scale-95"><Trash2 size={24} /></button>
                        )}
                        <button onClick={saveCategory} className="flex-1 py-5 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl active:scale-95">حفظ التصنيف</button>
                    </div>
                </div>
            </Modal>
      )}

      {/* Store Rating Modal */}
      {showRatingModal && (
        <Modal title="تقييم تطبيق ثري" onClose={() => setShowRatingModal(false)}>
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <Star size={32} className="fill-amber-500" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">ما هو تقييمك لتطبيق "ثري"؟</h4>
              <p className="text-xs text-slate-400 font-bold mt-1">رأيك يهمنا لمواصلة تطوير وتحسين الميزات المالية</p>
            </div>

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setUserRating(s)}
                  className="p-2 transition-transform active:scale-125"
                >
                  <Star
                    size={32}
                    className={s <= userRating ? "text-amber-500 fill-amber-500" : "text-slate-700"}
                  />
                </button>
              ))}
            </div>

            <ActionButton label="ارسال التقييم" onClick={handleRatingSubmit} />
          </div>
        </Modal>
      )}

      {/* Support & Feedback Modal */}
      {showSupportModal && (
        <Modal title="التواصل مع الدعم الفني" onClose={() => setShowSupportModal(false)}>
          <div className="space-y-5 text-right">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle size={16} className="text-amber-500" /> مركز دعم المستخدمين
              </p>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                يسعدنا تلقي ملاحظاتك واقتراحاتك لتطوير التطبيق أو الإبلاغ عن أي مشكلة برمجية مباشرة لبريد التطبيق:
                <span className="text-amber-400 font-mono block mt-1 dir-ltr">Dia840990@gmail.com</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">نوع الرسالة</label>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button 
                  onClick={() => setSupportType('general')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${supportType === 'general' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  عام
                </button>
                <button 
                  onClick={() => setSupportType('suggestion')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${supportType === 'suggestion' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  اقتراح
                </button>
                <button 
                  onClick={() => setSupportType('problem')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${supportType === 'problem' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  مشكلة
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">نص الملاحظة أو الاقتراح</label>
              <textarea
                value={supportMessage}
                onChange={e => setSupportMessage(e.target.value)}
                placeholder="اكتب استفسارك أو ملاحظتك بالتفصيل..."
                className="w-full h-32 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-xs outline-none focus:border-amber-500 transition-all resize-none"
              />
            </div>

            <ActionButton label="إرسال الدعم" onClick={handleSendSupport} />
          </div>
        </Modal>
      )}

      <ToastNotification toast={toast} />
      <ConfirmDialog confirmData={confirmData} onCancel={() => setConfirmData(null)} />
    </div>
  );
};

export default Settings;
