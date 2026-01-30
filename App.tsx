
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, LayoutDashboard, History, Settings as SettingsIcon, BrainCircuit, HandCoins, Repeat, Target, Star, Sparkles, Wand2 } from 'lucide-react';
import { Transaction, AppState, Wallet, Budget, Goal } from './types';
import { INITIAL_CATEGORIES, DEFAULT_CURRENCIES } from './constants';
import BalanceCard from './components/BalanceCard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Analytics from './components/Analytics';
import WealthScore from './components/WealthScore';
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
import { getEliteInsight } from './services/geminiService';

const STORAGE_KEY = 'thari_app_v3_premium';

const INITIAL_STATE: AppState = {
  userName: 'مستخدم ثري',
  transactions: [],
  subscriptions: [],
  chatHistory: [],
  categories: INITIAL_CATEGORIES,
  wallets: [
    { id: 'w-sar-1', name: 'الراتب (SAR)', currencyCode: 'SAR', color: '#f59e0b' },
    { id: 'w-sar-2', name: 'نقداً (SAR)', currencyCode: 'SAR', color: '#10b981' }
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'debts' | 'chat' | 'subscriptions' | 'settings' | 'budgets' | 'goals'>('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('جارِ تحليل ثروتك...');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Generate Proactive AI Insight
  useEffect(() => {
    if (activeTab === 'dashboard' && state.transactions.length > 0) {
      getEliteInsight(state.transactions, state.currency.symbol).then(setAiInsight);
    }
  }, [activeTab, state.transactions.length]);

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

  if (!state.hasAcceptedTerms) return <WelcomeScreen onAccept={() => setState(p => ({ ...p, hasAcceptedTerms: true }))} onShowPrivacy={() => setShowPrivacyPolicy(true)} />;
  if (state.pin && state.isLocked) return <LockScreen savedPin={state.pin} onUnlock={() => setState(p => ({ ...p, isLocked: false }))} />;

  return (
    <div className="w-full max-w-lg mx-auto h-full flex flex-col bg-transparent transition-all overflow-hidden relative border-x border-white/5 print:bg-white print:max-w-none">
      <FinancialReport transactions={currentCurrencyTransactions} categories={state.categories} currency={state.currency} userName={state.userName} wallets={state.wallets} />
      
      <div className="flex flex-col h-full print:hidden relative z-20">
        <header className="px-6 py-6 pt-[calc(var(--sat)+1.5rem)] space-y-5 glass-effect border-b border-white/5">
          <div className="flex justify-between items-center">
            <Logo size={42} showText />
            <div className="flex gap-3">
              <button onClick={() => setActiveTab('chat')} className={`p-3 rounded-2xl border border-white/10 transition-all ${activeTab === 'chat' ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}><BrainCircuit size={20} /></button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {state.currencies.map(curr => (
              <button key={curr.code} onClick={() => setState(p => ({ ...p, currency: curr }))} className={`flex-shrink-0 px-5 py-2 rounded-full border text-[10px] font-black uppercase transition-all duration-300 ${state.currency.code === curr.code ? 'bg-white text-slate-950 border-white shadow-xl' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}>{curr.code}</button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-40">
          <div className="py-6 space-y-8">
            {activeTab === 'dashboard' && (
              <>
                <BalanceCard totalBalance={totals.balance} totalIncome={totals.income} totalExpense={totals.expense} symbol={state.currency.symbol} />
                
                {/* AI Elite Insight Card */}
                <div className="bg-gradient-to-r from-amber-500/20 to-transparent p-5 rounded-[2.5rem] border border-amber-500/20 flex items-center gap-4 animate-luxury-pop">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shrink-0">
                    <Wand2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">ومضة ذكية</p>
                    <p className="text-sm font-bold text-white leading-tight">{aiInsight}</p>
                  </div>
                </div>

                <WealthScore transactions={currentCurrencyTransactions} budgets={state.budgets} debts={state.debts} currencySymbol={state.currency.symbol} />
                
                {state.goals.length > 0 && (
                   <section className="space-y-4">
                     <div className="flex justify-between items-center px-2">
                       <h3 className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]"><Star size={12} className="text-amber-500" /> الطموحات المالية</h3>
                       <button onClick={() => setActiveTab('goals')} className="text-amber-500 text-[9px] font-black uppercase">التفاصيل</button>
                     </div>
                     <div className="flex gap-4 overflow-x-auto no-scrollbar p-1">
                        {state.goals.map(goal => (
                          <div key={goal.id} className="min-w-[220px] bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] space-y-4 transition-transform hover:scale-105 active:scale-95">
                             <div className="flex justify-between items-center">
                               <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"><Star size={20} /></div>
                               <span className="text-[11px] font-black text-white">{Math.round((goal.currentAmount/goal.targetAmount)*100)}%</span>
                             </div>
                             <p className="font-black text-slate-100 text-sm truncate">{goal.name}</p>
                             <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000" style={{ width: `${(goal.currentAmount/goal.targetAmount)*100}%` }} />
                             </div>
                          </div>
                        ))}
                     </div>
                   </section>
                )}

                <section className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]"><History size={12} /> السجل النخبوي</h3>
                    <button onClick={() => setActiveTab('transactions')} className="text-amber-500 text-[9px] font-black uppercase">عرض الكل</button>
                  </div>
                  <TransactionList transactions={currentCurrencyTransactions.slice(0, 5)} categories={state.categories} wallets={state.wallets} onDelete={(id) => setState(p => ({ ...p, transactions: p.transactions.filter(t => t.id !== id) }))} currencySymbol={state.currency.symbol} />
                </section>
              </>
            )}
            
            {activeTab === 'goals' && <GoalTracker goals={state.goals} onAddGoal={(g) => setState(p => ({ ...p, goals: [...p.goals, { ...g, id: 'g-'+Date.now() }] }))} onUpdateGoalAmount={(id, amt) => setState(p => ({ ...p, goals: p.goals.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amt } : g) }))} currencySymbol={state.currency.symbol} />}
            {activeTab === 'budgets' && <BudgetManager budgets={state.budgets} categories={state.categories} transactions={currentCurrencyTransactions} onSetBudget={(catId, amount) => setState(p => ({ ...p, budgets: [...p.budgets.filter(b => b.categoryId !== catId), { categoryId: catId, amount }] }))} currencySymbol={state.currency.symbol} />}
            {activeTab === 'chat' && <AIChat history={state.chatHistory} transactions={currentCurrencyTransactions} categories={state.categories} currency={state.currency.symbol} onSendMessage={(msg) => setState(p => ({ ...p, chatHistory: [...p.chatHistory, msg].slice(-30) }))} />}
            {activeTab === 'debts' && <DebtManager debts={state.debts.filter(d => d.currency === state.currency.code)} wallets={state.wallets.filter(w => w.currencyCode === state.currency.code)} onAddDebt={(d) => setState(p => ({ ...p, debts: [{...d, id: 'd-'+Date.now()}, ...p.debts] }))} onSettleDebt={(id, wId) => {
              const debt = state.debts.find(d => d.id === id);
              if (debt) setState(p => ({ ...p, transactions: [{ id: 'tx-'+Date.now(), amount: debt.amount, type: debt.type === 'on_me' ? 'expense' : 'income', categoryId: debt.type === 'on_me' ? '4' : '9', walletId: wId, note: `تسديد دين: ${debt.personName}`, date: new Date().toISOString().split('T')[0], currency: debt.currency, frequency: 'once' }, ...p.transactions], debts: p.debts.map(d => d.id === id ? { ...d, isPaid: true } : d) }));
            }} onDeleteDebt={(id) => setState(p => ({ ...p, debts: p.debts.filter(d => d.id !== id) }))} currencySymbol={state.currency.symbol} currencyCode={state.currency.code} />}
            {activeTab === 'subscriptions' && <SubscriptionManager subscriptions={state.subscriptions} categories={state.categories} onAdd={(sub) => setState(p => ({ ...p, subscriptions: [{...sub, id: 's-'+Date.now()}, ...p.subscriptions] }))} onRemove={(id) => setState(p => ({ ...p, subscriptions: p.subscriptions.filter(s => s.id !== id) }))} currencySymbol={state.currency.symbol} />}
            {activeTab === 'transactions' && <div className="space-y-8 animate-luxury-pop"><Analytics transactions={currentCurrencyTransactions} categories={state.categories} currencySymbol={state.currency.symbol} /><TransactionList transactions={currentCurrencyTransactions} categories={state.categories} wallets={state.wallets} onDelete={(id) => setState(p => ({...p, transactions: p.transactions.filter(t => t.id !== id)}))} currencySymbol={state.currency.symbol} showFilters /></div>}
            {activeTab === 'settings' && <Settings {...state} onUpdateSettings={(updates) => setState(p => ({...p, ...updates}))} onAddCurrency={(c) => setState(p => ({...p, currencies: [...p.currencies, c]}))} onRemoveCurrency={(code) => setState(p => ({...p, currencies: p.currencies.filter(c => c.code !== code)}))} onAddWallet={(w) => setState(p => ({ ...p, wallets: [...p.wallets, { ...w, id: 'w-' + Date.now() }] }))} onRemoveWallet={(id) => setState(p => ({ ...p, wallets: p.wallets.filter(w => w.id !== id) }))} onExport={() => {}} onRestore={(json) => { try { const data = JSON.parse(json); setState(p => ({ ...INITIAL_STATE, ...data, isLocked: !!data.pin })); } catch { alert('خطأ في البيانات'); } }} onClearData={() => { if(confirm('هل تريد مسح السجل المالي نهائياً؟')) setState(p => ({...p, transactions: [], debts: [], budgets: [], subscriptions: [], chatHistory: [], goals: []})) }} onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)} />}
          </div>
        </main>

        <button 
          onClick={() => setShowAddForm(true)} 
          className="fixed bottom-[calc(var(--sab)+6.5rem)] left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-500 text-slate-950 rounded-[2rem] shadow-[0_15px_40px_rgba(245,158,11,0.5)] flex items-center justify-center z-50 border-[6px] border-slate-950 active:scale-90 active:rotate-90 transition-all duration-500"
        >
          <Plus size={32} strokeWidth={4} />
        </button>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg glass-effect border-t border-white/5 flex justify-around p-4 pt-5 bottom-nav-safe z-40 rounded-t-[3.5rem]">
          <NavButton icon={<LayoutDashboard />} label="ثري" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<HandCoins />} label="ديون" active={activeTab === 'debts'} onClick={() => setActiveTab('debts')} />
          <div className="w-20" /> 
          <NavButton icon={<Repeat />} label="دوري" active={activeTab === 'subscriptions'} onClick={() => setActiveTab('subscriptions')} />
          <NavButton icon={<SettingsIcon />} label="المزيد" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        {showAddForm && <TransactionForm categories={state.categories} wallets={state.wallets.filter(w => w.currencyCode === state.currency.code)} currency={state.currency.symbol} onSubmit={(tx) => { setState(p => ({ ...p, transactions: [{ ...tx, id: 'tx-' + Date.now(), currency: state.currency.code }, ...p.transactions] })); setShowAddForm(false); }} onClose={() => setShowAddForm(false)} />}
        {showPrivacyPolicy && <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />}
      </div>
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-2 transition-all flex-1 group ${active ? 'text-amber-500' : 'text-slate-500'}`}>
    <div className={`p-3 rounded-2xl transition-all duration-500 ${active ? 'bg-amber-500/10 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'group-hover:bg-white/5'}`}>{React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}</div>
    <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

export default App;
