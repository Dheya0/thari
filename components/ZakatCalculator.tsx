import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  Coins, 
  Layers, 
  ShieldCheck, 
  Calendar, 
  ChevronLeft, 
  Plus, 
  RotateCcw, 
  Check, 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  Sparkles, 
  Clock,
  Wallet as WalletIcon,
  HandCoins,
  Gem,
  Building,
  TrendingUp,
  HelpCircle,
  X,
  FileCheck,
  Share2,
  DollarSign
} from 'lucide-react';
import { Wallet, Transaction, Debt, Currency, ZakatProfile, ZakatScopeType, ZakatPaymentRecord } from '../types';
import { convertCurrency, DEFAULT_EXCHANGE_RATES } from '../constants';
import { formatFinancialNumber } from './ElegantDashboard';

interface ZakatCalculatorProps {
  totalBalance?: number;
  currencySymbol?: string;
  debts?: Debt[];
  wallets?: Wallet[];
  transactions?: Transaction[];
  currencies?: Currency[];
  currentCurrency?: Currency;
  exchangeRates?: Record<string, number>;
  zakatProfiles?: ZakatProfile[];
  zakatPayments?: ZakatPaymentRecord[];
  onSaveProfiles?: (profiles: ZakatProfile[]) => void;
  onSavePayments?: (payments: ZakatPaymentRecord[]) => void;
}

// Default benchmark price for 24k Gold per gram across major currencies
const DEFAULT_GOLD_PRICES: Record<string, number> = {
  SAR: 290,
  USD: 77,
  YER: 42000,
  AED: 285,
  EGP: 3600,
  KWD: 24,
  QAR: 282,
  OMR: 30,
  BHD: 29,
  EUR: 71,
  GBP: 61,
};

