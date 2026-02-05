
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, LayoutDashboard, History, Settings as SettingsIcon, BrainCircuit, HandCoins, Repeat, Coins, ArrowRight, Sparkles } from 'lucide-react';
import { AppState, Transaction, Category, Debt } from './types';
import { INITIAL_CATEGORIES, DEFAULT_CURRENCIES } from './constants';
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

const STORAGE_KEY = 'thari_app_v4';

const INITIAL_STATE: AppState = {
  userName: 'مستخدم ثري',
  transactions: [],
  subscriptions: [],
  chatHistory: [],
  categories: INITIAL_CATEGORIES,
  wallets: [
    { id: 'w-yer-1', name: 'الراتب', currencyCode: 'YER', color: '#f59e0b' },
    { id: 'w-yer-2', name: 'كاش', currencyCode: 'YER', color: '#10b981' }
  ],
  goals: [],
  debts: [],
  budgets: [],
  currency: DEFAULT_CURRENCIES[0],
  currencies: DEFAULT_CURRENCIES,
  isDarkMode: true,
  pin: null,
  isLocked: false,
  hasAcceptedTerms: false,
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...INITIAL_STATE, ...JSON.parse(saved), isLocked: !!JSON.parse(saved).pin } : INITIAL_STATE;
    } catch { return INITIAL_STATE; }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'debts' | 'chat' | 'subscriptions' | 'settings' | 'budgets' | 'goals' | 'future'>('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [printType, setPrintType] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentCurrencyTransactions = useMemo(() => 
    state.transactions.filter(t => t.currency === state.currency.code), 
  [state.transactions, state.currency]);

  const totals = useMemo(() => {
    const balances: Record<string, number> = {};
    state.transactions.forEach(t => { 
      balances[t.walletId] = (balances[t.walletId] || 0) + (t.type === 'income' ? t.amount : -t.amount); 
    });
    const balance = state.wallets.filter(w => w.currencyCode === state.currency.code).reduce((sum, w) => sum + (balances[w.id] || 0), 0);
    const income = currentCurrencyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = currentCurrencyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance };
  }, [currentCurrencyTransactions, state.wallets, state.transactions, state.currency]);

  const handlePrint = (type: 'summary' | 'detailed') => {
    setPrintType(type);
    setTimeout(() => { window.print(); }, 800);
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

  const handleUpdateDebt = (id: string, updates: Partial<Debt>) => {
    setState(p => ({
      ...p,
      debts: p.debts.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };

  if (!state.hasAcceptedTerms) return <WelcomeScreen onAccept={() => setState(p => ({ ...p, hasAcceptedTerms: true }))} onShowPrivacy={() => setShowPrivacyPolicy(true)} />;
  if (state.pin && state.isLocked) return <LockScreen savedPin={state.pin} onUnlock={() => setState(p => ({ ...p, isLocked: false }))} />;

  return (
    <div className="w-full max-w-lg mx-auto h-full flex flex-col bg-transparent transition-all overflow-hidden relative border-x border-white/5 print:block print:bg-white print:max-w-none print:h-auto print:overflow-visible">
      
      <FinancialReport transactions={currentCurrencyTransactions} categories={state.categories} currency={state.currency} userName={state.userName} wallets={state.wallets} type={printType} />
      
      <div className="flex flex-col h-full print:hidden relative z-20">
        <header className="px-6 py-6 pt-[calc(var(--sat)+1.5rem)] space-y-4 glass-effect border-b border-white/5 z-30">
          <div className="flex justify-between items-center">
            <Logo size={42} showText />
            <div className="flex gap-3">
              <button onClick={() => setActiveTab('future')} className={`p-3 rounded-2xl border border-white/10 transition-all ${activeTab === 'future' ? 'bg-purple-500 text-slate-950 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}><Sparkles size={20} /></button>
              <button onClick={() => setActiveTab('chat')} className={`p-3 rounded-2xl border border-white/10 transition-all ${activeTab === 'chat' ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}><BrainCircuit size={20} /></button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden mask-gradient-x py-2 -my-2">
                    <div className="flex items-center gap-3 w-max animate-marquee-rtl pause px-6">
                    {[...state.currencies, ...state.currencies, ...state.currencies].map((curr, index) => {
                        const isActive = state.currency.code === curr.code;
                        return (
                        <button key={`${curr.code}-${index}`} onClick={() => setState(p => ({...p, currency: curr}))} className={`relative flex items-center gap-3 pl-5 pr-3 py-3 rounded-full border backdrop-blur-md transition-all duration-500 ${isActive ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-105 z-10' : 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/20 hover:scale-105'}`}>
                            {isActive && <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-50 pointer-events-none" />}
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-slate-900/60' : 'text-slate-500'}`}>{curr.code}</span>
                            <span className="font-bold text-sm">{curr.name}</span>
                            <div className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-slate-950' : 'bg-slate-600'}`} />
                        </button>
                        );
                    })}
                    </div>
                </div>
                <button onClick={() => setActiveTab('settings')} className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700 text-slate-500 hover:text-amber-500 hover:border-amber-500/50 transition-all shrink-0 active:scale-95 backdrop-blur-md shadow-lg z-20"><SettingsIcon size={18} /></button>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-40 relative">
          <div className="py-6 space-y-8">
            {activeTab === 'dashboard' && (
              <>
                <SmartAlerts budgets={state.budgets} transactions={currentCurrencyTransactions} debts={state.debts} subscriptions={state.subscriptions} categories={state.categories} />
                <BalanceCard totalBalance={totals.balance} totalIncome={totals.income} totalExpense={totals.expense} symbol={state.currency.symbol} />
                <section className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]"><History size={12} /> السجل المالي ({state.currency.code})</h3>
                    <button onClick={() => setActiveTab('transactions')} className="text-amber-500 text-[9px] font-black uppercase flex items-center gap-1">عرض الكل <ArrowRight size={10} className="rotate-180" /></button>
                  </div>
                  <TransactionList transactions={currentCurrencyTransactions.slice(0, 5)} categories={state.categories} wallets={state.wallets} onDelete={(id) => setState(p => ({ ...p, transactions: p.transactions.filter(t => t.id !== id) }))} onEdit={handleEditTransaction} currencySymbol={state.currency.symbol} />
                </section>
                
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setActiveTab('goals')} className="p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex flex-col items-center gap-3 hover:bg-slate-800 transition-colors shadow-xl">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500"><Coins size={24} /></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">الأهداف المالية</span>
                    </button>
                     <button onClick={() => setActiveTab('budgets')} className="p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex flex-col items-center gap-3 hover:bg-slate-800 transition-colors shadow-xl">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><LayoutDashboard size={24} /></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">إدارة الميزانية</span>
                    </button>
                </div>
              </>
            )}
            
            {activeTab === 'future' && <FinancialSimulation transactions={currentCurrencyTransactions} currencySymbol={state.currency.symbol} />}
            {activeTab === 'goals' && <GoalTracker goals={state.goals} wallets={state.wallets} transactions={currentCurrencyTransactions} onAddGoal={(g) => setState(p => ({ ...p, goals: [...p.goals, { ...g, id: 'g-'+Date.now() }] }))} onUpdateGoalAmount={(id, amt) => setState(p => ({ ...p, goals: p.goals.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amt } : g) }))} currencySymbol={state.currency.symbol} />}
            {activeTab === 'budgets' && <BudgetManager budgets={state.budgets} categories={state.categories} transactions={currentCurrencyTransactions} onSetBudget={(catId, amount) => setState(p => ({ ...p, budgets: [...p.budgets.filter(b => b.categoryId !== catId), { categoryId: catId, amount }] }))} currencySymbol={state.currency.symbol} />}
            {activeTab === 'chat' && <AIChat history={state.chatHistory} transactions={currentCurrencyTransactions} categories={state.categories} currency={state.currency.symbol} onSendMessage={(msg) => setState(p => ({ ...p, chatHistory: [...p.chatHistory, msg].slice(-30) }))} />}
            {activeTab === 'debts' && <DebtManager debts={state.debts.filter(d => d.currency === state.currency.code)} wallets={state.wallets.filter(w => w.currencyCode === state.currency.code)} onAddDebt={(d) => setState(p => ({ ...p, debts: [{...d, id: 'd-'+Date.now()}, ...p.debts] }))} onUpdateDebt={handleUpdateDebt} onSettleDebt={(id, wId) => {
              const debt = state.debts.find(d => d.id === id);
              if (debt) setState(p => ({ ...p, transactions: [{ id: 'tx-'+Date.now(), amount: debt.amount, type: debt.type === 'on_me' ? 'expense' : 'income', categoryId: debt.type === 'on_me' ? '4' : '9', walletId: wId, note: `تسديد دين: ${debt.personName}`, date: new Date().toISOString().split('T')[0], currency: debt.currency, frequency: 'once' }, ...p.transactions], debts: p.debts.map(d => d.id === id ? { ...d, isPaid: true } : d) }));
            }} onDeleteDebt={(id) => setState(p => ({ ...p, debts: p.debts.filter(d => d.id !== id) }))} currencySymbol={state.currency.symbol} currencyCode={state.currency.code} />}
            {activeTab === 'subscriptions' && <SubscriptionManager subscriptions={state.subscriptions} categories={state.categories} onAdd={(sub) => setState(p => ({ ...p, subscriptions: [{...sub, id: 's-'+Date.now()}, ...p.subscriptions] }))} onRemove={(id) => setState(p => ({ ...p, subscriptions: p.subscriptions.filter(s => s.id !== id) }))} currencySymbol={state.currency.symbol} />}
            
            {activeTab === 'transactions' && (
                <div className="space-y-8 animate-luxury-pop">
                    <Analytics transactions={currentCurrencyTransactions} categories={state.categories} currencySymbol={state.currency.symbol} onPrint={handlePrint} />
                    <TransactionList transactions={currentCurrencyTransactions} categories={state.categories} wallets={state.wallets} onDelete={(id) => setState(p => ({...p, transactions: p.transactions.filter(t => t.id !== id)}))} onEdit={handleEditTransaction} currencySymbol={state.currency.symbol} showFilters />
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
                    onClearData={() => { if(confirm('هل تريد مسح السجل المالي نهائياً؟')) setState(p => ({...p, transactions: [], debts: [], budgets: [], subscriptions: [], chatHistory: [], goals: []})) }} 
                    onShowPrivacyPolicy={() => setShowPrivacyPolicy(false)} 
                    onPrint={handlePrint}
                />
            )}
          </div>
        </main>

        <button 
          onClick={() => { setEditingTransaction(null); setShowAddForm(true); }}
          className="fixed bottom-[calc(var(--sab)+6rem)] left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-500 text-slate-950 rounded-[2rem] shadow-[0_15px_40px_rgba(245,158,11,0.5)] flex items-center justify-center z-50 border-[6px] border-slate-950 active:scale-90 transition-all hover:scale-110"
        >
          <Plus size={32} strokeWidth={4} />
        </button>

        <nav className="fixed bottom-6 left-4 right-4 max-w-[calc(32rem-2rem)] mx-auto bg-slate-900/90 backdrop-blur-2xl border border-white/10 flex justify-around p-3 pb-3 z-40 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
          <NavButton icon={<LayoutDashboard />} label="الرئيسية" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<HandCoins />} label="ديون" active={activeTab === 'debts'} onClick={() => setActiveTab('debts')} />
          <div className="w-12" />
          <NavButton icon={<Repeat />} label="دوري" active={activeTab === 'subscriptions'} onClick={() => setActiveTab('subscriptions')} />
          <NavButton icon={<SettingsIcon />} label="المزيد" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        {showAddForm && (
            <TransactionForm categories={state.categories} wallets={state.wallets} onSubmit={handleSubmitTransaction} onClose={() => { setShowAddForm(false); setEditingTransaction(null); }} initialData={editingTransaction} />
        )}
        {showPrivacyPolicy && <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />}
      </div>
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 group ${active ? 'text-amber-500' : 'text-slate-500'}`}>
    <div className={`p-2.5 rounded-2xl transition-all duration-300 ${active ? 'bg-amber-500 text-slate-900 translate-y-[-12px] shadow-[0_10px_20px_rgba(245,158,11,0.3)] scale-110' : 'group-hover:bg-white/5'}`}>
        {React.cloneElement(icon, { size: active ? 24 : 22, strokeWidth: active ? 2.5 : 2 })}
    </div>
    <span className={`text-[9px] font-bold transition-all duration-300 ${active ? 'opacity-100 translate-y-[-8px]' : 'opacity-0 scale-0 h-0'}`}>{label}</span>
  </button>
);

export default App;
