'use client';

import React from 'react';
import { Member, MEMBERS, MEMBER_INFO, Currency, MemberBalance } from '@/lib/types';
import { formatAmount } from '@/lib/calculations';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Filter } from 'lucide-react';

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
  const displayCurrency: Currency = activeCurrency === 'all' ? 'r' : activeCurrency;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Member Overview (Click card to filter history)
        </h2>
        {selectedMember !== 'all' && (
          <button
            onClick={() => onSelectMember('all')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <Filter className="h-3 w-3" />
            <span>Show All Members</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MEMBERS.map((m) => {
          const info = MEMBER_INFO[m];
          const bal = balances[m] || { member: m, totalPaid: 0, totalOwed: 0, netBalance: 0 };
          const isSelected = selectedMember === m;

          const isNetCreditor = bal.netBalance > 0.009;
          const isNetDebtor = bal.netBalance < -0.009;

          return (
            <button
              key={m}
              onClick={() => onSelectMember(isSelected ? 'all' : m)}
              className={`group relative overflow-hidden rounded-2xl p-5 text-left border backdrop-blur-xl shadow-xl transition-all duration-300 ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              {/* Ambient subtle glow background */}
              <div
                className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-20 pointer-events-none transition-all group-hover:opacity-35"
                style={{ backgroundColor: info.color }}
              />

              {/* Header: Avatar & Member Name */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10"
                    style={{ backgroundColor: info.bgLight, color: info.color }}
                  >
                    {info.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base flex items-center gap-1.5">
                      {info.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {isSelected ? 'Filtering History' : 'Click to filter'}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${
                    isNetCreditor
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : isNetDebtor
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
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

              {/* Main KPI Net Balance */}
              <div className="mb-4">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
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

              {/* Total up vs Total down */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Total up:
                  </span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {formatAmount(bal.totalPaid, displayCurrency)}
                  </span>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Total down:
                  </span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {formatAmount(bal.totalOwed, displayCurrency)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
