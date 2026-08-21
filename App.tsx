
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, LayoutDashboard, History, Settings as SettingsIcon, Briefcase, HandCoins, Repeat, Coins, ArrowRight, Sparkles, Scale, Wallet as WalletIcon, Check, Plane, FileText, Download, ArrowUpRight, ArrowDownLeft, Calendar, ArrowLeftRight, Trash2, Wifi, WifiOff, Edit3 } from 'lucide-react';
import { AppState, Transaction, Category, Debt, Account, RecurringRule, AuditLog } from './types';
import { INITIAL_CATEGORIES, DEFAULT_CURRENCIES, DEFAULT_EXCHANGE_RATES, convertCurrency } from './constants';
import { generateAndShareCSV, buildExecutiveCSVContent, exportAndShareExecutiveCSV } from './utils/exportHelper';
import { saveSecureState, loadSecureState } from './utils/secureStorage';
import { calculateConsolidatedPosition, calculateWalletBalances } from './services/balanceEngine';
import { processDueRecurringRules } from './services/recurringService';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import BalanceCard from './components/BalanceCard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Analytics from './components/Analytics';
import DebtManager from './components/DebtManager';
import SubscriptionManager from './components/SubscriptionManager';
import BudgetManager from './components/BudgetManager';
import GoalTracker from './components/GoalTracker';
import AIChat from './components/AIChat';
import Settings from './components/Settings';
import PrivacyPolicy from './components/PrivacyPolicy';
import WelcomeScreen from './components/WelcomeScreen';
import LockScreen from './components/LockScreen';
import Logo from './components/Logo';
import FinancialReport from './components/FinancialReport';
import { ReportModal } from './components/reports/ReportModal';
import { TrashModal } from './components/TrashModal';
import { RecurringManagerModal } from './components/RecurringManagerModal';
import { SystemDiagnosticsModal } from './components/SystemDiagnosticsModal';
import SmartAlerts from './components/SmartAlerts';
import ZakatCalculator from './components/ZakatCalculator';
import ExecutiveInsights from './components/ExecutiveInsights';
import CashflowSankey from './components/CashflowSankey';

