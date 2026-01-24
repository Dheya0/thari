
import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

interface BalanceCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  symbol: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ totalBalance, totalIncome, totalExpense, symbol }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-indigo-100 text-sm font-medium mb-1">الرصيد الإجمالي</p>
          <h2 className="text-3xl font-bold">{totalBalance.toLocaleString()} {symbol}</h2>
        </div>
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
          <Wallet className="text-white" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-emerald-500/20 p-1 rounded-full">
              <ArrowUpRight size={14} className="text-emerald-400" />
            </div>
            <span className="text-indigo-100 text-xs">دخل</span>
          </div>
          <p className="font-semibold">{totalIncome.toLocaleString()} {symbol}</p>
        </div>
        
        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-rose-500/20 p-1 rounded-full">
              <ArrowDownLeft size={14} className="text-rose-400" />
            </div>
            <span className="text-indigo-100 text-xs">مصروفات</span>
          </div>
          <p className="font-semibold">{totalExpense.toLocaleString()} {symbol}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
