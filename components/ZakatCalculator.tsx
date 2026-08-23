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
  Trash2, 
  Edit3, 
  Sparkles, 
  Clock,
  Wallet as WalletIcon,
  HandCoins,
  Gem,
  Building,
  TrendingUp,
  X,
  FileCheck,
  Landmark,
  BadgeAlert,
  Info,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Wallet, Transaction, Debt, Currency, ZakatProfile, ZakatPaymentRecord } from '../types';
import { convertCurrency, DEFAULT_EXCHANGE_RATES } from '../constants';
import { getTranslation } from '../utils/translations';
import { formatFinancialNumber } from './ElegantDashboard';
import { StatsGrid, StatItem } from './StatsGrid';
import { AssetItemRow } from './AssetItemRow';
import { ZakatAssetConfigModal, ZakatModalCategory } from './ZakatAssetConfigModal';

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
  language?: 'ar' | 'en';
}

// Default benchmark price for 24k Gold per gram in SAR (approx 320 SAR/g)
const BASE_GOLD_PRICE_SAR = 320;
const BASE_SILVER_PRICE_SAR = 4.2;

// Unified Category Navigation Tabs
export type UnifiedZakatCategory = 
  | 'cash_liquidity'       // السيولة والنقد
  | 'metals_gold'          // المعادن والذهب
  | 'stocks_invest'        // الأسهم والاستثمار
  | 'realestate_assets'    // العقارات والأصول
  | 'debts_liabilities';   // الالتزامات والديون

// Unified Karat & Silver Pricing Model
export interface KaratRates {
  price24k: number;
  price21k: number;
  price18k: number;
  priceSilver: number;
  custom21k: number | null;
  custom18k: number | null;
  customSilver: number | null;
}

// Central Calculation Function
export function calculateAssetZakat(
  profile: ZakatProfile,
  scopedCashInBase: number,
  debtsToMeIncluded: number,
  debtsOnMeIncluded: number,
  rates: KaratRates
) {
  // 1. Metals (Gold & Silver)
  const g24 = Number(profile.gold24Grams) || 0;
  const g21 = Number(profile.gold21Grams) || 0;
  const g18 = Number(profile.gold18Grams) || 0;
  const silver = Number(profile.silverGrams) || 0;

  const val24 = g24 * rates.price24k;
  const val21 = g21 * rates.price21k;
  const val18 = g18 * rates.price18k;
  const totalGoldVal = val24 + val21 + val18;
  const totalSilverVal = silver * rates.priceSilver;
  const totalMetalsVal = totalGoldVal + totalSilverVal;

  // 2. Commercial, Stocks, Real Estate
  const tradeInv = Number(profile.tradeInventoryValue) || 0;
  const tradingStocks = Number(profile.tradingStocksValue) || 0;
  const reTrade = Number(profile.realEstateTradeValue) || 0;
  const fundsVal = Number(profile.investmentFundsValue) || 0;
  const rentIncome = Number(profile.rentalIncomeValue) || 0;

  let longTermBase = 0;
  if (profile.investmentStocksMethod === 'liquid_ratio') {
    longTermBase = (Number(profile.longTermStocksValue) || 0) * 0.10; // 10% Liquid assets ratio
  } else {
    longTermBase = Number(profile.longTermDividendsValue) || 0;
  }

  const totalCommercial = tradeInv + tradingStocks + longTermBase + reTrade + fundsVal + rentIncome;

  // 3. Gross, Deductions & Net Pool
  const grossAssets = scopedCashInBase + debtsToMeIncluded + totalMetalsVal + totalCommercial;
  const customDeductions = Number(profile.customDeductions) || 0;
  const totalDeductions = debtsOnMeIncluded + customDeductions;
  const netBase = Math.max(0, grossAssets - totalDeductions);

  // 4. Nisab Benchmark: 85 grams of 24k Gold
  const nisabThreshold = 85 * rates.price24k;
  const silverNisabThreshold = 595 * rates.priceSilver;
  const hasReachedNisab = netBase >= nisabThreshold && nisabThreshold > 0;

  // 5. Hawl tracking
  const startDate = profile.hawlStartDate ? new Date(profile.hawlStartDate) : new Date();
  const today = new Date();
  const elapsedDays = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalHawlDays = profile.hawlDurationDays || 354;
  const remainingDays = Math.max(0, totalHawlDays - elapsedDays);
  const isHawlCompleted = elapsedDays >= totalHawlDays;

  // 6. Zakat Rate: 2.5% on Net Base
  const zakatRate = 0.025;
  const estimatedZakat = hasReachedNisab ? netBase * zakatRate : 0;

  return {
    g24, g21, g18, silver,
    val24, val21, val18,
    totalGoldVal, totalSilverVal, totalMetalsVal,
    tradeInv, tradingStocks, longTermBase, reTrade, fundsVal, rentIncome, totalCommercial,
    grossAssets,
    totalDeductions,
    customDeductions,
    netBase,
    nisabThreshold,
    silverNisabThreshold,
    hasReachedNisab,
    elapsedDays,
    totalHawlDays,
    remainingDays,
    isHawlCompleted,
    zakatRate,
    estimatedZakat
  };
}

