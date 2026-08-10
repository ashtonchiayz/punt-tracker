'use client';

import React from 'react';
import { Currency, CURRENCIES } from '@/lib/types';
import { Coins } from 'lucide-react';

interface CurrencyTabsProps {
  activeCurrency: Currency | 'all';
  onChange: (currency: Currency | 'all') => void;
}

export const CurrencyTabs: React.FC<CurrencyTabsProps> = ({ activeCurrency, onChange }) => {
  const tabs = [{ id: 'all', label: 'All Currencies', symbol: '∑' }, ...CURRENCIES];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Coins className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Currency Scope</h2>
          <p className="text-xs text-slate-400">Filter debts, KPIs & matrix by currency type</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 w-full sm:w-auto">
        {tabs.map((tab) => {
          const isActive = activeCurrency === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id as Currency | 'all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="font-mono opacity-80">[{tab.symbol}]</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
