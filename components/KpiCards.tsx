'use client';

import React from 'react';
import { Member, MEMBERS, MEMBER_INFO, Currency, MemberBalance } from '@/lib/types';
import { formatAmount } from '@/lib/calculations';
import { ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

interface KpiCardsProps {
  balances: Record<Member, MemberBalance>;
  activeCurrency: Currency | 'all';
}

export const KpiCards: React.FC<KpiCardsProps> = ({ balances, activeCurrency }) => {
  const displayCurrency: Currency = activeCurrency === 'all' ? 'r' : activeCurrency;

  return (
    <div className="space-y-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Member Overview
          </h2>
          <span className="text-[10px] text-zinc-500 font-medium md:hidden">
            (Swipe horizontally)
          </span>
        </div>
      </div>

      {/* Cards Container: Mobile horizontal snap carousel / Desktop 4-col grid */}
      <div className="flex overflow-x-auto snap-x snap-mandatory space-x-3 pb-2 pt-0.5 px-1 md:grid md:grid-cols-4 md:space-x-0 md:gap-4 md:overflow-visible md:pb-0 scrollbar-none">
        {MEMBERS.map((m) => {
          const info = MEMBER_INFO[m];
          const bal = balances[m] || { member: m, totalPaid: 0, totalOwed: 0, netBalance: 0 };

          const isNetCreditor = bal.netBalance > 0.009;
          const isNetDebtor = bal.netBalance < -0.009;

          return (
            <div
              key={m}
              className="snap-center min-w-[260px] sm:min-w-[280px] shrink-0 md:min-w-0 md:shrink relative overflow-hidden rounded-2xl p-4.5 text-left border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-sm transition-all"
            >
              {/* Subtle ambient accent glow */}
              <div
                className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-15 pointer-events-none"
                style={{ backgroundColor: info.color }}
              />

              {/* Header: Member Avatar, Name & Status Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-lg shadow-inner border border-white/10 shrink-0"
                    style={{ backgroundColor: info.bgLight, color: info.color }}
                  >
                    {info.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm leading-tight">
                      {info.name}
                    </h3>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border shrink-0 ${
                    isNetCreditor
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : isNetDebtor
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/80'
                  }`}
                >
                  {isNetCreditor ? (
                    <>
                      <ArrowUpRight className="h-3 w-3" />
                      <span>Gets Back</span>
                    </>
                  ) : isNetDebtor ? (
                    <>
                      <ArrowDownRight className="h-3 w-3" />
                      <span>Owes</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Settled</span>
                    </>
                  )}
                </div>
              </div>

              {/* Main Net Balance Display */}
              <div className="my-2">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
                  Net Balance {activeCurrency !== 'all' ? `(${activeCurrency})` : ''}
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                    isNetCreditor
                      ? 'text-emerald-400'
                      : isNetDebtor
                      ? 'text-rose-400'
                      : 'text-zinc-300'
                  }`}
                >
                  {isNetCreditor ? '+' : ''}
                  {formatAmount(bal.netBalance, displayCurrency)}
                </div>
              </div>

              {/* Sub-metrics: Total Paid / Total Owed */}
              <div className="pt-2.5 border-t border-white/10 mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/50 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                    Total up:
                  </span>
                  <span className="font-mono text-zinc-200 font-bold">
                    {formatAmount(bal.totalPaid, displayCurrency)}
                  </span>
                </div>
                <div className="bg-black/50 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                    Total down:
                  </span>
                  <span className="font-mono text-zinc-200 font-bold">
                    {formatAmount(bal.totalOwed, displayCurrency)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
