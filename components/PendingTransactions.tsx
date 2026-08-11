'use client';

import React, { useState } from 'react';
import {
  Member,
  MEMBERS,
  MEMBER_INFO,
  Currency,
  Transaction,
} from '@/lib/types';
import { formatAmount } from '@/lib/calculations';
import { Hourglass, Trophy, Coins, CheckCircle2, Trash2, Plus, X } from 'lucide-react';
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
  const [resolvingTx, setResolvingTx] = useState<Transaction | null>(null);
  const [winner, setWinner] = useState<Member>('Sidd');
  const [losers, setLosers] = useState<Member[]>(['Chia']);
  const [resolutionAmount, setResolutionAmount] = useState('');

  const pendingList = transactions.filter((tx) => {
    if (tx.status !== 'pending') return false;
    if (activeCurrency !== 'all' && tx.currency !== activeCurrency) return false;
    return true;
  });

  const handleOpenResolve = (tx: Transaction) => {
    setResolvingTx(tx);
    setWinner(tx.paidBy || 'Sidd');
    setLosers(tx.owers && tx.owers.length > 0 ? tx.owers : MEMBERS.filter((m) => m !== tx.paidBy));
    setResolutionAmount(tx.amount.toString());
  };

  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTx) return;

    const parsedAmount = parseFloat(resolutionAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid positive resolution amount.');
      return;
    }
    if (losers.length === 0) {
      alert('Please select at least one loser for this bet.');
      return;
    }

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });

    onResolveBet(resolvingTx, winner, losers, parsedAmount);
    setResolvingTx(null);
  };

  const toggleLoser = (member: Member) => {
    if (losers.includes(member)) {
      if (losers.length > 1) {
        setLosers(losers.filter((m) => m !== member));
      }
    } else {
      setLosers([...losers, member]);
    }
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
              Active bets waiting for an outcome to resolve
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
            Log a bet to track upcoming wagers before deciding a winner!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pendingList.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              {/* Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                    🎲 {tx.description}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Pending
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400">
                    {tx.currency}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1 truncate">
                  <span>Proposed: {tx.paidBy}</span>
                  <span>•</span>
                  <span>Participants: {tx.owers.join(', ')}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-zinc-500 font-mono text-[10px] hidden sm:inline">{tx.date}</span>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-mono text-xs sm:text-sm font-extrabold text-amber-400 whitespace-nowrap">
                  {formatAmount(tx.amount, tx.currency)}
                </span>

                <button
                  onClick={() => handleOpenResolve(tx)}
                  className="min-h-[44px] px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-full shadow-md shadow-blue-600/20 active:scale-[0.97] transition-all flex items-center gap-1 border border-blue-400/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Resolve Bet</span>
                </button>

                <button
                  onClick={() => onDeletePending(tx.id)}
                  title="Delete pending bet"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {resolvingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <span>Resolve Bet Outcome</span>
                </h2>
                <p className="text-xs text-zinc-400">Select the winner and loser(s) to settle this bet</p>
              </div>
              <button
                onClick={() => setResolvingTx(null)}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmResolution} className="p-6 space-y-5">
              <div className="p-3 rounded-2xl bg-black/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Bet Description</span>
                <span className="font-bold text-white text-sm">{resolvingTx.description}</span>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Final Bet Amount ({resolvingTx.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={resolutionAmount}
                  onChange={(e) => setResolutionAmount(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-black border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Winner Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Select Winner (Who WON)</span>
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {MEMBERS.map((m) => {
                    const info = MEMBER_INFO[m];
                    const isSelected = winner === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setWinner(m);
                          setLosers(losers.filter((l) => l !== m));
                        }}
                        className={`flex items-center justify-center gap-1 p-2 rounded-2xl border text-xs font-semibold transition-all min-h-[44px] ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                            : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span>{info.avatar}</span>
                        <span>{info.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loser Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" />
                  <span>Select Loser(s) (Who LOST & Owes)</span>
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {MEMBERS.map((m) => {
                    const info = MEMBER_INFO[m];
                    const isWinner = winner === m;
                    const isChecked = losers.includes(m);

                    if (isWinner) {
                      return (
                        <div
                          key={m}
                          className="flex items-center justify-center gap-1 p-2 rounded-2xl border border-zinc-800/40 bg-black/30 text-zinc-600 text-xs font-medium cursor-not-allowed opacity-40 min-h-[44px]"
                        >
                          <span>{info.avatar}</span>
                          <span>{info.name}</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleLoser(m)}
                        className={`flex items-center justify-center gap-1 p-2 rounded-2xl border text-xs font-semibold transition-all min-h-[44px] ${
                          isChecked
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                            : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span>{info.avatar}</span>
                        <span>{info.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setResolvingTx(null)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg shadow-blue-600/20 transition-all border border-blue-400/20"
                >
                  Confirm & Complete Bet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
