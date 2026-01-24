
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, LayoutDashboard, History, Target, Settings as SettingsIcon, BrainCircuit, CreditCard, Lock, Delete } from 'lucide-react';
import { Transaction, Category, Budget, Currency, AppState } from './types';
import { INITIAL_CATEGORIES, DEFAULT_CURRENCIES } from './constants';
import { getFinancialAdvice } from './services/geminiService';
import BalanceCard from './components/BalanceCard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Analytics from './components/Analytics';
import BudgetManager from './components/BudgetManager';
import Settings from './components/Settings';

const STORAGE_KEY = 'thari_app_data_v5';

const ThariLogo = ({ size = 32, className = "" }: { size?: number, className?: string }) => (
  <div className={`flex items-center justify-center transition-transform hover:scale-110 duration-500 ${className}`}>
    <div className="relative group">
      {/* Decorative Glow background for the logo */}
      <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <img 
        src="/public/logo.svg" 
        alt="Thari Logo" 
        style={{ width: size, height: size }}
        className="relative z-10 drop-shadow-2xl"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = "bg-slate-900 rounded-full flex items-center justify-center border-2 border-amber-500 shadow-lg shadow-amber-500/20";
          fallback.style.width = `${size}px`;
          fallback.style.height = `${size}px`;
          fallback.innerHTML = `<span style="color:#F59E0B; font-weight:900; font-size:${size/2}px">ث</span>`;
          e.currentTarget.parentElement!.appendChild(fallback);
        }}
      />
    </div>
  </div>
);