export const ZakatCalculator: React.FC<ZakatCalculatorProps> = ({
  totalBalance = 0,
  currencySymbol = 'ر.س',
  debts = [],
  wallets = [],
  transactions = [],
  currencies = [],
  currentCurrency = { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' },
  exchangeRates = DEFAULT_EXCHANGE_RATES,
  zakatProfiles,
  zakatPayments = [],
  onSaveProfiles,
  onSavePayments
}) => {
  const baseCurrencyCode = currentCurrency.code || 'SAR';

  // Initialize Default Profiles if none exist
  const [profiles, setProfiles] = useState<ZakatProfile[]>(() => {
    if (zakatProfiles && zakatProfiles.length > 0) return zakatProfiles;
    
    // Check localStorage fallback
    const saved = localStorage.getItem('thari_zakat_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved zakat profiles', e);
      }
    }

    // Create standard default profile
    const defaultProfile: ZakatProfile = {
      id: 'zp-personal-default',
      name: 'زكاة أموالي الشخصية',
      description: 'النطاق المالي الشامل للمحافظ والمدخرات والذهب الشخصي',
      scopeType: 'all',
      selectedWalletIds: wallets.map(w => w.id),
      includeDebtsToMe: true,
      includeDebtsOnMe: true,
      gold24Grams: 0,
      gold21Grams: 0,
      gold18Grams: 0,
      silverGrams: 0,
      tradeInventoryValue: 0,
      tradingStocksValue: 0,
      investmentStocksMethod: 'liquid_ratio',
      longTermStocksValue: 0,
      longTermDividendsValue: 0,
      realEstateTradeValue: 0,
      hawlStartDate: new Date(Date.now() - 336 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // ~11 months ago as default
      hawlDurationDays: 354, // Hijri lunar year
      customDeductions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return [defaultProfile];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => profiles[0]?.id || 'zp-personal-default');
  const [payments, setPayments] = useState<ZakatPaymentRecord[]>(() => {
    if (zakatPayments && zakatPayments.length > 0) return zakatPayments;
    const saved = localStorage.getItem('thari_zakat_payments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Active Profile object
  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || profiles[0] || {
      id: 'temp',
      name: 'زكاة أموالي',
      scopeType: 'all',
      selectedWalletIds: wallets.map(w => w.id),
      includeDebtsToMe: true,
      includeDebtsOnMe: true,
      gold24Grams: 0,
      gold21Grams: 0,
      gold18Grams: 0,
      silverGrams: 0,
      tradeInventoryValue: 0,
      tradingStocksValue: 0,
      investmentStocksMethod: 'liquid_ratio',
      longTermStocksValue: 0,
      longTermDividendsValue: 0,
      realEstateTradeValue: 0,
      hawlStartDate: new Date().toISOString().split('T')[0],
      hawlDurationDays: 354,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as ZakatProfile;
  }, [profiles, activeProfileId, wallets]);

  // Gold 24k Gram price in current currency
  const [goldPrice24k, setGoldPrice24k] = useState<number>(() => {
    return DEFAULT_GOLD_PRICES[baseCurrencyCode] || (77 * (exchangeRates[baseCurrencyCode] || 1));
  });

  // Modals and view states
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHawlResetConfirm, setShowHawlResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'breakdown' | 'history'>('calculator');
  const [editingProfileName, setEditingProfileName] = useState('');

  // Form states for adding payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRecipient, setPaymentRecipient] = useState('');
  const [paymentWalletId, setPaymentWalletId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Persist profiles
  const updateProfiles = (newProfiles: ZakatProfile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem('thari_zakat_profiles', JSON.stringify(newProfiles));
    if (onSaveProfiles) onSaveProfiles(newProfiles);
  };

  const updateActiveProfile = (partial: Partial<ZakatProfile>) => {
    const updated = profiles.map(p => {
      if (p.id === activeProfile.id) {
        return { ...p, ...partial, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    updateProfiles(updated);
  };

  // Sync default gold price if currency changes
  useEffect(() => {
    if (DEFAULT_GOLD_PRICES[baseCurrencyCode]) {
      setGoldPrice24k(DEFAULT_GOLD_PRICES[baseCurrencyCode]);
    } else {
      const usdPrice = 77;
      const rate = exchangeRates[baseCurrencyCode] || 1;
      setGoldPrice24k(usdPrice * rate);
    }
  }, [baseCurrencyCode, exchangeRates]);

  // ─────────────────────────────────────────────────────────────────
  // CALCULATIONS BASED ON ACTIVE PROFILE SCOPE
  // ─────────────────────────────────────────────────────────────────

  // 1. Calculate live balances of ALL wallets
  const allWalletBalances = useMemo(() => {
    return wallets.map(wallet => {
      let balance = 0;
      transactions.forEach(t => {
        if (t.isDeleted) return;
        const amt = Number(t.amount) || 0;
        const conv = Number(t.convertedAmountInWalletCurrency) || amt;

        if (t.walletId === wallet.id) {
          if (t.type === 'income') balance += conv;
          else if (t.type === 'expense') balance -= conv;
          else if (t.type === 'transfer') balance -= amt;
          else if (t.type === 'adjustment') balance = amt;
        } else if (t.destinationWalletId === wallet.id && t.type === 'transfer') {
          const destAmt = Number(t.destinationAmount) || amt;
          balance += destAmt;
        }
      });

      const inBaseCurrency = convertCurrency(balance, wallet.currencyCode, baseCurrencyCode, exchangeRates);
      
      return {
        ...wallet,
        nativeBalance: balance,
        balanceInBase: inBaseCurrency,
      };
    });
  }, [wallets, transactions, baseCurrencyCode, exchangeRates]);

  // 2. Wallets included in the active Scope
  const scopedWallets = useMemo(() => {
    if (activeProfile.scopeType === 'all') {
      return allWalletBalances;
    }
    const selectedIds = new Set(activeProfile.selectedWalletIds || []);
    return allWalletBalances.filter(w => selectedIds.has(w.id));
  }, [activeProfile.scopeType, activeProfile.selectedWalletIds, allWalletBalances]);

  // Total cash in scoped wallets in base currency
  const scopedCashInBase = useMemo(() => {
    return scopedWallets.reduce((sum, w) => sum + (w.balanceInBase || 0), 0);
  }, [scopedWallets]);

  // Distinct currencies included in the scope
  const scopedCurrenciesCount = useMemo(() => {
    const set = new Set(scopedWallets.map(w => w.currencyCode));
    return set.size;
  }, [scopedWallets]);

  // 3. Debts (Receivables & Payables) in Scope
  const scopedDebts = useMemo(() => {
    let toMe = 0;
    let onMe = 0;

    debts.forEach(d => {
      if (d.isPaid || d.status === 'settled') return;
      const remaining = Math.max(0, (Number(d.amount) || 0) - (Number(d.paidAmount) || 0));
      const inBase = convertCurrency(remaining, d.currency || baseCurrencyCode, baseCurrencyCode, exchangeRates);

      if (d.type === 'to_me') {
        toMe += inBase;
      } else {
        onMe += inBase;
      }
    });

    const includedToMe = activeProfile.includeDebtsToMe ? toMe : 0;
    const includedOnMe = activeProfile.includeDebtsOnMe ? onMe : 0;

    return {
      toMeTotal: toMe,
      onMeTotal: onMe,
      includedToMe,
      includedOnMe
    };
  }, [debts, activeProfile.includeDebtsToMe, activeProfile.includeDebtsOnMe, baseCurrencyCode, exchangeRates]);

  // 4. Precious Metals (Gold & Silver)
  const metalsValue = useMemo(() => {
    const g24 = Number(activeProfile.gold24Grams) || 0;
    const g21 = Number(activeProfile.gold21Grams) || 0;
    const g18 = Number(activeProfile.gold18Grams) || 0;
    const silver = Number(activeProfile.silverGrams) || 0;

    const val24 = g24 * goldPrice24k;
    const val21 = g21 * (goldPrice24k * (21 / 24));
    const val18 = g18 * (goldPrice24k * (18 / 24));
    const totalGold = val24 + val21 + val18;

    // Approximate silver gram price as 1/85 of gold
    const silverPricePerGram = goldPrice24k / 85;
    const totalSilver = silver * silverPricePerGram;

    return {
      g24Weight: g24,
      g21Weight: g21,
      g18Weight: g18,
      silverWeight: silver,
      totalGoldVal: totalGold,
      totalSilverVal: totalSilver,
      totalMetalsVal: totalGold + totalSilver
    };
  }, [activeProfile.gold24Grams, activeProfile.gold21Grams, activeProfile.gold18Grams, activeProfile.silverGrams, goldPrice24k]);

  // 5. Commercial, Stocks & Real Estate
  const businessAndStocksValue = useMemo(() => {
    const tradeInv = Number(activeProfile.tradeInventoryValue) || 0;
    const tradingStocks = Number(activeProfile.tradingStocksValue) || 0;
    const reTrade = Number(activeProfile.realEstateTradeValue) || 0;

    let longTermBase = 0;
    if (activeProfile.investmentStocksMethod === 'liquid_ratio') {
      longTermBase = (Number(activeProfile.longTermStocksValue) || 0) * 0.10; // 10% Zakatable liquid asset benchmark
    } else {
      longTermBase = Number(activeProfile.longTermDividendsValue) || 0;
    }

    return {
      tradeInventory: tradeInv,
      tradingStocks,
      longTermStocksBase: longTermBase,
      realEstateTrade: reTrade,
      totalCommercial: tradeInv + tradingStocks + longTermBase + reTrade
    };
  }, [
    activeProfile.tradeInventoryValue,
    activeProfile.tradingStocksValue,
    activeProfile.investmentStocksMethod,
    activeProfile.longTermStocksValue,
    activeProfile.longTermDividendsValue,
    activeProfile.realEstateTradeValue
  ]);

  // 6. Net Zakatable Pool & Nisab Calculation
  const zakatCalculation = useMemo(() => {
    // Total Zakatable Gross Assets inside Scope
    const grossAssets = 
      scopedCashInBase + 
      scopedDebts.includedToMe + 
      metalsValue.totalMetalsVal + 
      businessAndStocksValue.totalCommercial;

    // Deductible liabilities
    const deductions = scopedDebts.includedOnMe + (Number(activeProfile.customDeductions) || 0);

    // Net Zakatable Base
    const netBase = Math.max(0, grossAssets - deductions);

    // Nisab Benchmark: 85 grams of 24k Gold
    const nisabThreshold = 85 * goldPrice24k;
    const hasReachedNisab = netBase >= nisabThreshold;

    // Hawl Tracking (حساب أيام الحول)
    const startDate = activeProfile.hawlStartDate ? new Date(activeProfile.hawlStartDate) : new Date();
    const today = new Date();
    const elapsedDays = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalHawlDays = activeProfile.hawlDurationDays || 354;
    const remainingDays = Math.max(0, totalHawlDays - elapsedDays);
    const isHawlCompleted = elapsedDays >= totalHawlDays;

    // Estimated / Due Zakat (2.5% = 1/40)
    const zakatRate = 0.025;
    const estimatedZakat = hasReachedNisab ? netBase * zakatRate : 0;

    return {
      grossAssets,
      deductions,
      netBase,
      nisabThreshold,
      hasReachedNisab,
      elapsedDays,
      totalHawlDays,
      remainingDays,
      isHawlCompleted,
      zakatRate,
      estimatedZakat
    };
  }, [
    scopedCashInBase, 
    scopedDebts.includedToMe, 
    scopedDebts.includedOnMe, 
    metalsValue.totalMetalsVal, 
    businessAndStocksValue.totalCommercial, 
    activeProfile.customDeductions, 
    activeProfile.hawlStartDate, 
    activeProfile.hawlDurationDays, 
    goldPrice24k
  ]);

  // Handlers for Scope Selection
  const handleSelectScopeType = (type: ZakatScopeType) => {
    if (type === 'all') {
      updateActiveProfile({
        scopeType: 'all',
        selectedWalletIds: wallets.map(w => w.id)
      });
    } else if (type === 'selected_wallets') {
      updateActiveProfile({
        scopeType: 'selected_wallets',
        selectedWalletIds: activeProfile.selectedWalletIds.length > 0 ? activeProfile.selectedWalletIds : wallets.map(w => w.id)
      });
    } else {
      updateActiveProfile({
        scopeType: 'custom'
      });
    }
  };

  const handleToggleWallet = (walletId: string) => {
    const current = new Set(activeProfile.selectedWalletIds || []);
    if (current.has(walletId)) {
      if (current.size > 1) current.delete(walletId);
    } else {
      current.add(walletId);
    }
    updateActiveProfile({
      selectedWalletIds: Array.from(current)
    });
  };

  const handleCreateProfile = () => {
    if (!editingProfileName.trim()) return;
    const newId = 'zp-' + Date.now();
    const newProfile: ZakatProfile = {
      id: newId,
      name: editingProfileName.trim(),
      description: 'ملف زكاة مخصص',
      scopeType: 'selected_wallets',
      selectedWalletIds: wallets.map(w => w.id),
      includeDebtsToMe: false,
      includeDebtsOnMe: true,
      gold24Grams: 0,
      gold21Grams: 0,
      gold18Grams: 0,
      silverGrams: 0,
      tradeInventoryValue: 0,
      tradingStocksValue: 0,
      investmentStocksMethod: 'liquid_ratio',
      longTermStocksValue: 0,
      longTermDividendsValue: 0,
      realEstateTradeValue: 0,
      hawlStartDate: new Date().toISOString().split('T')[0],
      hawlDurationDays: 354,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...profiles, newProfile];
    updateProfiles(updated);
    setActiveProfileId(newId);
    setEditingProfileName('');
    setShowNewProfileModal(false);
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) return;
    const updated = profiles.filter(p => p.id !== id);
    updateProfiles(updated);
    setActiveProfileId(updated[0].id);
  };

  const handleStartNewCycle = () => {
    updateActiveProfile({
      hawlStartDate: new Date().toISOString().split('T')[0],
      lastCalculatedAt: new Date().toISOString()
    });
    setShowHawlResetConfirm(false);
  };

  const handleAddPayment = () => {
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) return;

    const newPayment: ZakatPaymentRecord = {
      id: 'zpay-' + Date.now(),
      profileId: activeProfile.id,
      profileName: activeProfile.name,
      amount: amt,
      currency: baseCurrencyCode,
      date: new Date().toISOString().split('T')[0],
      recipient: paymentRecipient.trim() || 'مستحق زكاة',
      walletId: paymentWalletId || undefined,
      note: paymentNote.trim(),
      cycleYear: new Date().getFullYear().toString()
    };

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    localStorage.setItem('thari_zakat_payments', JSON.stringify(updatedPayments));
    if (onSavePayments) onSavePayments(updatedPayments);

    setPaymentAmount('');
    setPaymentRecipient('');
    setPaymentWalletId('');
    setPaymentNote('');
    setShowPaymentModal(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16 font-sans">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & PROFILE SELECTOR
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale size={18} className="text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                حساب الزكاة والوعاء الشرعي
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/95">
              زكــــاتــــي
            </h1>
          </div>

          {/* Action to Start New Hawl Cycle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHawlResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] text-xs font-medium text-slate-300 hover:text-white transition-all"
              title="بدء دورة جديدة للحول مع الاحتفاظ بنطاق الملف"
            >
              <RotateCcw size={13} />
              <span>بدء دورة زكاة جديدة</span>
            </button>

            <button
              onClick={() => setShowNewProfileModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-all shadow-sm"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>ملف زكاة جديد</span>
            </button>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {profiles.map(p => {
            const isActive = p.id === activeProfile.id;
            return (
              <div
                key={p.id}
                className={`group shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all text-xs font-medium ${
                  isActive 
                    ? 'bg-white text-slate-950 border-white shadow-md font-semibold' 
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <button
                  onClick={() => setActiveProfileId(p.id)}
                  className="flex items-center gap-1.5"
                >
                  <FileCheck size={13} className={isActive ? 'text-slate-950' : 'text-slate-500'} />
                  <span>{p.name}</span>
                </button>

                {profiles.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p.id); }}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 text-slate-500 hover:text-rose-600 ${isActive ? 'text-slate-700' : ''}`}
                    title="حذف الملف"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ZAKAT SCOPE SELECTION (نطاق حساب الزكاة)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white/90">
              حدد نطاق أموالك
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              اختر الأموال والمحافظ التي ترغب بإدراجها في وعاء هذا الملف الزكوي
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400/90 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            {activeProfile.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* OPTION 1: ALL WALLETS */}
          <button
            type="button"
            onClick={() => handleSelectScopeType('all')}
            className={`p-4 rounded-2xl border text-right transition-all duration-200 relative ${
              activeProfile.scopeType === 'all'
                ? 'bg-amber-500/[0.06] border-amber-500/40 shadow-sm'
                : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  activeProfile.scopeType === 'all'
                    ? 'border-amber-400 bg-amber-500'
                    : 'border-slate-600'
                }`}>
                  {activeProfile.scopeType === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <span className="text-sm font-semibold text-white/95">جميع المحافظ</span>
              </div>
              <Layers size={15} className={activeProfile.scopeType === 'all' ? 'text-amber-400' : 'text-slate-500'} />
            </div>
            <p className="text-xs text-slate-400 pr-6">
              {wallets.length} محافظ • {new Set(wallets.map(w => w.currencyCode)).size} عملات
            </p>
          </button>

          {/* OPTION 2: SPECIFIC WALLETS */}
          <button
            type="button"
            onClick={() => handleSelectScopeType('selected_wallets')}
            className={`p-4 rounded-2xl border text-right transition-all duration-200 relative ${
              activeProfile.scopeType === 'selected_wallets'
                ? 'bg-amber-500/[0.06] border-amber-500/40 shadow-sm'
                : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  activeProfile.scopeType === 'selected_wallets'
                    ? 'border-amber-400 bg-amber-500'
                    : 'border-slate-600'
                }`}>
                  {activeProfile.scopeType === 'selected_wallets' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <span className="text-sm font-semibold text-white/95">اختيار محافظ</span>
              </div>
              <WalletIcon size={15} className={activeProfile.scopeType === 'selected_wallets' ? 'text-amber-400' : 'text-slate-500'} />
            </div>
            <p className="text-xs text-slate-400 pr-6">
              تحديد المحافظ يدويًا ({scopedWallets.length} مشمولة)
            </p>
          </button>

          {/* OPTION 3: CUSTOM ADVANCED SCOPE */}
          <button
            type="button"
            onClick={() => handleSelectScopeType('custom')}
            className={`p-4 rounded-2xl border text-right transition-all duration-200 relative ${
              activeProfile.scopeType === 'custom'
                ? 'bg-amber-500/[0.06] border-amber-500/40 shadow-sm'
                : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  activeProfile.scopeType === 'custom'
                    ? 'border-amber-400 bg-amber-500'
                    : 'border-slate-600'
                }`}>
                  {activeProfile.scopeType === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <span className="text-sm font-semibold text-white/95">حساب مخصص</span>
              </div>
              <Gem size={15} className={activeProfile.scopeType === 'custom' ? 'text-amber-400' : 'text-slate-500'} />
            </div>
            <p className="text-xs text-slate-400 pr-6">
              تخصيص كامل (محافظ، ديون، ذهب، تجارة)
            </p>
          </button>

        </div>

        {/* ── SCOPE DETAILS EXPANSION ACCORDING TO SELECTION ── */}

        {/* When 'all' is selected: List of all automatically included wallets */}
        {activeProfile.scopeType === 'all' && (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <span className="text-xs font-semibold text-slate-400 block">
              المحافظ المشمولة تلقائيًا في هذا النطاق:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {allWalletBalances.map(w => (
                <div 
                  key={w.id} 
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-white/90 truncate">{w.name}</span>
                  </div>
                  <span className="text-xs font-numeric font-medium text-slate-300">
                    {formatFinancialNumber(w.nativeBalance, true)} {w.currencyCode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* When 'selected_wallets' or 'custom' is selected: Interactive Checklist of Wallets */}
        {(activeProfile.scopeType === 'selected_wallets' || activeProfile.scopeType === 'custom') && (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                اختر المحافظ التي تريد حساب زكاتها:
              </span>
              <span className="text-[11px] text-amber-400 font-medium">
                سيتم احتساب الزكاة فقط من المحافظ المحددة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {allWalletBalances.map(w => {
                const isChecked = activeProfile.selectedWalletIds?.includes(w.id);
                return (
                  <button
                    type="button"
                    key={w.id}
                    onClick={() => handleToggleWallet(w.id)}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-xl border text-right transition-all ${
                      isChecked 
                        ? 'bg-amber-500/[0.08] border-amber-500/30 text-white' 
                        : 'bg-white/[0.01] border-white/[0.04] text-slate-400 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isChecked ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-600'
                      }`}>
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span className="text-xs font-medium truncate">{w.name}</span>
                    </div>

                    <span className="text-xs font-numeric font-medium">
                      {formatFinancialNumber(w.nativeBalance, true)} {w.currencyCode}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* When 'custom' is selected: Granular inputs for Metals, Debts, Trade Goods, Stocks */}
        {activeProfile.scopeType === 'custom' && (
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-6">
            
            {/* 1. Debts Policy in Custom Scope */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                الديون والالتزامات المالية في النطاق:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateActiveProfile({ includeDebtsToMe: !activeProfile.includeDebtsToMe })}
                  className={`flex items-center justify-between p-3 rounded-xl border text-right transition-all ${
                    activeProfile.includeDebtsToMe 
                      ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-white' 
                      : 'bg-white/[0.01] border-white/[0.04] text-slate-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold block">ديون لي عند الغير (مرجوة السداد)</span>
                    <span className="text-[11px] text-slate-400">
                      تضاف للوعاء ({formatFinancialNumber(scopedDebts.toMeTotal, true)} {baseCurrencyCode})
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                    activeProfile.includeDebtsToMe ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
                  }`}>
                    {activeProfile.includeDebtsToMe && <Check size={11} strokeWidth={3} />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateActiveProfile({ includeDebtsOnMe: !activeProfile.includeDebtsOnMe })}
                  className={`flex items-center justify-between p-3 rounded-xl border text-right transition-all ${
                    activeProfile.includeDebtsOnMe 
                      ? 'bg-rose-500/[0.08] border-rose-500/30 text-white' 
                      : 'bg-white/[0.01] border-white/[0.04] text-slate-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold block">ديون عليّ للغير (حالّة السداد)</span>
                    <span className="text-[11px] text-slate-400">
                      تخصم من الوعاء ({formatFinancialNumber(scopedDebts.onMeTotal, true)} {baseCurrencyCode})
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                    activeProfile.includeDebtsOnMe ? 'bg-rose-500 border-rose-500 text-slate-950' : 'border-slate-600'
                  }`}>
                    {activeProfile.includeDebtsOnMe && <Check size={11} strokeWidth={3} />}
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Gold and Silver in Custom Scope */}
            <div className="space-y-3 pt-4 border-t border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  المعادن الثمينة والمدخرات (بالجرام):
                </span>
                <span className="text-[11px] text-slate-400 font-numeric">
                  إجمالي المعادن: {formatFinancialNumber(metalsValue.totalMetalsVal, true)} {baseCurrencyCode}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">ذهب عيار 24 (جرام)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={activeProfile.gold24Grams || ''}
                    onChange={(e) => updateActiveProfile({ gold24Grams: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-numeric text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">ذهب عيار 21 (جرام)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={activeProfile.gold21Grams || ''}
                    onChange={(e) => updateActiveProfile({ gold21Grams: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-numeric text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">ذهب عيار 18 (جرام)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={activeProfile.gold18Grams || ''}
                    onChange={(e) => updateActiveProfile({ gold18Grams: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-numeric text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">فضة خالصة (جرام)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={activeProfile.silverGrams || ''}
                    onChange={(e) => updateActiveProfile({ silverGrams: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-numeric text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Trade Inventory & Commercial Investments */}
            <div className="space-y-3 pt-4 border-t border-white/[0.04]">
              <span className="text-xs font-semibold text-slate-300 block">
                عروض التجارة والأسهم والاستثمارات ({baseCurrencyCode}):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">بضائع وعروض التجارة (بسعر البيع الحالي)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={activeProfile.tradeInventoryValue || ''}
                    onChange={(e) => updateActiveProfile({ tradeInventoryValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-numeric text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">أسهم مضاربة وتجارة (القيمة السوقية)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={activeProfile.tradingStocksValue || ''}
                    onChange={(e) => updateActiveProfile({ tradingStocksValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-numeric text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">عقارات مخصصة للبيع والتجارة</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={activeProfile.realEstateTradeValue || ''}
                    onChange={(e) => updateActiveProfile({ realEstateTradeValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-numeric text-white outline-none"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. ZAKAT INDICATORS & RESULTS DASHBOARD
      ───────────────────────────────────────────────────────────── */}
      <motion.section 
        layout
        className="space-y-6 pt-2"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              الزكاة الشرعية المقدرة (2.5%)
            </span>
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              zakatCalculation.hasReachedNisab 
                ? 'text-emerald-400 bg-emerald-500/10' 
                : 'text-amber-400 bg-amber-500/10'
            }`}>
              {zakatCalculation.hasReachedNisab ? <Check size={12} strokeWidth={2.5} /> : <Clock size={12} />}
              <span>{zakatCalculation.hasReachedNisab ? 'بلغ النصاب الشرعي' : 'لم يبلغ النصاب'}</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white font-numeric">
              {formatFinancialNumber(zakatCalculation.estimatedZakat)}
            </span>
            <span className="text-lg sm:text-xl font-normal text-amber-400/90">
              {baseCurrencyCode}
            </span>
          </div>
        </div>

        {/* Metric Cards Grid: Scope Summary, Nisab Status, Hawl Tracker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-white/[0.06]">
          
          {/* Metric 1: Scope Name & Included Count */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="text-[11px] text-slate-400 block">نطاق الزكاة</span>
            <p className="text-sm font-semibold text-white truncate">
              {activeProfile.name}
            </p>
            <span className="text-[10px] text-amber-400/90 block">
              {scopedWallets.length} محافظ • {scopedCurrenciesCount} عملات
            </span>
          </div>

          {/* Metric 2: Current Net Zakatable Value */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="text-[11px] text-slate-400 block">الوعاء الزكوي الحالي</span>
            <p className="text-sm sm:text-base font-semibold text-white font-numeric tracking-tight">
              {formatFinancialNumber(zakatCalculation.netBase, true)}
              <span className="text-[10px] text-slate-400 mr-1 font-normal">{baseCurrencyCode}</span>
            </p>
            <span className="text-[10px] text-slate-500 block">
              بعد خصم الالتزامات
            </span>
          </div>

          {/* Metric 3: Nisab Value */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="text-[11px] text-slate-400 block">حد النصاب (85g ذهب)</span>
            <p className="text-sm sm:text-base font-semibold text-white font-numeric tracking-tight">
              {formatFinancialNumber(zakatCalculation.nisabThreshold, true)}
              <span className="text-[10px] text-slate-400 mr-1 font-normal">{baseCurrencyCode}</span>
            </p>
            <span className={`text-[10px] font-medium block ${zakatCalculation.hasReachedNisab ? 'text-emerald-400' : 'text-amber-400'}`}>
              {zakatCalculation.hasReachedNisab ? 'المال تجاوز النصاب' : 'أقل من حد النصاب'}
            </span>
          </div>

          {/* Metric 4: Hawl Countdown */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="text-[11px] text-slate-400 block">حالة الحول (الحول القمري)</span>
            <p className={`text-sm sm:text-base font-semibold font-numeric tracking-tight ${
              zakatCalculation.isHawlCompleted ? 'text-emerald-400' : 'text-white'
            }`}>
              {zakatCalculation.isHawlCompleted 
                ? 'اكتمل الحول' 
                : `متبقي ${zakatCalculation.remainingDays} يوم`}
            </p>
            <span className="text-[10px] text-slate-500 block">
              بدأ في {activeProfile.hawlStartDate}
            </span>
          </div>

        </div>
      </motion.section>

      {/* ─────────────────────────────────────────────────────────────
          4. ACTION BAR: RECORD PAYMENT & EDIT GOLD PRICE
      ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all shadow-sm"
          >
            <HandCoins size={15} />
            <span>توثيق إخراج زكاة</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'breakdown' ? 'calculator' : 'breakdown')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-medium transition-all ${
              activeTab === 'breakdown'
                ? 'bg-white text-slate-950 border-white'
                : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.05]'
            }`}
          >
            <span>تفصيل مكونات الوعاء</span>
          </button>
        </div>

        {/* Live Gold Price reference tweak */}
        <div className="flex items-center gap-2 text-xs bg-white/[0.02] border border-white/[0.05] py-1.5 px-3 rounded-2xl">
          <span className="text-slate-400">سعر جرام الذهب 24k:</span>
          <input
            type="number"
            value={goldPrice24k || ''}
            onChange={(e) => setGoldPrice24k(parseFloat(e.target.value) || 0)}
            className="w-20 bg-transparent text-white font-numeric font-medium outline-none border-b border-amber-500/30 focus:border-amber-400 text-center"
          />
          <span className="text-slate-400 font-numeric">{baseCurrencyCode}</span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. DETAILED BREAKDOWN OF ASSETS IN CURRENT SCOPE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'breakdown' && (
        <motion.section 
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              تفصيل الأصول الداخلة في وعاء ({activeProfile.name})
            </h3>
            <span className="text-xs font-numeric text-amber-400">
              صافي الوعاء: {formatFinancialNumber(zakatCalculation.netBase)} {baseCurrencyCode}
            </span>
          </div>

          <div className="divide-y divide-white/[0.03] text-xs">
            {/* 1. Cash in Wallets */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <WalletIcon size={14} className="text-slate-400" />
                <span className="text-slate-300">السيولة في المحافظ المشمولة ({scopedWallets.length} محافظ)</span>
              </div>
              <span className="font-numeric font-medium text-white">
                +{formatFinancialNumber(scopedCashInBase)} {baseCurrencyCode}
              </span>
            </div>

            {/* 2. Debts to me */}
            {activeProfile.includeDebtsToMe && (
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <HandCoins size={14} className="text-emerald-400" />
                  <span className="text-slate-300">ديون مرجوة السداد لك عند الغير</span>
                </div>
                <span className="font-numeric font-medium text-emerald-400">
                  +{formatFinancialNumber(scopedDebts.includedToMe)} {baseCurrencyCode}
                </span>
              </div>
            )}

            {/* 3. Gold & Silver */}
            {metalsValue.totalMetalsVal > 0 && (
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <Gem size={14} className="text-amber-400" />
                  <span className="text-slate-300">الذهب والفضة والمدخرات الثمينة</span>
                </div>
                <span className="font-numeric font-medium text-amber-400">
                  +{formatFinancialNumber(metalsValue.totalMetalsVal)} {baseCurrencyCode}
                </span>
              </div>
            )}

            {/* 4. Commercial goods & Stocks */}
            {businessAndStocksValue.totalCommercial > 0 && (
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <Building size={14} className="text-blue-400" />
                  <span className="text-slate-300">عروض التجارة والأسهم والاستثمارات</span>
                </div>
                <span className="font-numeric font-medium text-blue-400">
                  +{formatFinancialNumber(businessAndStocksValue.totalCommercial)} {baseCurrencyCode}
                </span>
              </div>
            )}

            {/* 5. Deductions */}
            {zakatCalculation.deductions > 0 && (
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <RotateCcw size={14} className="text-rose-400" />
                  <span className="text-slate-300">خصم الديون والالتزامات الحالّة السداد</span>
                </div>
                <span className="font-numeric font-medium text-rose-400">
                  -{formatFinancialNumber(zakatCalculation.deductions)} {baseCurrencyCode}
                </span>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. PAYMENT HISTORY & AUDIT LOG
      ───────────────────────────────────────────────────────────── */}
      {payments.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-white/[0.04]">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              سجل مدفوعات الزكاة السابقة
            </h3>
            <span className="text-xs text-slate-500 font-numeric">
              {payments.length} دفعات موثقة
            </span>
          </div>

          <div className="divide-y divide-white/[0.04] border-y border-white/[0.06]">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-3 px-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white/95">{p.recipient}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 font-mono">
                      {p.profileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{p.date}</span>
                    {p.note && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-xs">{p.note}</span>
                      </>
                    )}
                  </div>
                </div>

                <span className="text-xs sm:text-sm font-semibold text-emerald-400 font-numeric">
                  {formatFinancialNumber(p.amount)} {p.currency}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: NEW ZAKAT PROFILE
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl text-right"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-base font-semibold text-white">إنشاء ملف زكاة جديد</h3>
                <button onClick={() => setShowNewProfileModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-slate-400 block">اسم الملف (مثال: زكاة المتجر، زكاة الاستثمار)</label>
                <input
                  type="text"
                  placeholder="مثال: زكاة المحل التجاري"
                  value={editingProfileName}
                  onChange={(e) => setEditingProfileName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-amber-400 rounded-2xl px-4 py-3 text-sm text-white outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يسمح لك كل ملف بحفظ نطاق منفصل تماماً من المحافظ والأصول، ويمكنك إعادة استخدامه سنوياً بضغطة واحدة.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCreateProfile}
                  disabled={!editingProfileName.trim()}
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  حفظ وتفعيل الملف
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProfileModal(false)}
                  className="px-5 py-3 rounded-2xl bg-white/[0.03] text-slate-400 hover:text-white text-xs font-medium"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: RECORD ZAKAT PAYMENT
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl text-right"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-base font-semibold text-white">توثيق إخراج زكاة</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">المبلغ المخرج ({baseCurrencyCode})</label>
                  <input
                    type="number"
                    placeholder={zakatCalculation.estimatedZakat.toString()}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-sm font-numeric text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">الجهة أو المستحق</label>
                  <input
                    type="text"
                    placeholder="مثال: جمعية البر، أسر متعففة"
                    value={paymentRecipient}
                    onChange={(e) => setPaymentRecipient(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">المحفظة المسحوب منها (اختياري)</label>
                  <select
                    value={paymentWalletId}
                    onChange={(e) => setPaymentWalletId(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="">-- بدون ربط بمحفظة --</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.currencyCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">ملاحظات</label>
                  <input
                    type="text"
                    placeholder="ملاحظات أو رقم الإيصال"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddPayment}
                  disabled={!paymentAmount || Number(paymentAmount) <= 0}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  حفظ الدفعة في السجل
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-3 rounded-2xl bg-white/[0.03] text-slate-400 hover:text-white text-xs font-medium"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: RESET HAWL CONFIRMATION
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHawlResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl text-right"
            >
              <div className="flex items-center gap-2 text-amber-400">
                <RotateCcw size={18} />
                <h3 className="text-base font-semibold text-white">بدء دورة زكاة جديدة للحول</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                هل ترغب في بدء عام زكوي جديد لملف <strong className="text-white">({activeProfile.name})</strong>؟ 
                سيتم تحديث تاريخ بداية الحول إلى تاريخ اليوم مع الاحتفاظ بكافة المحافظ والإعدادات كما هي.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleStartNewCycle}
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-all"
                >
                  نعم، ابدأ الدورة الجديدة
                </button>
                <button
                  type="button"
                  onClick={() => setShowHawlResetConfirm(false)}
                  className="px-5 py-3 rounded-2xl bg-white/[0.03] text-slate-400 hover:text-white text-xs font-medium"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ZakatCalculator;
