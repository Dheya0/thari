
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, LayoutDashboard, History, Settings as SettingsIcon, BrainCircuit, Sparkles, HandCoins, Repeat } from 'lucide-react';
import { Transaction, AppState, Wallet, Debt, Subscription, ChatMessage } from './types';
import { INITIAL_CATEGORIES, DEFAULT_CURRENCIES } from './constants';
import BalanceCard from './components/BalanceCard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Analytics from './components/Analytics';
import WealthScore from './components/WealthScore';
import DebtManager from './components/DebtManager';
import SubscriptionManager from './components/SubscriptionManager';
import AIChat from './components/AIChat';
import Settings from './components/Settings';
import PrivacyPolicy from './components/PrivacyPolicy';
import WelcomeScreen from './components/WelcomeScreen';
import LockScreen from './components/LockScreen';
import Logo from './components/Logo';
import FinancialReport from './components/FinancialReport';

const STORAGE_KEY = 'thari_app_v23_ultimate_responsive';

const INITIAL_WALLETS: Wallet[] = [
  { id: 'w-sar-1', name: 'الراتب (SAR)', currencyCode: 'SAR', color: '#3b82f6' },
  { id: 'w-sar-2', name: 'نقداً (SAR)', currencyCode: 'SAR', color: '#10b981' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, isLocked: !!parsed.pin };
    }
    return {
      userName: 'مستخدم ثري',
      transactions: [],
      subscriptions: [],
      chatHistory: [],
      categories: INITIAL_CATEGORIES,
      wallets: INITIAL_WALLETS,
      debts: [],
      budgets: [],
      currency: DEFAULT_CURRENCIES[0],
      currencies: DEFAULT_CURRENCIES,
      isDarkMode: true,
      pin: null,
      isLocked: false,
      hasAcceptedTerms: false,
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'debts' | 'chat' | 'subscriptions' | 'settings'>('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentCurrencyTransactions = useMemo(() => {
    return state.transactions.filter(t => t.currency === state.currency.code);
  }, [state.transactions, state.currency]);

  const walletBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    state.transactions.forEach(t => {
      const val = t.type === 'income' ? t.amount : -t.amount;
      balances[t.walletId] = (balances[t.walletId] || 0) + val;
    });
    return balances;
  }, [state.transactions]);

  const currentCurrencyWallets = useMemo(() => {
    return state.wallets.filter(w => w.currencyCode === state.currency.code);
  }, [state.wallets, state.currency]);

  const totals = useMemo(() => {
    const balance = currentCurrencyWallets.reduce((sum, w) => sum + (walletBalances[w.id] || 0), 0);
    const income = currentCurrencyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = currentCurrencyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance };
  }, [currentCurrencyTransactions, walletBalances, currentCurrencyWallets]);

  if (!state.hasAcceptedTerms) {
    return <WelcomeScreen onAccept={() => setState(p => ({ ...p, hasAcceptedTerms: true }))} onShowPrivacy={() => setShowPrivacyPolicy(true)} />;
  }

  if (state.pin && state.isLocked) {
    return <LockScreen savedPin={state.pin} onUnlock={() => setState(p => ({ ...p, isLocked: false }))} />;
  }

  return (
    <div className="w-full max-w-lg mx-auto h-full flex flex-col bg-slate-950 transition-all duration-500 overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.5)] border-x border-white/5 print:bg-white print:max-w-none print:shadow-none print:border-none print:overflow-visible">
      
      {/* Printable Report (Hidden in App View) */}
      <FinancialReport 
        transactions={currentCurrencyTransactions} 
        categories={state.categories} 
        currency={state.currency} 
        userName={state.userName}
        wallets={currentCurrencyWallets}
      />

      {/* Main App Content - Hidden in Print View */}
      <div className="flex flex-col h-full print:hidden relative">
        <div className="absolute top-[-5%] left-[-20%] w-[100%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-[-5%] right-[-20%] w-[80%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

        <header className="p-4 pt-[calc(var(--sat)+1rem)] pb-0 space-y-4 animate-fade relative z-30 glass-effect border-b border-white/5">
          <div className="flex justify-between items-center px-2">
            <Logo size={42} showText />
            <div className="flex gap-2">
               <button 
                onClick={() => setActiveTab('chat')}
                aria-label="AI Chat"
                className={`p-3 rounded-2xl bg-slate-900/50 border border-white/5 text-amber-500 active:scale-90 transition-all ${activeTab === 'chat' ? 'bg-amber-500/10 border-amber-500/30' : ''}`}
              >
                <BrainCircuit size={20} />
              </button>
            </div>
          </div>

          <div className="relative overflow-x-auto no-scrollbar flex gap-3 py-3 px-2">
            {state.currencies.map((curr, i) => (
              <button
                key={i}
                onClick={() => setState(p => ({ ...p, currency: curr }))}
                className={`flex-shrink-0 flex flex-col p-3.5 min-w-[120px] rounded-[2rem] border-2 transition-all duration-300 ${
                  state.currency.code === curr.code 
                    ? 'bg-amber-500 border-amber-400 text-slate-950 scale-105 shadow-lg shadow-amber-500/20' 
                    : 'bg-slate-900/40 border-white/5 text-slate-500 opacity-60'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-widest">{curr.code}</span>
                <span className="text-xs font-black truncate">{curr.name}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 relative z-20">
          <div className="animate-fade py-4 space-y-8">
            {activeTab === 'dashboard' && (
              <>
                <BalanceCard totalBalance={totals.balance} totalIncome={totals.income} totalExpense={totals.expense} symbol={state.currency.symbol} />
                <WealthScore transactions={currentCurrencyTransactions} budgets={state.budgets} debts={state.debts} currencySymbol={state.currency.symbol} />
                <section className="space-y-4">
                   <div className="flex justify-between items-center px-2">
                      <h3 className="font-black text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={14} /> النشاط الأخير</h3>
                      <button onClick={() => setActiveTab('transactions')} className="text-amber-500 text-[10px] font-black uppercase underline">عرض الكل</button>
                   </div>
                   <TransactionList transactions={currentCurrencyTransactions.slice(0, 8)} categories={state.categories} wallets={state.wallets} onDelete={(id) => setState(p => ({ ...p, transactions: p.transactions.filter(t => t.id !== id) }))} currencySymbol={state.currency.symbol} />
                </section>
              </>
            )}

            {activeTab === 'chat' && (
              <AIChat 
                history={state.chatHistory} 
                transactions={currentCurrencyTransactions} 
                categories={state.categories} 
                currency={state.currency.symbol} 
                onSendMessage={(msg) => setState(p => ({ ...p, chatHistory: [...p.chatHistory, msg].slice(-20) }))} 
              />
            )}

            {activeTab === 'debts' && (
              <DebtManager debts={state.debts.filter(d => d.currency === state.currency.code)} wallets={currentCurrencyWallets} onAddDebt={(d) => setState(p => ({ ...p, debts: [{...d, id: 'd-'+Date.now()}, ...p.debts] }))} onSettleDebt={(id, wId) => {
                const debt = state.debts.find(d => d.id === id);
                if (debt) {
                  const tx: Transaction = {
                    id: 'tx-' + Date.now(),
                    amount: debt.amount,
                    type: debt.type === 'on_me' ? 'expense' : 'income',
                    categoryId: debt.type === 'on_me' ? '4' : '9', 
                    walletId: wId,
                    note: `تسديد دين: ${debt.personName}`,
                    date: new Date().toISOString().split('T')[0],
                    currency: debt.currency,
                    frequency: 'once'
                  };
                  setState(p => ({
                    ...p,
                    transactions: [tx, ...p.transactions],
                    debts: p.debts.map(d => d.id === id ? { ...d, isPaid: true } : d)
                  }));
                }
              }} onDeleteDebt={(id) => setState(p => ({ ...p, debts: p.debts.filter(d => d.id !== id) }))} currencySymbol={state.currency.symbol} currencyCode={state.currency.code} />
            )}

            {activeTab === 'subscriptions' && (
              <SubscriptionManager 
                subscriptions={state.subscriptions} 
                categories={state.categories} 
                onAdd={(sub) => setState(p => ({ ...p, subscriptions: [{...sub, id: 's-'+Date.now()}, ...p.subscriptions] }))}
                onRemove={(id) => setState(p => ({ ...p, subscriptions: p.subscriptions.filter(s => s.id !== id) }))}
                currencySymbol={state.currency.symbol}
              />
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <Analytics transactions={currentCurrencyTransactions} categories={state.categories} currencySymbol={state.currency.symbol} />
                <TransactionList transactions={currentCurrencyTransactions} categories={state.categories} wallets={state.wallets} onDelete={(id) => setState(p => ({...p, transactions: p.transactions.filter(t => t.id !== id)}))} currencySymbol={state.currency.symbol} showFilters />
              </div>
            )}

            {activeTab === 'settings' && (
              <Settings 
                {...state} 
                onUpdateSettings={(updates) => setState(p => ({...p, ...updates}))} 
                onAddCurrency={(c) => setState(p => ({...p, currencies: [...p.currencies, c]}))}
                onRemoveCurrency={(code) => setState(p => ({...p, currencies: p.currencies.filter(c => c.code !== code)}))}
                onAddWallet={(w) => setState(p => ({ ...p, wallets: [...p.wallets, { ...w, id: 'w-' + Date.now() }] }))}
                onRemoveWallet={(id) => setState(p => ({ ...p, wallets: p.wallets.filter(w => w.id !== id) }))}
                onExport={() => {}} 
                onRestore={(json) => {
                  try {
                    const data = JSON.parse(json);
                    setState(p => ({ ...p, ...data, isLocked: !!data.pin }));
                  } catch (e) { alert('خطأ في استعادة البيانات'); }
                }} 
                onClearData={() => { if(confirm('حذف كل البيانات؟')) setState(p => ({...p, transactions: [], debts: [], budgets: [], subscriptions: [], chatHistory: []})) }} 
                onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)} 
              />
            )}
          </div>
        </main>

        <button 
          onClick={() => setShowAddForm(true)} 
          aria-label="Add Transaction"
          className="fixed bottom-[calc(var(--sab)+90px)] left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-500 text-slate-950 rounded-full shadow-[0_15px_30px_rgba(245,158,11,0.3)] flex items-center justify-center z-50 border-4 border-slate-950 active:scale-90 transition-all hover:scale-105"
        >
          <Plus size={32} strokeWidth={3} />
        </button>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-slate-900/80 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center p-3 pb-[calc(var(--sab)+1.5rem)] z-40">
          <NavButton icon={<LayoutDashboard />} label="ثري" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<HandCoins />} label="ديون" active={activeTab === 'debts'} onClick={() => setActiveTab('debts')} />
          <div className="w-12" />
          <NavButton icon={<Repeat />} label="دوري" active={activeTab === 'subscriptions'} onClick={() => setActiveTab('subscriptions')} />
          <NavButton icon={<SettingsIcon />} label="المزيد" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        {showAddForm && (
          <TransactionForm categories={state.categories} wallets={currentCurrencyWallets} currency={state.currency.symbol} onSubmit={(tx) => { setState(p => ({ ...p, transactions: [{ ...tx, id: 'tx-' + Date.now(), currency: state.currency.code }, ...p.transactions] })); setShowAddForm(false); }} onClose={() => setShowAddForm(false)} />
        )}
        {showPrivacyPolicy && <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />}
      </div>
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${active ? 'text-amber-500 scale-105 font-bold' : 'text-slate-500'}`}>
    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-amber-500/10' : ''}`}>{React.cloneElement(icon, { size: 22 })}</div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
