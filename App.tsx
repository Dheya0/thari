
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, LayoutDashboard, History, Settings as SettingsIcon, BrainCircuit, HandCoins, Repeat, Coins, ArrowRight, Sparkles, Scale, Wallet as WalletIcon, Check, Plane, FileText, Download } from 'lucide-react';
import { AppState, Transaction, Category, Debt } from './types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { INITIAL_CATEGORIES, DEFAULT_CURRENCIES, DEFAULT_EXCHANGE_RATES, convertCurrency } from './constants';
import { generateAndSharePDF, generateAndShareCSV, buildExecutiveCSVContent, exportAndShareExecutiveCSV } from './utils/exportHelper';
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
import SmartAlerts from './components/SmartAlerts';
import FinancialSimulation from './components/FinancialSimulation';
import ZakatCalculator from './components/ZakatCalculator';
import ExecutiveInsights from './components/ExecutiveInsights';
import CashflowSankey from './components/CashflowSankey';

const STORAGE_KEY = 'thari_app_v4';

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const INITIAL_STATE: AppState = {
  userName: 'مستخدم ثري',
  transactions: [],
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
  isDarkMode: true,
  pin: null,
  isLocked: false,
  isTravelMode: false,
  showSeparateCurrencies: false,
  hasAcceptedTerms: false,
  apiKey: '', // Initialize empty
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
          const parsed = JSON.parse(saved);
          
          // Migration: if currency is a string, convert it to an object
          if (typeof parsed.currency === 'string') {
              const matchedCurrency = DEFAULT_CURRENCIES.find(c => c.code === parsed.currency) || DEFAULT_CURRENCIES[0];
              parsed.currency = matchedCurrency;
          }
          
          if (!parsed.currencies || !Array.isArray(parsed.currencies)) {
              parsed.currencies = DEFAULT_CURRENCIES;
          }
          
          return { ...INITIAL_STATE, ...parsed, isLocked: !!parsed.pin };
      }
      return INITIAL_STATE;
    } catch { return INITIAL_STATE; }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'debts' | 'chat' | 'subscriptions' | 'settings' | 'budgets' | 'goals' | 'future' | 'zakat'>('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [printType, setPrintType] = useState<'summary' | 'detailed'>('summary');
  const [printCurrencyFilter, setPrintCurrencyFilter] = useState<string | null>(null);
  
  // Wallet Filter State (null = All Wallets)
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  // PWA states
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
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
      window.removeEventListener('pwa-update-available', handleUpdate);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // --- Filtering Logic ---
  
  // 1. Get Transactions based on Selected Wallet
  const filteredTransactions = useMemo(() => {
      if (!selectedWalletId) return state.transactions;
      return state.transactions.filter(t => t.walletId === selectedWalletId);
  }, [state.transactions, selectedWalletId]);

  // 2. Calculate Totals and Multi-Currency Breakdown
  const totals = useMemo(() => {
    const txSource = filteredTransactions;
    
    // Calculate breakdowns per currency
    const currencyBreakdown: Record<string, number> = {};
    const expenseBreakdown: Record<string, number> = {};
    
    // Initialize currencies from wallets to ensure they appear even if 0
    if (selectedWalletId) {
        const w = state.wallets.find(w => w.id === selectedWalletId);
        if (w) currencyBreakdown[w.currencyCode] = 0;
    } else {
        state.wallets.forEach(w => {
            currencyBreakdown[w.currencyCode] = 0;
        });
    }

    txSource.forEach(t => {
        const currentVal = currencyBreakdown[t.currency] || 0;
        const change = t.type === 'income' ? t.amount : -t.amount;
        currencyBreakdown[t.currency] = currentVal + change;

        if (t.type === 'expense') {
            const currentExp = expenseBreakdown[t.currency] || 0;
            expenseBreakdown[t.currency] = currentExp + t.amount;
        }
    });

    // Total estimated balance in Display Currency (for the big number)
    // We sum up all different currencies converted to the main display currency
    const balance = Object.entries(currencyBreakdown).reduce((sum, [code, amount]) => {
        return sum + convertCurrency(amount, code, state.currency.code, state.exchangeRates);
    }, 0);
    
    // Income/Expense for period (converted for summary view)
    const income = txSource
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, state.currency.code, state.exchangeRates), 0);

    const expense = txSource
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, state.currency.code, state.exchangeRates), 0);

    return { income, expense, balance, currencyBreakdown, expenseBreakdown };
  }, [filteredTransactions, state.wallets, state.currency, state.exchangeRates, selectedWalletId]);

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

  const handlePrint = (type: 'summary' | 'detailed', currencyFilter?: string | null) => {
    setPrintType(type);
    setPrintCurrencyFilter(currencyFilter || null);
    // Give React time to update state and re-render FinancialReport before opening print dialog
    setTimeout(() => { 
      window.print(); 
    }, 600);
  };

  const handleShare = async (type: 'summary' | 'detailed', currencyFilter?: string | null) => {
    setPrintType(type);
    setPrintCurrencyFilter(currencyFilter || null);
    
    setTimeout(async () => {
        try {
            const original = document.getElementById('printable-report');
            if (!original) return;
            
            // Clone offscreen for standard 210mm A4 rendering
            const clone = original.cloneNode(true) as HTMLElement;
            clone.classList.remove('hidden', 'print:block');
            clone.classList.add('block');
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.left = '0';
            clone.style.width = '794px'; // A4 width at 96 DPI
            clone.style.height = 'auto';
            clone.style.backgroundColor = '#ffffff';
            clone.style.color = '#000000';
            document.body.appendChild(clone);
            
            const canvas = await html2canvas(clone, { 
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 794 
            });
            
            document.body.removeChild(clone);
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210; // A4 width in mm
            const pdfPageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * pdfWidth) / canvas.width; // Total height of report image in mm
            
            let heightLeft = imgHeight;
            let position = 0;

            // Render first page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfPageHeight;

            // Add additional pages if content spans across multiple pages
            while (heightLeft > 0) {
                position -= pdfPageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfPageHeight;
            }
            
            const fileName = `Thari_Financial_Report_${type}_${new Date().toISOString().split('T')[0]}.pdf`;

            const blob = pdf.output('blob');
            const blobUrl = URL.createObjectURL(blob);
            
            // Try Web Share API first
            let shared = false;
            if (navigator.share && navigator.canShare) {
                try {
                    const file = new File([blob], fileName, { type: 'application/pdf' });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'كشف حساب ثري المالي',
                            text: 'تقرير مالي من تطبيق ثري'
                        });
                        shared = true;
                    }
                } catch (e) {
                    console.log("Web Share API failed, falling back to download");
                }
            }

            if (!shared) {
                // Direct PDF download fallback
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                }, 1000);
            }

        } catch (e) {
            console.error("Share failed", e);
            alert("فشل إنشاء ملف PDF. يرجى المحاولة مرة أخرى.");
        }
    }, 600);
  };

  const handleExportExcelReport = (type: 'summary' | 'detailed' = 'detailed', currencyFilter?: string | null) => {
    const csvContent = buildExecutiveCSVContent({
      transactions: state.transactions,
      categories: state.categories,
      wallets: state.wallets,
      userName: state.userName,
      currency: state.currency,
      exchangeRates: state.exchangeRates,
      type,
      filterWalletId: selectedWalletId,
      filterCurrency: currencyFilter || null
    });

    const fileName = `Thari_Executive_Report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    exportAndShareExecutiveCSV(csvContent, fileName);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setShowAddForm(true);
  };

  const handleSubmitTransaction = (txData: any) => {
    if (editingTransaction) {
        setState(p => ({
            ...p,
            transactions: p.transactions.map(t => t.id === editingTransaction.id ? { ...txData, id: t.id } : t)
        }));
    } else {
        setState(p => ({ 
            ...p, 
            transactions: [{ ...txData, id: 'tx-' + Date.now() }, ...p.transactions] 
        }));
    }
    setShowAddForm(false);
    setEditingTransaction(null);
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
  if (state.pin && state.isLocked) return <LockScreen savedPin={state.pin} onUnlock={() => setState(p => ({ ...p, isLocked: false }))} />;

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
        filterWalletId={selectedWalletId} 
        filterCurrency={printCurrencyFilter}
      />
      
      <div className="flex flex-col flex-1 print:hidden relative z-20 overflow-hidden">
        <header className="sticky top-0 shrink-0 px-4 pb-3 md:px-6 md:py-4 glass-effect border-b border-white/5 z-30 backdrop-blur-xl bg-slate-950/80" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}>
          <div className="flex justify-between items-center max-w-6xl mx-auto w-full">
            <Logo size={28} showText />
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('future')} className={`p-2 rounded-xl border border-white/10 transition-all ${activeTab === 'future' ? 'bg-purple-500 text-slate-950 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}><Sparkles size={16} /></button>
              <button onClick={() => setActiveTab('chat')} className={`p-2 rounded-xl border border-white/10 transition-all ${activeTab === 'chat' ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}><BrainCircuit size={16} /></button>
              <button onClick={() => setActiveTab('settings')} className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-500 hover:text-amber-500 hover:border-amber-500/50 transition-all shrink-0 active:scale-95 backdrop-blur-md"><SettingsIcon size={16} /></button>
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

                    <div className="lg:col-span-12">
                       <SmartAlerts budgets={state.budgets} transactions={filteredTransactions} debts={state.debts} subscriptions={state.subscriptions} categories={state.categories} />
                    </div>

                    {/* LEFT COLUMN: Balance Card & Executive Insights */}
                    <div className="lg:col-span-6 space-y-6 w-full">
                        <BalanceCard 
                            totalBalance={totals.balance} 
                            totalIncome={totals.income} 
                            totalExpense={totals.expense} 
                            symbol={state.currency.symbol}
                            balances={totals.currencyBreakdown}
                            expenseBreakdown={totals.expenseBreakdown}
                            showSeparateCurrencies={state.showSeparateCurrencies}
                        />

                        <ExecutiveInsights 
                            transactions={filteredTransactions}
                            budgets={state.budgets}
                            debts={state.debts}
                            totalBalance={totals.balance}
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
                          <TransactionList transactions={filteredTransactions.slice(0, 3)} categories={state.categories} wallets={state.wallets} onDelete={(id) => setState(p => ({ ...p, transactions: p.transactions.filter(t => t.id !== id) }))} onEdit={handleEditTransaction} currencySymbol={state.currency.symbol} />
                        </section>
                    </div>
                  </div>
                )}
                
                {activeTab === 'future' && <FinancialSimulation transactions={filteredTransactions} currencySymbol={state.currency.symbol} apiKey={state.apiKey} />}
                {activeTab === 'goals' && <GoalTracker goals={state.goals} wallets={state.wallets} transactions={state.transactions} onAddGoal={(g) => setState(p => ({ ...p, goals: [...p.goals, { ...g, id: 'g-'+Date.now() }] }))} onUpdateGoalAmount={(id, amt) => setState(p => ({ ...p, goals: p.goals.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amt } : g) }))} currencySymbol={state.currency.symbol} apiKey={state.apiKey} />}
                {activeTab === 'budgets' && <BudgetManager budgets={state.budgets} categories={state.categories} transactions={filteredTransactions} onSetBudget={(catId, amount) => setState(p => ({ ...p, budgets: [...p.budgets.filter(b => b.categoryId !== catId), { categoryId: catId, amount }] }))} currencySymbol={state.currency.symbol} />}
                {activeTab === 'chat' && <AIChat history={state.chatHistory} transactions={filteredTransactions} categories={state.categories} currency={state.currency.symbol} onSendMessage={(msg) => setState(p => ({ ...p, chatHistory: [...p.chatHistory, msg].slice(-30) }))} apiKey={state.apiKey} />}
                {activeTab === 'debts' && <DebtManager debts={state.debts} wallets={state.wallets} onAddDebt={handleAddDebt} onUpdateDebt={handleUpdateDebt} onSettleDebt={handleSettleDebt} onPayDebt={handlePayDebt} onDeleteDebt={(id) => setState(p => ({ ...p, debts: p.debts.filter(d => d.id !== id) }))} currencySymbol={state.currency.symbol} currencyCode={state.currency.code} />}
                {activeTab === 'subscriptions' && <SubscriptionManager subscriptions={state.subscriptions} categories={state.categories} onAdd={(sub) => setState(p => ({ ...p, subscriptions: [{...sub, id: 's-'+Date.now()}, ...p.subscriptions] }))} onRemove={(id) => setState(p => ({ ...p, subscriptions: p.subscriptions.filter(s => s.id !== id) }))} currencySymbol={state.currency.symbol} />}
                {activeTab === 'zakat' && <ZakatCalculator totalBalance={totals.balance} currencySymbol={state.currency.symbol} debts={state.debts} />}
                
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
                        />
                        
                        <TransactionList transactions={filteredTransactions} categories={state.categories} wallets={state.wallets} onDelete={(id) => setState(p => ({...p, transactions: p.transactions.filter(t => t.id !== id)}))} onEdit={handleEditTransaction} currencySymbol={state.currency.symbol} showFilters />
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
          <div className="fixed left-4 bottom-28 md:bottom-32 z-40 flex flex-col gap-3 pointer-events-none no-print">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab('goals')} 
              className="pointer-events-auto w-12 h-12 bg-slate-900/95 backdrop-blur-3xl border border-white/10 hover:border-amber-500/50 rounded-full flex flex-col items-center justify-center text-amber-500 shadow-[0_10px_25px_rgba(0,0,0,0.6)] group relative"
              title="الأهداف المالية"
            >
              <Coins size={20} className="group-hover:scale-110 transition-transform" />
              <span className="absolute left-14 bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md hidden group-hover:block">الأهداف</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab('budgets')} 
              className="pointer-events-auto w-12 h-12 bg-slate-900/95 backdrop-blur-3xl border border-white/10 hover:border-blue-500/50 rounded-full flex flex-col items-center justify-center text-blue-400 shadow-[0_10px_25px_rgba(0,0,0,0.6)] group relative"
              title="إدارة الميزانية"
            >
              <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
              <span className="absolute left-14 bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md hidden group-hover:block">الميزانية</span>
            </motion.button>
          </div>
        )}

        <AnimatePresence>
          {showAddForm && (
              <TransactionForm categories={state.categories} wallets={state.wallets} onSubmit={handleSubmitTransaction} onClose={() => { setShowAddForm(false); setEditingTransaction(null); }} initialData={editingTransaction} exchangeRates={state.exchangeRates} />
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
