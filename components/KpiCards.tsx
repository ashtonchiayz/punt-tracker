'use client';

import React, { useState } from 'react';
import { Member, MEMBERS, MEMBER_INFO, Currency, MemberBalance } from '@/lib/types';
import { formatAmount } from '@/lib/calculations';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface KpiCardsProps {
  balances: Record<Member, MemberBalance>;
  activeCurrency: Currency | 'all';
  selectedMember: Member | 'all';
  onSelectMember: (member: Member | 'all') => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  balances,
  activeCurrency,
  selectedMember,
  onSelectMember,
}) => {
  const [showSubMetrics, setShowSubMetrics] = useState<Record<Member, boolean>>({
    Sidd: false,
    Chia: false,
    Yh: false,
    Cy: false,
  });

  const displayCurrency: Currency = activeCurrency === 'all' ? 'r' : activeCurrency;

  const toggleSubMetrics = (e: React.MouseEvent, m: Member) => {
    e.stopPropagation();
    setShowSubMetrics((prev) => ({ ...prev, [m]: !prev[m] }));
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Member Balances
          </h2>
          <span className="text-[10px] text-slate-500 font-medium md:hidden">
            (Swipe left/right)
          </span>
        </div>
        {selectedMember !== 'all' && (
          <button
            onClick={() => onSelectMember('all')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20"
          >
            <Filter className="h-3 w-3" />
            <span>Show All</span>
          </button>
        )}
      </div>

      {/* Cards Container: Mobile horizontal snap carousel / Desktop 4-col grid */}
      <div className="flex overflow-x-auto snap-x snap-mandatory space-x-3 pb-2 pt-1 px-1 md:grid md:grid-cols-4 md:space-x-0 md:gap-4 md:overflow-visible md:pb-0 scrollbar-none">
        {MEMBERS.map((m) => {
          const info = MEMBER_INFO[m];
          const bal = balances[m] || { member: m, totalPaid: 0, totalOwed: 0, netBalance: 0 };
          const isSelected = selectedMember === m;
          const isExpanded = showSubMetrics[m];

          const isNetCreditor = bal.netBalance > 0.009;
          const isNetDebtor = bal.netBalance < -0.009;

          return (
            <div
              key={m}
              onClick={() => onSelectMember(isSelected ? 'all' : m)}
              className={`snap-center min-w-[260px] sm:min-w-[280px] shrink-0 md:min-w-0 md:shrink group relative cursor-pointer overflow-hidden rounded-2xl p-4.5 text-left border backdrop-blur-xl shadow-lg transition-all duration-300 ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-500/10'
                  : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Subtle ambient accent glow */}
              <div
                className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none transition-all group-hover:opacity-35"
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
                    <h3 className="font-bold text-slate-100 text-sm leading-tight flex items-center gap-1">
                      {info.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isSelected ? 'Filtering' : 'Click to filter'}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border shrink-0 ${
                    isNetCreditor
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : isNetDebtor
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
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
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  Net Balance {activeCurrency !== 'all' ? `(${activeCurrency})` : ''}
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                    isNetCreditor
                      ? 'text-emerald-400'
                      : isNetDebtor
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {isNetCreditor ? '+' : ''}
                  {formatAmount(bal.netBalance, displayCurrency)}
                </div>
              </div>

              {/* Sub-Metrics Toggle Button */}
              <div className="pt-2 border-t border-slate-800/60 mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => toggleSubMetrics(e, m)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors py-0.5"
                >
                  <span>{isExpanded ? 'Hide details' : 'View total up/down'}</span>
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>

              {/* Expandable Sub-metrics (Total Paid / Total Owed) */}
              {isExpanded && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs animate-fadeIn">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Total up:
                    </span>
                    <span className="font-mono text-slate-200 font-bold">
                      {formatAmount(bal.totalPaid, displayCurrency)}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Total down:
                    </span>
                    <span className="font-mono text-slate-200 font-bold">
                      {formatAmount(bal.totalOwed, displayCurrency)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