// Central Calculation Function

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
  onSavePayments,
  language = 'ar'
}) => {
  const t = getTranslation(language);
  const baseCurrencyCode = currentCurrency.code || 'SAR';
  const displaySymbol = currentCurrency.symbol || currencySymbol || baseCurrencyCode;

  // Initialize Default Profiles if none exist
  const [profiles, setProfiles] = useState<ZakatProfile[]>(() => {
    if (zakatProfiles && zakatProfiles.length > 0) return zakatProfiles;
    
    const saved = localStorage.getItem('thari_zakat_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved zakat profiles', e);
      }
    }

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
      investmentFundsValue: 0,
      realEstateTradeValue: 0,
      rentalIncomeValue: 0,
      hawlStartDate: new Date(Date.now() - 336 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // ~11 months ago as default
      hawlDurationDays: 354, // Hijri lunar year
      customDeductions: 0,
      isScopeConfirmed: true,
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

  // Unified Top Category Tab
  const [activeCategoryTab, setActiveCategoryTab] = useState<UnifiedZakatCategory>('cash_liquidity');

  // Gold & Silver Prices State (Calculated cleanly using exchange rates)
  const computeDefaultGoldPrice = (code: string): number => {
    try {
      const converted = convertCurrency(BASE_GOLD_PRICE_SAR, 'SAR', code, exchangeRates);
      return Math.round(converted > 0 ? converted : BASE_GOLD_PRICE_SAR);
    } catch {
      return BASE_GOLD_PRICE_SAR;
    }
  };

  const [goldPrice24k, setGoldPrice24k] = useState<number>(() => computeDefaultGoldPrice(baseCurrencyCode));
  const [customPrice21k, setCustomPrice21k] = useState<number | null>(null);
  const [customPrice18k, setCustomPrice18k] = useState<number | null>(null);
  const [customSilverPrice, setCustomSilverPrice] = useState<number | null>(null);

  // Modals state
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [configModalCategory, setConfigModalCategory] = useState<ZakatModalCategory>('metals_rates');
  const [showNewProfileModal, setShowNewProfileModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showHawlResetConfirm, setShowHawlResetConfirm] = useState<boolean>(false);
  const [editingProfileName, setEditingProfileName] = useState<string>('');

  const openCategoryConfig = (cat: ZakatModalCategory) => {
    setConfigModalCategory(cat);
    setShowConfigModal(true);
  };

  // Form states for adding payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRecipient, setPaymentRecipient] = useState('');
  const [paymentWalletId, setPaymentWalletId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

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
      investmentFundsValue: 0,
      realEstateTradeValue: 0,
      rentalIncomeValue: 0,
      hawlStartDate: new Date().toISOString().split('T')[0],
      hawlDurationDays: 354,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as ZakatProfile;
  }, [profiles, activeProfileId, wallets]);

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
    setGoldPrice24k(computeDefaultGoldPrice(baseCurrencyCode));
  }, [baseCurrencyCode, exchangeRates]);

  // Unified Karat Rates Object
  const karatRates: KaratRates = useMemo(() => {
    const p24 = goldPrice24k;
    const p21 = customPrice21k !== null ? customPrice21k : (goldPrice24k * 21) / 24;
    const p18 = customPrice18k !== null ? customPrice18k : (goldPrice24k * 18) / 24;
    const pSilver = customSilverPrice !== null ? customSilverPrice : (goldPrice24k * BASE_SILVER_PRICE_SAR) / BASE_GOLD_PRICE_SAR;
    return {
      price24k: p24,
      price21k: p21,
      price18k: p18,
      priceSilver: pSilver,
      custom21k: customPrice21k,
      custom18k: customPrice18k,
      customSilver: customSilverPrice
    };
  }, [goldPrice24k, customPrice21k, customPrice18k, customSilverPrice]);

  // Live Wallet balances
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
          balance += (t.destinationAmount || amt);
        }
      });

      const nativeBalance = Math.max(0, balance);
      let balanceInBase = 0;
      try {
        balanceInBase = convertCurrency(nativeBalance, wallet.currencyCode || 'SAR', baseCurrencyCode, exchangeRates);
      } catch {
        balanceInBase = nativeBalance;
      }

      return {
        id: wallet.id,
        name: wallet.name,
        currencyCode: wallet.currencyCode || 'SAR',
        nativeBalance,
        balanceInBase
      };
    });
  }, [wallets, transactions, baseCurrencyCode, exchangeRates]);

  // Active Scoped Wallets
  const scopedWallets = useMemo(() => {
    if (activeProfile.scopeType === 'all') {
      return allWalletBalances;
    }
    const selectedIds = new Set(activeProfile.selectedWalletIds || []);
    return allWalletBalances.filter(w => selectedIds.has(w.id));
  }, [activeProfile.scopeType, activeProfile.selectedWalletIds, allWalletBalances]);

  // Total Scoped Liquid Cash
  const scopedCashInBase = useMemo(() => {
    return scopedWallets.reduce((sum, w) => sum + w.balanceInBase, 0);
  }, [scopedWallets]);

  // Debts scoped calculation
  const scopedDebts = useMemo(() => {
    let toMe = 0;
    let onMe = 0;

    debts.forEach(d => {
      if (d.isPaid || d.status === 'settled') return;
      const remaining = Math.max(0, (Number(d.amount) || 0) - (Number(d.paidAmount) || 0));
      let amtInBase = 0;
      try {
        amtInBase = convertCurrency(remaining, d.currency || 'SAR', baseCurrencyCode, exchangeRates);
      } catch {
        amtInBase = remaining;
      }

      if (d.type === 'to_me') {
        toMe += amtInBase;
      } else if (d.type === 'on_me') {
        onMe += amtInBase;
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

  // Central Zakat Calculation Result
  const zakat = useMemo(() => {
    return calculateAssetZakat(
      activeProfile,
      scopedCashInBase,
      scopedDebts.includedToMe,
      scopedDebts.includedOnMe,
      karatRates
    );
  }, [activeProfile, scopedCashInBase, scopedDebts, karatRates]);

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
      investmentFundsValue: 0,
      realEstateTradeValue: 0,
      rentalIncomeValue: 0,
      hawlStartDate: new Date().toISOString().split('T')[0],
      hawlDurationDays: 354,
      customDeductions: 0,
      isScopeConfirmed: true,
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

  // Category counts/badges
  const categorySummary = useMemo(() => {
    return {
      cashCount: scopedWallets.length,
      metalsGrams: (activeProfile.gold24Grams || 0) + (activeProfile.gold21Grams || 0) + (activeProfile.gold18Grams || 0) + (activeProfile.silverGrams || 0),
      stocksTotal: (activeProfile.tradingStocksValue || 0) + zakat.longTermBase + (activeProfile.investmentFundsValue || 0),
      assetsTotal: (activeProfile.tradeInventoryValue || 0) + (activeProfile.realEstateTradeValue || 0) + (activeProfile.rentalIncomeValue || 0),
      debtsTotal: scopedDebts.includedOnMe + (activeProfile.customDeductions || 0)
    };
  }, [scopedWallets, activeProfile, zakat.longTermBase, scopedDebts]);

  return (
    <div id="zakat-calculator-root" className="w-full max-w-5xl mx-auto space-y-5 pb-16 font-sans text-right" dir="rtl">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & PROFILE SELECTOR
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-white/[0.04] pb-3.5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale size={18} className="text-[#D9B978]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#D9B978]">
                حساب الوعاء والزكاة الشرعية
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white/95">
              زكــــاتــــي
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-gold-price-badge"
              onClick={() => openCategoryConfig('metals_rates')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D9B978]/10 hover:bg-[#D9B978]/20 border border-[#D9B978]/30 text-xs font-medium text-[#E5C17B] transition-all active:scale-95 group"
              title="تعديل أسعار عيارات الذهب والفضة"
            >
              <Sparkles size={13} className="text-[#D9B978] group-hover:scale-110 transition-transform" />
              <span>ذهب 24: {formatFinancialNumber(karatRates.price24k, true)} {displaySymbol}</span>
            </button>

            <button
              id="btn-new-hawl"
              onClick={() => setShowHawlResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] text-xs font-medium text-slate-300 hover:text-white transition-all active:scale-95"
              title="بدء دورة جديدة للحول"
            >
              <RotateCcw size={13} />
              <span>دورة حول</span>
            </button>

            <button
              id="btn-new-profile"
              onClick={() => setShowNewProfileModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D9B978] hover:bg-[#E5C17B] text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>ملف جديد</span>
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
                className={`group shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-medium ${
                  isActive 
                    ? 'bg-white text-slate-950 border-white shadow-md font-bold' 
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveProfileId(p.id)}
                  className="flex items-center gap-1.5"
                >
                  <FileCheck size={13} className={isActive ? 'text-slate-950' : 'text-slate-500'} />
                  <span>{p.name}</span>
                </button>

                {profiles.length > 1 && (
                  <button
                    type="button"
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
          2. ZAKAT INDICATORS & RESULTS DASHBOARD (HERO STATS CARD)
      ───────────────────────────────────────────────────────────── */}
      <motion.section 
        layout
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#101726] to-[#0A0E18] border border-[#D9B978]/25 space-y-5 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">
                الزكاة الشرعية المستحقة (2.5%)
              </span>
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                zakat.hasReachedNisab 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}>
                {zakat.hasReachedNisab ? <Check size={12} strokeWidth={2.5} /> : <Clock size={12} />}
                <span>{zakat.hasReachedNisab ? 'بلغ النصاب الشرعي' : 'دون النصاب الشرعي'}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2" dir="ltr">
              <span className="text-4xl sm:text-5xl font-light tracking-tight text-white font-numeric">
                {formatFinancialNumber(zakat.estimatedZakat)}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#D9B978]">
                {displaySymbol}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              id="btn-document-payment"
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <HandCoins size={15} />
              <span>توثيق إخراج زكاة</span>
            </button>
          </div>
        </div>

        {/* Standardized StatsGrid (Quiet Luxury Tokens) */}
        <div className="pt-4 border-t border-white/[0.06]">
          <StatsGrid
            columns={4}
            theme="dark"
            items={[
              {
                id: 'scope-summary',
                label: 'نطاق الحساب',
                value: activeProfile.name,
                subValue: `${scopedWallets.length} محافظ مشمولة`,
                accentColor: 'champagne',
                icon: Layers,
                badge: {
                  text: `${scopedWallets.length} محافظ`,
                  variant: 'champagne'
                }
              },
              {
                id: 'net-zakatable-pool',
                label: 'الوعاء الزكوي الصافي',
                value: formatFinancialNumber(zakat.netBase, true),
                currency: displaySymbol,
                subValue: 'بعد خصم الالتزامات المستحقة',
                accentColor: 'ocean',
                icon: Scale
              },
              {
                id: 'nisab-benchmark',
                label: 'حد النصاب (85g عيار 24)',
                value: formatFinancialNumber(zakat.nisabThreshold, true),
                currency: displaySymbol,
                accentColor: zakat.hasReachedNisab ? 'sage' : 'amber',
                icon: ShieldCheck,
                badge: {
                  text: zakat.hasReachedNisab ? 'تجاوز النصاب' : 'دون النصاب',
                  variant: zakat.hasReachedNisab ? 'sage' : 'amber'
                }
              },
              {
                id: 'hawl-tracker',
                label: 'حالة الحول (القمري)',
                value: zakat.isHawlCompleted ? 'اكتمل الحول' : `متبقي ${zakat.remainingDays} يوم`,
                subValue: `بدأ في ${activeProfile.hawlStartDate}`,
                accentColor: zakat.isHawlCompleted ? 'sage' : 'neutral',
                icon: Calendar,
                badge: {
                  text: zakat.isHawlCompleted ? 'مستحقة فوراً' : `${zakat.remainingDays} يوم`,
                  variant: zakat.isHawlCompleted ? 'sage' : 'neutral'
                }
              }
            ]}
          />
        </div>
      </motion.section>

      {/* ─────────────────────────────────────────────────────────────
          3. SLEEK SEGMENTED NAVIGATION BAR (5 ASSET CATEGORIES)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div 
          id="unified-zakat-nav"
          className="p-1 rounded-2xl bg-[#0B0F19] border border-white/[0.08] flex items-center gap-1 overflow-x-auto no-scrollbar"
        >
          {/* TAB 1: Cash & Liquidity */}
          <button
            id="tab-cash-liquidity"
            type="button"
            onClick={() => setActiveCategoryTab('cash_liquidity')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-center flex items-center justify-center gap-2 shrink-0 ${
              activeCategoryTab === 'cash_liquidity'
                ? 'bg-[#182032] text-[#F3D382] border border-[#D9B978]/35 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Coins size={15} className={activeCategoryTab === 'cash_liquidity' ? 'text-[#F3D382]' : 'text-slate-500'} />
            <span className="whitespace-nowrap">السيولة والنقد</span>
          </button>

          {/* TAB 2: Metals & Gold */}
          <button
            id="tab-metals-gold"
            type="button"
            onClick={() => setActiveCategoryTab('metals_gold')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-center flex items-center justify-center gap-2 shrink-0 ${
              activeCategoryTab === 'metals_gold'
                ? 'bg-[#182032] text-[#F3D382] border border-[#D9B978]/35 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Sparkles size={15} className={activeCategoryTab === 'metals_gold' ? 'text-[#F3D382]' : 'text-slate-500'} />
            <span className="whitespace-nowrap">المعادن والذهب</span>
            {categorySummary.metalsGrams > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9B978]" />
            )}
          </button>

          {/* TAB 3: Stocks & Investment */}
          <button
            id="tab-stocks-invest"
            type="button"
            onClick={() => setActiveCategoryTab('stocks_invest')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-center flex items-center justify-center gap-2 shrink-0 ${
              activeCategoryTab === 'stocks_invest'
                ? 'bg-[#182032] text-[#F3D382] border border-[#D9B978]/35 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <TrendingUp size={15} className={activeCategoryTab === 'stocks_invest' ? 'text-[#F3D382]' : 'text-slate-500'} />
            <span className="whitespace-nowrap">الأسهم والاستثمار</span>
          </button>

          {/* TAB 4: Real Estate & Assets */}
          <button
            id="tab-realestate-assets"
            type="button"
            onClick={() => setActiveCategoryTab('realestate_assets')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-center flex items-center justify-center gap-2 shrink-0 ${
              activeCategoryTab === 'realestate_assets'
                ? 'bg-[#182032] text-[#F3D382] border border-[#D9B978]/35 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Building size={15} className={activeCategoryTab === 'realestate_assets' ? 'text-[#F3D382]' : 'text-slate-500'} />
            <span className="whitespace-nowrap">العقارات والأصول</span>
          </button>

          {/* TAB 5: Debts & Liabilities */}
          <button
            id="tab-debts-liabilities"
            type="button"
            onClick={() => setActiveCategoryTab('debts_liabilities')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-center flex items-center justify-center gap-2 shrink-0 ${
              activeCategoryTab === 'debts_liabilities'
                ? 'bg-[#182032] text-[#F3D382] border border-[#D9B978]/35 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <HandCoins size={15} className={activeCategoryTab === 'debts_liabilities' ? 'text-[#F3D382]' : 'text-slate-500'} />
            <span className="whitespace-nowrap">الالتزامات والديون</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. UNIFIED TAB PANELS WITH ASSET ITEM ROWS
        ───────────────────────────────────────────────────────────── */}
        
        {/* PANEL 1: CASH & LIQUIDITY */}
        {activeCategoryTab === 'cash_liquidity' && (
          <motion.div
            key="tab-cash-liquidity-panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            {/* Liquid Cash Quick Config Bar */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Coins size={14} className="text-[#D9B978]" />
                <span>إدارة وتخصيص السيولة المشمولة في الزكاة:</span>
                <span className="text-[#E5C17B] font-numeric font-semibold">
                  {formatFinancialNumber(scopedCashInBase, true)} {displaySymbol}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openCategoryConfig('cash_liquidity')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1"
              >
                <SlidersHorizontal size={12} />
                <span>تخصيص السيولة والمحافظ</span>
              </button>
            </div>

            {/* Total Liquid Cash Row */}
            <AssetItemRow
              id="cash-liquidity-total"
              icon={<Coins size={18} />}
              iconBg="bg-teal-500/10 border-teal-500/20"
              iconColor="text-teal-400"
              title="إجمالي السيولة النقدية"
              codeBadge="CASH"
              badgeColor="bg-teal-500/10 text-teal-400 border-teal-500/20"
              description="أرصدة الحسابات البنكية والنقد الحر المشمولة في نطاق الزكاة"
              valueDisplay={formatFinancialNumber(scopedCashInBase)}
              currencyCode={displaySymbol}
            />

            {/* Wallets Inclusion Selector Row */}
            <AssetItemRow
              id="wallets-scope-selector"
              icon={<WalletIcon size={18} />}
              iconBg="bg-indigo-500/10 border-indigo-500/20"
              iconColor="text-indigo-400"
              title="تخصيص المحافظ المشمولة"
              codeBadge="WALLETS"
              badgeColor="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              description="اختر المحافظ المحددة لإدراج أرصدتها في هذا الملف"
              valueDisplay={formatFinancialNumber(scopedCashInBase)}
              currencyCode={displaySymbol}
              actionElement={
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateActiveProfile({ scopeType: 'all', selectedWalletIds: wallets.map(w => w.id) })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      activeProfile.scopeType === 'all'
                        ? 'bg-[#D9B978] text-slate-950 border-[#D9B978] shadow-xs'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    تضمين الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => updateActiveProfile({ scopeType: 'selected_wallets' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      activeProfile.scopeType === 'selected_wallets'
                        ? 'bg-[#D9B978] text-slate-950 border-[#D9B978] shadow-xs'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    تخصيص يدوي
                  </button>
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {allWalletBalances.map(w => {
                  const isChecked = activeProfile.scopeType === 'all' || activeProfile.selectedWalletIds?.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        const current = new Set(activeProfile.selectedWalletIds || []);
                        if (current.has(w.id)) {
                          if (current.size > 1) current.delete(w.id);
                        } else {
                          current.add(w.id);
                        }
                        updateActiveProfile({
                          scopeType: 'selected_wallets',
                          selectedWalletIds: Array.from(current)
                        });
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-right transition-all ${
                        isChecked 
                          ? 'bg-amber-500/10 border-amber-500/30 text-white' 
                          : 'bg-white/[0.02] border-white/[0.04] text-slate-400 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          isChecked ? 'bg-[#D9B978] border-[#D9B978] text-slate-950' : 'border-slate-600'
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className="text-xs font-medium truncate">{w.name}</span>
                      </div>
                      <span className="text-xs font-numeric font-bold text-[#E5C17B] shrink-0" dir="ltr">
                        {formatFinancialNumber(w.nativeBalance, true)} {w.currencyCode}
                      </span>
                    </button>
                  );
                })}
              </div>
            </AssetItemRow>
          </motion.div>
        )}

        {/* PANEL 2: METALS & GOLD */}
        {activeCategoryTab === 'metals_gold' && (
          <motion.div
            key="tab-metals-gold-panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            {/* Live Karats Quick Bar */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles size={14} className="text-[#D9B978]" />
                <span>الأسعار المعتمدة للجرام:</span>
                <span className="text-[#E5C17B] font-numeric font-semibold">24k: {formatFinancialNumber(karatRates.price24k, true)}</span>
                <span className="text-slate-500">|</span>
                <span className="text-[#E5C17B] font-numeric font-semibold">21k: {formatFinancialNumber(karatRates.price21k, true)}</span>
                <span className="text-slate-500">|</span>
                <span className="text-[#E5C17B] font-numeric font-semibold">18k: {formatFinancialNumber(karatRates.price18k, true)} {displaySymbol}</span>
              </div>
              <button
                type="button"
                onClick={() => openCategoryConfig('metals_rates')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1"
              >
                <SlidersHorizontal size={12} />
                <span>تعديل الأسعار والعيارات</span>
              </button>
            </div>

            {/* Gold 24k Row */}
            <AssetItemRow
              id="gold-24k"
              icon={<Sparkles size={18} />}
              iconBg="bg-amber-500/10 border-amber-500/20"
              iconColor="text-amber-400"
              title="ذهب عيار 24 (سبائك ونقي)"
              codeBadge="Au 24"
              badgeColor="bg-amber-500/15 text-amber-400 border-amber-500/30"
              description={`سعر الجرام المعتمد: ${formatFinancialNumber(karatRates.price24k, true)} ${displaySymbol}`}
              valueDisplay={formatFinancialNumber(zakat.val24)}
              currencyCode={displaySymbol}
            >
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400 shrink-0">الوزن المملوك:</label>
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={activeProfile.gold24Grams || ''}
                    onChange={(e) => updateActiveProfile({ gold24Grams: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl pl-12 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    جرام
                  </span>
                </div>
              </div>
            </AssetItemRow>

            {/* Gold 21k Row */}
            <AssetItemRow
              id="gold-21k"
              icon={<Sparkles size={18} />}
              iconBg="bg-amber-500/10 border-amber-500/20"
              iconColor="text-amber-400"
              title="ذهب عيار 21 (مدخرات واستثمار)"
              codeBadge="Au 21"
              badgeColor="bg-amber-500/15 text-amber-400 border-amber-500/30"
              description={`سعر الجرام المعتمد: ${formatFinancialNumber(karatRates.price21k, true)} ${displaySymbol}`}
              valueDisplay={formatFinancialNumber(zakat.val21)}
              currencyCode={displaySymbol}
            >
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400 shrink-0">الوزن المملوك:</label>
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={activeProfile.gold21Grams || ''}
                    onChange={(e) => updateActiveProfile({ gold21Grams: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl pl-12 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    جرام
                  </span>
                </div>
              </div>
            </AssetItemRow>

            {/* Gold 18k Row */}
            <AssetItemRow
              id="gold-18k"
              icon={<Sparkles size={18} />}
              iconBg="bg-amber-500/10 border-amber-500/20"
              iconColor="text-amber-400"
              title="ذهب عيار 18 (مدخرات)"
              codeBadge="Au 18"
              badgeColor="bg-amber-500/15 text-amber-400 border-amber-500/30"
              description={`سعر الجرام المعتمد: ${formatFinancialNumber(karatRates.price18k, true)} ${displaySymbol}`}
              valueDisplay={formatFinancialNumber(zakat.val18)}
              currencyCode={displaySymbol}
            >
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400 shrink-0">الوزن المملوك:</label>
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={activeProfile.gold18Grams || ''}
                    onChange={(e) => updateActiveProfile({ gold18Grams: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl pl-12 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    جرام
                  </span>
                </div>
              </div>
            </AssetItemRow>

            {/* Silver Row */}
            <AssetItemRow
              id="silver-bullion"
              icon={<Gem size={18} />}
              iconBg="bg-slate-500/10 border-slate-400/20"
              iconColor="text-slate-300"
              title="الفضة والسبائك الفضية"
              codeBadge="Ag"
              badgeColor="bg-slate-500/15 text-slate-300 border-slate-400/30"
              description={`سعر الجرام المعتمد: ${formatFinancialNumber(karatRates.priceSilver, true)} ${displaySymbol}`}
              valueDisplay={formatFinancialNumber(zakat.totalSilverVal)}
              currencyCode={displaySymbol}
            >
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400 shrink-0">الوزن المملوك (جرام فضة):</label>
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={activeProfile.silverGrams || ''}
                    onChange={(e) => updateActiveProfile({ silverGrams: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 focus:border-slate-300 rounded-xl pl-16 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    جرام
                  </span>
                </div>
              </div>
            </AssetItemRow>
          </motion.div>
        )}

        {/* PANEL 3: STOCKS & INVESTMENT */}
        {activeCategoryTab === 'stocks_invest' && (
          <motion.div
            key="tab-stocks-invest-panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            {/* Stocks Quick Config Bar */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <TrendingUp size={14} className="text-[#D9B978]" />
                <span>إعداد وحساب زكاة المحافظ الاستثمارية والأسهم:</span>
              </div>
              <button
                type="button"
                onClick={() => openCategoryConfig('stocks_invest')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1"
              >
                <SlidersHorizontal size={12} />
                <span>تعديل الأسهم والاستثمارات</span>
              </button>
            </div>

            {/* Trading Stocks */}
            <AssetItemRow
              id="trading-stocks"
              icon={<TrendingUp size={18} />}
              iconBg="bg-blue-500/10 border-blue-500/20"
              iconColor="text-blue-400"
              title="أسهم المضاربة والتداول السريع"
              codeBadge="STK-TRD"
              badgeColor="bg-blue-500/15 text-blue-400 border-blue-500/30"
              description="أسهم مشتراة بنية المتاجرة والربح الرأسمالي (تزكى بكامل قيمتها السوقية)"
              valueDisplay={formatFinancialNumber(activeProfile.tradingStocksValue || 0)}
              currencyCode={displaySymbol}
            >
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400 shrink-0">القيمة السوقية الحالية:</label>
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={activeProfile.tradingStocksValue || ''}
                    onChange={(e) => updateActiveProfile({ tradingStocksValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-400 rounded-xl pl-16 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    {displaySymbol}
                  </span>
                </div>
              </div>
            </AssetItemRow>

            {/* Long-Term / Dividend Stocks */}
            <AssetItemRow
              id="longterm-stocks"
              icon={<Landmark size={18} />}
              iconBg="bg-indigo-500/10 border-indigo-500/20"
              iconColor="text-indigo-400"
              title="أسهم الاستثمار طويل الأجل (عوائد)"
              codeBadge="STK-DIV"
              badgeColor="bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
              description="أسهم اقتناء لعوائد دورية دون نية البيع السريع"
              valueDisplay={formatFinancialNumber(zakat.longTermBase)}
              currencyCode={displaySymbol}
              actionElement={
                <div className="flex gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => updateActiveProfile({ investmentStocksMethod: 'liquid_ratio' })}
                    className={`py-1 px-2.5 rounded-lg border transition-all ${
                      activeProfile.investmentStocksMethod === 'liquid_ratio'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    نسبة الأصول (10%)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateActiveProfile({ investmentStocksMethod: 'dividends_only' })}
                    className={`py-1 px-2.5 rounded-lg border transition-all ${
                      activeProfile.investmentStocksMethod === 'dividends_only'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    الأرباح فقط
                  </button>
                </div>
              }
            >
              <div className="pt-1">
                {activeProfile.investmentStocksMethod === 'liquid_ratio' ? (
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-400 shrink-0">إجمالي قيمة المحفظة:</label>
                    <div className="relative flex-1 max-w-sm">
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={activeProfile.longTermStocksValue || ''}
                        onChange={(e) => updateActiveProfile({ longTermStocksValue: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black/40 border border-white/10 focus:border-indigo-400 rounded-xl pl-16 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                        {displaySymbol}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-400 shrink-0">الأرباح الموزعة المستلمة:</label>
                    <div className="relative flex-1 max-w-sm">
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={activeProfile.longTermDividendsValue || ''}
                        onChange={(e) => updateActiveProfile({ longTermDividendsValue: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black/40 border border-white/10 focus:border-indigo-400 rounded-xl pl-16 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                        {displaySymbol}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </AssetItemRow>

            {/* Investment Funds & Sukuk */}
            <AssetItemRow
              id="investment-funds"
              icon={<Layers size={18} />}
              iconBg="bg-violet-500/10 border-violet-500/20"
              iconColor="text-violet-400"
              title="الصناديق الاستثمارية والصكوك"
              codeBadge="FND-SKK"
              badgeColor="bg-violet-500/15 text-violet-400 border-violet-500/30"
              description="صناديق المرابحة، السيولة، والصكوك المتداولة الخاضعة للزكاة"
              valueDisplay={formatFinancialNumber(activeProfile.investmentFundsValue || 0)}
              currencyCode={displaySymbol}
            >
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400 shrink-0">القيمة الإجمالية للصناديق:</label>
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={activeProfile.investmentFundsValue || ''}
                    onChange={(e) => updateActiveProfile({ investmentFundsValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 focus:border-violet-400 rounded-xl pl-16 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    {displaySymbol}
                  </span>
                </div>
              </div>
            </AssetItemRow>
          </motion.div>
        )}

        {/* PANEL 4: REAL ESTATE & ASSETS */}
        {activeCategoryTab === 'realestate_assets' && (
          <motion.div
            key="tab-realestate-assets-panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            {/* Real Estate Quick Config Bar */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Building size={14} className="text-[#D9B978]" />
                <span>إدارة عروض التجارة والعقارات وعوائد الإيجار:</span>
              </div>
              <button
                type="button"
                onClick={() => openCategoryConfig('realestate_assets')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1"
              >
                <SlidersHorizontal size={12} />
                <span>تعديل العقارات والعروض</span>
              </button>
            </div>

            {/* Trade Inventory */}
            <AssetItemRow
              id="trade-inventory"
              icon={<Building size={18} />}
              iconBg="bg-amber-500/10 border-amber-500/20"
              iconColor="text-amber-400"
              title="عروض التجارة والبضائع المعدة للبيع"
              codeBadge="INV-TRD"
              badgeColor="bg-amber-500/15 text-amber-400 border-amber-500/30"
              description="تقوم البضائع بقيمتها السوقية بسعر الجملة وقت وجوب الزكاة"
              valueDisplay={formatFinancialNumber(activeProfile.tradeInventoryValue || 0)}
              currencyCode={displaySymbol}
            >
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400 shrink-0">القيمة السوقية للبضائع:</label>
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={activeProfile.tradeInventoryValue || ''}
                    onChange={(e) => updateActiveProfile({ tradeInventoryValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl pl-16 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    {displaySymbol}
                  </span>
                </div>
              </div>
            </AssetItemRow>

            {/* Real Estate for Trading */}
            <AssetItemRow
              id="real-estate-trade"
              icon={<Building size={18} />}
              iconBg="bg-emerald-500/10 border-emerald-500/20"
              iconColor="text-emerald-400"
              title="عقارات معدة للمتاجرة والبيع (أراضي ومخططات)"
              codeBadge="EST-TRD"
              badgeColor="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              description="أراضي أو مباني مشتراة بنية البيع والربح (تزكى بكامل قيمتها السوقية)"
              valueDisplay={formatFinancialNumber(activeProfile.realEstateTradeValue || 0)}
              currencyCode={displaySymbol}
            >
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400 shrink-0">القيمة السوقية الحالية للعقارات:</label>
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={activeProfile.realEstateTradeValue || ''}
                    onChange={(e) => updateActiveProfile({ realEstateTradeValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 focus:border-emerald-400 rounded-xl pl-16 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    {displaySymbol}
                  </span>
                </div>
              </div>
            </AssetItemRow>

            {/* Rental Income */}
            <AssetItemRow
              id="rental-income"
              icon={<Landmark size={18} />}
              iconBg="bg-cyan-500/10 border-cyan-500/20"
              iconColor="text-cyan-400"
              title="ريع وعوائد العقارات المؤجرة"
              codeBadge="EST-RNT"
              badgeColor="bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
              description="أصل العقار المؤجر معفى، وتجب الزكاة في الإيجار المحصل إذا دار عليه الحول"
              valueDisplay={formatFinancialNumber(activeProfile.rentalIncomeValue || 0)}
              currencyCode={displaySymbol}
            >
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400 shrink-0">صافي الإيجارات المحصلة:</label>
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={activeProfile.rentalIncomeValue || ''}
                    onChange={(e) => updateActiveProfile({ rentalIncomeValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl pl-16 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    {displaySymbol}
                  </span>
                </div>
              </div>
            </AssetItemRow>

            {/* Sharia Exemption Banner for Fixed Assets */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Info size={15} className="text-amber-400 shrink-0" />
                <span>الأصول الثابتة والمعدات التشغيلية والمباني المشغولة والسيارات الشخصية معفاة شرعاً من الزكاة.</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] shrink-0 border border-emerald-500/20">
                معفاة شرعاً
              </span>
            </div>
          </motion.div>
        )}

        {/* PANEL 5: DEBTS & LIABILITIES */}
        {activeCategoryTab === 'debts_liabilities' && (
          <motion.div
            key="tab-debts-liabilities-panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            {/* Debts Quick Config Bar */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <HandCoins size={14} className="text-[#D9B978]" />
                <span>إدارة الديون المرجوة والالتزامات الواجبة والخصومات:</span>
              </div>
              <button
                type="button"
                onClick={() => openCategoryConfig('debts_liabilities')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1"
              >
                <SlidersHorizontal size={12} />
                <span>تعديل الديون والالتزامات</span>
              </button>
            </div>
            {/* Receivables (To Me) */}
            <AssetItemRow
              id="debts-to-me"
              icon={<HandCoins size={18} />}
              iconBg="bg-emerald-500/10 border-emerald-500/20"
              iconColor="text-emerald-400"
              title="ديون لك عند الغير (مرجوة السداد)"
              codeBadge="REC-DBT"
              badgeColor="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              description="ديون على مليء مقر بالدين يرجى استردادها (تضاف للوعاء الزكوي)"
              valueDisplay={formatFinancialNumber(scopedDebts.includedToMe)}
              currencyCode={displaySymbol}
              isPositiveAddition={activeProfile.includeDebtsToMe && scopedDebts.includedToMe > 0}
              actionElement={
                <button
                  type="button"
                  onClick={() => updateActiveProfile({ includeDebtsToMe: !activeProfile.includeDebtsToMe })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    activeProfile.includeDebtsToMe
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Check size={13} className={activeProfile.includeDebtsToMe ? 'opacity-100' : 'opacity-0'} />
                  <span>{activeProfile.includeDebtsToMe ? 'مضمنة في الوعاء' : 'مستبعدة'}</span>
                </button>
              }
            />

            {/* Payables (On Me) */}
            <AssetItemRow
              id="debts-on-me"
              icon={<HandCoins size={18} />}
              iconBg="bg-rose-500/10 border-rose-500/20"
              iconColor="text-rose-400"
              title="ديون عليك للغير (حالّة السداد)"
              codeBadge="PAY-DBT"
              badgeColor="bg-rose-500/15 text-rose-400 border-rose-500/30"
              description="التزامات وديون تجب تأديتها فوراً قبل حلول الحول (تخصم من الوعاء)"
              valueDisplay={formatFinancialNumber(scopedDebts.includedOnMe)}
              currencyCode={displaySymbol}
              isDeduction={activeProfile.includeDebtsOnMe && scopedDebts.includedOnMe > 0}
              actionElement={
                <button
                  type="button"
                  onClick={() => updateActiveProfile({ includeDebtsOnMe: !activeProfile.includeDebtsOnMe })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    activeProfile.includeDebtsOnMe
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Check size={13} className={activeProfile.includeDebtsOnMe ? 'opacity-100' : 'opacity-0'} />
                  <span>{activeProfile.includeDebtsOnMe ? 'مخصومة من الوعاء' : 'مستبعدة'}</span>
                </button>
              }
            />

            {/* Custom Deductions */}
            <AssetItemRow
              id="custom-deductions"
              icon={<BadgeAlert size={18} />}
              iconBg="bg-rose-500/10 border-rose-500/20"
              iconColor="text-rose-400"
              title="خصومات والتزامات تشغيلية أخرى"
              codeBadge="DED-OPS"
              badgeColor="bg-rose-500/15 text-rose-400 border-rose-500/30"
              description="أي التزامات عاجلة واجبة السداد تخصم شرعاً من الوعاء الزكوي"
              valueDisplay={formatFinancialNumber(activeProfile.customDeductions || 0)}
              currencyCode={displaySymbol}
              isDeduction={(activeProfile.customDeductions || 0) > 0}
            >
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400 shrink-0">مبلغ الخصومات الإضافية:</label>
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={activeProfile.customDeductions || ''}
                    onChange={(e) => updateActiveProfile({ customDeductions: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 focus:border-rose-400 rounded-xl pl-16 pr-3 py-2 text-sm text-white font-numeric outline-none text-left"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    {displaySymbol}
                  </span>
                </div>
              </div>
            </AssetItemRow>
          </motion.div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. PAYMENT HISTORY & AUDIT LOG
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

                <span className="text-xs sm:text-sm font-bold text-emerald-400 font-numeric" dir="ltr">
                  {formatFinancialNumber(p.amount)} {p.currency}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CENTRALIZED ISOLATED CONFIGURATION MODAL (Single-source State Update)
      ───────────────────────────────────────────────────────────── */}
      <ZakatAssetConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        category={configModalCategory}
        profile={activeProfile}
        onUpdateProfile={updateActiveProfile}
        karatRates={{
          price24k: karatRates.price24k,
          price21k: karatRates.price21k,
          price18k: karatRates.price18k,
          priceSilver: karatRates.priceSilver,
          custom21k: customPrice21k,
          custom18k: customPrice18k,
          customSilver: customSilverPrice
        }}
        onUpdateKaratRates={({ price24k, custom21k, custom18k, customSilver }) => {
          setGoldPrice24k(price24k);
          setCustomPrice21k(custom21k);
          setCustomPrice18k(custom18k);
          setCustomSilverPrice(customSilver);
        }}
        wallets={allWalletBalances}
        debts={{
          toMeTotal: scopedDebts.toMeTotal,
          onMeTotal: scopedDebts.onMeTotal,
          includedToMe: scopedDebts.includedToMe,
          includedOnMe: scopedDebts.includedOnMe
        }}
        displaySymbol={displaySymbol}
        theme="dark"
      />

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
              className="w-full max-w-md bg-[#0E131F] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl text-right"
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
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-[#D9B978] rounded-2xl px-4 py-3 text-sm text-white outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يسمح لك كل ملف بحفظ نطاق منفصل تماماً من المحافظ والأصول، ويمكنك استخدامه سنوياً بضغطة واحدة.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCreateProfile}
                  disabled={!editingProfileName.trim()}
                  className="flex-1 py-3 rounded-2xl bg-[#D9B978] hover:bg-[#E5C17B] text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
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
              className="w-full max-w-md bg-[#0E131F] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl text-right"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-base font-semibold text-white">توثيق إخراج زكاة</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">المبلغ المخرج ({displaySymbol})</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-sm text-white font-numeric outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">المستحق / الجهة المستلمة</label>
                  <input
                    type="text"
                    placeholder="مثال: أسرة محتاجة، جمعية البر، منصة إحسان"
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
                    className="w-full bg-slate-800 border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="">-- بدون خصم من محفظة محددة --</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.currencyCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">ملاحظات إضافية</label>
                  <input
                    type="text"
                    placeholder="مثال: دفعة زكاة الفطر / زكاة المال لعام 1447هـ"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddPayment}
                  disabled={!paymentAmount || Number(paymentAmount) <= 0}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  توثيق الدفعة
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
              className="w-full max-w-md bg-[#0E131F] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl text-right"
            >
              <div className="flex items-center gap-3 text-amber-400 border-b border-white/[0.06] pb-3">
                <RotateCcw size={20} />
                <h3 className="text-base font-semibold text-white">بدء دورة حول جديدة</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                هل ترغب في إعادة ضبط تاريخ بداية الحول لملف <strong>{activeProfile.name}</strong> إلى تاريخ اليوم؟
                سيتم الاحتفاظ بكافة إعدادات النطاق والمحافظ المحددة.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleStartNewCycle}
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
                >
                  تأكيد وبدء الحول من اليوم
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
