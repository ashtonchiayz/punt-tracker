'use client';

import React from 'react';
import { Currency, CURRENCIES } from '@/lib/types';
import { Coins, ChevronDown } from 'lucide-react';

interface CurrencyTabsProps {
  activeCurrency: Currency | 'all';
  onChange: (currency: Currency | 'all') => void;
}

export const CurrencyTabs: React.FC<CurrencyTabsProps> = ({ activeCurrency, onChange }) => {
  const options = [{ id: 'all', label: 'All Currencies', symbol: '∑' }, ...CURRENCIES];

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
          <Coins className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-200 block truncate">Currency Scope</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Filter net balances & debts</span>
        </div>
      </div>

      {/* Pill selector for desktop, native select for mobile */}
      <div className="shrink-0">
        {/* Mobile Dropdown (< sm) */}
        <div className="relative sm:hidden">
          <select
            value={activeCurrency}
            onChange={(e) => onChange(e.target.value as Currency | 'all')}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500"
          >
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                [{opt.symbol}] {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Desktop Segmented Control (>= sm) */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          {options.map((tab) => {
            const isActive = activeCurrency === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id as Currency | 'all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span className="font-mono text-[11px] opacity-80">[{tab.symbol}]</span>
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
