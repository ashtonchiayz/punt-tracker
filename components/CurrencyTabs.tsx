'use client';

import React from 'react';
import { Currency, CURRENCIES } from '@/lib/types';
import { Coins, ChevronDown } from 'lucide-react';

interface CurrencyTabsProps {
  activeCurrency: Currency | 'all';
  onChange: (currency: Currency | 'all') => void;
}

export const CurrencyTabs: React.FC<CurrencyTabsProps> = ({ activeCurrency, onChange }) => {
  const options = [{ id: 'all', label: 'All Currencies', shortLabel: 'All', symbol: '∑' }, ...CURRENCIES];

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
          <Coins className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-white block truncate">Currency Scope</span>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">Filter net balances & debts</span>
        </div>
      </div>

      <div className="shrink-0">
        {/* Mobile Native Dropdown (< sm) */}
        <div className="relative sm:hidden">
          <select
            value={activeCurrency}
            onChange={(e) => onChange(e.target.value as Currency | 'all')}
            className="appearance-none min-h-[44px] pl-3 pr-8 py-2 rounded-xl bg-black border border-white/10 text-xs font-semibold text-blue-400 focus:outline-none focus:border-blue-500"
          >
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                [{opt.symbol}] {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-3.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
        </div>

        {/* Desktop Apple Segmented Control (>= sm) */}
        <div className="hidden sm:flex items-center gap-1 bg-black p-1 rounded-full border border-white/10">
          {options.map((tab) => {
            const isActive = activeCurrency === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id as Currency | 'all')}
                className={`flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <span className="font-mono text-[11px] opacity-80">[{tab.symbol}]</span>
                <span>{tab.shortLabel || tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
