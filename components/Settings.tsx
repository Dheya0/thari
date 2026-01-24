
import React, { useState, useRef } from 'react';
import { 
  Moon, Sun, Shield, Download, Trash2, Globe, Plus, 
  Check, Save, Layers, FileText, Code, Printer, 
  Palette, Smartphone, Zap, Coffee, HeartPulse, GraduationCap,
  User, Database, Upload
} from 'lucide-react';
import { Currency, Category } from '../types';
import { DEFAULT_CURRENCIES, getIcon } from '../constants';

interface SettingsProps {
  userName: string;
  isDarkMode: boolean;
  isLocked: boolean;
  currency: Currency;
  categories: Category[];
  onUpdateSettings: (updates: any) => void;
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
  onExport: (format: 'csv' | 'json' | 'text' | 'print' | 'backup') => void;
  onRestore: (jsonData: string) => void;
  onClearData: () => void;
}

const PRESET_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#06b6d4', '#84cc16', '#f97316', '#64748b'];
const PRESET_ICONS = ['Utensils', 'Car', 'Home', 'Receipt', 'Film', 'HeartPulse', 'GraduationCap', 'Briefcase', 'Wallet', 'ShoppingBag', 'Gift', 'Coffee', 'Zap', 'Bus', 'Plane', 'Smartphone'];