const LockScreen: React.FC<{ pin: string, onUnlock: () => void, userName: string }> = ({ pin, onUnlock, userName }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleKey = (num: string) => {
    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);
      if (newInput.length === 4) {
        if (newInput === pin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setInput('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full" />

      <ThariLogo size={140} className="mb-10 animate-bounce" />
      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">ثري Thari</h2>
      <p className="text-slate-400 mb-12 font-medium">أهلاً بك مجدداً، {userName}</p>
      
      <div className="flex gap-4 mb-16">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${input.length > i ? 'bg-amber-500 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110' : 'border-slate-700'}`} />
        ))}
      </div>

      {error && <p className="text-rose-500 font-bold mb-6 animate-shake">رمز PIN خاطئ!</p>}

      <div className="grid grid-cols-3 gap-8">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key) => {
          if (key === '') return <div key="empty" />;
          if (key === 'delete') return (
            <button key="del" onClick={() => setInput(input.slice(0, -1))} className="w-20 h-20 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
              <Delete size={28} />
            </button>
          );
          return (
            <button 
              key={key} 
              onClick={() => handleKey(key)}
              className="w-20 h-20 bg-slate-900/50 hover:bg-amber-500 text-white rounded-full shadow-lg text-2xl font-black active:scale-90 transition-all border border-slate-800 hover:border-amber-400"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      userName: 'مستخدم ثري',
      transactions: [],
      categories: INITIAL_CATEGORIES,
      budgets: [],
      currency: DEFAULT_CURRENCIES[0],
      currencies: DEFAULT_CURRENCIES,
      isDarkMode: false,
      pin: "1234",
      isLocked: false,
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'analytics' | 'budgets' | 'settings'>('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state]);

  useEffect(() => {
    if (!state.isLocked) setIsAppUnlocked(true);
  }, [state.isLocked]);

  const currentCurrencyTransactions = useMemo(() => {
    return state.transactions.filter(t => t.currency === state.currency.code);
  }, [state.transactions, state.currency]);

  const totals = useMemo(() => {
    const income = currentCurrencyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = currentCurrencyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [currentCurrencyTransactions]);

  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    state.transactions.forEach(t => {
      const val = t.type === 'income' ? t.amount : -t.amount;
      balances[t.currency] = (balances[t.currency] || 0) + val;
    });
    return balances;
  }, [state.transactions]);

  const handleFetchAiAdvice = async () => {
    setIsAiLoading(true);
    const advice = await getFinancialAdvice(currentCurrencyTransactions, state.categories, state.currency.symbol);
    setAiInsight(advice);
    setIsAiLoading(false);
  };

  if (!isAppUnlocked && state.isLocked) {
    return <LockScreen pin={state.pin || "1234"} userName={state.userName} onUnlock={() => setIsAppUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors print:bg-white print:pb-0">
      <div className="max-w-md mx-auto p-4 sm:p-6 print:max-w-none print:p-0">
        
        {/* Header */}
        <header className="flex flex-col gap-6 mb-8 print:hidden">
          <div className="flex justify-between items-center">
            <div className="animate-in fade-in slide-in-from-right duration-700 flex items-center gap-4">
              <ThariLogo size={54} />
              <div>
                <h1 className="text-2xl font-black text-amber-600 dark:text-amber-500 leading-tight">ثري Thari</h1>
                <p className="text-slate-500 text-xs font-bold tracking-wide">أهلاً بك، {state.userName}</p>
              </div>
            </div>
            <button 
              onClick={handleFetchAiAdvice} 
              className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-amber-500 hover:scale-105 transition-all active:scale-95 border border-slate-100 dark:border-slate-800"
            >
              <BrainCircuit size={22} />
            </button>
          </div>

          {/* Account List */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 px-1 -mx-1">
            {state.currencies.map(curr => {
              const isActive = state.currency.code === curr.code;
              const balance = accountBalances[curr.code] || 0;
              return (
                <button
                  key={curr.code}
                  onClick={() => setState(prev => ({ ...prev, currency: curr }))}
                  className={`flex flex-col items-start gap-1 p-4 min-w-[130px] rounded-[1.8rem] border-2 transition-all ${
                    isActive 
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-200 dark:shadow-none scale-105 z-10' 
                      : 'bg-white dark:bg-slate-900 border-transparent text-slate-600 dark:text-slate-400 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="text-[10px] font-black opacity-60 uppercase">{curr.code}</span>
                    <CreditCard size={12} />
                  </div>
                  <span className={`text-sm font-black truncate w-full ${isActive ? 'text-white' : 'dark:text-white'}`}>{curr.name}</span>
                  <span className={`text-xs font-bold ${isActive ? 'text-amber-100' : 'text-slate-500'}`}>
                    {balance.toLocaleString()} {curr.symbol}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {/* AI Insight Box */}
        {aiInsight && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-800 animate-in fade-in zoom-in duration-300 print:hidden shadow-lg shadow-amber-100/50 dark:shadow-none">
            <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
              <BrainCircuit size={18} />
              <span className="font-bold text-sm">نصيحة ثري الذكية</span>
            </div>
            <div className="text-sm text-slate-700 dark:text-amber-100 whitespace-pre-line leading-relaxed">
              {aiInsight}
            </div>
            <div className="flex justify-end gap-3 mt-3">
              <button onClick={() => setAiInsight(null)} className="text-xs text-amber-500 hover:underline font-bold">إخفاء</button>
            </div>
          </div>
        )}
        
        {isAiLoading && (
          <div className="mb-8 bg-slate-100 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4 print:hidden animate-pulse">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-black text-slate-500 dark:text-slate-400">ثري يحلل بياناتك الآن...</p>
          </div>
        )}

        {/* Dynamic Screens */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <BalanceCard 
              totalBalance={totals.balance} 
              totalIncome={totals.income} 
              totalExpense={totals.expense} 
              symbol={state.currency.symbol}
            />
            
            <section className="print:block">
              <div className="flex justify-between items-center mb-4 print:mb-2">
                <h3 className="font-black text-lg dark:text-white">العمليات الأخيرة</h3>
                <button onClick={() => setActiveTab('transactions')} className="text-amber-600 text-sm font-bold print:hidden">توسيع الكل</button>
              </div>
              <TransactionList 
                transactions={currentCurrencyTransactions} 
                categories={state.categories} 
                onDelete={(id) => setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }))}
                currencySymbol={state.currency.symbol}
                showFilters={false}
              />
            </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <Settings 
            userName={state.userName}
            isDarkMode={state.isDarkMode}
            isLocked={state.isLocked}
            currency={state.currency}
            categories={state.categories}
            onUpdateSettings={(updates) => setState(p => ({ ...p, ...updates }))}
            onAddCategory={(cat) => setState(p => ({ ...p, categories: [...p.categories, { ...cat, id: Math.random().toString(36).substr(2, 9) }] }))}
            onExport={(format) => format === 'print' && window.print()}
            onRestore={(data) => setState(JSON.parse(data))}
            onClearData={() => confirm('هل تود مسح الذاكرة؟') && setState({ ...state, transactions: [] })}
          />
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black dark:text-white">سجل العمليات</h3>
            <TransactionList 
              transactions={currentCurrencyTransactions} 
              categories={state.categories} 
              onDelete={(id) => setState(p => ({...p, transactions: p.transactions.filter(t => t.id !== id)}))} 
              currencySymbol={state.currency.symbol} 
              showFilters={true} 
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <Analytics transactions={currentCurrencyTransactions} categories={state.categories} currencySymbol={state.currency.symbol} />
        )}

        {activeTab === 'budgets' && (
          <BudgetManager 
            budgets={state.budgets} 
            categories={state.categories} 
            transactions={currentCurrencyTransactions} 
            onSetBudget={(id, amt) => setState(p => ({...p, budgets: [...p.budgets.filter(b => b.categoryId !== id), {categoryId: id, amount: amt}]}))} 
            currencySymbol={state.currency.symbol} 
          />
        )}

        {/* FAB */}
        <button 
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-2xl shadow-amber-200 dark:shadow-none flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-40 print:hidden"
        >
          <Plus size={32} strokeWidth={3} />
        </button>

        {/* Footer Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-40 print:hidden">
          <NavButton icon={<LayoutDashboard />} label="ثري" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<History />} label="السجل" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
          <div className="w-16" />
          <NavButton icon={<Target />} label="ميزانية" active={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')} />
          <NavButton icon={<SettingsIcon />} label="المزيد" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        {showAddForm && (
          <TransactionForm 
            categories={state.categories} 
            currency={state.currency.symbol}
            onSubmit={(tx) => {
              setState(p => ({ ...p, transactions: [{ ...tx, id: Math.random().toString(36).substr(2, 9), currency: state.currency.code }, ...p.transactions] }));
              setShowAddForm(false);
            }} 
            onClose={() => setShowAddForm(false)} 
          />
        )}
      </div>
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>
    {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: active ? 2.8 : 2 })}
    <span className="text-[10px] font-black">{label}</span>
  </button>
);

export default App;
