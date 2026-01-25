
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, LayoutDashboard, History, Target, Settings as SettingsIcon, BrainCircuit, Wallet as WalletIcon, Layers, Sparkles, HandCoins } from 'lucide-react';
import { Transaction, AppState, Wallet, Debt } from './types';
import { INITIAL_CATEGORIES, DEFAULT_CURRENCIES } from './constants';
import { getFinancialAdvice } from './services/geminiService';
import BalanceCard from './components/BalanceCard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Analytics from './components/Analytics';
import BudgetManager from './components/BudgetManager';
import DebtManager from './components/DebtManager';
import Settings from './components/Settings';
import PrivacyPolicy from './components/PrivacyPolicy';
import WelcomeScreen from './components/WelcomeScreen';
import LockScreen from './components/LockScreen';
import Logo from './components/Logo';

const STORAGE_KEY = 'thari_app_v20_master';

const INITIAL_WALLETS: Wallet[] = [
  { id: 'w-sar-1', name: 'الراتب (SAR)', currencyCode: 'SAR', color: '#3b82f6' },
  { id: 'w-sar-2', name: 'نقداً (SAR)', currencyCode: 'SAR', color: '#10b981' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      userName: 'مستخدم ثري',
      transactions: [],
      categories: INITIAL_CATEGORIES,
      wallets: INITIAL_WALLETS,
      debts: [],
      budgets: [],
      currency: DEFAULT_CURRENCIES[0],
      currencies: DEFAULT_CURRENCIES,
      isDarkMode: true,
      pin: "1234",
      isLocked: true, // يبدأ مقفلاً إذا كان هناك PIN
      hasAcceptedTerms: false,
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'debts' | 'budgets' | 'settings'>('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.documentElement.classList.add('dark');
  }, [state]);

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

  const currentCurrencyTransactions = useMemo(() => {
    return state.transactions.filter(t => t.currency === state.currency.code);
  }, [state.transactions, state.currency]);

  const totals = useMemo(() => {
    const balance = currentCurrencyWallets.reduce((sum, w) => sum + (walletBalances[w.id] || 0), 0);
    const income = currentCurrencyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = currentCurrencyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance };
  }, [currentCurrencyTransactions, walletBalances, currentCurrencyWallets]);

  const handleFetchAiAdvice = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    const advice = await getFinancialAdvice(currentCurrencyTransactions, state.categories, state.currency.symbol);
    alert(advice); // يمكن تحسينه بنافذة منبثقة لاحقاً
    setIsAiLoading(false);
  };

  const handleAddDebt = (debt: Omit<Debt, 'id'>) => {
    const newDebt = { ...debt, id: 'd-' + Date.now() };
    setState(p => ({ ...p, debts: [newDebt, ...p.debts] }));
  };

  const handleSettleDebt = (debtId: string, walletId: string) => {
    const debt = state.debts.find(d => d.id === debtId);
    if (!debt) return;

    const newTransaction: Transaction = {
      id: 'tx-' + Date.now(),
      amount: debt.amount,
      type: debt.type === 'on_me' ? 'expense' : 'income',
      categoryId: debt.type === 'on_me' ? '4' : '12',
      walletId: walletId,
      note: `تسديد دين: ${debt.personName}`,
      date: new Date().toISOString().split('T')[0],
      currency: state.currency.code,
      frequency: 'once'
    };

    setState(p => ({
      ...p,
      transactions: [newTransaction, ...p.transactions],
      debts: p.debts.map(d => d.id === debtId ? { ...d, isPaid: true } : d)
    }));
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `thari_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const importedState = JSON.parse(jsonStr);
      if (importedState.userName && importedState.transactions) {
        setState({ ...importedState, isLocked: false });
        alert("تمت استعادة البيانات بنجاح!");
      }
    } catch (e) {
      alert("الملف غير صالح!");
    }
  };

  if (!state.hasAcceptedTerms) {
    return <WelcomeScreen onAccept={() => setState(p => ({ ...p, hasAcceptedTerms: true }))} onShowPrivacy={() => setShowPrivacyPolicy(true)} />;
  }

  if (state.pin && state.isLocked) {
    return <LockScreen savedPin={state.pin} onUnlock={() => setState(p => ({ ...p, isLocked: false }))} />;
  }

  return (
    <div className="app-container flex flex-col bg-slate-950 transition-all duration-500 overflow-hidden text-slate-100 font-sans">
      <header className="p-4 pt-10 pb-0 space-y-4 animate-fade relative z-30">
        <div className="flex justify-between items-center px-2">
          <Logo size={42} showText />
          <button 
            onClick={handleFetchAiAdvice}
            className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 text-amber-500 active:scale-90 transition-all ${isAiLoading ? 'animate-pulse' : ''}`}
          >
            <BrainCircuit size={20} className={isAiLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="relative slider-mask">
          <div ref={sliderRef} className="infinite-scroll gap-4 no-scrollbar items-center py-6">
            {state.currencies.map((curr, i) => (
              <button
                key={i}
                onClick={() => setState(p => ({ ...p, currency: curr }))}
                className={`snap-item flex flex-col p-6 min-w-[155px] rounded-[2.8rem] border-2 text-right transition-all duration-500 ${
                  state.currency.code === curr.code 
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-300 text-white active-glow scale-105 z-20' 
                    : 'bg-slate-900 border-slate-800 text-slate-500 opacity-20 scale-90'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest">{curr.code}</span>
                  <Sparkles size={14} className={state.currency.code === curr.code ? 'text-white/60' : 'text-slate-700'} />
                </div>
                <span className="text-sm font-black truncate">{curr.name}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32">
        <div className="animate-fade py-2 space-y-8">
          {activeTab === 'dashboard' && (
            <>
              <BalanceCard totalBalance={totals.balance} totalIncome={totals.income} totalExpense={totals.expense} symbol={state.currency.symbol} />
              <section className="space-y-4">
                 <div className="flex justify-between items-center px-2">
                    <h3 className="font-black text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={14} /> آخر النشاطات</h3>
                    <button onClick={() => setActiveTab('transactions')} className="text-amber-500 text-[10px] font-black uppercase">التاريخ</button>
                 </div>
                 <TransactionList transactions={currentCurrencyTransactions.slice(0, 10)} categories={state.categories} wallets={state.wallets} onDelete={(id) => setState(p => ({ ...p, transactions: p.transactions.filter(t => t.id !== id) }))} currencySymbol={state.currency.symbol} />
              </section>
            </>
          )}

          {activeTab === 'debts' && (
            <DebtManager debts={state.debts.filter(d => d.currency === state.currency.code)} wallets={currentCurrencyWallets} onAddDebt={handleAddDebt} onSettleDebt={handleSettleDebt} onDeleteDebt={(id) => setState(p => ({ ...p, debts: p.debts.filter(d => d.id !== id) }))} currencySymbol={state.currency.symbol} currencyCode={state.currency.code} />
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <Analytics transactions={currentCurrencyTransactions} categories={state.categories} currencySymbol={state.currency.symbol} />
              <TransactionList transactions={currentCurrencyTransactions} categories={state.categories} wallets={state.wallets} onDelete={(id) => setState(p => ({...p, transactions: p.transactions.filter(t => t.id !== id)}))} currencySymbol={state.currency.symbol} showFilters />
            </div>
          )}

          {activeTab === 'budgets' && <BudgetManager budgets={state.budgets} categories={state.categories} transactions={currentCurrencyTransactions} onSetBudget={(id, amt) => setState(p => ({...p, budgets: [...p.budgets.filter(b => b.categoryId !== id), {categoryId: id, amount: amt}]}))} currencySymbol={state.currency.symbol} />}
          
          {activeTab === 'settings' && (
            <Settings 
              {...state} 
              onUpdateSettings={(updates) => setState(p => ({...p, ...updates}))} 
              onAddCurrency={(c) => setState(p => ({...p, currencies: [...p.currencies, c]}))}
              onRemoveCurrency={(code) => setState(p => ({...p, currencies: p.currencies.filter(c => c.code !== code)}))}
              onAddWallet={(w) => setState(p => ({ ...p, wallets: [...p.wallets, { ...w, id: 'w-' + Date.now() }] }))}
              onRemoveWallet={(id) => setState(p => ({ ...p, wallets: p.wallets.filter(w => w.id !== id) }))}
              onExport={handleExportData} 
              onRestore={handleImportData} 
              onClearData={() => { if(confirm('حذف كل شيء؟')) setState(p => ({...p, transactions: [], debts: [], budgets: []})) }} 
              onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)} 
            />
          )}
        </div>
      </main>

      <button onClick={() => setShowAddForm(true)} className="fixed bottom-[110px] left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-500 text-slate-950 rounded-full shadow-2xl flex items-center justify-center z-50 border-4 border-slate-950 active:scale-75 transition-all">
        <Plus size={32} strokeWidth={3} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-slate-800 nav-compact flex justify-around items-center z-40">
        <NavButton icon={<LayoutDashboard />} label="ثري" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavButton icon={<HandCoins />} label="ديون" active={activeTab === 'debts'} onClick={() => setActiveTab('debts')} />
        <div className="w-14" />
        <NavButton icon={<History />} label="تحليل" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
        <NavButton icon={<SettingsIcon />} label="المزيد" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

      {showAddForm && (
        <TransactionForm categories={state.categories} wallets={currentCurrencyWallets} currency={state.currency.symbol} onSubmit={(tx) => { setState(p => ({ ...p, transactions: [{ ...tx, id: 'tx-' + Date.now(), currency: state.currency.code }, ...p.transactions] })); setShowAddForm(false); }} onClose={() => setShowAddForm(false)} />
      )}
      {showPrivacyPolicy && <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />}
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-amber-500' : 'text-slate-600'}`}>
    <div className={`p-2 rounded-xl ${active ? 'bg-amber-500/10' : ''}`}>{React.cloneElement(icon, { size: 22 })}</div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
