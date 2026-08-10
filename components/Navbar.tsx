'use client';

import React from 'react';
import { MEMBERS, MEMBER_INFO } from '@/lib/types';
import { PlusCircle, RotateCcw, Trash2, Wallet } from 'lucide-react';

interface NavbarProps {
  onOpenAddModal: () => void;
  onResetSeed: () => void;
  onClearAll: () => void;
  transactionCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onResetSeed,
  onClearAll,
  transactionCount,
}) => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 p-[2px] shadow-lg shadow-emerald-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Punt Tracker
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Sidd • Chia • Yh • Cy Shared Ledger & Debt Simplifier
            </p>
          </div>
        </div>

        {/* Group Member Chips with Neutral Emojis */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/60">
          {MEMBERS.map((m) => {
            const info = MEMBER_INFO[m];
            return (
              <div
                key={m}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-800/50 text-slate-200 border border-slate-700/40"
              >
                <span>{info.avatar}</span>
                <span>{info.name}</span>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onResetSeed}
            title="Reset to current spreadsheet debt tally"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset Tally</span>
          </button>

          {transactionCount > 0 && (
            <button
              onClick={onClearAll}
              title="Clear all transactions"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
