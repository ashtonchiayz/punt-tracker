'use client';

import React from 'react';
import { MEMBERS, MEMBER_INFO } from '@/lib/types';
import { Plus, RotateCcw, Trash2, Wallet } from 'lucide-react';

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
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-sm shrink-0">
            <Wallet className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
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
            <p className="text-xs text-zinc-400 hidden sm:block">
              Group Expense Ledger & Debt Simplifier
            </p>
          </div>
        </div>

        {/* Member Chips (Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-full border border-white/10">
          {MEMBERS.map((m) => {
            const info = MEMBER_INFO[m];
            return (
              <div
                key={m}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800/60 text-zinc-200 border border-zinc-700/50"
              >
                <span>{info.avatar}</span>
                <span>{info.name}</span>
              </div>
            );
          })}
        </div>

        {/* Header Action Buttons (Min 44px Touch Targets) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onResetSeed}
            title="Reset to exact debt tally"
            className="min-h-[44px] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-full border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {transactionCount > 0 && (
            <button
              onClick={onClearAll}
              title="Clear all transactions"
              className="min-h-[44px] px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-white/10 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {/* Desktop Add Expense SF Blue Button */}
          <button
            onClick={onOpenAddModal}
            className="hidden md:flex items-center gap-1.5 min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all border border-blue-400/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
