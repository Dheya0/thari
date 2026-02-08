
import React, { useState, useMemo } from 'react';
import { Coins, Scale, TrendingDown, TrendingUp, Info, Calculator, CheckCircle2, XCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { convertCurrency } from '../constants';

interface ZakatCalculatorProps {
  totalBalance: number; // الرصيد الحالي من التطبيق للمساعدة
  currencySymbol: string;
}

const ZakatCalculator: React.FC<ZakatCalculatorProps> = ({ totalBalance, currencySymbol }) => {
  // أسعار افتراضية (يمكن للمستخدم تعديلها)
  const [goldPrice, setGoldPrice] = useState(285); // سعر جرام الذهب عيار 24
  
  // الأصول الزكوية
  const [cash, setCash] = useState(totalBalance.toString()); // الملء التلقائي من المحفظة
  const [goldWeight, setGoldWeight] = useState(''); // جرامات الذهب
  const [silverWeight, setSilverWeight] = useState(''); // جرامات الفضة
  const [stocks, setStocks] = useState(''); // أسهم معدة للتجارة
  const [owedToMe, setOwedToMe] = useState(''); // ديون لك عند الآخرين (مرجوة السداد)
  
  // الخصوم (الديون)
  const [debtsOnMe, setDebtsOnMe] = useState(''); // ديون عليك (حالة)

  // حالة عرض التفاصيل
  const [showDetails, setShowDetails] = useState(true);

  // المنطق الحسابي
  const calculation = useMemo(() => {
    const cashVal = parseFloat(cash) || 0;
    const goldVal = (parseFloat(goldWeight) || 0) * goldPrice;
    const silverVal = (parseFloat(silverWeight) || 0) * (goldPrice / 85); // تقدير تقريبي لسعر الفضة نسبة للذهب إذا لم يدخل يدوياً، أو يمكن تثبيته بـ 3 ريال مثلاً
    const stocksVal = parseFloat(stocks) || 0;
    const owedVal = parseFloat(owedToMe) || 0;
    
    const debtsVal = parseFloat(debtsOnMe) || 0;

    const totalAssets = cashVal + goldVal + silverVal + stocksVal + owedVal;
    const netAssets = totalAssets - debtsVal;

    // نصاب الذهب: 85 جرام عيار 24
    const nisabThreshold = 85 * goldPrice;
    const isEligible = netAssets >= nisabThreshold;
    
    const zakatAmount = isEligible ? netAssets * 0.025 : 0;

    return {
      totalAssets,
      netAssets,
      nisabThreshold,
      isEligible,
      zakatAmount
    };
  }, [cash, goldWeight, silverWeight, stocks, owedToMe, debtsOnMe, goldPrice]);

  return (
    <div className="space-y-6 pb-24 animate-fade">
      
      {/* Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-800 p-8 rounded-[3rem] shadow-2xl text-center group">
         <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 animate-spin-slow pointer-events-none"></div>
         <div className="relative z-10 space-y-4">
             <div className="flex justify-center mb-2">
                 <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                    <Scale size={32} className="text-white" />
                 </div>
             </div>
             
             <div>
                 <p className="text-[10px] font-black text-amber-200 uppercase tracking-widest mb-1">الزكاة الواجب إخراجها</p>
                 <h2 className="text-5xl font-black text-white drop-shadow-md">
                    {calculation.zakatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                    <span className="text-lg text-amber-200 mr-2">{currencySymbol}</span>
                 </h2>
             </div>

             <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${calculation.isEligible ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-100 border border-rose-400/30'}`}>
                {calculation.isEligible ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {calculation.isEligible ? 'بلغ النصاب - تجب الزكاة' : `لم تبلغ النصاب (${calculation.nisabThreshold.toLocaleString()} ${currencySymbol})`}
             </div>
         </div>
      </div>

      {/* Settings (Gold Price) */}
      <div className="bg-slate-900/60 p-4 rounded-[2rem] border border-slate-800 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                <SettingsIconComp size={20} />
            </div>
            <div>
                <p className="text-[9px] text-slate-500 font-black uppercase">سعر جرام الذهب (24)</p>
                <p className="text-xs text-white font-bold">يستخدم لحساب النصاب</p>
            </div>
         </div>
         <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-white/5">
            <input 
                type="number" 
                value={goldPrice} 
                onChange={(e) => setGoldPrice(parseFloat(e.target.value))} 
                className="w-20 bg-transparent text-white font-black text-center outline-none" 
            />
            <span className="text-[9px] text-slate-500 font-bold">{currencySymbol}</span>
         </div>
      </div>

      <div className="space-y-4">
        <button onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-2 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-amber-500 transition-colors">
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            إدخال الأصول والخصوم
        </button>

        {showDetails && (
            <div className="grid gap-4 animate-slide-up">
                {/* Cash */}
                <InputCard 
                    icon={<Coins size={20} />} 
                    label="السيولة النقدية" 
                    subLabel="أرصدة البنوك + الكاش"
                    value={cash} 
                    onChange={setCash} 
                    color="text-emerald-500"
                    bgColor="bg-emerald-500/10"
                />

                {/* Gold & Silver */}
                <div className="grid grid-cols-2 gap-4">
                    <InputCard 
                        icon={<span className="text-lg font-black">Au</span>} 
                        label="ذهب (جرام)" 
                        subLabel="للاتخار أو الزينة (حسب المذهب)"
                        value={goldWeight} 
                        onChange={setGoldWeight} 
                        color="text-amber-400"
                        bgColor="bg-amber-400/10"
                    />
                    <InputCard 
                        icon={<TrendingUp size={20} />} 
                        label="أسهم / تجارة" 
                        subLabel="القيمة السوقية الحالية"
                        value={stocks} 
                        onChange={setStocks} 
                        color="text-blue-400"
                        bgColor="bg-blue-400/10"
                    />
                </div>

                {/* Debts (Assets vs Liabilities) */}
                <div className="grid grid-cols-2 gap-4">
                    <InputCard 
                        icon={<TrendingUp size={20} />} 
                        label="ديون لك" 
                        subLabel="مرجوة السداد"
                        value={owedToMe} 
                        onChange={setOwedToMe} 
                        color="text-emerald-500"
                        bgColor="bg-emerald-500/10"
                    />
                    <InputCard 
                        icon={<TrendingDown size={20} />} 
                        label="ديون عليك" 
                        subLabel="تخصم من الوعاء"
                        value={debtsOnMe} 
                        onChange={setDebtsOnMe} 
                        color="text-rose-500"
                        bgColor="bg-rose-500/10"
                    />
                </div>
            </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
         <div className="flex items-center gap-3 mb-2">
            <Info size={18} className="text-slate-500" />
            <h4 className="text-sm font-black text-white">ملخص الوعاء الزكوي</h4>
         </div>
         <div className="space-y-2 text-xs font-bold text-slate-400">
            <div className="flex justify-between">
                <span>إجمالي الأصول:</span>
                <span className="text-emerald-500">{calculation.totalAssets.toLocaleString()} {currencySymbol}</span>
            </div>
            <div className="flex justify-between">
                <span>يخصم الديون:</span>
                <span className="text-rose-500">-{parseFloat(debtsOnMe || '0').toLocaleString()} {currencySymbol}</span>
            </div>
            <div className="w-full h-px bg-slate-800 my-2"></div>
            <div className="flex justify-between text-white text-sm">
                <span>صافي الوعاء:</span>
                <span>{calculation.netAssets.toLocaleString()} {currencySymbol}</span>
            </div>
            <div className="flex justify-between text-[10px] text-amber-500 pt-1">
                <span>النصاب الشرعي (85 جرام ذهب):</span>
                <span>{calculation.nisabThreshold.toLocaleString()} {currencySymbol}</span>
            </div>
         </div>
      </div>

    </div>
  );
};

// Helper Components
const InputCard = ({ icon, label, subLabel, value, onChange, color, bgColor }: any) => (
    <div className="bg-slate-900 p-5 rounded-[2.2rem] border border-slate-800 flex flex-col gap-3 transition-all focus-within:border-slate-700">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor} ${color}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className="text-[8px] text-slate-600 font-bold">{subLabel}</p>
                </div>
            </div>
        </div>
        <input 
            type="number" 
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="0"
            className="bg-transparent text-2xl font-black text-white outline-none w-full placeholder:text-slate-800"
        />
    </div>
);

const SettingsIconComp = ({size}: {size:number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

export default ZakatCalculator;
