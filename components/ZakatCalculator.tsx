import React, { useState, useMemo } from 'react';
import { Coins, Scale, TrendingDown, TrendingUp, Info, CheckCircle2, XCircle, ChevronDown, ChevronUp, Landmark, FileText, Sparkles, AlertCircle } from 'lucide-react';

interface ZakatCalculatorProps {
  totalBalance: number; // الرصيد الحالي من التطبيق للمساعدة
  currencySymbol: string;
}

const ZakatCalculator: React.FC<ZakatCalculatorProps> = ({ totalBalance, currencySymbol }) => {
  // أسعار افتراضية للذهب والفضة
  const [goldPrice, setGoldPrice] = useState(285); // سعر جرام الذهب عيار 24 الأساسي

  // فروع المعادن الثمينة
  const [gold24, setGold24] = useState('');
  const [gold21, setGold21] = useState('');
  const [gold18, setGold18] = useState('');
  const [silverWeight, setSilverWeight] = useState('');

  // الأصول والمدخرات والسيولة
  const [cash, setCash] = useState(totalBalance.toFixed(2));
  
  // المحافظ والأسهم
  const [tradingStocks, setTradingStocks] = useState(''); // أسهم مضاربة ومتاجرة (تزكى كأورق تجارية بسعر السوق كاملة)
  const [longTermStocks, setLongTermStocks] = useState(''); // أسهم استثمارية طويلة المدى (تزكى أرباحها فقط أو الجزء السائل بنسبة 2.5% أو 10% من ريعها)
  const [longTermStockDividends, setLongTermStockDividends] = useState(''); // ريع وتوزيعات الأسهم الاستثمارية

  // العقارات الاستثمارية
  const [realEstateTrading, setRealEstateTrading] = useState(''); // عقار مخصص للبيع والمضاربة (يزكى بسعره السوقي الكامل)
  const [realEstateRentalValue, setRealEstateRentalValue] = useState(''); // عقار مخصص للتأجير (يزكى صافي الريع السنوي)

  // مستحقات والتزامات
  const [owedToMe, setOwedToMe] = useState(''); // ديون مرجوة السداد لك عند الغير
  const [debtsOnMe, setDebtsOnMe] = useState(''); // ديون والتزامات مالية مستحقة للغير (تخصم من الوعاء)

  // طريقة الحساب للمحافظ طويلة الأجل
  const [longTermZakatMethod, setLongTermZakatMethod] = useState<'liquid' | 'dividends'>('liquid');

  // حالة عرض التفاصيل والتبويبات الفرعية
  const [activeSubTab, setActiveSubTab] = useState<'metals' | 'funds' | 'realestate' | 'debts'>('metals');

  // منشئ الحسابات الشاملة للزكاة الممتدة لقادة الأعمال والشخصيات المرموقة
  const calculation = useMemo(() => {
    const cashVal = parseFloat(cash) || 0;
    
    // حساب قيمة الذهب الفعلي حسب العيار
    const g24Weight = parseFloat(gold24) || 0;
    const g21Weight = parseFloat(gold21) || 0;
    const g18Weight = parseFloat(gold18) || 0;

    const gold24Val = g24Weight * goldPrice;
    const gold21Val = g21Weight * (goldPrice * 21 / 24);
    const gold18Val = g18Weight * (goldPrice * 18 / 24);
    const totalGoldVal = gold24Val + gold21Val + gold18Val;

    // حساب الفضة
    const silverVal = (parseFloat(silverWeight) || 0) * (goldPrice / 85); // تقدير معتدل للفضة

    // حساب الأسهم والمحافظ الاستثمارية
    const tradingStocksVal = parseFloat(tradingStocks) || 0; // تخضع للزكاة كاملة بنسبة 2.5%
    
    // المحافظ الاستثمارية طويلة الأجل
    const longTermStocksMarketVal = parseFloat(longTermStocks) || 0;
    const longTermDividendsVal = parseFloat(longTermStockDividends) || 0;
    
    // زكاة المحفظة الاستثمارية طويلة الأجل حسب المعايير الدولية للزكاة (AAOIFI)
    // طريقة الوعاء السائل (وتقدر عادة بنسبة 10% من إجمالي القيمة الدفترية أو القيمة السائلة الفعلية)
    // طريقة زكاة الريع فقط (10% من صافي التوزيعات والأرباح كعروض التجارة)
    const longTermStocksZakatBase = longTermZakatMethod === 'liquid' 
      ? longTermStocksMarketVal * 0.10 // 10% كقيمة تقديرية للوعاء الزكوي للمحفظة
      : longTermDividendsVal; // فقط التوزيعات والأرباح النقدية

    // حساب العقار الاستثماري
    const reTradingVal = parseFloat(realEstateTrading) || 0; // يزكى بالكامل
    const reRentalVal = parseFloat(realEstateRentalValue) || 0; // تزكى الأرباح والريع فقط

    const owedVal = parseFloat(owedToMe) || 0;
    const debtsVal = parseFloat(debtsOnMe) || 0;

    // تجميع الوعاء الزكوي الإجمالي الخاضع للحساب
    // يشمل الكاش، الفضة، الذهب، الأسهم المخصصة للتجارة، وعاء المحافظ طويلة المدى، عقار البيع، ريع عقار التأجير، والدائن
    const totalAssets = cashVal + totalGoldVal + silverVal + tradingStocksVal + longTermStocksZakatBase + reTradingVal + reRentalVal + owedVal;
    
    // الخصم الشرعي للالتزامات
    const netAssets = Math.max(0, totalAssets - debtsVal);

    // نصاب الذهب الرئيسي: 85 جرام عيار 24
    const nisabThreshold = 85 * goldPrice;
    const isEligible = netAssets >= nisabThreshold;
    
    // الزكاة المستحقة 2.5% من صافي الوعاء
    const zakatAmount = isEligible ? netAssets * 0.025 : 0;

    return {
      cashVal,
      totalGoldVal,
      silverVal,
      tradingStocksVal,
      longTermStocksZakatBase,
      reTradingVal,
      reRentalVal,
      owedVal,
      debtsVal,
      totalAssets,
      netAssets,
      nisabThreshold,
      isEligible,
      zakatAmount,
      totalGoldWeight: g24Weight + g21Weight + g18Weight
    };
  }, [cash, gold24, gold21, gold18, silverWeight, tradingStocks, longTermStocks, longTermStockDividends, longTermZakatMethod, realEstateTrading, realEstateRentalValue, owedToMe, debtsOnMe, goldPrice]);

  return (
    <div className="space-y-6 pb-24 animate-luxury-pop">
      
      {/* Header Card Elite Style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 p-8 rounded-[3rem] shadow-2xl text-center group border border-amber-400/20">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-300/25 via-transparent to-transparent pointer-events-none"></div>
         <div className="relative z-10 space-y-4">
             <div className="flex justify-center mb-1">
                 <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/25 shadow-xl">
                    <Scale size={28} className="text-white animate-pulse" />
                 </div>
             </div>
             
             <div>
                 <p className="text-[10px] font-black text-amber-100 uppercase tracking-widest mb-1 opacity-90">الوعاء الزكوي والالتزامات التنفيذية</p>
                 <h2 className="text-5xl font-black text-white drop-shadow-lg tracking-tight">
                    {calculation.zakatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                    <span className="text-xl text-amber-100 mr-2 font-bold">{currencySymbol}</span>
                 </h2>
             </div>

             <div className="flex justify-center">
               <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider ${calculation.isEligible ? 'bg-slate-950/40 text-amber-400 border border-amber-400/30' : 'bg-slate-950/40 text-slate-400 border border-white/5'}`}>
                  {calculation.isEligible ? <CheckCircle2 size={14} className="text-amber-400" /> : <XCircle size={14} className="text-slate-500" />}
                  {calculation.isEligible ? 'بلغ الوعاء النصاب الشرعي - مستحقة الصرف' : `لم يبلغ النصاب حالياً (${Math.round(calculation.nisabThreshold).toLocaleString()} ${currencySymbol})`}
               </div>
             </div>
         </div>
      </div>

      {/* Gold Price Configuration */}
      <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-[2rem] border border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                <Coins size={20} />
            </div>
            <div>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">سعر مرجع الذهب عيار 24 (اليوم)</p>
                <p className="text-xs text-slate-300 font-bold">تحديث مؤشر النصاب التلقائي</p>
            </div>
         </div>
         <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-white/5">
            <input 
                type="number" 
                value={goldPrice} 
                onChange={(e) => setGoldPrice(parseFloat(e.target.value) || 0)} 
                className="w-16 bg-transparent text-white font-black text-center outline-none" 
            />
            <span className="text-[9px] text-slate-500 font-bold">{currencySymbol}</span>
         </div>
      </div>

      {/* Extended Modules Navigation tabs */}
      <div className="bg-slate-950/80 p-1 rounded-2xl border border-white/5 flex gap-1">
        <button 
          onClick={() => setActiveSubTab('metals')} 
          className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeSubTab === 'metals' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 border' : 'text-slate-400 hover:text-white'}`}
        >
          المعادن والسيولة
        </button>
        <button 
          onClick={() => setActiveSubTab('funds')} 
          className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeSubTab === 'funds' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 border' : 'text-slate-400 hover:text-white'}`}
        >
          المحافظ والأسهم
        </button>
        <button 
          onClick={() => setActiveSubTab('realestate')} 
          className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeSubTab === 'realestate' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 border' : 'text-slate-400 hover:text-white'}`}
        >
          العقارات والأصول
        </button>
        <button 
          onClick={() => setActiveSubTab('debts')} 
          className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeSubTab === 'debts' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 border' : 'text-slate-400 hover:text-white'}`}
        >
          الالتزامات والدائن
        </button>
      </div>

      {/* Multi-Section form contents */}
      <div className="space-y-4">
        {activeSubTab === 'metals' && (
          <div className="grid gap-4 animate-luxury-pop">
            <InputCard 
              icon={<Coins size={20} />} 
              label="السيولة المالية الإجمالية" 
              subLabel="أرصدة البنوك، النقد الحر، والشيكات المقبولة"
              value={cash} 
              onChange={setCash} 
              color="text-emerald-500"
              bgColor="bg-emerald-500/10"
              currencySymbol={currencySymbol}
            />

            <div className="grid grid-cols-3 gap-3">
              <InputCard 
                icon={<span className="text-[10px] font-black">Au 24</span>} 
                label="ذهب عيار 24 (g)" 
                subLabel="سبائك أو مدخرات"
                value={gold24} 
                onChange={setGold24} 
                color="text-amber-400"
                bgColor="bg-amber-400/10"
              />
              <InputCard 
                icon={<span className="text-[10px] font-black">Au 21</span>} 
                label="ذهب عيار 21 (g)" 
                subLabel="حلي مخصصة للكنز"
                value={gold21} 
                onChange={setGold21} 
                color="text-amber-500"
                bgColor="bg-amber-500/10"
              />
              <InputCard 
                icon={<span className="text-[10px] font-black">Au 18</span>} 
                label="ذهب عيار 18 (g)" 
                subLabel="ذهب مصنع ومصاغ"
                value={gold18} 
                onChange={setGold18} 
                color="text-amber-600"
                bgColor="bg-amber-600/10"
              />
            </div>

            <InputCard 
              icon={<Coins size={20} className="text-slate-400" />} 
              label="الفضة والسبائك الفضية (جرام)" 
              subLabel="ما يملكه الفرد من فضة غير مخصصة للاستخدام الشخصي"
              value={silverWeight} 
              onChange={setSilverWeight} 
              color="text-slate-300"
              bgColor="bg-slate-100/10"
            />
          </div>
        )}

        {activeSubTab === 'funds' && (
          <div className="grid gap-4 animate-luxury-pop">
            <InputCard 
              icon={<TrendingUp size={20} />} 
              label="محافظ المضاربة والأسهم قصيرة الأجل" 
              subLabel="القيم السوقية الجارية للأسهم المعدة للبيع لغرض الربح السريع"
              value={tradingStocks} 
              onChange={setTradingStocks} 
              color="text-blue-400"
              bgColor="bg-blue-400/10"
              currencySymbol={currencySymbol}
            />

            <div className="bg-slate-900 border border-white/5 p-5 rounded-[2.2rem] space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-white">المحافظ طويلة الأجل والأسهم الاستراتيجية</h4>
                  <p className="text-[8px] text-slate-500 font-bold">تحديد معايير الزكاة للمدخرات الاستثمارية</p>
                </div>
                <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setLongTermZakatMethod('liquid')}
                    className={`px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all ${longTermZakatMethod === 'liquid' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'}`}
                  >
                    10% تقديري
                  </button>
                  <button 
                    onClick={() => setLongTermZakatMethod('dividends')}
                    className={`px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all ${longTermZakatMethod === 'dividends' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'}`}
                  >
                    التوزيعات فقط
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">القيمة السوقية للمحفظة</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={longTermStocks} 
                    onChange={e => setLongTermStocks(e.target.value)} 
                    className="w-full bg-slate-950 border border-white/5 rounded-xl p-3.5 text-white font-black text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">العوائد / ريع التوزيعات النقدية</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={longTermStockDividends} 
                    onChange={e => setLongTermStockDividends(e.target.value)} 
                    className="w-full bg-slate-950 border border-white/5 rounded-xl p-3.5 text-white font-black text-sm outline-none" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'realestate' && (
          <div className="grid gap-4 animate-luxury-pop">
            <InputCard 
              icon={<Landmark size={20} />} 
              label="عقارات مخصصة للبيع (عروض تجارة)" 
              subLabel="سعر العقار التقديري المعروض للتجارة أو المضاربة بهدف التربح"
              value={realEstateTrading} 
              onChange={setRealEstateTrading} 
              color="text-amber-500"
              bgColor="bg-amber-500/10"
              currencySymbol={currencySymbol}
            />

            <InputCard 
              icon={<Landmark size={20} className="scale-95 text-blue-400" />} 
              label="صافي ريع عقارات التأجير عالي الأصول" 
              subLabel="صافي الإيراد السنوي المستلم من العقارات المؤجرة المطروحة للاستغلال السكني أو التجاري"
              value={realEstateRentalValue} 
              onChange={setRealEstateRentalValue} 
              color="text-blue-400"
              bgColor="bg-blue-400/10"
              currencySymbol={currencySymbol}
            />
          </div>
        )}

        {activeSubTab === 'debts' && (
          <div className="grid gap-4 animate-luxury-pop">
            <InputCard 
              icon={<TrendingUp size={20} />} 
              label="ديون وحقوق مرجوة السداد لك عند الغير" 
              subLabel="المستحقات المالية المؤكدة التي يوثق في التزام أصحابها بالسداد خلال الحول"
              value={owedToMe} 
              onChange={setOwedToMe} 
              color="text-emerald-400"
              bgColor="bg-emerald-400/10"
              currencySymbol={currencySymbol}
            />

            <InputCard 
              icon={<TrendingDown size={20} />} 
              label="ديون مستحقة والتزامات قانونية وتجارية عليك" 
              subLabel="الديون الحالة، المتأخرات التجارية والالتزامات المالية للغير التي يتم خصمها من وعاء الزكاة"
              value={debtsOnMe} 
              onChange={setDebtsOnMe} 
              color="text-rose-500"
              bgColor="bg-rose-500/10"
              currencySymbol={currencySymbol}
            />
          </div>
        )}
      </div>

      {/* Summary of Zakat Pool - Executive Report style */}
      <div className="bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/5 space-y-4">
         <div className="flex items-center gap-3">
            <FileText size={18} className="text-amber-500" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">التقرير التنفيذي الشامل لحساب الزكاة</h4>
         </div>

         <div className="space-y-3 text-[11px] font-bold text-slate-400">
            <div className="flex justify-between">
                <span>السيولة النقدية والودائع الجارية:</span>
                <span className="text-white">{calculation.cashVal.toLocaleString()} {currencySymbol}</span>
            </div>
            
            {calculation.totalGoldWeight > 0 && (
              <div className="flex justify-between">
                  <span>الأصول الذهبية والسبائك:</span>
                  <span className="text-white">{calculation.totalGoldVal.toLocaleString()} {currencySymbol}</span>
              </div>
            )}

            {calculation.tradingStocksVal > 0 && (
              <div className="flex justify-between">
                  <span>المحافظ والأسهم قصيرة المدى:</span>
                  <span className="text-white">{calculation.tradingStocksVal.toLocaleString()} {currencySymbol}</span>
              </div>
            )}

            {calculation.longTermStocksZakatBase > 0 && (
              <div className="flex justify-between">
                  <span>محافظ الاستثمار الاستراتيجي (الوعاء التقديري):</span>
                  <span className="text-white">{calculation.longTermStocksZakatBase.toLocaleString()} {currencySymbol}</span>
              </div>
            )}

            {(calculation.reTradingVal > 0 || calculation.reRentalVal > 0) && (
              <div className="flex justify-between">
                  <span>الأصول العقارية والريع الاستثماري الخاضع للزكاة:</span>
                  <span className="text-white">{(calculation.reTradingVal + calculation.reRentalVal).toLocaleString()} {currencySymbol}</span>
              </div>
            )}

            {calculation.owedVal > 0 && (
              <div className="flex justify-between">
                  <span>ديون وذمم مستحقة لك:</span>
                  <span className="text-white">{calculation.owedVal.toLocaleString()} {currencySymbol}</span>
              </div>
            )}

            <div className="w-full h-px bg-slate-800/80 my-2"></div>

            <div className="flex justify-between">
                <span>إجمالي الأصول والمدخرات الزكوية:</span>
                <span className="text-amber-500 font-extrabold">{calculation.totalAssets.toLocaleString()} {currencySymbol}</span>
            </div>

            <div className="flex justify-between items-center text-rose-400">
                <span>يخصم الخصوم والالتزامات المستحقة:</span>
                <span>-{calculation.debtsVal.toLocaleString()} {currencySymbol}</span>
            </div>

            <div className="w-full h-px bg-slate-800/80 my-2"></div>

            <div className="flex justify-between text-white text-xs pt-1">
                <span className="flex items-center gap-1 font-black">صافي الوعاء الزكوي الخاضع:</span>
                <span className="font-black text-md">{calculation.netAssets.toLocaleString()} {currencySymbol}</span>
            </div>

            <div className="flex justify-between text-[9px] text-slate-500 pt-2">
                <span>حد النصاب الشرعي القياسي (85g عيار 24):</span>
                <span>{calculation.nisabThreshold.toLocaleString()} {currencySymbol}</span>
            </div>
         </div>
      </div>

    </div>
  );
};

// Helper Sub-Component
interface InputCardProps {
  icon: React.ReactNode;
  label: string;
  subLabel: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
  bgColor: string;
  currencySymbol?: string;
}

const InputCard: React.FC<InputCardProps> = ({ icon, label, subLabel, value, onChange, color, bgColor, currencySymbol }) => (
    <div className="bg-slate-900 border border-white/5 p-5 rounded-[2.2rem] flex flex-col gap-3 transition-colors focus-within:border-amber-500/30">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${bgColor} ${color}`}>
                    {icon}
                </div>
                <div>
                    <h5 className="text-[10px] font-black text-white uppercase tracking-wider">{label}</h5>
                    <p className="text-[8px] text-slate-500 font-semibold">{subLabel}</p>
                </div>
            </div>
        </div>
        <div className="relative">
          <input 
              type="number" 
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="0"
              className="bg-transparent text-2xl font-black text-white outline-none w-full placeholder:text-slate-800 pr-1 pl-12"
          />
          {currencySymbol && (
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2.5 py-1.5 rounded-lg border border-white/5">
              {currencySymbol}
            </span>
          )}
        </div>
    </div>
);

export default ZakatCalculator;
