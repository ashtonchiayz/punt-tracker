'use client';

import React from 'react';
import { MEMBERS, MEMBER_INFO } from '@/lib/types';
import { PlusCircle, RotateCcw, Trash2, Wallet } from 'lucide-react';

interface NavbarProps {
  onOpenAddModal: () => void;
  onResetSeed: () => void;
  onClearAll: () => void;
  transactionCount: number;
  storageMode?: 'supabase' | 'local';
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onResetSeed,
  onClearAll,
  transactionCount,
  storageMode = 'local',
}) => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 p-[2px] shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Punt Tracker
              </h1>
              {storageMode === 'supabase' ? (
                <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live</span>
                </span>
              ) : (
                <span
                  className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1"
                  title="Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for cloud sync"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Local</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Shared Expense Ledger & Debt Simplifier
            </p>
          </div>
        </div>

        {/* Member Avatars (Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          {MEMBERS.map((m) => {
            const info = MEMBER_INFO[m];
            return (
              <div
                key={m}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-800/50 text-slate-200 border border-slate-700/40"
              >
                <span>{info.avatar}</span>
                <span>{info.name}</span>
              </div>
            );
          })}
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onResetSeed}
            title="Reset to exact debt tally"
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {transactionCount > 0 && (
            <button
              onClick={onClearAll}
              title="Clear all transactions"
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium text-slate-400 hover:text-red-400 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {/* Desktop Add Expense Button (Mobile has floating FAB) */}
          <button
            onClick={onOpenAddModal}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
