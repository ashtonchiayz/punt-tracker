'use client';

import React from 'react';
import { Currency, MEMBER_INFO, Transaction, SimplifiedTransfer } from '@/lib/types';
import { simplifyDebts, formatAmount } from '@/lib/calculations';
import { ArrowRight, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SimplifiedSettleUpProps {
  transactions: Transaction[];
  activeCurrency: Currency | 'all';
  onSettle: (from: string, to: string, amount: number, currency: Currency) => void;
}

export const SimplifiedSettleUp: React.FC<SimplifiedSettleUpProps> = ({
  transactions,
  activeCurrency,
  onSettle,
}) => {
  const currenciesToAnalyze: Currency[] =
    activeCurrency === 'all' ? ['r', 'arb', 'rr', 'rr*'] : [activeCurrency];

  const allTransfers: SimplifiedTransfer[] = [];

  currenciesToAnalyze.forEach((curr) => {
    const currTransfers = simplifyDebts(transactions, curr);
    allTransfers.push(...currTransfers);
  });

  const handleQuickSettle = (transfer: SimplifiedTransfer) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onSettle(transfer.from, transfer.to, transfer.amount, transfer.currency);
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 p-4 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              Simplified Settle-Up Plan
            </h2>
            <p className="text-xs text-slate-400">
              Minimizes transactions into direct optimal transfers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{allTransfers.length} Payment{allTransfers.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {allTransfers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">All Settled Up!</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            No pending debts remaining for {activeCurrency === 'all' ? 'any currency' : activeCurrency}. Everyone is squared away!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {allTransfers.map((transfer, index) => {
            const debtorInfo = MEMBER_INFO[transfer.from];
            const creditorInfo = MEMBER_INFO[transfer.to];

            return (
              <div
                key={`${transfer.from}-${transfer.to}-${transfer.currency}-${index}`}
                className="group flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all shadow-md"
              >
                {/* Direction: Debtor -> Creditor */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Debtor */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold shadow-inner shrink-0"
                      style={{ backgroundColor: debtorInfo.bgLight, color: debtorInfo.color }}
                    >
                      {debtorInfo.avatar}
                    </div>
                    <span className="font-bold text-slate-200 text-xs sm:text-sm">
                      {debtorInfo.name}
                    </span>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />

                  {/* Creditor */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold shadow-inner shrink-0"
                      style={{ backgroundColor: creditorInfo.bgLight, color: creditorInfo.color }}
                    >
                      {creditorInfo.avatar}
                    </div>
                    <span className="font-bold text-slate-200 text-xs sm:text-sm">
                      {creditorInfo.name}
                    </span>
                  </div>
                </div>

                {/* Amount & Settle Button */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-400 whitespace-nowrap">
                    {formatAmount(transfer.amount, transfer.currency)}
                  </span>

                  <button
                    onClick={() => handleQuickSettle(transfer)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-600/20 active:scale-[0.97] transition-all whitespace-nowrap"
                  >
                    Settle
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