const Settings: React.FC<SettingsProps> = ({ 
  userName, isDarkMode, isLocked, currency, categories, onUpdateSettings, onAddCategory, onExport, onRestore, onClearData 
}) => {
  const [localUserName, setLocalUserName] = useState(userName);
  const [localDarkMode, setLocalDarkMode] = useState(isDarkMode);
  const [localLocked, setLocalLocked] = useState(isLocked);
  const [localCurrency, setLocalCurrency] = useState(currency);

  const [showCustomCurrency, setShowCustomCurrency] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState(PRESET_ICONS[0]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setSaveStatus('saving');
    onUpdateSettings({
      userName: localUserName,
      isDarkMode: localDarkMode,
      isLocked: localLocked,
      currency: localCurrency
    });
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleAddCustomCurrency = () => {
    if (customName && customCode && customSymbol) {
      const newCurr = {
        name: customName,
        code: customCode.toUpperCase(),
        symbol: customSymbol
      };
      setLocalCurrency(newCurr);
      onUpdateSettings({
        currency: newCurr,
        currencies: (prevCurrencies: Currency[]) => {
          const exists = prevCurrencies.find(c => c.code === newCurr.code);
          if (exists) return prevCurrencies;
          return [...prevCurrencies, newCurr];
        }
      });
      setShowCustomCurrency(false);
      setCustomName('');
      setCustomCode('');
      setCustomSymbol('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onRestore(content);
      };
      reader.readAsText(file);
    }
  };

  const handleAddCategoryLocal = () => {
    if (!newCatName) return;
    onAddCategory({
      name: newCatName,
      type: newCatType,
      icon: newCatIcon,
      color: newCatColor
    });
    setNewCatName('');
    setShowCatForm(false);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Save Button Bar */}
      <div className="flex justify-between items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl shadow-sm sticky top-0 z-20">
        <h3 className="font-bold dark:text-white">إعدادات الحساب</h3>
        <button 
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
            saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none'
          }`}
        >
          {saveStatus === 'saved' ? <Check size={18} /> : <Save size={18} />}
          {saveStatus === 'saved' ? 'تم الحفظ' : saveStatus === 'saving' ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
        {/* User Profile */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <User size={20} />
            </div>
            <div>
              <p className="font-bold dark:text-white">ملف المستخدم</p>
              <p className="text-xs text-slate-500">اسمك الذي سيظهر في التقارير</p>
            </div>
          </div>
          <input 
            type="text" 
            value={localUserName}
            onChange={(e) => setLocalUserName(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none outline-none dark:text-white font-bold"
            placeholder="اسم المستخدم"
          />
        </div>

        {/* Visual Settings */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              {localDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div>
              <p className="font-bold dark:text-white">الوضع الليلي</p>
              <p className="text-xs text-slate-500">تغيير مظهر التطبيق</p>
            </div>
          </div>
          <button 
            onClick={() => setLocalDarkMode(!localDarkMode)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${localDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${localDarkMode ? 'translate-x-0' : '-translate-x-6'}`} />
          </button>
        </div>

        {/* Security Settings */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Shield size={20} />
            </div>
            <div>
              <p className="font-bold dark:text-white">قفل التطبيق</p>
              <p className="text-xs text-slate-500">تأمين التطبيق برمز PIN</p>
            </div>
          </div>
          <button 
            onClick={() => setLocalLocked(!localLocked)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${localLocked ? 'bg-emerald-600' : 'bg-slate-200'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${localLocked ? 'translate-x-0' : '-translate-x-6'}`} />
          </button>
        </div>

        {/* Currency/Account Settings */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Globe size={20} />
            </div>
            <div>
              <p className="font-bold dark:text-white">إنشاء حساب جديد</p>
              <p className="text-xs text-slate-500">لعملة مختلفة أو غرض مخصص</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCustomCurrency(!showCustomCurrency)}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm font-bold"
          >
            <Plus size={18} /> إنشاء محفظة عملة مخصصة
          </button>

          {showCustomCurrency && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 mt-4 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 mr-2">اسم الحساب</label>
                <input 
                  type="text" 
                  placeholder="مثلاً: التوفير الجاري" 
                  className="w-full p-3 text-sm rounded-xl bg-white dark:bg-slate-800 border-none outline-none dark:text-white shadow-sm font-bold"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 mr-2">رمز العملة</label>
                  <input 
                    type="text" 
                    placeholder="USD" 
                    className="w-full p-3 text-sm rounded-xl bg-white dark:bg-slate-800 border-none outline-none dark:text-white shadow-sm font-bold uppercase"
                    value={customCode}
                    onChange={e => setCustomCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 mr-2">علامة العملة</label>
                  <input 
                    type="text" 
                    placeholder="$" 
                    className="w-full p-3 text-sm rounded-xl bg-white dark:bg-slate-800 border-none outline-none dark:text-white shadow-sm font-bold"
                    value={customSymbol}
                    onChange={e => setCustomSymbol(e.target.value)}
                  />
                </div>
              </div>
              <button 
                onClick={handleAddCustomCurrency}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 transition-all"
              >
                حفظ وإضافة الحساب
              </button>
            </div>
          )}
        </div>

        {/* Categories Management */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
           <div className="flex items-center gap-3 mb-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Layers size={20} />
              </div>
              <div>
                <p className="font-bold dark:text-white">التصنيفات</p>
                <p className="text-xs text-slate-500">إدارة تصنيفاتك الخاصة</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCatForm(!showCatForm)}
              className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 rounded-full hover:scale-110 transition-transform"
            >
              <Plus size={18} />
            </button>
          </div>

          {showCatForm && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-3xl mb-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 border border-purple-100 dark:border-purple-800/30">
              <input 
                type="text" 
                placeholder="اسم التصنيف" 
                className="w-full p-3 text-sm rounded-xl bg-white dark:bg-slate-800 border-none outline-none dark:text-white shadow-sm font-bold"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
              />
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-2 mr-2">إختر اللون</label>
                <div className="flex flex-wrap gap-2 justify-center">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCatColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${newCatColor === color ? 'border-indigo-500 scale-125 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-2 mr-2">إختر الأيقونة</label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewCatIcon(icon)}
                      className={`p-2 rounded-xl border-2 transition-all flex items-center justify-center ${newCatIcon === icon ? 'border-indigo-500 bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'border-transparent bg-white/50 dark:bg-slate-800/50 text-slate-400'}`}
                    >
                      {getIcon(icon, 18)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 p-1 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <button 
                  onClick={() => setNewCatType('expense')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newCatType === 'expense' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500'}`}
                >
                  مصروف
                </button>
                <button 
                  onClick={() => setNewCatType('income')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newCatType === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500'}`}
                >
                  دخل
                </button>
              </div>

              <button 
                onClick={handleAddCategoryLocal}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-100 dark:shadow-none active:scale-95 transition-all"
              >
                تأكيد الإضافة
              </button>
            </div>
          )}

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex flex-col items-center gap-1.5 min-w-[60px]">
                <div className="p-3 rounded-2xl shadow-sm" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                  {getIcon(cat.icon, 20)}
                </div>
                <span className="text-[10px] font-bold dark:text-slate-300 whitespace-nowrap">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Local Backup/Restore */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Database size={20} />
            </div>
            <div>
              <p className="font-bold dark:text-white">النسخ الاحتياطي المحلي</p>
              <p className="text-xs text-slate-500">حفظ أو استعادة كافة بيانات التطبيق</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onExport('backup')}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Download size={18} className="text-emerald-500" />
              <span className="text-xs font-bold dark:text-white">تصدير نسخة</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Upload size={18} className="text-blue-500" />
              <span className="text-xs font-bold dark:text-white">استعادة نسخة</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleFileChange} 
            />
          </div>
        </div>

        {/* Reports & Export */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Printer size={20} />
            </div>
            <div>
              <p className="font-bold dark:text-white">التقارير والتصدير</p>
              <p className="text-xs text-slate-500">تحويل بياناتك لملفات مطبوعة أو رقمية</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onExport('csv')}
              className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <FileText className="text-emerald-500" size={24} />
              <div className="text-right">
                <span className="block text-xs font-bold dark:text-white">ملف Excel</span>
                <span className="text-[10px] text-slate-400">CSV</span>
              </div>
            </button>
            <button 
              onClick={() => onExport('print')}
              className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Printer className="text-indigo-500" size={24} />
              <div className="text-right">
                <span className="block text-xs font-bold dark:text-white">طباعة PDF</span>
                <span className="text-[10px] text-slate-400">تقرير شامل</span>
              </div>
            </button>
          </div>
        </div>

        {/* Destruction Settings */}
        <div className="p-6">
          <button 
            onClick={onClearData}
            className="flex items-center gap-3 w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors text-rose-600"
          >
            <Trash2 size={20} />
            <span className="font-bold text-sm">مسح كافة البيانات (تصفير)</span>
          </button>
        </div>
      </div>
      
      <p className="text-center text-[11px] font-black text-slate-300 dark:text-slate-600 pb-8 uppercase tracking-[0.2em]">
        Thari • Smart Personal Finance v1.4.0
      </p>
    </div>
  );
};

export default Settings;