const STORAGE_KEY = 'thari_app_v4';

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-main',
    name: 'الحساب الشخصي',
    type: 'personal',
    description: 'الحساب المالي الأساسي لإدارة المصاريف والدخل اليومي',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_STATE: AppState = {
  accounts: DEFAULT_ACCOUNTS,
  activeAccountId: 'acc-main',
  userName: 'مستخدم ثري',
  userEmail: '',
  transactions: [],
  trashTransactions: [],
  recurringRules: [],
  subscriptions: [],
  chatHistory: [],
  categories: INITIAL_CATEGORIES,
  wallets: [
    { id: 'w-yer-1', name: 'الراتب', currencyCode: 'YER_SANAA', color: '#f59e0b' },
    { id: 'w-sar-1', name: 'كاش سعودي', currencyCode: 'SAR', color: '#10b981' }
  ],
  goals: [],
  debts: [],
  budgets: [],
  currency: DEFAULT_CURRENCIES[0], // Default to SAR
  currencies: DEFAULT_CURRENCIES,
  exchangeRates: DEFAULT_EXCHANGE_RATES,
  auditLogs: [],
  isDarkMode: true,
  pin: null,
  isLocked: false,
  isBiometricEnabled: true,
  requireBiometricOnOpen: true,
  isTravelMode: false,
  showSeparateCurrencies: false,
  hasAcceptedTerms: false,
  apiKey: '', // Initialize empty
  autoLockTime: 'instant',
  autoBackupFrequency: 'daily',
  lastAutoBackupTime: '',
  syncStatus: 'SYNCED',
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const parsed = loadSecureState(STORAGE_KEY);
      if (parsed && typeof parsed === 'object') {
          // Migration: if currency is a string, convert it to an object
          let activeCurrency = parsed.currency;
          if (typeof activeCurrency === 'string') {
              activeCurrency = DEFAULT_CURRENCIES.find(c => c.code === activeCurrency) || DEFAULT_CURRENCIES[0];
          } else if (!activeCurrency || !activeCurrency.code) {
              activeCurrency = DEFAULT_CURRENCIES[0];
          }
          
          const currencies = (parsed.currencies && Array.isArray(parsed.currencies) && parsed.currencies.length > 0)
              ? parsed.currencies
              : DEFAULT_CURRENCIES;

          const categories = (parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0)
              ? parsed.categories
              : INITIAL_CATEGORIES;

          const wallets = (parsed.wallets && Array.isArray(parsed.wallets) && parsed.wallets.length > 0)
              ? parsed.wallets
              : INITIAL_STATE.wallets;

          const accounts = (parsed.accounts && Array.isArray(parsed.accounts) && parsed.accounts.length > 0)
              ? parsed.accounts
              : DEFAULT_ACCOUNTS;

          const exchangeRates = (parsed.exchangeRates && typeof parsed.exchangeRates === 'object')
              ? { ...DEFAULT_EXCHANGE_RATES, ...parsed.exchangeRates }
              : DEFAULT_EXCHANGE_RATES;

          const shouldLockOnOpen = !!parsed.pin && parsed.requireBiometricOnOpen !== false && parsed.autoLockTime !== 'never';
          
          return {
            ...INITIAL_STATE,
            ...parsed,
            accounts: accounts,
            activeAccountId: parsed.activeAccountId || accounts[0]?.id || 'acc-main',
            currency: activeCurrency,
            currencies: currencies,
            categories: categories,
            wallets: wallets,
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            trashTransactions: Array.isArray(parsed.trashTransactions) ? parsed.trashTransactions : [],
            recurringRules: Array.isArray(parsed.recurringRules) ? parsed.recurringRules : [],
            subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
            debts: Array.isArray(parsed.debts) ? parsed.debts : [],
            goals: Array.isArray(parsed.goals) ? parsed.goals : [],
            budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
            exchangeRates: exchangeRates,
            userEmail: parsed.userEmail || '',
            userName: parsed.userName || 'مستخدم ثري',
            isLocked: shouldLockOnOpen
          };
      }
      return INITIAL_STATE;
    } catch { 
      return INITIAL_STATE; 
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'debts' | 'chat' | 'subscriptions' | 'settings' | 'budgets' | 'goals' | 'zakat'>('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [printType, setPrintType] = useState<'summary' | 'detailed'>('summary');
  const [printWalletFilter, setPrintWalletFilter] = useState<string | null>(null);
  const [printCurrencyFilter, setPrintCurrencyFilter] = useState<string | null>(null);
  const [printStartDate, setPrintStartDate] = useState<string | null>(null);
  const [printEndDate, setPrintEndDate] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showTrashModal, setShowTrashModal] = useState<boolean>(false);
  const [showRecurringModal, setShowRecurringModal] = useState<boolean>(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  
  // Wallet Filter State (null = All Wallets)
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [timePeriodFilter, setTimePeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [formDefaultType, setFormDefaultType] = useState<'expense' | 'income' | 'transfer' | 'adjustment' | undefined>(undefined);

  // Network Offline / Online State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showNetworkToast, setShowNetworkToast] = useState(false);

  // PWA states
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const backgroundedAtRef = useRef<number | null>(null);

  // Check and process due recurring transactions on initial mount
  useEffect(() => {
    if (state.recurringRules && state.recurringRules.length > 0) {
      const { newTransactions, updatedRules } = processDueRecurringRules(
        state.recurringRules,
        state.transactions
      );
      if (newTransactions.length > 0) {
        setState(prev => ({
          ...prev,
          transactions: [...newTransactions, ...prev.transactions],
          recurringRules: updatedRules
        }));
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNetworkToast(true);
      setTimeout(() => setShowNetworkToast(false), 3500);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowNetworkToast(true);
      setTimeout(() => setShowNetworkToast(false), 4500);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleUpdate = (e: Event) => {
      console.log("Thari App: PWA update detected on client!");
      setIsUpdateAvailable(true);
      if (e instanceof CustomEvent && e.detail) {
        setSwRegistration(e.detail);
      }
    };
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.dispatchEvent(new CustomEvent('pwa-check-status'));

    window.addEventListener('pwa-update-available', handleUpdate);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-update-available', handleUpdate);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  // Android Hardware Back Button Handler for Native Capacitor App
  useEffect(() => {
    let backButtonListener: any = null;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (showAddForm) {
          setShowAddForm(false);
          setEditingTransaction(null);
        } else if (showPrivacyPolicy) {
          setShowPrivacyPolicy(false);
        } else if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
        } else {
          CapApp.exitApp();
        }
      }).then(l => { backButtonListener = l; });
    }
    return () => {
      if (backButtonListener && backButtonListener.remove) {
        backButtonListener.remove();
      }
    };
  }, [showAddForm, showPrivacyPolicy, activeTab]);

  // Dual Encrypted Offline-Safe Persistence to LocalStorage & Filesystem
  useEffect(() => {
    saveSecureState(STORAGE_KEY, state);
  }, [state]);

  // Timed Auto-lock when user leaves or backgrounds the app
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If user disabled biometric/PIN lock on open/background
      if (state.requireBiometricOnOpen === false) return;

      if (document.visibilityState === 'hidden') {
        backgroundedAtRef.current = Date.now();
        if (state.pin && (!state.autoLockTime || state.autoLockTime === 'instant')) {
          setState(p => ({ ...p, isLocked: true }));
        }
      } else if (document.visibilityState === 'visible') {
        if (state.pin && backgroundedAtRef.current && state.autoLockTime && state.autoLockTime !== 'never' && state.autoLockTime !== 'instant') {
          const elapsedMs = Date.now() - backgroundedAtRef.current;
          const thresholdMs = state.autoLockTime === '1min' ? 60000 : 300000;
          if (elapsedMs >= thresholdMs) {
            setState(p => ({ ...p, isLocked: true }));
          }
        }
        backgroundedAtRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.pin, state.autoLockTime, state.requireBiometricOnOpen]);

  // Automated Periodic / On-Open Snapshot Backup Runner
  useEffect(() => {
    try {
      const freq = state.autoBackupFrequency || 'daily';
      if (freq === 'disabled') return;

      const now = Date.now();
      const lastBackupIso = state.lastAutoBackupTime;
      const lastTime = lastBackupIso ? new Date(lastBackupIso).getTime() : 0;
      const elapsedMs = now - lastTime;

      let shouldBackup = false;
      if (freq === 'on_open') {
        shouldBackup = true;
      } else if (freq === 'daily') {
        shouldBackup = elapsedMs > 86400000; // 24 hours
      } else if (freq === 'weekly') {
        shouldBackup = elapsedMs > 7 * 86400000; // 7 days
      }

      if (shouldBackup) {
        const timestampIso = new Date().toISOString();
        const snapshotItem = {
          id: `auto_${Date.now()}`,
          timestamp: timestampIso,
          dateFormatted: new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          transactionsCount: state.transactions.length,
          walletsCount: state.wallets.length,
          debtsCount: state.debts.length,
          data: JSON.stringify(state)
        };

        const savedHistory = localStorage.getItem('thari_auto_backup_history');
        let history = savedHistory ? JSON.parse(savedHistory) : [];
        history = [snapshotItem, ...history.filter((h: any) => h.id !== snapshotItem.id)].slice(0, 5);
        localStorage.setItem('thari_auto_backup_history', JSON.stringify(history));

        setState(prev => ({
          ...prev,
          lastAutoBackupTime: timestampIso
        }));
      }
    } catch (e) {
      console.warn("Auto backup runner error:", e);
    }
  }, [state.autoBackupFrequency]);

  // --- Filtering Logic ---
  
  // 1. Get Transactions based on Selected Wallet & Time Period
  const filteredTransactions = useMemo(() => {
      let list = state.transactions;
      if (selectedWalletId) {
          list = list.filter(t => t.walletId === selectedWalletId || t.destinationWalletId === selectedWalletId);
      }
      if (timePeriodFilter !== 'all') {
          const todayStr = new Date().toISOString().split('T')[0];
          if (timePeriodFilter === 'today') {
              list = list.filter(t => t.date === todayStr);
          } else if (timePeriodFilter === 'week') {
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              const limitStr = sevenDaysAgo.toISOString().split('T')[0];
              list = list.filter(t => t.date >= limitStr);
          } else if (timePeriodFilter === 'month') {
              const monthStr = todayStr.substring(0, 7);
              list = list.filter(t => t.date.startsWith(monthStr));
          }
      }
      return list;
  }, [state.transactions, selectedWalletId, timePeriodFilter]);

  // 2. Calculate Totals and Multi-Currency Breakdown via Balance Engine
  // Lifetime transactions ensure accurate cumulative Wallet Balances & Net Worth,
  // while filteredTransactions determine period Inflows (Income) and Outflows (Expenses).
  const totals = useMemo(() => {
    return calculateConsolidatedPosition(
      filteredTransactions,
      state.wallets,
      state.currency.code,
      state.exchangeRates,
      selectedWalletId,
      null,
      state.transactions
    );
  }, [filteredTransactions, state.transactions, state.wallets, state.currency.code, state.exchangeRates, selectedWalletId]);

  // Handle Wallet Selection & Currency Sync
  const handleSelectWallet = (id: string | null) => {
      setSelectedWalletId(id);
      if (id) {
          const wallet = state.wallets.find(w => w.id === id);
          if (wallet) {
              const walletCurrency = state.currencies.find(c => c.code === wallet.currencyCode);
              if (walletCurrency) {
                  setState(p => ({ ...p, currency: walletCurrency }));
              }
          }
      }
  };

  const handlePrint = (
    type: 'summary' | 'detailed',
    walletId?: string | null,
    currencyFilter?: string | null,
    startDate?: string | null,
    endDate?: string | null
  ) => {
    setPrintType(type);
    setPrintWalletFilter(walletId !== undefined ? walletId : selectedWalletId);
    setPrintCurrencyFilter(currencyFilter || null);
    setPrintStartDate(startDate || null);
    setPrintEndDate(endDate || null);
    // Give React time to update state and re-render FinancialReport before opening print dialog
    setTimeout(() => { 
      window.print(); 
    }, 600);
  };

  const handleShare = async (
    type: 'summary' | 'detailed',
    walletId?: string | null,
    currencyFilter?: string | null,
    startDate?: string | null,
    endDate?: string | null
  ) => {
    setPrintType(type);
    setPrintWalletFilter(walletId !== undefined ? walletId : selectedWalletId);
    setPrintCurrencyFilter(currencyFilter || null);
    setPrintStartDate(startDate || null);
    setPrintEndDate(endDate || null);
    
    // Fallback to native print dialog which accurately renders Arabic text into PDFs
    // For mobile platforms, we trigger print where the user can save as PDF and share.
    setTimeout(() => { 
        window.print();
        // Show a brief tip to the user about saving as PDF
        alert("لطباعة التقرير أو حفظه كملف PDF، يرجى استخدام خيار (حفظ كـ PDF) من نافذة الطباعة الخاصة بجهازك للحفاظ على جودة اللغة العربية.");
    }, 600);
  };

  const handleExportExcelReport = (
    type: 'summary' | 'detailed' = 'detailed',
    currencyFilter?: string | null,
    startDate?: string | null,
    endDate?: string | null
  ) => {
    const csvContent = buildExecutiveCSVContent({
      transactions: state.transactions,
      categories: state.categories,
      wallets: state.wallets,
      userName: state.userName,
      currency: state.currency,
      exchangeRates: state.exchangeRates,
      type,
      filterWalletId: selectedWalletId,
      filterCurrency: currencyFilter || null,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    const fileName = `Thari_Executive_Report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    exportAndShareExecutiveCSV(csvContent, fileName);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setShowAddForm(true);
  };

  // Soft Delete Handler
  const handleDeleteTransaction = (id: string) => {
    const target = state.transactions.find(t => t.id === id);
    if (!target) return;

    const deletedItem: Transaction = {
      ...target,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState(p => ({
      ...p,
      transactions: p.transactions.filter(t => t.id !== id),
      trashTransactions: [deletedItem, ...(p.trashTransactions || [])],
    }));
  };

  const handleRestoreTransaction = (id: string) => {
    const target = state.trashTransactions?.find(t => t.id === id);
    if (!target) return;

    const restoredItem: Transaction = {
      ...target,
      isDeleted: false,
      deletedAt: undefined,
      updatedAt: new Date().toISOString(),
    };

    setState(p => ({
      ...p,
      trashTransactions: (p.trashTransactions || []).filter(t => t.id !== id),
      transactions: [restoredItem, ...p.transactions],
    }));
  };

  const handlePermanentDelete = (id: string) => {
    setState(p => ({
      ...p,
      trashTransactions: (p.trashTransactions || []).filter(t => t.id !== id),
    }));
  };

  const handleEmptyTrash = () => {
    setState(p => ({
      ...p,
      trashTransactions: [],
    }));
  };

  // Recurring Rules Handlers
  const handleToggleRecurringActive = (id: string) => {
    setState(p => ({
      ...p,
      recurringRules: (p.recurringRules || []).map(r => r.id === id ? { ...r, isActive: !r.isActive } : r),
    }));
  };

  const handleDeleteRecurringRule = (id: string) => {
    setState(p => ({
      ...p,
      recurringRules: (p.recurringRules || []).filter(r => r.id !== id),
    }));
  };

  const handleAddRecurringRule = (ruleData: Omit<RecurringRule, 'id' | 'createdAt'>) => {
    const newRule: RecurringRule = {
      ...ruleData,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setState(p => ({
      ...p,
      recurringRules: [newRule, ...(p.recurringRules || [])],
    }));
  };

  const handleTriggerRecurringCatchup = () => {
    if (state.recurringRules && state.recurringRules.length > 0) {
      const { newTransactions, updatedRules } = processDueRecurringRules(
        state.recurringRules,
        state.transactions
      );
      if (newTransactions.length > 0) {
        setState(prev => ({
          ...prev,
          transactions: [...newTransactions, ...prev.transactions],
          recurringRules: updatedRules,
        }));
      }
    }
  };

  const handleApplyRepairedState = (repairedState: AppState) => {
    setState(repairedState);
  };

  const handleSubmitTransaction = (txData: any) => {
    const targetId = editingTransaction?.id || txData.id;
    if (targetId) {
        setState(p => ({
            ...p,
            transactions: p.transactions.map(t => t.id === targetId ? { ...txData, id: t.id, updatedAt: new Date().toISOString() } : t)
        }));
    } else {
        setState(p => ({ 
            ...p, 
            transactions: [{ ...txData, id: 'tx-' + Date.now(), createdAt: new Date().toISOString() }, ...p.transactions] 
        }));
    }
    setShowAddForm(false);
    setEditingTransaction(null);
    setFormDefaultType(undefined);
  };

  // ... (Debt handlers remain the same) ...
  const handleUpdateDebt = (id: string, updates: Partial<Debt>) => {
    setState(p => ({
      ...p,
      debts: p.debts.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };
  const handlePayDebt = (id: string, amount: number, walletId?: string, noteSuffix?: string, customDebtUpdates?: Partial<Debt>) => {
    const debt = state.debts.find(d => d.id === id);
    if (!debt) return;
    
    let newTransaction: Transaction | null = null;
    if (walletId && amount > 0) {
        newTransaction = {
            id: 'tx-' + Date.now(),
            amount: amount,
            type: debt.type === 'to_me' ? 'income' : 'expense',
            categoryId: debt.type === 'to_me' ? '11' : '4',
            walletId: walletId,
            note: debt.type === 'to_me' 
                ? `دفعة مستردة من دين: ${debt.personName}${noteSuffix ? ` (${noteSuffix})` : ''}` 
                : `دفعة مسددة من دين: ${debt.personName}${noteSuffix ? ` (${noteSuffix})` : ''}`,
            date: new Date().toISOString().split('T')[0],
            currency: debt.currency,
            frequency: 'once'
        };
    }
    
    setState(p => {
        const updatedDebts = p.debts.map(d => {
            if (d.id === id) {
                const newPaidAmount = (d.paidAmount || 0) + amount;
                const isPaid = newPaidAmount >= d.amount * 0.999;
                return {
                    ...d,
                    paidAmount: newPaidAmount,
                    isPaid: isPaid,
                    ...customDebtUpdates
                };
            }
            return d;
        });
        return {
            ...p,
            transactions: newTransaction ? [newTransaction, ...p.transactions] : p.transactions,
            debts: updatedDebts
        };
    });
  };
  const handleAddDebt = (debtData: Omit<Debt, 'id'>, walletId?: string) => {
    const newDebtId = 'd-' + Date.now();
    const newTransactionId = 'tx-' + Date.now();
    const newDebt: Debt = { ...debtData, id: newDebtId };
    let newTransaction: Transaction | null = null;
    if (walletId) {
        newTransaction = {
            id: newTransactionId,
            amount: debtData.amount,
            type: debtData.type === 'to_me' ? 'expense' : 'income',
            categoryId: debtData.type === 'to_me' ? '12' : '11', 
            walletId: walletId,
            note: debtData.type === 'to_me' ? `إقراض مبلغ لـ: ${debtData.personName}` : `استلاف مبلغ من: ${debtData.personName}`,
            date: debtData.createdAt,
            currency: debtData.currency,
            frequency: 'once'
        };
    }
    setState(p => ({
        ...p,
        debts: [newDebt, ...p.debts],
        transactions: newTransaction ? [newTransaction, ...p.transactions] : p.transactions
    }));
  };
  const handleSettleDebt = (id: string, walletId?: string) => {
    const debt = state.debts.find(d => d.id === id);
    if (!debt) return;
    const remaining = debt.amount - (debt.paidAmount || 0);
    handlePayDebt(id, remaining, walletId, "سداد كامل");
  };

  if (!state.hasAcceptedTerms) return <WelcomeScreen onAccept={() => setState(p => ({ ...p, hasAcceptedTerms: true }))} onShowPrivacy={() => setShowPrivacyPolicy(true)} />;
  if (state.pin && state.isLocked) {
    return (
      <LockScreen 
        savedPin={state.pin} 
        pinSalt={state.pinSalt}
        isBiometricEnabled={state.isBiometricEnabled !== false} 
        onUnlock={() => setState(p => ({ ...p, isLocked: false }))} 
        onRehashPin={(newPinHash, newSalt) => setState(p => ({ ...p, pin: newPinHash, pinSalt: newSalt }))}
      />
    );
  }

  return (
    <div 
      className="w-full flex flex-col relative print:block print:bg-white print:max-w-none print:h-auto overflow-hidden text-right bg-slate-950/30"
      style={{
        height: 'var(--vh, var(--app-height))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      } as React.CSSProperties}
    >
      
      {/* Hidden Print Report */}
      <FinancialReport 
        transactions={state.transactions} 
        categories={state.categories} 
        currency={state.currency} 
        userName={state.userName} 
        wallets={state.wallets} 
        type={printType} 
        exchangeRates={state.exchangeRates}
        filterWalletId={printWalletFilter} 
        filterCurrency={printCurrencyFilter}
        startDate={printStartDate}
        endDate={printEndDate}
      />
      
      <div className="flex flex-col flex-1 print:hidden relative z-20 overflow-hidden">
        <header className="sticky top-0 shrink-0 px-4 pb-3 md:px-6 md:py-4 glass-effect border-b border-white/5 z-30 backdrop-blur-xl bg-slate-950/80" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}>
          <div className="flex justify-between items-center max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <Logo size={28} showText />
              {/* Online/Offline status pill */}
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                  isOnline
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                }`}
                title={isOnline ? 'بياناتك محفوظة محلياً ومتصل' : 'التطبيق يعمل بكفاءة أوفلاين 100%'}
              >
                {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                <span>{isOnline ? 'متصل' : 'أوفلاين'}</span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {/* System Diagnostics / Accounting Audit */}
              <button
                type="button"
                onClick={() => setShowDiagnosticsModal(true)}
                className="p-2 rounded-xl border border-white/10 text-slate-400 bg-white/5 hover:bg-white/10 hover:text-emerald-400 transition-all"
                title="فحص تكامل البيانات والتدقيق المحاسبي"
              >
                <Scale size={16} />
              </button>

              {/* Recurring Rules Manager */}
              <button
                type="button"
                onClick={() => setShowRecurringModal(true)}
                className="relative p-2 rounded-xl border border-white/10 text-slate-400 bg-white/5 hover:bg-white/10 hover:text-amber-400 transition-all"
                title="إدارة العمليات الدورية والمجدولة"
              >
                <Repeat size={16} />
                {(state.recurringRules?.length || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center shadow-md">
                    {state.recurringRules.length}
                  </span>
                )}
              </button>

              {/* Trash Bin Quick Access */}
              <button
                type="button"
                onClick={() => setShowTrashModal(true)}
                className="relative p-2 rounded-xl border border-white/10 text-slate-400 bg-white/5 hover:bg-white/10 hover:text-rose-400 transition-all"
                title="سلة المحذوفات"
              >
                <Trash2 size={16} />
                {(state.trashTransactions?.length || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
                    {state.trashTransactions.length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setShowReportModal(true)} 
                className="p-2 rounded-xl border border-white/10 text-slate-400 bg-white/5 hover:bg-white/10 hover:text-amber-400 transition-all" 
                title="إصدار التقارير المالية"
              >
                <FileText size={16} />
              </button>
              <button onClick={() => setActiveTab('chat')} className={`p-2 rounded-xl border border-white/10 transition-all ${activeTab === 'chat' ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`} title="المستشار المالي"><Briefcase size={16} /></button>
              <button onClick={() => setActiveTab('settings')} className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-500 hover:text-amber-500 hover:border-amber-500/50 transition-all shrink-0 active:scale-95 backdrop-blur-md" title="الإعدادات"><SettingsIcon size={16} /></button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar overflow-x-hidden px-3 sm:px-5 md:px-8 relative pb-[calc(7rem+env(safe-area-inset-bottom,16px))] w-full">
          <div className="py-4 sm:py-6 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full"
              >
                {activeTab === 'dashboard' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start">
                    
                    {/* Horizontal Sliding Currencies Marquee */}
                    <div className="lg:col-span-12 overflow-hidden mask-gradient-x py-1">
                        <div className="flex items-center gap-2.5 relative z-10 w-full overflow-x-auto no-scrollbar py-1">
                        {state.currencies.map((curr, index) => {
                            const isActive = state.currency.code === curr.code;
                            return (
                            <motion.button 
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              key={`${curr.code}-${index}`} 
                              onClick={() => setState(p => ({...p, currency: curr}))} 
                              className={`shrink-0 relative flex items-center gap-2 pl-3.5 pr-2.5 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300 ${isActive ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.35)] font-black z-20' : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/20'}`}
                            >
                                {isActive && <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-50 pointer-events-none" />}
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-slate-900/70' : 'text-slate-500'}`}>{curr.code}</span>
                                <span className="font-bold text-xs whitespace-nowrap">{curr.name}</span>
                                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-slate-950' : 'bg-slate-600'}`} />
                            </motion.button>
                            );
                        })}
                        </div>
                    </div>

                    {/* Wallets selector */}
                    <div className="lg:col-span-12 flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                         <motion.button 
                             whileHover={{ scale: 1.02 }}
                             whileTap={{ scale: 0.97 }}
                             onClick={() => handleSelectWallet(null)}
                             className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${!selectedWalletId ? 'bg-white text-slate-900 border-white shadow-md' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
                         >
                             <LayoutDashboard size={15} />
                             <span className="text-xs font-black">كل المحافظ</span>
                         </motion.button>
                         {state.wallets.map(w => (
                             <motion.button 
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.97 }}
                                 key={w.id}
                                 onClick={() => handleSelectWallet(w.id)}
                                 className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${selectedWalletId === w.id ? 'bg-amber-500 text-slate-900 border-amber-500 shadow-lg shadow-amber-500/20 font-black' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
                             >
                                 <div className="w-2 h-2 rounded-full" style={{backgroundColor: w.color}} />
                                 <span className="text-xs font-black">{w.name}</span>
                                 {selectedWalletId === w.id && <Check size={14} />}
                             </motion.button>
                         ))}
                    </div>

                    {/* Mobile-First Quick Action Bar & Time Period Filter */}
                    <div className="lg:col-span-12 space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setEditingTransaction(null); setFormDefaultType('expense'); setShowAddForm(true); }}
                                className="bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 p-2.5 sm:p-3 rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 shadow-sm"
                            >
                                <ArrowDownLeft size={16} className="shrink-0" />
                                <span className="text-xs font-bold truncate">تسجيل مصروف</span>
                            </motion.button>

                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setEditingTransaction(null); setFormDefaultType('income'); setShowAddForm(true); }}
                                className="bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 p-2.5 sm:p-3 rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 shadow-sm"
                            >
                                <ArrowUpRight size={16} className="shrink-0" />
                                <span className="text-xs font-bold truncate">تسجيل دخل</span>
                            </motion.button>

                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setEditingTransaction(null); setFormDefaultType('transfer'); setShowAddForm(true); }}
                                className="bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 p-2.5 sm:p-3 rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 shadow-sm"
                            >
                                <ArrowLeftRight size={16} className="shrink-0" />
                                <span className="text-xs font-bold truncate">تحويل محافظ</span>
                            </motion.button>

                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    const targetTx = state.transactions.length > 0 ? state.transactions[0] : null;
                                    setEditingTransaction(targetTx);
                                    setFormDefaultType('adjustment');
                                    setShowAddForm(true);
                                }}
                                className="bg-amber-500/10 border border-amber-500/25 hover:border-amber-500/50 text-amber-400 p-2.5 sm:p-3 rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 shadow-sm"
                                title="تعديل أي معاملة سابقة من القائمة المنسدلة"
                            >
                                <Edit3 size={16} className="shrink-0 text-amber-400" />
                                <span className="text-xs font-bold truncate">تعديل معاملة</span>
                            </motion.button>

                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveTab('debts')}
                                className="col-span-2 sm:col-span-1 bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 text-purple-400 p-2.5 sm:p-3 rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 shadow-sm"
                            >
                                <HandCoins size={16} className="shrink-0" />
                                <span className="text-xs font-bold truncate">ديون والتزامات</span>
                            </motion.button>
                        </div>

                        {/* Period Filter Chips */}
                        <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0 flex items-center gap-1">
                                <Calendar size={12} /> الفترة:
                            </span>
                            <div className="flex gap-1 shrink-0">
                                {[
                                    { id: 'all', label: 'الكل' },
                                    { id: 'today', label: 'اليوم' },
                                    { id: 'week', label: 'هذا الأسبوع' },
                                    { id: 'month', label: 'هذا الشهر' },
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setTimePeriodFilter(p.id as any)}
                                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${timePeriodFilter === p.id ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-12">
                       <SmartAlerts budgets={state.budgets} transactions={filteredTransactions} debts={state.debts} subscriptions={state.subscriptions} categories={state.categories} />
                    </div>

                    {/* LEFT COLUMN: Balance Card & Executive Insights */}
                    <div className="lg:col-span-6 space-y-6 w-full">
                        <BalanceCard 
                            totalBalance={totals.netWorthInBase} 
                            totalIncome={totals.totalIncomeInBase} 
                            totalExpense={totals.totalExpenseInBase} 
                            symbol={state.currency.symbol}
                            balances={totals.currencyBalances}
                            expenseBreakdown={totals.expenseByCurrency}
                            showSeparateCurrencies={state.showSeparateCurrencies}
                        />

                        <ExecutiveInsights 
                            transactions={filteredTransactions}
                            budgets={state.budgets}
                            debts={state.debts}
                            totalBalance={totals.netWorthInBase}
                            currencySymbol={state.currency.symbol}
                        />
                    </div>

                    {/* RIGHT COLUMN: Sankey Flow & Recent Operations */}
                    <div className="lg:col-span-6 space-y-6 w-full">
                        <CashflowSankey 
                            transactions={filteredTransactions}
                            categories={state.categories}
                            currencySymbol={state.currency.symbol}
                        />

                        <section className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-[0.15em]"><History size={13} /> {selectedWalletId ? 'سجل المحفظة المختارة' : 'أحدث العمليات'}</h3>
                            <button onClick={() => setActiveTab('transactions')} className="text-amber-500 text-[10px] font-black uppercase flex items-center gap-1 hover:text-amber-400 transition-colors">عرض الكل <ArrowRight size={11} className="rotate-180" /></button>
                          </div>
                          <TransactionList 
                            transactions={filteredTransactions.slice(0, 5)} 
                            categories={state.categories} 
                            wallets={state.wallets} 
                            onDelete={handleDeleteTransaction} 
                            onEdit={handleEditTransaction} 
                            currencySymbol={state.currency.symbol}
                            currentCurrencyCode={state.currency.code}
                            currencies={state.currencies}
                            exchangeRates={state.exchangeRates}
                          />
                        </section>
                    </div>
                  </div>
                )}
                
                {activeTab === 'goals' && <GoalTracker goals={state.goals} wallets={state.wallets} transactions={state.transactions} onAddGoal={(g) => setState(p => ({ ...p, goals: [...p.goals, { ...g, id: 'g-'+Date.now() }] }))} onUpdateGoalAmount={(id, amt) => setState(p => ({ ...p, goals: p.goals.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amt } : g) }))} currencySymbol={state.currency.symbol} apiKey={state.apiKey} />}
                {activeTab === 'budgets' && <BudgetManager budgets={state.budgets} categories={state.categories} transactions={filteredTransactions} onSetBudget={(catId, amount) => setState(p => ({ ...p, budgets: [...p.budgets.filter(b => b.categoryId !== catId), { categoryId: catId, amount }] }))} currencySymbol={state.currency.symbol} />}
                {activeTab === 'chat' && <AIChat history={state.chatHistory} transactions={filteredTransactions} categories={state.categories} currency={state.currency.symbol} onSendMessage={(msg) => setState(p => ({ ...p, chatHistory: [...p.chatHistory, msg].slice(-30) }))} apiKey={state.apiKey} />}
                {activeTab === 'debts' && <DebtManager debts={state.debts} wallets={state.wallets} onAddDebt={handleAddDebt} onUpdateDebt={handleUpdateDebt} onSettleDebt={handleSettleDebt} onPayDebt={handlePayDebt} onDeleteDebt={(id) => setState(p => ({ ...p, debts: p.debts.filter(d => d.id !== id) }))} currencySymbol={state.currency.symbol} currencyCode={state.currency.code} />}
                {activeTab === 'subscriptions' && <SubscriptionManager subscriptions={state.subscriptions} categories={state.categories} onAdd={(sub) => setState(p => ({ ...p, subscriptions: [{...sub, id: 's-'+Date.now()}, ...p.subscriptions] }))} onRemove={(id) => setState(p => ({ ...p, subscriptions: p.subscriptions.filter(s => s.id !== id) }))} currencySymbol={state.currency.symbol} />}
                {activeTab === 'zakat' && <ZakatCalculator totalBalance={totals.netWorthInBase} currencySymbol={state.currency.symbol} debts={state.debts} />}
                
                {activeTab === 'transactions' && (
                    <div className="space-y-8">
                        <Analytics 
                            transactions={state.transactions} 
                            categories={state.categories} 
                            wallets={state.wallets}
                            currencySymbol={state.currency.symbol} 
                            onPrint={handlePrint} 
                            currentCurrencyCode={state.currency.code} 
                            exchangeRates={state.exchangeRates} 
                            initialWalletId={selectedWalletId} 
                            onFilterChange={handleSelectWallet} 
                            userName={state.userName}
                            currencies={state.currencies}
                        />
                        
                        <TransactionList 
                            transactions={filteredTransactions} 
                            categories={state.categories} 
                            wallets={state.wallets} 
                            onDelete={handleDeleteTransaction} 
                            onEdit={handleEditTransaction} 
                            currencySymbol={state.currency.symbol}
                            currentCurrencyCode={state.currency.code}
                            currencies={state.currencies}
                            exchangeRates={state.exchangeRates}
                            showFilters 
                        />
                    </div>
                )}
                
                {activeTab === 'settings' && (
                    <Settings 
                        {...state} 
                        appState={state} 
                        onUpdateSettings={(updates) => setState(p => ({...p, ...updates}))} 
                        onAddCurrency={(c) => setState(p => ({...p, currencies: [...p.currencies, c]}))} 
                        onRemoveCurrency={(code) => setState(p => ({...p, currencies: p.currencies.filter(c => c.code !== code)}))} 
                        onAddWallet={(w) => setState(p => ({ ...p, wallets: [...p.wallets, { ...w, id: 'w-' + Date.now() }] }))} 
                        onUpdateWallet={(id, updates) => setState(p => ({ ...p, wallets: p.wallets.map(w => w.id === id ? { ...w, ...updates } : w) }))}
                        onRemoveWallet={(id) => setState(p => ({ ...p, wallets: p.wallets.filter(w => w.id !== id) }))} 
                        onAddCategory={(c) => setState(p => ({ ...p, categories: [...p.categories, { ...c, id: 'c-' + Date.now() }] }))}
                        onUpdateCategory={(id, updates) => setState(p => ({ ...p, categories: p.categories.map(c => c.id === id ? { ...c, ...updates } : c) }))}
                        onRemoveCategory={(id) => setState(p => ({ ...p, categories: p.categories.filter(c => c.id !== id) }))}
                        onRestore={(data) => setState(p => ({ ...INITIAL_STATE, ...data, isLocked: !!data.pin }))} 
                        onClearData={() => setState(p => ({...p, transactions: [], debts: [], budgets: [], subscriptions: [], chatHistory: [], goals: []}))} 
                        onShowPrivacyPolicy={() => setShowPrivacyPolicy(false)} 
                        onPrint={handlePrint}
                        onShare={handleShare}
                        onExportExcel={handleExportExcelReport}
                        installPrompt={installPrompt}
                        isUpdateAvailable={isUpdateAvailable}
                        swRegistration={swRegistration}
                    />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 pt-16 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] px-4 md:px-0 flex justify-center pointer-events-none z-50 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
            <nav className="pointer-events-auto w-full md:max-w-xl bg-slate-900/95 backdrop-blur-2xl border border-white/10 flex items-center justify-between px-2 py-2 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                <NavButton icon={<LayoutDashboard />} label="الرئيسية" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavButton icon={<Scale />} label="زكاتي" active={activeTab === 'zakat'} onClick={() => setActiveTab('zakat')} />
                
                <motion.button 
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { setEditingTransaction(null); setShowAddForm(true); }}
                  className="w-14 h-14 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-[1.5rem] shadow-[0_10px_20px_rgba(245,158,11,0.4)] flex items-center justify-center z-50 border-[4px] border-slate-900 mx-1 shrink-0"
                >
                  <Plus size={28} strokeWidth={4} />
                </motion.button>

                <NavButton icon={<HandCoins />} label="ديون" active={activeTab === 'debts'} onClick={() => setActiveTab('debts')} />
                <NavButton icon={<SettingsIcon />} label="المزيد" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </nav>
        </div>

        {/* Floating Quick Action Buttons */}
        {activeTab === 'dashboard' && (
          <div className="fixed left-3 sm:left-4 bottom-24 sm:bottom-28 md:bottom-32 z-40 flex flex-col gap-2.5 pointer-events-none no-print">
            <motion.button 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab('goals')} 
              className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 bg-slate-900/95 backdrop-blur-3xl border border-white/10 hover:border-amber-500/50 rounded-full flex flex-col items-center justify-center text-amber-500 shadow-[0_10px_25px_rgba(0,0,0,0.6)] group relative"
              title="الأهداف المالية"
            >
              <Coins size={18} className="group-hover:scale-110 transition-transform" />
              <span className="absolute right-12 sm:right-14 bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white font-bold text-[10px] px-2.5 py-1 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md hidden group-hover:block">الأهداف</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab('budgets')} 
              className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 bg-slate-900/95 backdrop-blur-3xl border border-white/10 hover:border-blue-500/50 rounded-full flex flex-col items-center justify-center text-blue-400 shadow-[0_10px_25px_rgba(0,0,0,0.6)] group relative"
              title="إدارة الميزانية"
            >
              <LayoutDashboard size={18} className="group-hover:scale-110 transition-transform" />
              <span className="absolute right-12 sm:right-14 bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white font-bold text-[10px] px-2.5 py-1 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md hidden group-hover:block">الميزانية</span>
            </motion.button>
          </div>
        )}

        <AnimatePresence>
          {showTrashModal && (
            <TrashModal
              isOpen={showTrashModal}
              onClose={() => setShowTrashModal(false)}
              trashTransactions={state.trashTransactions || []}
              categories={state.categories}
              wallets={state.wallets}
              currencies={state.currencies}
              onRestore={handleRestoreTransaction}
              onPermanentDelete={handlePermanentDelete}
              onEmptyTrash={handleEmptyTrash}
            />
          )}
          {showReportModal && (
            <ReportModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              transactions={state.transactions}
              categories={state.categories}
              wallets={state.wallets}
              currencies={state.currencies}
              currentCurrency={state.currency}
              userName={state.userName}
              exchangeRates={state.exchangeRates}
              initialType={printType}
              initialWalletId={selectedWalletId}
              initialCurrencyCode={printCurrencyFilter}
              onTriggerPrint={handlePrint}
            />
          )}
          {showRecurringModal && (
            <RecurringManagerModal
              isOpen={showRecurringModal}
              onClose={() => setShowRecurringModal(false)}
              rules={state.recurringRules || []}
              wallets={state.wallets}
              categories={state.categories}
              currencies={state.currencies}
              onToggleActive={handleToggleRecurringActive}
              onDeleteRule={handleDeleteRecurringRule}
              onAddRule={handleAddRecurringRule}
              onTriggerCatchup={handleTriggerRecurringCatchup}
            />
          )}
          {showDiagnosticsModal && (
            <SystemDiagnosticsModal
              isOpen={showDiagnosticsModal}
              onClose={() => setShowDiagnosticsModal(false)}
              state={state}
              onApplyRepairedState={handleApplyRepairedState}
            />
          )}
          {showAddForm && (
              <TransactionForm 
                categories={state.categories} 
                wallets={state.wallets} 
                transactions={state.transactions}
                onSubmit={handleSubmitTransaction} 
                onClose={() => { setShowAddForm(false); setEditingTransaction(null); setFormDefaultType(undefined); }} 
                initialData={editingTransaction} 
                defaultType={formDefaultType} 
                exchangeRates={state.exchangeRates} 
              />
          )}
          {showPrivacyPolicy && <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <motion.button 
    whileTap={{ scale: 0.92 }}
    onClick={onClick} 
    className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 min-w-[60px] group ${active ? 'text-amber-500' : 'text-slate-500'}`}
  >
    <div className={`p-2 rounded-xl transition-all duration-300 relative ${active ? 'bg-amber-500/10 text-amber-500' : 'group-hover:bg-white/5'}`}>
        {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
        {active && (
          <motion.div 
            layoutId="activeTabGlow" 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" 
          />
        )}
    </div>
    <span className={`text-[10px] font-bold transition-all duration-300 ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </motion.button>
);

export default App;
