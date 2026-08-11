'use client';

import React from 'react';
import {
  Member,
  Currency,
  Transaction,
} from '@/lib/types';
import { formatAmount } from '@/lib/calculations';
import { Hourglass, Trophy, XCircle, Trash2, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PendingTransactionsProps {
  transactions: Transaction[];
  activeCurrency: Currency | 'all';
  onResolveBet: (tx: Transaction, winner: Member, losers: Member[], finalAmount?: number) => void;
  onDeletePending: (id: string) => void;
  onOpenAddModal: () => void;
}

export const PendingTransactions: React.FC<PendingTransactionsProps> = ({
  transactions,
  activeCurrency,
  onResolveBet,
  onDeletePending,
  onOpenAddModal,
}) => {
  const pendingList = transactions.filter((tx) => {
    if (tx.status !== 'pending') return false;
    if (activeCurrency !== 'all' && tx.currency !== activeCurrency) return false;
    return true;
  });

  const handleResolveOutcome = (tx: Transaction, bettorWon: boolean) => {
    const bettor = tx.bettor || tx.paidBy || 'Chia';
    const opponent = tx.opponent || (tx.owers && tx.owers.find((m) => m !== bettor)) || (bettor === 'Sidd' ? 'Chia' : 'Sidd');

    const winner = bettorWon ? bettor : opponent;
    const losers = bettorWon ? [opponent] : [bettor];

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onResolveBet(tx, winner, losers, tx.amount);
  };

  return (
    <div className="rounded-2xl bg-zinc-900/80 p-4 sm:p-6 border border-white/10 backdrop-blur-xl shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Hourglass className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Pending Bets & Wagers</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {pendingList.length}
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Select if the bettor WON or LOST to automatically update group debts
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-full shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 border border-amber-400/20 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Bet</span>
        </button>
      </div>

      {/* List */}
      {pendingList.length === 0 ? (
        <div className="p-6 sm:p-8 text-center bg-black/60 rounded-2xl border border-dashed border-zinc-800">
          <p className="text-xs sm:text-sm font-semibold text-zinc-400">No active pending bets.</p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Log a bet to track pending wagers before deciding the winner!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingList.map((tx) => {
            const bettor = tx.bettor || tx.paidBy || 'Chia';
            const opponent = tx.opponent || (tx.owers && tx.owers.find((m) => m !== bettor)) || 'Yh';

            return (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-black/60 border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                {/* Bet Details */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      🎲 {tx.description}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Pending
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400">
                      {tx.currency}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                    <span>
                      Bettor: <strong className="text-amber-300">{bettor}</strong>
                    </span>
                    <span>vs</span>
                    <span>
                      Opponent: <strong className="text-zinc-200">{opponent}</strong>
                    </span>
                    <span className="font-mono text-amber-400 font-bold ml-1">
                      ({formatAmount(tx.amount, tx.currency)})
                    </span>
                  </div>
                </div>

                {/* Instant Win / Loss Resolution Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  <button
                    onClick={() => handleResolveOutcome(tx, true)}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full border border-emerald-500/40 shadow-sm active:scale-[0.97] transition-all flex items-center gap-1.5"
                  >
                    <Trophy className="h-4 w-4 text-emerald-400" />
                    <span>{bettor} Won</span>
                  </button>

                  <button
                    onClick={() => handleResolveOutcome(tx, false)}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-bold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 rounded-full border border-rose-500/40 shadow-sm active:scale-[0.97] transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="h-4 w-4 text-rose-400" />
                    <span>{bettor} Lost</span>
                  </button>

                  <button
                    onClick={() => onDeletePending(tx.id)}
                    title="Delete pending bet"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
